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

/* ------------------------------------------------------------------
 * CORRECTIF 28/11 — POLICES EN LIGNÉES (VITESSE DE GÉNÉRATION).
 *
 * Retour de l'éditeur : « la génération des documents prend trop de
 * temps — il faut optimiser ça pour que ce soit rapide ». Cause
 * mesurée : chaque PDF téléchargeait ses polices (Inter, Great Vibes,
 * Poppins) depuis Google Fonts À CHAQUE GÉNÉRATION — `networkidle0`
 * attendait le réseau, puis les polices arrivaient APRÈS le premier
 * rendu et déclenchaient un re-paginage complet (900 ms de plus).
 * Désormais, le CSS Google Fonts et ses fichiers woff2 sont chargés
 * UNE FOIS par processus, mis en cache et INLINÉS en data-URI : le
 * HTML n'a PLUS AUCUNE requête externe — le rendu, les polices et la
 * pagination sont bons dès la première passe. Mêmes fichiers de
 * polices, mêmes métriques : le rendu au pixel près est inchangé.
 * ------------------------------------------------------------------ */
const cacheCssPolices = new Map<string, string>();
/* Requêtes en cours partagées : deux générations simultanées ne
   téléchargent le CSS et ses polices qu'UNE FOIS (mesuré : le premier
   PDF après un démarrage à froid pouvait attendre 45 s si chaque
   fichier de police partait seul — CORRECTIF 28/11 (2)). */
const policesEnCours = new Map<string, Promise<string | null>>();

/** Récupère le CSS Google Fonts avec les woff2 en data-URI (cache
 * par processus). Null si indisponible (on garde alors les <link>). */
async function cssPolicesInlinees(urlCss: string): Promise<string | null> {
  const enCache = cacheCssPolices.get(urlCss);
  if (enCache) return enCache;
  const enCours = policesEnCours.get(urlCss);
  if (enCours) return enCours;
  const promesse = (async (): Promise<string | null> => {
    try {
      const res = await fetch(urlCss, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/css,*/*;q=0.1",
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return null;
      let css = await res.text();
      /* CORRECTIF 28/11 (2) — VITESSE DU PREMIER PDF : ne garder que
         les sous-ensembles LATIN et LATIN-EXT du CSS (les documents
         sont en français et en anglais — é è ç sont dans latin) :
         ~2 fichiers par police au lieu de ~7, et un CSS inliné 3 à
         4 fois plus léger. */
      const blocs = css.match(/\/\* [a-z0-9-]+ \*\/\s*@font-face\s*\{[^}]*\}/g) ?? [];
      const latins = blocs.filter((b) => /^\/\* (?:latin|latin-ext) \*\//.test(b.trim()));
      if (latins.length > 0) css = latins.join("\n");
      /* Chaque url(https://fonts.gstatic.com/…woff2) → data-URI. */
      const fichiers = new Map<string, string>();
      const urls = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map(
        (m) => m[1],
      );
      await Promise.all(
        [...new Set(urls)].map(async (u) => {
          try {
            const f = await fetch(u, { signal: AbortSignal.timeout(8000) });
            if (f.ok) {
              const tampon = Buffer.from(await f.arrayBuffer());
              fichiers.set(u, `url(data:font/woff2;base64,${tampon.toString("base64")})`);
            }
          } catch {
            /* police non inlinée — le <link> d'origine reste en secours */
          }
        }),
      );
      if (fichiers.size === 0) return null;
      for (const [u, dataUri] of fichiers) css = css.split(`url(${u})`).join(dataUri);
      cacheCssPolices.set(urlCss, css);
      return css;
    } catch {
      return null;
    } finally {
      policesEnCours.delete(urlCss);
    }
  })();
  policesEnCours.set(urlCss, promesse);
  return promesse;
}

/** Remplace les <link> Google Fonts du HTML par un <style> avec les
 *  polices INLINÉES (aucune requête réseau au rendu). */
async function inlinerPolices(html: string): Promise<string> {
  const liens = [...html.matchAll(/<link[^>]+href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"[^>]*>/g)];
  let resultat = html;
  for (const lien of liens) {
    const css = await cssPolicesInlinees(lien[1]);
    if (!css) continue;
    resultat = resultat.replace(lien[0], `<style>${css}</style>`);
  }
  /* les préconnexions ne servent plus à rien sans réseau */
  return resultat.replace(
    /<link[^>]+rel="preconnect"[^>]+href="https:\/\/fonts\.(?:googleapis|gstatic)\.com"[^>]*>\s*/g,
    "",
  );
}

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

/** Génère le PDF A4 du document — pagination automatique par le
 *  script embarqué (VOLET 17 : propositions, devis et factures ;
 *  le tableau des devis se poursuit d'une page à l'autre).
 *  `logoSrc` est un data URI base64 : setContent n'a pas d'URL de
 *  base pour résoudre /assets/logo-noir.png. */
export async function generatePdf(
  document: DocumentRecord | PropositionRecord,
  logoSrc?: string,
): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  const estProposition = estPropositionV2(document);
  const htmlBrut = estProposition
    ? renderPropositionHtml(document, logoSrc)
    : renderDocumentHtml(document as DocumentRecord, logoSrc);
  /* CORRECTIF 28/11 — polices INLINÉES : le HTML n'a plus AUCUNE
     requête externe ; `networkidle2` ci-dessous est donc calmé dès
     le chargement local (le repli <link> reste si le cache des
     polices est indisponible). */
  const html = await inlinerPolices(htmlBrut);
  /* networkidle0 : le HTML référence les polices par <link>
     (Google Fonts) — domcontentloaded n'attend pas leur
     téléchargement et document.fonts.ready résout alors trop tôt
     (signature cursive rendue en police de repli — mesuré au
     contrôle visuel du volet 14). networkidle0 attend que le
     réseau soit calme, polices incluses ; le catch tolère un lien
     lent (la course fonts.ready ci-dessous borne le reste).
     CORRECTIF 28/11 (mesuré : 45 s d'attente PLEINE sur la
     première génération, UN PASSAGE SUR DEUX, le networkidle0 ne
     se calmant JAMAIS) : quand les polices sont INLINÉES il n'y a
     PLUS AUCUNE requête réseau — l'événement « load » suffit (les
     polices en data-URI sont décodées dans l'instant, la course
     fonts.ready ci-dessous borne le reste et la pagination se
     stabilise en dessous) ; le networkidle0 ne reste que pour le
     REPLI <link> (inlining impossible), où les polices sont
     réellement distantes.
     NOTE de typage : les types Puppeteer 25 retirent networkidle0
     de SetContentWaitForOptions (déprécié) mais l'événement reste
     géré à l'exécution — cast pour conserver le comportement. */
  const policesInlined = html !== htmlBrut;
  const optionsContenu = (policesInlined
    ? { waitUntil: "load", timeout: 20000 }
    : { waitUntil: "networkidle0", timeout: 45000 }) as unknown as {
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

  /* PAGINATION AUTOMATIQUE (VOLET 17 : propositions, devis et
     factures) : attendre la pagination STABLE — le script du document
     répartit les blocs en pages A4 explicites puis pose
     window.__paginePc ; les polices (Google Fonts) peuvent arriver
     après coup et déclencher un re-paginage : on attend qu'aucune
     passe n'ait eu lieu depuis 900 ms. 20 s maximum, toléré : en cas
     d'échec le flux continu s'imprime (repli dégradé).
     CORRECTIF 28/11 — polices INLINÉES (aucune requête réseau) : la
     passe unique est déjà stable, l'attente de 900 ms reste en
     garde-fou (repli <link> possible). */
  await page
    .waitForFunction(
      "window.__paginePc === true && (Date.now() - (window.__paginePcAt || 0)) > 900",
      { timeout: 20000, polling: 400 },
    )
    .catch(() => undefined);

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

/* ------------------------------------------------------------------
 * VOLET 20 (26/11/2026) — CAPTURE AUTOMATIQUE DES MOCKUPS D'UN
 * PROJET (portfolio admin).
 *
 * Demande de l'éditeur : « concernant l'image, je n'ai qu'à ajouter
 * l'URL du projet et le site extrait directement le mockup mobile
 * et desktop. Donc ce n'est pas à moi d'ajouter l'image à mettre en
 * mockup pour desktop et mobile. » La capture ouvre le site en
 * ligne dans Chromium (même moteur que les PDF) : viewport
 * ORDINATEUR (1280 × 800) puis viewport MOBILE (390 × 844), PNG
 * compressé en WebP (sharp, qualité 82) — léger comme les captures
 * historiques, prêt pour l'enregistrement base64 du projet.
 * ------------------------------------------------------------------ */

/** Capture une vue complète d'une URL : ouverture (viewport fixé
 *  AVANT la navigation pour un rendu réactif dès le départ), attente
 *  du calme réseau + des polices + d'un court temps de réaction, puis
 *  capture WebP base64. */
async function capturerVueComplete(
  browser: Browser,
  url: string,
  largeur: number,
  hauteur: number,
): Promise<{ data: string; mime: string; largeur: number; hauteur: number }> {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: largeur, height: hauteur, deviceScaleFactor: 1 });
    await page
      .goto(url, { waitUntil: "networkidle2", timeout: 45000 })
      .catch(() => undefined);
    /* polices du site + court temps de réaction (re-rendu,
       animations d'apparition) — CORRECTIF 28/11 : l'attente FIXE de
       1 500 + 1 400 + 1 400 ms devient « polices prêtes » + 700 ms. */
    await page
      .evaluate(
        "(() => Promise.race([(document.fonts && document.fonts.ready) || Promise.resolve(), new Promise((r) => setTimeout(r, 3000))]))()",
      )
      .catch(() => undefined);
    await new Promise((r) => setTimeout(r, 700));
    const png = await page.screenshot({ type: "png", captureBeyondViewport: false });
    const sharp = (await import("sharp")).default;
    const webp = await sharp(Buffer.from(png)).webp({ quality: 82 }).toBuffer();
    return { data: webp.toString("base64"), mime: "image/webp", largeur, hauteur };
  } finally {
    await page.close();
  }
}

/** Capture les mockups ORDINATEUR + MOBILE d'une URL de projet.
 *  CORRECTIF 28/11 (retour de l'éditeur : « le scraping du lien
 *  portfolio prend trop de temps ») : les DEUX vues se chargent en
 *  PARALLÈLE (deux onglets du même navigateur — cache partagé),
 *  chacune avec son viewport posé AVANT la navigation : durée ≈ un
 *  seul chargement de page au lieu de deux enchaînés. */
export async function capturerMockups(
  url: string,
): Promise<{ desktop: { data: string; mime: string; largeur: number; hauteur: number }; mobile: { data: string; mime: string; largeur: number; hauteur: number } }> {
  const browser = await getBrowser();
  const [desktop, mobile] = await Promise.all([
    capturerVueComplete(browser, url, 1280, 800),
    capturerVueComplete(browser, url, 390, 844),
  ]);
  return { desktop, mobile };
}
