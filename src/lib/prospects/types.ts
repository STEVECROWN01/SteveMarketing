/**
 * VOLET 29 (28/11/2026) — L'ESPACE « PROSPECTS » DU BACK-OFFICE.
 *
 * Demande de l'éditeur : les résultats de scraping SÉLECTIONNÉS sont
 * importés dans un espace dédié qui présente TOUS les prospects dans
 * un tableau façon Excel (entreprise, dirigeant, email, téléphone,
 * adresse, site web, message personnalisé, suivi RDV / converti…).
 * Chaque ensemble importé en un clic forme un LOT, séparé du
 * suivant par une ligne en gras plus claire, avec la date et l'heure
 * d'importation affichées VERTICALEMENT au début du lot.
 *
 * Les données sont SAUVEGARDÉES dans le dépôt GitHub privé de
 * stockage du back-office : le fichier prospects/prospects.json
 * (source de vérité de l'espace) et le classeur prospects/
 * prospects.xlsx, MIS À JOUR à chaque import (jamais un nouveau
 * fichier) — on ne perd jamais les données.
 */

import type { EntrepriseScraped } from "@/lib/scraping/types";
import type { QualiteSite } from "@/lib/scraping/qualite-site";

/** Le suivi d'un prospect : contacté, rendez-vous, conversion. */
export type StatutProspect =
  | "non-contacte"
  | "contacte"
  | "rdv-accepte"
  | "rdv-tenu"
  | "converti"
  | "perdu";

/** Les statuts du suivi, dans l'ordre du travail de prospection. */
export const STATUTS_PROSPECT: { cle: StatutProspect; libelle: string; couleur: string }[] = [
  { cle: "non-contacte", libelle: "Non contacté", couleur: "#c8c8c8" },
  { cle: "contacte", libelle: "Contacté", couleur: "#86efac" },
  { cle: "rdv-accepte", libelle: "RDV accepté", couleur: "#a3c4ff" },
  { cle: "rdv-tenu", libelle: "RDV tenu", couleur: "#ffe9a3" },
  { cle: "converti", libelle: "Converti", couleur: "#22c55e" },
  { cle: "perdu", libelle: "Perdu", couleur: "#ff8080" },
];

/** Le libellé affiché d'un statut. */
export function statutLibelle(cle: StatutProspect): string {
  return STATUTS_PROSPECT.find((s) => s.cle === cle)?.libelle ?? cle;
}

/** La couleur d'un statut (points, pastilles). */
export function statutCouleur(cle: StatutProspect): string {
  return STATUTS_PROSPECT.find((s) => s.cle === cle)?.couleur ?? "#c8c8c8";
}

/** Un prospect enregistré dans l'espace Prospects. */
export type ProspectEnregistre = {
  /** Identifiant stable (lot + index). */
  id: string;
  /** Nom de l'entreprise. */
  nom: string;
  /** Ce que fait l'entreprise (niche scrapée). */
  niche: string;
  /** Clé de la niche du fichier de prospection (ex. « #11 »). */
  nicheProspection?: string;
  /** Nom du dirigeant / propriétaire — « Non trouvé » si absent. */
  dirigeant?: string;
  /** Email de l'entreprise. */
  email?: string;
  /** Téléphone de l'entreprise. */
  telephone?: string;
  /** Adresse de localisation. */
  adresse?: string;
  /** Ville / quartier. */
  localisation?: string;
  /** Pays. */
  pays?: string;
  /** Site web. */
  siteWeb?: string;
  /** Horaires d'ouverture. */
  horaires?: string;
  /** Depuis quand l'entreprise existe. */
  anciennete?: string;
  /** Nombre d'employés. */
  employes?: string;
  /** Ce que fait l'entreprise (bio). */
  bio?: string;
  /** Le suivi du prospect. */
  statut: StatutProspect;
  /** Outil d'origine du scraping. */
  source: EntrepriseScraped["source"];
  /** Fiche d'origine. */
  urlSource?: string;
  /** VOLET 32 — diagnostic de la qualité du site web au moment du
   *  scraping (plateforme, année, score, verdict, problèmes) : le
   *  « pourquoi ce prospect a besoin de vous » suit le prospect
   *  jusque dans le classeur Excel. */
  qualiteSite?: QualiteSite;
  /** Date d'import dans l'espace (ISO). */
  importeLe: string;
};

/** Un ensemble de prospects importés en un clic (un lot). */
export type LotProspects = {
  /** Identifiant du lot. */
  id: string;
  /** Date et heure d'importation (ISO). */
  importeLe: string;
  /** La niche / la recherche d'origine, pour mémoire. */
  intitule: string;
  /** Les prospects du lot. */
  prospects: ProspectEnregistre[];
};

/** Le classeur des prospects : la liste des lots, du plus récent au
 *  plus ancien. */
export type ClasseurProspects = {
  lots: LotProspects[];
};
