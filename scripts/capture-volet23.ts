/**
 * CAPTURES VOLET 23 — rendu PNG des pages (devis depuis proposition,
 * facture, proposition avec destinataire) pour contrôle visuel.
 */
import { preRemplissageDevisDepuisProposition } from "../src/lib/documents/devis-depuis-proposition";
import { propositionV2ParDefaut, type PropositionRecord } from "../src/lib/documents/proposition";
import { renderDocumentHtml } from "../src/lib/documents/document-html";
import { renderPropositionHtml } from "../src/lib/documents/proposition-html";
import type { DocumentRecord } from "../src/lib/documents/types";
import puppeteer from "puppeteer-core";
import os from "os";
import path from "path";
import fs from "fs";

const prop = {
  ...propositionV2ParDefaut(),
  numero: "P2600001",
  numeroClient: 26,
  id: "proposition-test",
  docType: "proposition",
  createdAt: "",
  updatedAt: "",
} as unknown as PropositionRecord;
prop.titre = "Conception et développement de votre site web professionnel";
prop.destinataire = { nomComplet: "Éric De Lavarene", entreprise: "" };
prop.sections.perimetre = [
  {
    id: "a",
    titre: "Conception et développement sur mesure",
    intro:
      "Création d'un site web professionnel entièrement adapté à votre activité et pensé pour vos visiteurs.",
    lead: "La prestation comprend :",
    points: [
      "La conception et le développement sur mesure de chaque page.",
      "L'intégration fidèle du design validé.",
      "La rédaction professionnelle de vos textes.",
    ],
    post: "Chaque livrable sera soumis à votre validation avant l'étape suivante.",
  },
  {
    id: "b",
    titre: "Référencement et mise en ligne",
    intro: "Votre site sera préparé pour être trouvé par vos futurs clients.",
    lead: "La prestation comprend :",
    points: [
      "Le référencement de base (SEO) dès la conception.",
      "L'adaptation mobile, tablette et ordinateur.",
      "La mise en ligne complète dans un délai très court.",
    ],
    post: "",
  },
];
prop.sections.calendrierEtapes = [
  "Écoute stratégique et cadrage du projet",
  "Conception et rédaction professionnelles",
  "Développement au code pur et ajustements",
  "Mise en ligne et remise des accès",
];
prop.sections.calendrierIntro = "Le projet avancera par étapes claires :";
prop.delai = "02 à 03 semaines";
prop.montant = 350000;
prop.devise = "XOF";

const pre = preRemplissageDevisDepuisProposition(prop);
const devis: DocumentRecord = {
  ...(pre.champs as object),
  docType: "devis",
  numero: "D2600002",
  numeroClient: 26,
  client: { nom: "Éric De Lavarene", entreprise: "", ville: "", pays: "Bénin", telephone: "", email: "" },
  langue: "fr",
  modePaiement: "Virement bancaire",
  conditionsReglement: "À réception",
  banque: { titulaire: "TCHOGNON STEVENS AKPOVI", iban: "MT33CFTE28904000000000006119777", bic: "CFTEMTM1XXX" },
  validiteJours: 15,
  notes: "Je reste à votre disposition pour toute question complémentaire et vous remercie pour votre confiance.",
  date: "2026-11-27",
} as unknown as DocumentRecord;

const facture: DocumentRecord = {
  ...devis,
  docType: "facture",
  numero: "F2600002",
  devisSource: "D2600002",
  statutPaiement: "Payé",
  datePaiement: "2026-11-27",
} as unknown as DocumentRecord;

/* Devis avec un tableau LONG (coupe de page) pour le trait de
 * fermeture + en-tête repris. */
const devisLong: DocumentRecord = {
  ...devis,
  items: [
    ...(devis.items ?? []),
    ...Array.from({ length: 5 }, (_, i) => ({
      id: `x${i}`,
      type: "Service",
      designation: `Prestation complémentaire ${i + 1}`,
      description:
        "Écoute stratégique et compréhension de votre activité. Conception sur mesure au code pur, sans template générique. Rédaction professionnelle des textes et référencement de base dès la conception. Adaptation mobile, tablette et ordinateur avec mise en ligne rapide.",
      prixUnitaire: 50000,
      quantite: 1,
    })),
  ],
} as unknown as DocumentRecord;

const documents: [string, string][] = [
  ["devis-prop", renderDocumentHtml(devis)],
  ["facture", renderDocumentHtml(facture)],
  ["devis-long", renderDocumentHtml(devisLong)],
  ["proposition", renderPropositionHtml(prop)],
];

(async () => {
  fs.mkdirSync("/tmp/volet23", { recursive: true });
  const navigateur = await puppeteer.launch({
    headless: true,
    executablePath: path.join(os.homedir(), ".cache/ms-playwright/chromium-1200/chrome-linux64/chrome"),
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  for (const [nom, html] of documents) {
    const page = await navigateur.newPage();
    await page.setViewport({ width: 900, height: 1280, deviceScaleFactor: 1.4 });
    await page.setContent(html, { waitUntil: "load" });
    await page.waitForFunction("window.__paginePc === true", { timeout: 12000 }).catch(() => null);
    await new Promise((r) => setTimeout(r, 1000));
    const pages = await page.$$(".ppage");
    for (let i = 0; i < pages.length; i++) {
      await pages[i].screenshot({ path: `/tmp/volet23/${nom}-p${i + 1}.png` });
    }
    console.log(`${nom} : ${pages.length} pages capturées`);
    await page.close();
  }
  await navigateur.close();
})();
