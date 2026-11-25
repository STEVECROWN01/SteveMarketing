/**
 * VOLET 18 (26/11/2026) — VÉRIFICATIONS DU BILINGUE FR/EN.
 *
 * Contrôles exécutés (bun scripts/volet18-verification.ts) :
 *  1. montantEnLettres — anglais (« and », tirets, devises EN) et
 *     comportement FR STRICTEMENT inchangé ;
 *  2. formatDate — EN « 25 Nov 2026 », FR inchangé ;
 *  3. devisParDefaut("en") — textes par défaut anglais + langue ;
 *     devisParDefaut() — textes français historiques mot pour mot ;
 *  4. renderDocumentHtml — devis/facture FR et EN (libellés, montant
 *     en lettres, valeurs système traduites), propositions TOUJOURS
 *     françaises même si langue "en" est posée ;
 *  5. le correctif de pied de page « Page X of Y » n'est embarqué
 *     que dans les documents anglais.
 *
 * Les rendus HTML sont écrits dans /tmp/render/volet18/ pour contrôle
 * visuel manuel (comme scripts/test-proposition-html.ts).
 */
import { montantEnLettres, formatDate } from "../src/lib/documents/format";
import {
  devisParDefaut,
  propositionParDefaut,
  TEXTES_DEFAUT,
  CONDITIONS_GENERALES_EN,
  NOTE_DEFAUT,
} from "../src/lib/documents/defaults";
import { renderDocumentHtml } from "../src/lib/documents/document-html";
import type { DocumentRecord } from "../src/lib/documents/types";
import fs from "fs";

let ok = 0;
let ko = 0;
function verifier(nom: string, condition: boolean) {
  if (condition) {
    ok++;
    console.log("  OK      " + nom);
  } else {
    ko++;
    console.log("  ÉCHEC   " + nom);
  }
}

/* ------------------------------------------------------------------ */
/* 1. MONTANT EN LETTRES — ANGLAIS                                    */
/* ------------------------------------------------------------------ */
console.log("\n— montantEnLettres (anglais) —");
verifier(
  '350 000 EUR → "three hundred and fifty thousand euros"',
  montantEnLettres(350000, "EUR", "en") === "three hundred and fifty thousand euros",
);
verifier(
  '350 000 XOF → "three hundred and fifty thousand CFA francs"',
  montantEnLettres(350000, "XOF", "en") === "three hundred and fifty thousand CFA francs",
);
verifier(
  '105 → "one hundred and five euros" (« and » après centaines)',
  montantEnLettres(105, "EUR", "en") === "one hundred and five euros",
);
verifier(
  '2026 → "two thousand and twenty-six euros" (« and » dernier groupe)',
  montantEnLettres(2026, "EUR", "en") === "two thousand and twenty-six euros",
);
verifier(
  '21 → "twenty-one euros" (tiret dizaine-unité)',
  montantEnLettres(21, "EUR", "en") === "twenty-one euros",
);
verifier(
  '2 100 000 → "two million one hundred thousand euros"',
  montantEnLettres(2100000, "EUR", "en") === "two million one hundred thousand euros",
);
verifier(
  '12,50 → "twelve euros and fifty cents"',
  montantEnLettres(12.5, "EUR", "en") === "twelve euros and fifty cents",
);
verifier(
  '85 → "eighty-five euros"',
  montantEnLettres(85, "EUR", "en") === "eighty-five euros",
);
verifier(
  '1 000 001 → "one million and one euros"',
  montantEnLettres(1000001, "EUR", "en") === "one million and one euros",
);

console.log("\n— montantEnLettres (français — inchangé) —");
verifier(
  '350 000 → "trois cent cinquante mille euros"',
  montantEnLettres(350000, "EUR") === "trois cent cinquante mille euros",
);
verifier(
  '2 000 000 → "deux millions d\'euros" (liaison)',
  montantEnLettres(2000000, "EUR") === "deux millions d'euros",
);
verifier(
  '200 000 XOF → "deux cents mille francs CFA" (sortie historique, inchangée)',
  montantEnLettres(200000, "XOF") === "deux cents mille francs CFA",
);
verifier(
  "3e argument absent = FR (12,50 → « …et cinquante centimes »)",
  montantEnLettres(12.5, "EUR").endsWith("et cinquante centimes"),
);

/* ------------------------------------------------------------------ */
/* 2. DATES                                                           */
/* ------------------------------------------------------------------ */
console.log("\n— formatDate —");
verifier(
  'EN "2026-11-25" → "25 Nov 2026"',
  formatDate("2026-11-25", "en") === "25 Nov 2026",
);
verifier(
  'FR "2026-11-25" → "25 novembre 2026" (inchangé)',
  formatDate("2026-11-25") === "25 novembre 2026",
);

/* ------------------------------------------------------------------ */
/* 3. TEXTES PAR DÉFAUT                                               */
/* ------------------------------------------------------------------ */
console.log("\n— devisParDefaut / TEXTES_DEFAUT —");
const fr = devisParDefaut();
const en = devisParDefaut("en");
verifier("devisParDefaut() porte langue \"fr\"", fr.langue === "fr");
verifier("devisParDefaut(\"en\") porte langue \"en\"", en.langue === "en");
verifier(
  "FR : intro historique mot pour mot",
  fr.intro ===
    "Le présent devis concerne la création d'un site web professionnel conçu pour valoriser votre activité, attirer les bons visiteurs et transformer leur intérêt en demandes concrètes.",
);
verifier("FR : notes = NOTE_DEFAUT", fr.notes === NOTE_DEFAUT);
verifier("FR : délai « 02 à 03 semaines »", fr.delaiEstime === "02 à 03 semaines");
verifier(
  "FR : désignation de ligne historique",
  fr.items[0].designation === "Site Web Professionnel — Conception complète",
);
verifier(
  "FR : conditionsReglement « À réception »",
  fr.conditionsReglement === "À réception",
);
verifier("FR : modePaiement « Virement bancaire »", fr.modePaiement === "Virement bancaire");
verifier(
  "EN : intro traduite",
  en.intro === TEXTES_DEFAUT.en.intro && en.intro.includes("This quote concerns"),
);
verifier("EN : notes traduites", en.notes === TEXTES_DEFAUT.en.notes);
verifier("EN : délai « 02 to 03 weeks »", en.delaiEstime === "02 to 03 weeks");
verifier(
  "EN : désignation « Professional Website — Complete design »",
  en.items[0].designation === "Professional Website — Complete design",
);
verifier("EN : conditionsReglement « Upon receipt »", en.conditionsReglement === "Upon receipt");
verifier("EN : modePaiement « Bank transfer »", en.modePaiement === "Bank transfer");
verifier("EN : description multi-lignes traduite", en.items[0].description === TEXTES_DEFAUT.en.descriptionLigne);
verifier(
  "FR ↔ EN : chaque clé a bien une paire (7 textes)",
  Object.keys(TEXTES_DEFAUT.fr).length === 7 &&
    Object.keys(TEXTES_DEFAUT.en).length === 7 &&
    (Object.keys(TEXTES_DEFAUT.fr) as (keyof typeof TEXTES_DEFAUT.fr)[]).every(
      (k) => TEXTES_DEFAUT.en[k] !== TEXTES_DEFAUT.fr[k],
    ),
);
verifier("CGV anglaises : 5 lignes traduites", CONDITIONS_GENERALES_EN.length === 5);
verifier(
  "propositionParDefaut reste en français",
  propositionParDefaut().langue === "fr" &&
    propositionParDefaut().intro.includes("proposition d'accompagnement"),
);

/* ------------------------------------------------------------------ */
/* 4. RENDU HTML — DEVIS / FACTURE                                    */
/* ------------------------------------------------------------------ */
console.log("\n— renderDocumentHtml (devis) —");
function devisDeTest(langue?: "fr" | "en"): DocumentRecord {
  const base = devisParDefaut(langue);
  return {
    ...base,
    docType: "devis",
    id: "devis-test",
    numero: langue === "en" ? "D2600002" : "D2600001",
    numeroClient: langue === "en" ? 2 : 1,
    date: "2026-11-26",
    createdAt: "",
    updatedAt: "",
  } as unknown as DocumentRecord;
}

const htmlDevisFr = renderDocumentHtml(devisDeTest());
verifier("FR : titre « Devis »", htmlDevisFr.includes("Devis <span"));
verifier("FR : « Merci pour votre confiance. »", htmlDevisFr.includes("Merci pour votre confiance."));
verifier("FR : « Total&nbsp;: » + TVA non applicable", htmlDevisFr.includes("Total&nbsp;:") && htmlDevisFr.includes("TVA non applicable"));
verifier("FR : montant en lettres français", htmlDevisFr.includes("trois cent cinquante mille euros"));
verifier("FR : CGV françaises", htmlDevisFr.includes("Conditions générales de vente") && htmlDevisFr.includes("Mission réalisée à distance."));
verifier("FR : « Bon pour accord »", htmlDevisFr.includes("Bon pour accord"));
verifier("FR : pied « Document confidentiel — Stevens AKPOVI »", htmlDevisFr.includes("Document confidentiel — Stevens AKPOVI"));
verifier("FR : <html lang=\"fr\">", htmlDevisFr.includes('<html lang="fr">'));
verifier("FR : aucun libellé anglais", !htmlDevisFr.includes("Quote") && !htmlDevisFr.includes("VAT not applicable") && !htmlDevisFr.includes("Approved by"));
verifier("FR : pas de correctif de pied EN", !htmlDevisFr.includes("Page ' + m[1] + ' of"));

const htmlDevisEn = renderDocumentHtml(devisDeTest("en"));
verifier("EN : titre « Quote »", htmlDevisEn.includes("Quote <span"));
verifier("EN : date « 26 Nov 2026 »", htmlDevisEn.includes("26 Nov 2026"));
verifier("EN : « Thank you for your trust. »", htmlDevisEn.includes("Thank you for your trust."));
verifier("EN : intro anglaise (texte par défaut)", htmlDevisEn.includes("This quote concerns the creation of a professional website"));
verifier("EN : « Total: » + VAT not applicable", htmlDevisEn.includes("Total:") && htmlDevisEn.includes("VAT not applicable"));
verifier("EN : montant en lettres anglais", htmlDevisEn.includes("three hundred and fifty thousand euros"));
verifier("EN : « Terms and conditions » + CGV traduites", htmlDevisEn.includes("Terms and conditions") && htmlDevisEn.includes("Work starts once payment has been received."));
verifier("EN : « Estimated delivery time: » + « 02 to 03 weeks »", htmlDevisEn.includes("Estimated delivery time:") && htmlDevisEn.includes("02 to 03 weeks"));
verifier("EN : « Approved by »", htmlDevisEn.includes("Approved by"));
verifier("EN : « Document validity: 15 days »", htmlDevisEn.includes("Document validity:") && htmlDevisEn.includes("15 days"));
verifier("EN : « Bank details » + IBAN/BIC/Account holder", htmlDevisEn.includes("Bank details") && htmlDevisEn.includes("IBAN:") && htmlDevisEn.includes("Account holder:"));
verifier("EN : « Payment method: Bank transfer » (valeur traduite)", htmlDevisEn.includes("Payment method:") && htmlDevisEn.includes("Bank transfer"));
verifier("EN : « Payment terms: Upon receipt »", htmlDevisEn.includes("Payment terms:") && htmlDevisEn.includes("Upon receipt"));
verifier("EN : pied « Confidential document » + « Page 1 of 1 »", htmlDevisEn.includes("Confidential document — Stevens AKPOVI") && htmlDevisEn.includes("Page 1 of 1"));
verifier("EN : émetteur « Issuer » / destinataire « Recipient »", htmlDevisEn.includes("Issuer") && htmlDevisEn.includes("Recipient"));
verifier("EN : « Country: » + « Benin » + sous-texte traduit", htmlDevisEn.includes("Country:") && htmlDevisEn.includes(">Benin<") && htmlDevisEn.includes("Professional website designer"));
verifier("EN : colonnes « Unit price » / « Qty » / « Description »", htmlDevisEn.includes("Unit price") && htmlDevisEn.includes("Qty"));
verifier("EN : <html lang=\"en\">", htmlDevisEn.includes('<html lang="en">'));
verifier("EN : correctif de pied « Page X of Y » embarqué", htmlDevisEn.includes("Page ' + m[1] + ' of"));
verifier("EN : aucun libellé français restant", !htmlDevisEn.includes("TVA non applicable") && !htmlDevisEn.includes("Conditions générales de vente") && !htmlDevisEn.includes("Virement bancaire"));

console.log("\n— renderDocumentHtml (facture) —");
function factureDeTest(langue: "fr" | "en", statut: "Payé" | "En attente"): DocumentRecord {
  const d = devisDeTest(langue);
  return {
    ...d,
    docType: "facture",
    id: "facture-test",
    numero: langue === "en" ? "F2600002" : "F2600001",
    devisSource: d.numero,
    statutPaiement: statut,
    datePaiement: "2026-11-26",
  };
}
const htmlFactureFrPaye = renderDocumentHtml(factureDeTest("fr", "Payé"));
verifier("FR facture : titre « Facture » + cachet « PAYÉ »", htmlFactureFrPaye.includes("Facture <span") && htmlFactureFrPaye.includes("PAYÉ"));
verifier("FR facture : « le 26/11/2026 » (cachet)", htmlFactureFrPaye.includes("le 26/11/2026"));
verifier("FR facture : remerciement client", htmlFactureFrPaye.includes("Nous remercions notre client pour sa confiance."));
verifier("FR facture : « Devis d'origine »", htmlFactureFrPaye.includes("Devis d&#x27;origine") || htmlFactureFrPaye.includes("Devis d'origine"));
const htmlFactureFrAttente = renderDocumentHtml(factureDeTest("fr", "En attente"));
verifier("FR facture : statut « En attente » affiché", htmlFactureFrAttente.includes("En attente"));
const htmlFactureEnPaye = renderDocumentHtml(factureDeTest("en", "Payé"));
verifier("EN facture : titre « Invoice » + cachet « PAID »", htmlFactureEnPaye.includes("Invoice <span") && htmlFactureEnPaye.includes("PAID"));
verifier("EN facture : « on 26/11/2026 » (cachet)", htmlFactureEnPaye.includes("on 26/11/2026"));
verifier("EN facture : « Payment status » + « PAID »", htmlFactureEnPaye.includes("Payment status") && htmlFactureEnPaye.includes("PAID"));
verifier(
  "EN facture : badge du mode de paiement (logo + libellé « Bank transfer »)",
  htmlFactureEnPaye.includes("data:image/svg+xml;base64") && htmlFactureEnPaye.includes("Bank transfer"),
);
verifier(
  "EN→FR : un document anglais retrouve « Virement bancaire » en version française",
  renderDocumentHtml({ ...factureDeTest("en", "Payé"), langue: "fr" }).includes("Virement bancaire"),
);
verifier("EN facture : « Original quote »", htmlFactureEnPaye.includes("Original quote") && htmlFactureEnPaye.includes("D2600002"));
verifier("EN facture : remerciement traduit", htmlFactureEnPaye.includes("We thank our client for their trust."));
const htmlFactureEnAttente = renderDocumentHtml(factureDeTest("en", "En attente"));
verifier("EN facture : statut « Pending » (valeur FR « En attente » traduite à l'affichage)", htmlFactureEnAttente.includes("Pending"));

console.log("\n— renderDocumentHtml (proposition — toujours FR) —");
const prop = {
  ...propositionParDefaut(),
  docType: "proposition" as const,
  id: "proposition-test",
  numero: "PC2600001",
  numeroClient: 1,
  date: "2026-11-26",
  createdAt: "",
  updatedAt: "",
  /* langue volontairement erronée : la proposition reste FR */
  langue: "en" as const,
} as unknown as DocumentRecord;
const htmlProp = renderDocumentHtml(prop);
verifier("proposition : titre « Proposition Commerciale » (FR forcé)", htmlProp.includes("Proposition Commerciale"));
verifier("proposition : CGV françaises malgré langue \"en\"", htmlProp.includes("Conditions générales de vente"));
verifier("proposition : aucun libellé anglais", !htmlProp.includes("Quote") && !htmlProp.includes("Terms and conditions"));
verifier("proposition : <html lang=\"fr\">", htmlProp.includes('<html lang="fr">'));

/* ------------------------------------------------------------------ */
/* 5. Rendus écrits pour contrôle visuel                              */
/* ------------------------------------------------------------------ */
fs.mkdirSync("/tmp/render/volet18", { recursive: true });
fs.writeFileSync("/tmp/render/volet18/devis-fr.html", htmlDevisFr);
fs.writeFileSync("/tmp/render/volet18/devis-en.html", htmlDevisEn);
fs.writeFileSync("/tmp/render/volet18/facture-fr-paye.html", htmlFactureFrPaye);
fs.writeFileSync("/tmp/render/volet18/facture-fr-attente.html", htmlFactureFrAttente);
fs.writeFileSync("/tmp/render/volet18/facture-en-paye.html", htmlFactureEnPaye);
fs.writeFileSync("/tmp/render/volet18/facture-en-attente.html", htmlFactureEnAttente);
console.log("\nRendus écrits dans /tmp/render/volet18/ (devis-fr, devis-en, facture-fr-paye, facture-fr-attente, facture-en-paye, facture-en-attente).");

console.log(`\nRÉSULTAT : ${ok} vérification(s) OK, ${ko} échec(s).`);
process.exit(ko > 0 ? 1 : 0);
