/**
 * VOLET 19 — rend les documents types (proposition / devis / facture)
 * en HTML pour inspection visuelle (captures Playwright).
 * Usage : bun scripts/rendre-documents-volet19.ts
 */
import { renderPropositionHtml } from "../src/lib/documents/proposition-html";
import { renderDocumentHtml } from "../src/lib/documents/document-html";
import { propositionV2ParDefaut, estPropositionV2 } from "../src/lib/documents/proposition";
import { exempleModele, BANQUE_DEFAUT, TEXTES_DEFAUT, VALIDITE_JOURS } from "../src/lib/documents/defaults";
import { completerDocument } from "../src/lib/documents/github";
import { LOGO_DOC_DATA_URI } from "../src/lib/documents/logo-base64";
import { writeFileSync } from "node:fs";

/* Proposition avec les valeurs par défaut (extraites de l'exemple). */
const propBrut = {
  docType: "proposition" as const,
  numeroClient: 1,
  ...propositionV2ParDefaut(),
};
const prop = completerDocument(propBrut);
const htmlProp = renderPropositionHtml(estPropositionV2(prop) ? prop : (prop as never), LOGO_DOC_DATA_URI);
writeFileSync("/tmp/volet19-proposition.html", htmlProp);
console.log("proposition OK", htmlProp.length, "caractères");

/* Devis avec l'exemple de contenu dense (description riche longue). */
const devisBrut = {
  docType: "devis" as const,
  numeroClient: 2,
  ...exempleModele(),
  devise: "EUR",
  banque: { ...BANQUE_DEFAUT },
  conditionsReglement: TEXTES_DEFAUT.fr.conditionsReglement,
  modePaiement: TEXTES_DEFAUT.fr.modePaiement,
  validiteJours: VALIDITE_JOURS,
  items: [
    {
      type: "",
      designation: "Création d'un site web professionnel",
      description: `<p><font size="5"><b>Prestation complète</b></font></p>
<p>La prestation comprend la conception, la rédaction et le développement de l'ensemble des pages décrites ci-dessous, ainsi que la mise en ligne sur votre nom de domaine.</p>
<ul>
<li>Analyse de votre activité et de vos objectifs commerciaux.</li>
<li>Conception de l'architecture et du parcours des visiteurs.</li>
<li>Design des pages sur mesure (aucun modèle générique).</li>
<li>Rédaction professionnelle des contenus principaux.</li>
<li>Développement au code pur, optimisé pour la vitesse.</li>
<li>Optimisation SEO de base de chaque page.</li>
<li>Compatibilité mobile, tablette et ordinateur.</li>
<li>Mise en ligne et vérifications finales.</li>
</ul>
<p><b>Ce qui est inclus :</b></p>
<ul>
<li>Formulaires de contact fonctionnels.</li>
<li>Liens vers vos réseaux sociaux.</li>
<li>Statistiques de visite de base.</li>
<li>Formation à la prise en main.</li>
</ul>
<p>Le site vous est livré prêt à recevoir vos visiteurs, avec l'ensemble des accès nécessaires à son administration.</p>`,
      quantite: 1,
      prixUnitaire: 350000,
      mentionLivraison: "",
    },
  ],
};
const devis = completerDocument(devisBrut);
const htmlDevis = renderDocumentHtml(devis as never, LOGO_DOC_DATA_URI);
writeFileSync("/tmp/volet19-devis.html", htmlDevis);
console.log("devis OK", htmlDevis.length, "caractères");

/* Facture courte pour vérifier l'en-tête et le total. */
const factureBrut = {
  docType: "facture" as const,
  numeroClient: 3,
  ...exempleModele(),
  devise: "EUR",
  banque: { ...BANQUE_DEFAUT },
  conditionsReglement: TEXTES_DEFAUT.fr.conditionsReglement,
  modePaiement: TEXTES_DEFAUT.fr.modePaiement,
  validiteJours: VALIDITE_JOURS,
  statutPaiement: "Payé",
  datePaiement: "2026-11-26",
};
const facture = completerDocument(factureBrut);
const htmlFacture = renderDocumentHtml(facture as never, LOGO_DOC_DATA_URI);
writeFileSync("/tmp/volet19-facture.html", htmlFacture);
console.log("facture OK", htmlFacture.length, "caractères");
