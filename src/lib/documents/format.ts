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

/** Montant façon « proposition commerciale » (VOLET 16) : « 2 000 € »
 *  sans décimales quand le montant est entier (template de l'éditeur). */
export function fmtMontantSimple(montant: number, devise: string = "EUR"): string {
  const n = Number.isFinite(montant) ? montant : 0;
  const nb = n.toLocaleString("fr-FR", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  const m = MONNAIES[devise] ?? MONNAIES.EUR;
  return m.avant ? `${m.symbole}${nb}` : `${nb} ${m.symbole}`;
}

/* ------------------------------------------------------------------
 * MONTANT EN LETTRES (VOLET 17) — « Total : 2 000,00 € (deux mille
 * euros) — TVA non applicable » sous le tableau des devis : le
 * total s'écrit aussi en toutes lettres, comme demandé par
 * l'éditeur. Règles françaises : vingt/cent accordés au pluriel
 * seulement en fin de nombre composé, mille invariable.
 * ------------------------------------------------------------------ */

const UNITES_MOTS = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
  "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf",
];
const DIZAINES = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "", "quatre-vingt"];

function deuxChiffres(n: number): string {
  if (n < 20) return UNITES_MOTS[n];
  const d = Math.floor(n / 10);
  const u = n % 10;
  if (d === 7 || d === 9) {
    if (u === 0) return d === 7 ? "soixante-dix" : "quatre-vingt-dix";
    if (u === 1 && d === 7) return "soixante et onze";
    return (d === 7 ? "soixante" : "quatre-vingt") + "-" + UNITES_MOTS[10 + u];
  }
  const base = DIZAINES[d];
  if (u === 0) return base + (d === 8 ? "s" : "");
  if (u === 1 && d !== 8) return base + " et un";
  return base + "-" + UNITES_MOTS[u];
}

function troisChiffres(n: number): string {
  const c = Math.floor(n / 100);
  const r = n % 100;
  let out = "";
  if (c === 1) out = "cent";
  else if (c > 1) out = UNITES_MOTS[c] + " cent" + (r === 0 ? "s" : "");
  if (r > 0) out = out ? out + " " + deuxChiffres(r) : deuxChiffres(r);
  return out || "zéro";
}

function entierEnLettres(n: number): string {
  if (n <= 0) return "zéro";
  const morceaux: string[] = [];
  let reste = n;
  const milliards = Math.floor(reste / 1_000_000_000);
  reste %= 1_000_000_000;
  if (milliards) {
    morceaux.push((milliards === 1 ? "un" : troisChiffres(milliards)) + (milliards > 1 ? " milliards" : " milliard"));
  }
  const millions = Math.floor(reste / 1_000_000);
  reste %= 1_000_000;
  if (millions) {
    morceaux.push((millions === 1 ? "un" : troisChiffres(millions)) + (millions > 1 ? " millions" : " million"));
  }
  const milliers = Math.floor(reste / 1_000);
  reste %= 1_000;
  if (milliers) {
    morceaux.push(milliers === 1 ? "mille" : troisChiffres(milliers) + " mille");
  }
  if (reste) morceaux.push(troisChiffres(reste));
  return morceaux.join(" ");
}

/** Unités monétaires — [singulier, pluriel, centime sing., centime pl.]. */
const UNITES_MONNAIE: Record<string, [string, string, string | null, string | null]> = {
  EUR: ["euro", "euros", "centime", "centimes"],
  XOF: ["franc CFA", "francs CFA", null, null],
  XAF: ["franc CFA", "francs CFA", null, null],
  USD: ["dollar américain", "dollars américains", "cent", "cents"],
  CAD: ["dollar canadien", "dollars canadiens", "cent", "cents"],
  GBP: ["livre sterling", "livres sterling", "penny", "pence"],
  CHF: ["franc suisse", "francs suisses", "centime", "centimes"],
};

/** « 2 000 » → « deux mille euros » (devise accordée, centimes
 *  éventuels ; le franc CFA n'a pas de subdivision). */
export function montantEnLettres(montant: number, devise: string = "EUR"): string {
  const u = UNITES_MONNAIE[devise] ?? UNITES_MONNAIE.EUR;
  const arrondi = Math.round((Number(montant) || 0) * 100) / 100;
  const entier = Math.floor(arrondi);
  const centimes = Math.round((arrondi - entier) * 100);
  /* « un million D'euros » / « deux millions DE francs » : les
     échelles million/milliard exigent la préposition « de/d' ». */
  const motUnite = entier > 1 ? u[1] : u[0];
  const liaison = entier >= 1_000_000 ? (/^[aeéèiouh]/i.test(motUnite) ? " d'" : " de ") : " ";
  let out = entierEnLettres(entier) + liaison + motUnite;
  if (centimes > 0 && u[2]) {
    out += " et " + entierEnLettres(centimes) + " " + (centimes > 1 ? u[3] : u[2]);
  }
  return out;
}
