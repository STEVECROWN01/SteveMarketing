/**
 * SONDE M19 (28/11/2026) — « il y a suffisamment d'espace sous le bloc
 * paiement, mais tu as envoyé la validité du document ainsi que la
 * note sur AUTRE PAGE » : reproduction avec le flux réel (devis depuis
 * proposition, 7 périmètres) et mesure de la position du bloc
 * PAIEMENT, des coordonnées bancaires et du bloc validité+notes.
 */
import { readFileSync, writeFileSync } from "fs";
import { renderDocumentHtml } from "../../SteveMarketing/src/lib/documents/document-html";
import { preRemplissageDevisDepuisProposition } from "../../SteveMarketing/src/lib/documents/devis-depuis-proposition";
import { buildNumero } from "../../SteveMarketing/src/lib/documents/format";
import { propositionV2ParDefaut } from "../../SteveMarketing/src/lib/documents/proposition";
import type { DocumentRecord } from "../../SteveMarketing/src/lib/documents/types";

const logo = readFileSync("/home/z/my-project/SteveMarketing/public/assets/logo-noir.png");
const logoData = `data:image/png;base64,${logo.toString("base64")}`;

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
} as unknown as DocumentRecord;

const html = renderDocumentHtml(devis, logoData);
writeFileSync("/tmp/render/m19-devis-prop.html", html);
console.log("HTML écrit :", html.length, "caractères — description :",
  String(devis.items[0].description).replace(/<[^>]+>/g, "").length, "caractères");
