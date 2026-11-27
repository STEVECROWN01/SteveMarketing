import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";
import os from "os";
import { renderDocumentHtml } from "../src/lib/documents/document-html";
import { preRemplissageDevisDepuisProposition } from "../src/lib/documents/devis-depuis-proposition";
import { buildNumero } from "../src/lib/documents/format";
import { propositionV2ParDefaut } from "../src/lib/documents/proposition";

const SORTIE = path.join(process.cwd(), "scripts", "controle-volet22");

/* Proposition RÉALISTE : 7 blocs de périmètre (comme PC2600002). */
const prop = {
  ...propositionV2ParDefaut(),
  docType: "proposition" as const,
  id: "proposition-test",
  numero: "PC2600002",
  numeroClient: 2,
  titre: "Conception et développement de votre site web professionnel",
  projet: "Site web professionnel, éditorial et évolutif",
  montant: 2000,
  devise: "EUR",
  delai: "02 à 03 semaines",
  date: "2026-11-26",
  destinataire: { nomComplet: "Éric De Lavarene", entreprise: "" },
};
/* 7 blocs de périmètre réalistes (extraits des gabarits de l'éditeur) */
prop.sections.perimetre = [
  { id: "a", titre: "Conception et développement sur mesure", intro: "Chaque page est construite au code pur, sans template générique, pour refléter votre image de marque.", lead: "", points: ["Maquettes et arborescence validées avec vous", "Intégration au code pur (HTML, CSS, JS)", "Adaptation mobile, tablette et ordinateur"], post: "" },
  { id: "b", titre: "Site bilingue français / anglais", intro: "Le site parle à vos deux marchés sans duplication de contenu.", lead: "", points: ["Structure multilingue prête", "Bascule de langue fluide"], post: "" },
  { id: "c", titre: "Copywriting professionnel", intro: "Les textes sont rédigés pour convaincre.", lead: "", points: ["Rédaction des pages clés", "Ton professionnel adapté à votre clientèle"], post: "" },
  { id: "d", titre: "Espace éditorial et publications", intro: "Vous publiez seul vos contenus.", lead: "", points: ["Back-office simple", "Formulaires de publication"], post: "" },
  { id: "e", titre: "Back-office personnalisé", intro: "Pilotage des demandes et documents.", lead: "", points: ["Suivi des demandes clients", "Génération de devis et factures"], post: "" },
  { id: "f", titre: "Optimisation SEO de base", intro: "", lead: "", points: ["Balises et titres optimisés", "Soumission Google"], post: "" },
  { id: "g", titre: "Tests et mise en ligne", intro: "Livraison contrôlée sur tous les écrans.", lead: "", points: ["Tests multi-navigateurs", "Mise en ligne et remise des accès"], post: "" },
];
prop.sections.calendrierEtapes = [
  "Écoute stratégique et cadrage du projet — Jours 1 à 2",
  "Conception et rédaction professionnelles — Jours 3 à 7",
  "Développement au code pur et ajustements — Jours 8 à 12",
  "Mise en ligne et remise des accès — Jours 13 à 14",
];

const pre = preRemplissageDevisDepuisProposition(prop as never);
const base = pre.champs!;
const devis = {
  ...base,
  docType: "devis" as const,
  id: "devis-d2600002",
  numero: buildNumero(2, "devis"),
  numeroClient: 2,
  langue: "fr" as const,
  date: "2026-11-27",
  client: { nom: "Éric De Lavarene", entreprise: "", ville: "Cotonou", pays: "Bénin", telephone: "+229 97 00 00 00", email: "eric@exemple.fr" },
  banque: { titulaire: "TCHOGNON STEVENS AKPOVI", iban: "MT33CFTE28904000000000006119777", bic: "CFTEMTM1XXX" },
  createdAt: "",
  updatedAt: "",
} as never;

console.log("=== DESCRIPTION GÉNÉRÉE (', (devis as any).items[0].description.length, 'caractères) ===");
console.log((devis as any).items[0].description.replace(/<[^>]+>/g, "").slice(0, 1400));

function trouverChrome() {
  const racine = path.join(os.homedir(), ".cache", "ms-playwright");
  for (const version of fs.readdirSync(racine).sort().reverse()) {
    for (const dossier of ["chrome-linux64", "chrome-linux", "chrome"]) {
      const exe = path.join(racine, version, dossier, "chrome");
      if (fs.existsSync(exe)) return exe;
    }
  }
  throw new Error("Chromium introuvable");
}

const browser = await puppeteer.launch({ headless: true, executablePath: trouverChrome(), args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage();
await page.setContent(renderDocumentHtml(devis), { waitUntil: "networkidle0", timeout: 45000 }).catch(() => undefined);
await page.evaluate("(() => Promise.race([(document.fonts && document.fonts.ready) || Promise.resolve(), new Promise((r) => setTimeout(r, 5000))]))()");
await page.waitForFunction("window.__paginePc === true && (Date.now() - (window.__paginePcAt || 0)) > 900", { timeout: 20000, polling: 400 }).catch(() => undefined);
const pages = await page.evaluate("window.__pagesPc");
console.log("=== PAGES DU DEVIS :", pages, "===");
fs.writeFileSync(path.join(SORTIE, "devis-depuis-proposition.html"), renderDocumentHtml(devis));
const pdf = await page.pdf({ format: "A4", printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 }, preferCSSPageSize: true });
fs.writeFileSync(path.join(SORTIE, "devis-depuis-proposition.pdf"), pdf);
await browser.close();
