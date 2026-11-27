/**
 * VOLET 22 — CONTRÔLE VISUEL DES GABARITS (devis, facture, proposition).
 * Génère les HTML des documents (fichier local, même code que la route
 * PDF) et en fait des captures PNG page par page via Chromium.
 */
import fs from "fs";
import os from "os";
import path from "path";
import puppeteer from "puppeteer-core";
import { renderDocumentHtml } from "../src/lib/documents/document-html";
import { renderPropositionHtml } from "../src/lib/documents/proposition-html";
import { propositionV2ParDefaut } from "../src/lib/documents/proposition";

const SORTIE = path.join(process.cwd(), "scripts", "controle-volet22");
fs.mkdirSync(SORTIE, { recursive: true });

function trouverChrome() {
  for (const p of [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
  ].filter(Boolean)) {
    if (p && fs.existsSync(p)) return p;
  }
  const racine = path.join(os.homedir(), ".cache", "ms-playwright");
  if (fs.existsSync(racine)) {
    for (const version of fs.readdirSync(racine).sort().reverse()) {
      for (const dossier of ["chrome-linux64", "chrome-linux", "chrome"]) {
        const exe = path.join(racine, version, dossier, "chrome");
        if (fs.existsSync(exe)) return exe;
      }
    }
  }
  throw new Error("Chromium introuvable");
}

/* ---------- Devis : tableau LONG (remplit la première page) ---------- */
const descriptionLongue = Array.from({ length: 10 }, (_, i) =>
  `<p><b>${String.fromCharCode(65 + i)}. Point de périmètre numéro ${i + 1}</b></p><p>Contenu du paragraphe ${i + 1} : le périmètre couvre la conception complète, la rédaction professionnelle des textes, l'adaptation mobile, tablette et ordinateur, ainsi que la mise en ligne finale du site dans les délais annoncés et convenus avec le client.</p>`,
).join("");

const devis = {
  docType: "devis" as const,
  id: "devis-d2600001",
  numero: "D2600001",
  numeroClient: 1,
  langue: "fr" as const,
  date: "2026-11-27",
  client: {
    nom: "Aïcha DOSSOU",
    entreprise: "Cabinet Essentiel & Stratégie",
    ville: "Cotonou",
    pays: "Bénin",
    telephone: "+229 01 00 00 00 00",
    email: "exemple@demo.fr",
  },
  objet: "Création d'un site web professionnel",
  intro:
    "Le présent devis concerne la création d'un site web professionnel conçu pour valoriser votre activité, attirer les bons visiteurs et transformer leur intérêt en demandes concrètes.",
  items: [
    {
      id: "l1",
      type: "Service",
      designation: "Site Web Professionnel — Conception complète",
      description: descriptionLongue,
      quantite: 1,
      prixUnitaire: 350000,
    },
  ],
  devise: "EUR",
  delaiEstime: "02 à 03 semaines",
  conditionsReglement: "À réception",
  modePaiement: "Virement bancaire",
  validiteJours: 15,
  notes: "Je reste à votre disposition pour toute question complémentaire.",
  banque: { titulaire: "TCHOGNON STEVENS AKPOVI", iban: "MT33CFTE28904000000000006119777", bic: "CFTEMTM1XXX" },
  createdAt: "",
  updatedAt: "",
};

/* ---------- Facture PAYÉE ---------- */
const facture = {
  ...devis,
  docType: "facture" as const,
  id: "facture-f2600001",
  numero: "F2600001",
  devisSource: "D2600001",
  statutPaiement: "Payé" as const,
  datePaiement: "2026-11-27",
};

/* ---------- Proposition commerciale AVEC destinataire ---------- */
const proposition = {
  ...propositionV2ParDefaut(),
  docType: "proposition" as const,
  id: "proposition-pc2600001",
  numero: "PC2600001",
  numeroClient: 1,
  titre: "Conception et développement de votre site web professionnel",
  projet: "Site web professionnel, éditorial et évolutif",
  destinataire: {
    nomComplet: "Aïcha DOSSOU",
    entreprise: "Cabinet Essentiel & Stratégie",
  },
  date: "2026-11-27",
};

async function capturer(nom: string, html: string) {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: trouverChrome(),
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 45000 }).catch(() => undefined);
    await page.evaluate(
      "(() => Promise.race([(document.fonts && document.fonts.ready) || Promise.resolve(), new Promise((r) => setTimeout(r, 5000))]))()",
    );
    await page
      .waitForFunction(
        "window.__paginePc === true && (Date.now() - (window.__paginePcAt || 0)) > 900",
        { timeout: 20000, polling: 400 },
      )
      .catch(() => undefined);
    const fichier = path.join(SORTIE, `${nom}.html`);
    fs.writeFileSync(fichier, html);
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true,
    });
    fs.writeFileSync(path.join(SORTIE, `${nom}.pdf`), pdf);
    console.log(`${nom} : PDF écrit (${(pdf.length / 1024).toFixed(0)} Ko)`);
    await page.close();
  } finally {
    await browser.close();
  }
}

await capturer("devis-long", renderDocumentHtml(devis as never));
await capturer("facture-payee", renderDocumentHtml(facture as never));
await capturer("proposition-destinataire", renderPropositionHtml(proposition as never));
console.log("Terminé —", SORTIE);
