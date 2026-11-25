/**
 * Génération PDF côté serveur — copie du système K.Quotes
 * (src/lib/pdf.ts) : Puppeteer setContent → page.pdf (A4, marges
 * nulles, fond imprimé, tailles de page pilotées par le CSS).
 *
 * CHROMIUM :
 *  - SUR VERCEL : @sparticuz/chromium (binaire adapté au serverless,
 *    importé dynamiquement uniquement dans cet environnement) ;
 *  - EN LOCAL / PRÉVISUALISATION : l'exécutable du cache Playwright
 *    (~/.cache/ms-playwright/chromium-…/chrome-linux…/chrome), le
 *    Chromium système, ou PUPPETEER_EXECUTABLE_PATH.
 */

import puppeteer, { type Browser } from "puppeteer-core";
import fs from "fs";
import path from "path";
import os from "os";
import type { DocumentRecord } from "./types";
import { renderDocumentHtml } from "./document-html";
import { estPropositionV2, type PropositionRecord } from "./proposition";
import { renderPropositionHtml } from "./proposition-html";

let browserInstance: Browser | null = null;

function findLocalChrome(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const racines = [
    path.join(os.homedir(), ".cache", "ms-playwright"),
    path.join(process.cwd(), "node_modules", ".cache", "ms-playwright"),
  ];
  for (const racine of racines) {
    if (!fs.existsSync(racine)) continue;
    for (const version of fs.readdirSync(racine).sort().reverse()) {
      for (const dossier of ["chrome-linux64", "chrome-linux", "chrome"]) {
        const exe = path.join(racine, version, dossier, "chrome");
        if (fs.existsSync(exe)) return exe;
      }
    }
  }
  for (const p of [
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/local/bin/chromium",
  ]) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) return browserInstance;

  const argsBase = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--disable-software-rasterizer",
  ];

  let executablePath: string | undefined;
  let args = argsBase;
  if (process.env.VERCEL) {
    /* @sparticuz/chromium exporte sa classe Chromium par DÉFAUT :
       instance unique, méthodes statiques executablePath()/args. */
    const { default: chromium } = await import("@sparticuz/chromium");
    executablePath = await chromium.executablePath();
    args = chromium.args as unknown as string[];
  } else {
    executablePath = findLocalChrome();
    if (!executablePath) {
      throw new Error(
        "Aucun exécutable Chrome/Chromium trouvé — définissez PUPPETEER_EXECUTABLE_PATH (voir DEPLOIEMENT.md).",
      );
    }
  }

  browserInstance = await puppeteer.launch({
    headless: true,
    executablePath,
    args,
  });
  return browserInstance;
}

/** Génère le PDF A4 du document (2 pages devis, 1 page facture —
 *  piloté par le CSS du template ; PROPOSITION COMMERCIALE v2 :
 *  pagination automatique par le script du document). `logoSrc`
 *  est un data URI base64 : setContent n'a pas d'URL de base pour
 *  résoudre /assets/logo-noir.png. */
export async function generatePdf(
  document: DocumentRecord | PropositionRecord,
  logoSrc?: string,
): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  const estProposition = estPropositionV2(document);
  const html = estProposition
    ? renderPropositionHtml(document, logoSrc)
    : renderDocumentHtml(document as DocumentRecord, logoSrc);
  /* networkidle0 : le HTML référence les polices par <link>
     (Google Fonts) — domcontentloaded n'attend pas leur
     téléchargement et document.fonts.ready résout alors trop tôt
     (signature cursive rendue en police de repli — mesuré au
     contrôle visuel du volet 14). networkidle0 attend que le
     réseau soit calme, polices incluses ; le catch tolère un lien
     lent (la course fonts.ready ci-dessous borne le reste).
     NOTE de typage : les types Puppeteer 25 retirent networkidle0
     de SetContentWaitForOptions (déprécié) mais l'événement reste
     géré à l'exécution — cast pour conserver le comportement. */
  const optionsContenu = { waitUntil: "networkidle0", timeout: 45000 } as unknown as {
    waitUntil: "load";
    timeout: number;
  };
  await page
    .setContent(html, optionsContenu)
    .catch(() => undefined);
  // Attendre les polices web (Inter, Great Vibes) — 5 s maximum.
  /* NOTE : la fonction d'évaluation est passée en CHAÎNE (et non en
     closure) — le bundler réécrit les closures (renommage de
     variables hors de portée : « e is not defined » mesuré en
     volet 14) alors qu'une chaîne traverse le pipeline tel quel. */
  await page.evaluate(
    `(() => Promise.race([(document.fonts && document.fonts.ready) || Promise.resolve(), new Promise((r) => setTimeout(r, 5000))]))()`,
  );

  /* PROPOSITION COMMERCIALE (VOLET 16) : attendre la pagination
     automatique STABLE — le script du document répartit les blocs
     en pages A4 explicites puis pose window.__paginePc ; les polices
     Poppins (Google Fonts) peuvent arriver après coup et déclencher
     un re-paginage : on attend qu'aucune passe n'ait eu lieu depuis
     900 ms. 20 s maximum, toléré : en cas d'échec le flux continu
     s'imprime (repli dégradé). */
  if (estProposition) {
    await page
      .waitForFunction(
        "window.__paginePc === true && (Date.now() - (window.__paginePcAt || 0)) > 900",
        { timeout: 20000, polling: 400 },
      )
      .catch(() => undefined);
  }

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    preferCSSPageSize: true,
  });

  await page.close();
  return Buffer.from(pdfBuffer);
}

process.on("exit", () => {
  if (browserInstance) {
    void browserInstance.close().catch(() => {});
  }
});
