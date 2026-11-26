/**
 * VOLET 20 — rendu local des documents de test (devis + factures
 * payée/en attente + proposition) vers /tmp, pour la sonde visuelle.
 * Usage : npx tsx scripts/rendre-documents-volet20.ts
 */
import { writeFileSync } from "fs";
import { renderDocumentHtml } from "../src/lib/documents/document-html";
import { renderPropositionHtml } from "../src/lib/documents/proposition-html";
import { propositionV2ParDefaut } from "../src/lib/documents/proposition";
import { devisParDefaut, exempleModele } from "../src/lib/documents/defaults";
import type { DocumentRecord } from "../src/lib/documents/types";
import type { PropositionRecord } from "../src/lib/documents/proposition";

function base(partial: Partial<DocumentRecord>): DocumentRecord {
  const d = devisParDefaut();
  return {
    ...d,
    ...partial,
  } as DocumentRecord;
}

const maintenant = new Date().toISOString().slice(0, 10);

/* ---- 1. DEVIS (sans montant en lettres, intro/CGV/banque conservées) ---- */
const devis = base({
  numero: "D2600099",
  date: maintenant,
  validiteJours: 15,
});
writeFileSync("/tmp/volet20-devis.html", renderDocumentHtml(devis));
console.log("OK /tmp/volet20-devis.html");

/* ---- 2. FACTURE PAYÉE (cachet vert PAYÉ sur les pointillés) ---- */
const facturePayee = base({
  docType: "facture",
  numero: "F2600099",
  devisSource: "D2600099",
  date: maintenant,
  statutPaiement: "Payé",
  datePaiement: maintenant,
});
writeFileSync("/tmp/volet20-facture-payee.html", renderDocumentHtml(facturePayee));
console.log("OK /tmp/volet20-facture-payee.html");

/* ---- 3. FACTURE EN ATTENTE (cachet gris EN ATTENTE, sans date) ---- */
const factureAttente = base({
  docType: "facture",
  numero: "F2600100",
  devisSource: "D2600100",
  date: maintenant,
  statutPaiement: "En attente",
});
writeFileSync("/tmp/volet20-facture-attente.html", renderDocumentHtml(factureAttente));
console.log("OK /tmp/volet20-facture-attente.html");

/* ---- 4. DEVIS MULTI-PAGES (description dense : en-tête du tableau
          REPRIS sur la page de continuation) ---- */
const ex = exempleModele();
const descriptionDense = Array.from({ length: 60 })
  .map(
    ( _, i) =>
      `<p><b>Volet ${i + 1} de la prestation.</b> Description volontairement longue pour forcer la coupure du tableau sur plusieurs pages : chaque fragment est un bloc paginable, l'en-tête du tableau doit être repris en tête de chaque page de continuation.</p>`,
  )
  .join("");
const devisLong = base({
  numero: "D2600101",
  date: maintenant,
  client: {
    nom: "Aïcha DOSSOU",
    entreprise: "Cabinet Essentiel & Stratégie",
    ville: "Cotonou",
    pays: "Bénin",
    telephone: "+229 01 00 00 00 00",
    email: "exemple@demo.fr",
  },
  items: [
    {
      id: "l1",
      type: "Service",
      designation: "Site Web Professionnel — 5 pages",
      description: descriptionDense,
      quantite: 1,
      prixUnitaire: 450000,
    },
    {
      id: "l2",
      type: "Service",
      designation: "Rédaction professionnelle complète (copywriting)",
      description: "<p>Rédaction des textes de toutes les pages.</p>",
      quantite: 1,
      prixUnitaire: 75000,
    },
  ],
});
writeFileSync("/tmp/volet20-devis-long.html", renderDocumentHtml(devisLong));
console.log("OK /tmp/volet20-devis-long.html");

/* ---- 5. PROPOSITION (date d'émission sous le trait, destinataire) ---- */
const prop: PropositionRecord = {
  ...propositionV2ParDefaut(),
  id: "proposition-pc2600099",
  numero: "PC2600099",
  numeroClient: 99,
  date: maintenant,
  destinataire: { nomComplet: "Aïcha Dossou", entreprise: "Cabinet Essentiel & Stratégie" },
} as unknown as PropositionRecord;
writeFileSync("/tmp/volet20-proposition.html", renderPropositionHtml(prop));
console.log("OK /tmp/volet20-proposition.html");
