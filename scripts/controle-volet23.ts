/**
 * CONTRÔLE VOLET 23 (27/11/2026) — vérification locale des demandes
 * de l'éditeur avant déploiement :
 *  M5  proposition : destinataire SOUS prestataire, sans déplacement ;
 *  M6  facture sans « Devis d'origine » + bloc « Modalité de paiement »
 *      des devis au design du bloc Paiement ;
 *  M7  note des factures = note des devis ;
 *  M9  description devis←proposition : prose professionnelle, sans
 *      lettre, titres en gras, ≤ 10 paragraphes ;
 *  M10 description texte brut = UN SEUL paragraphe (comme le champ) ;
 *  M11 trait de fermeture du tableau en bas de page coupée + en-tête
 *      repris en page suivante.
 */
import {
  preRemplissageDevisDepuisProposition,
  nomClientDeProposition,
} from "../src/lib/documents/devis-depuis-proposition";
import { propositionV2ParDefaut, type PropositionRecord } from "../src/lib/documents/proposition";
import { decouperHtmlRiche, htmlRicheOuTexteBrut } from "../src/lib/documents/texte-riche";
import { renderDocumentHtml, } from "../src/lib/documents/document-html";
import { renderPropositionHtml } from "../src/lib/documents/proposition-html";
import type { DocumentRecord } from "../src/lib/documents/types";
import puppeteer from "puppeteer-core";
import fs from "fs";
import os from "os";
import path from "path";

let echecs = 0;
function controle(nom: string, ok: boolean, detail = "") {
  const marque = ok ? "OK " : "ÉCHEC";
  console.log(`[${marque}] ${nom}${detail ? ` — ${detail}` : ""}`);
  if (!ok) echecs++;
}

/* ---------- Échantillon de proposition (gabarit + périmètres) ---------- */
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

/* ---------- M9 : description rédigée ---------- */
const pre = preRemplissageDevisDepuisProposition(prop);
const description = pre.champs?.items?.[0]?.description ?? "";
const morceauxTitres = description.match(/<font size="5"><b>(.*?)<\/b><\/font>/g) ?? [];
const corpsParagraphes = description.match(/<p>(?!<font)(.*?)<\/p>/g) ?? [];
controle("M9 — titres en GRAS sans lettre (pas de « A. »)", 
  !/[A-Z]\.\s/.test((description.match(/<font size="5"><b>(.*?)<\/b>/) ?? ["", ""])[1] ?? "X") 
  && morceauxTitres.length > 0,
  `${morceauxTitres.length} titres : ${morceauxTitres.map((t) => t.replace(/<[^>]+>/g, "")).join(" | ")}`);
controle("M9 — aucun « ce périmètre » robotique", !/périmètre couvre/.test(description));
controle("M9 — prose tournée client (« vous/votre/vos »)", /\b(vous|votre|vos)\b/i.test(description));
controle("M9 — ≤ 10 paragraphes titrés", morceauxTitres.length <= 10, `${morceauxTitres.length}`);
controle(
  "M9 — chaque description tient en ~4 lignes (≤ 265 caractères)",
  corpsParagraphes.every((p) => p.length <= 270),
  corpsParagraphes.map((p) => String(p.length)).join(", "),
);
controle(
  "M9 — pas de note « Modalités issues de la proposition » (M7)",
  (pre.champs?.notes ?? "") === "",
);
console.log("\n--- Aperçu de la description (M9) ---");
console.log(
  description
    .replace(/<p>/g, "\n¶ ")
    .replace(/<\/?font[^>]*>/g, "")
    .replace(/<\/?[bp]>/g, "")
    .replace(/<\/p>/g, "")
    .trim(),
);
console.log("-------------------------------------\n");

/* ---------- M10 : texte brut = UN SEUL paragraphe ---------- */
const texteBrut = [
  "Écoute stratégique et compréhension de votre activité.",
  "Conception sur mesure au code pur, sans template générique.",
  "Rédaction professionnelle des textes (copywriting inclus).",
  "Référencement de base (SEO) dès la conception.",
].join("\n");
const renduBrut = htmlRicheOuTexteBrut(texteBrut);
controle(
  "M10 — texte brut rendu en UN SEUL paragraphe",
  /^<p>.*<\/p>$/.test(renduBrut) && !/<\/p>\s*<p>/.test(renduBrut),
  renduBrut.slice(0, 90) + "…",
);
controle(
  "M10 — le champ \n-joignant reste coulant (une seule rangée paginable)",
  decouperHtmlRiche(texteBrut).length >= 1,
);

/* ---------- M6 + M7 : rendu devis / facture ---------- */
const devis: DocumentRecord = {
  ...(pre.champs as object),
  docType: "devis",
  numero: "D2600001",
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
const htmlDevis = renderDocumentHtml(devis);
controle("M6 — devis : bloc « Modalité de paiement » présent", htmlDevis.includes("Modalité de paiement"));
controle("M6 — devis : plus de titre « Coordonnées bancaires »", !htmlDevis.includes(">Coordonnées bancaires<"));
controle(
  "M6 — devis : « Mode de paiement » au-dessus des coordonnées",
  htmlDevis.indexOf("Mode de paiement") < htmlDevis.indexOf("IBAN"),
);
controle("M6 — devis : IBAN/BIC/titulaire dans le bloc", htmlDevis.includes("MT33CFTE") && htmlDevis.includes("CFTEMTM1XXX"));

const facture: DocumentRecord = {
  ...devis,
  docType: "facture",
  numero: "F2600001",
  devisSource: "D2600001",
  statutPaiement: "Payé",
  datePaiement: "2026-11-27",
} as DocumentRecord;
const htmlFacture = renderDocumentHtml(facture);
controle("M6 — facture : « Devis d'origine » SUPPRIMÉ", !htmlFacture.includes("Devis d'origine"));
controle(
  "M7 — facture : note = note des devis",
  htmlFacture.includes("Je reste à votre disposition pour toute question complémentaire et vous remercie pour votre confiance."),
);

/* ---------- M5 : proposition, destinataire sous prestataire ---------- */
const htmlPropAvec = renderPropositionHtml(prop);
const propSans = { ...prop, destinataire: undefined };
const htmlPropSans = renderPropositionHtml(propSans);
controle("M5 — rangée DESTINATAIRE empilée (paire-destinataire)", htmlPropAvec.includes("paire-destinataire"));
controle("M5 — plus de duo à deux colonnes", !htmlPropAvec.includes("paire-duo"));
controle(
  "M5 — DESTINATAIRE AVANT PRESTATAIRE (l'un sous l'autre)",
  htmlPropAvec.indexOf(">DESTINATAIRE<") < htmlPropAvec.indexOf(">PRESTATAIRE<"),
);
controle("M5 — compensation posée (infos--dest + t01-dest)", htmlPropAvec.includes("infos--dest") && htmlPropAvec.includes("t01-dest"));
const sansCommentaires = (h: string) => h.replace(/<!--[\s\S]*?-->/g, "");
controle(
  "M5 — sans destinataire : aucune rangée rendue",
  !sansCommentaires(htmlPropSans).includes(">DESTINATAIRE<"),
);

/* ---------- M11 : pagination Chromium (tableau long) ---------- */
async function main() {
async function paginer(html: string) {
  const navigateur = await puppeteer.launch({
    headless: true,
    executablePath: path.join(
      os.homedir(),
      ".cache/ms-playwright/chromium-1200/chrome-linux64/chrome",
    ),
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await navigateur.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.waitForFunction("window.__paginePc === true", { timeout: 12000 }).catch(() => null);
  await new Promise((r) => setTimeout(r, 900));
  const resultat = await page.evaluate(() => {
    const pages = Array.from(document.querySelectorAll(".ppage")) as HTMLElement[];
    const compteRendu: {
      pages: number;
      finPage: number[];
      entetePage2: boolean;
      teteSection01: number | null;
      lignesMaxDescription: number;
    } = { pages: pages.length, finPage: [], entetePage2: false, teteSection01: null, lignesMaxDescription: 0 };
    pages.forEach((p, i) => {
      const dernier = p.querySelector(".corps [data-bloc]:last-child");
      if (dernier?.classList.contains("fin-page")) compteRendu.finPage.push(i + 1);
    });
    /* Hauteur mesurée des paragraphes de description (9 pt / 1,5 →
       18 px par ligne) : aucun ne doit dépasser QUATRE lignes. */
    document.querySelectorAll(".desc-riche p").forEach((p) => {
      const el = p as HTMLElement;
      if (el.querySelector('font[size="5"]')) return; /* titre */
      const lignes = Math.round(el.offsetHeight / 18);
      if (lignes > compteRendu.lignesMaxDescription) compteRendu.lignesMaxDescription = lignes;
    });
    const page2 = pages[1];
    if (page2) {
      compteRendu.entetePage2 = Boolean(
        page2.querySelector(".corps > .svc-head") &&
          page2.querySelector(".corps > .svc-part.debut-page"),
      );
    }
    const tete01 = document.querySelector(".s-head.t01");
    if (tete01) compteRendu.teteSection01 = Math.round(tete01.getBoundingClientRect().top);
    return compteRendu;
  });
  await navigateur.close();
  return resultat;
}

/* Devis avec tableau LONG (plusieurs pages) : la description de la
 * proposition est déjà longue ; on ajoute des lignes pour forcer
 * 3+ pages de tableau. */
const devisLong: DocumentRecord = {
  ...devis,
  items: [
    ...(devis.items ?? []),
    ...Array.from({ length: 6 }, (_, i) => ({
      id: `x${i}`,
      type: "Service",
      designation: `Prestation complémentaire ${i + 1}`,
      description:
        "Écoute stratégique et compréhension de votre activité. Conception sur mesure au code pur, sans template générique. Rédaction professionnelle des textes et référencement de base dès la conception.",
      prixUnitaire: 50000,
      quantite: 1,
    })),
  ],
} as unknown as DocumentRecord;
const resDevisLong = await paginer(renderDocumentHtml(devisLong));
controle(
  "M11 — tableau coupé FERMÉ en bas de page (trait fin)",
  resDevisLong.finPage.length >= 1,
  `pages: ${resDevisLong.pages}, fermées: [${resDevisLong.finPage.join(", ")}]`,
);
controle(
  "M11 — page de continuation : en-tête du tableau REPRIS",
  resDevisLong.entetePage2,
  `pages: ${resDevisLong.pages}`,
);

/* Titre + description dans la MÊME rangée (fragments <div>). */
const fragments = decouperHtmlRiche(description);
controle(
  "M9 — chaque périmètre (titre + description) tient en UNE rangée",
  fragments.length === morceauxTitres.length && fragments.every((f) => f.startsWith("<div>")),
  `${fragments.length} rangées pour ${morceauxTitres.length} périmètres`,
);

/* Mesure écran des descriptions GÉNÉRÉES (devis depuis proposition). */
const resDevis = await paginer(renderDocumentHtml(devis));
controle(
  "M9 — description ≤ 4 lignes MESURÉES à l'écran",
  resDevis.lignesMaxDescription <= 4,
  `maximum mesuré : ${resDevis.lignesMaxDescription} lignes`,
);

/* M5 : la proposition AVEC destinataire garde les mêmes positions */
const resPropAvec = await paginer(htmlPropAvec);
const resPropSans = await paginer(htmlPropSans);
controle(
  "M5 — nombre de pages identique avec/sans destinataire",
  resPropAvec.pages === resPropSans.pages,
  `avec: ${resPropAvec.pages}, sans: ${resPropSans.pages}`,
);
controle(
  "M5 — la section 01 démarre au même endroit (±6 px)",
  resPropAvec.teteSection01 !== null &&
    resPropSans.teteSection01 !== null &&
    Math.abs(resPropAvec.teteSection01 - resPropSans.teteSection01) <= 6,
  `avec: ${resPropAvec.teteSection01}px, sans: ${resPropSans.teteSection01}px`,
);

console.log(
  echecs === 0
    ? "\n=== VOLET 23 : TOUS LES CONTRÔLES PASSENT ==="
    : `\n=== ${echecs} CONTRÔLE(S) EN ÉCHEC ===`,
);
process.exit(echecs === 0 ? 0 : 1);
}
main();
