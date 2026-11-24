/**
 * Formatage des documents — fonctions copiées de K.Quotes
 * (src/lib/i18n.ts de ce projet) : dates en toutes lettres, monnaies
 * localisées, numéros de documents D/F/PC + année 2 chiffres +
 * numéro client sur 5 chiffres.
 */

import type { DocType } from "./types";

/** « 04 mai 2026 » — comme K.Quotes. */
export function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  const mois = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
  ];
  return `${String(d.getDate()).padStart(2, "0")} ${mois[d.getMonth()]} ${d.getFullYear()}`;
}

/** « 04/05/2026 » — pour la date du cachet payé (MrSteveEnglish :
 * « le JJ/MM/AAAA » sous PAYÉ). */
export function formatDateCourte(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

/** Monnaies — mêmes règles que K.Quotes (symbole APRÈS le montant
 *  pour FCFA/EUR-fr, AVANT pour $/£/CHF ; 2 décimales). */
const MONNAIES: Record<string, { symbole: string; locale: string; avant: boolean }> = {
  EUR: { symbole: "€", locale: "fr-FR", avant: false },
  USD: { symbole: "$", locale: "en-US", avant: true },
  XOF: { symbole: "FCFA", locale: "fr-FR", avant: false },
  XAF: { symbole: "FCFA", locale: "fr-FR", avant: false },
  CAD: { symbole: "$ CA", locale: "fr-CA", avant: false },
  GBP: { symbole: "£", locale: "en-GB", avant: true },
  CHF: { symbole: "CHF", locale: "de-CH", avant: true },
};

export function formatCurrency(montant: number, devise: string = "XOF"): string {
  const m = MONNAIES[devise] ?? MONNAIES.XOF;
  const n = montant.toLocaleString(m.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return m.avant ? `${m.symbole}${n}` : `${n} ${m.symbole}`;
}

/** Numéro de document — règle K.Quotes : préfixe + année (2) +
 *  numéro client sur 5 chiffres. client 1 en 2026 → D2600001.
 *  Proposition : PC2600001. */
export function buildNumero(numeroClient: number, docType: DocType): string {
  const annee = new Date().getFullYear().toString().slice(-2);
  return `${docType === "devis" ? "D" : docType === "facture" ? "F" : "PC"}${annee}${String(numeroClient).padStart(5, "0")}`;
}

/** Conversion devis → facture (règle K.Quotes : D remplacé par F). */
export function numeroDevisVersFacture(numeroDevis: string): string {
  return numeroDevis.replace(/^D/, "F");
}

/** Identifiant de fichier : devis-d2600001 (minuscules). */
export function buildIdDocument(docType: DocType, numero: string): string {
  return `${docType}-${numero}`.toLowerCase();
}

/** Nom de fichier PDF — convention K.Quotes :
 *  Devis_D2600004_Eric_De_Lavarene.pdf. */
export function buildNomFichier(
  docType: DocType,
  numero: string,
  nomClient: string,
): string {
  const label = docType === "devis" ? "Devis" : docType === "facture" ? "Facture" : "Proposition";
  const parties = nomClient.trim().split(/\s+/);
  const premier = parties[0] || "Client";
  const reste = parties.slice(1).join("_");
  const nomSur = `${premier}${reste ? "_" + reste : ""}`.replace(/[^a-zA-Z0-9_]/g, "");
  return `${label}_${numero}_${nomSur}.pdf`;
}

/** Total du document (somme quantité × prix unitaire). */
export function totalDocument(items: { quantite: number; prixUnitaire: number }[]): number {
  return items.reduce((somme, it) => somme + (Number(it.quantite) || 0) * (Number(it.prixUnitaire) || 0), 0);
}
