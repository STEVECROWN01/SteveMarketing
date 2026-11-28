/**
 * VOLET 27 (28/11/2026) — OUTILS DE SCRAPING POUR LA PROSPECTION.
 *
 * Trois outils de prospection (Google Maps, Instagram, LinkedIn) :
 *  - fiches d'entreprises PAR LIEU ET PAR NICHE (outil « Google Maps ») ;
 *  - pages d'entreprises Instagram (bio, catégorie, email, site web…) ;
 *  - pages d'entreprises LinkedIn (industrie, employés, siège, site…).
 *
 * Champs demandés par l'éditeur, pour CHAQUE outil (ceux disponibles
 * selon la source) : nom de l'entreprise, ce qu'elle fait (niche /
 * bio), localisation (pays au minimum), email, téléphone, lien du
 * site web, nombre d'employés — plus le FILTRE « avec site web /
 * sans site web » : c'est en fonction de ce filtre que l'outil scrape.
 */

/** Filtre « site web » : ce que l'outil doit renvoyer. */
export type FiltreSiteWeb = "tous" | "avec" | "sans";

/** Une entreprise prospectée par un outil de scraping. */
export type EntrepriseScraped = {
  /** Outil d'origine. */
  source: "google-maps" | "instagram" | "linkedin";
  /** Nom de l'entreprise. */
  nom: string;
  /** Ce que fait l'entreprise : catégorie / industrie / niche. */
  niche: string;
  /** VOLET 29 — clé de la niche du fichier de prospection quand la
   *  recherche en partait (ex. « #11 ») : sert à adapter le message
   *  personnalisé envoyé au prospect. */
  nicheProspection?: string;
  /** Description / bio (ce que fait l'entreprise). */
  bio?: string;
  /** Localisation : ville, quartier… au minimum le pays. */
  localisation?: string;
  /** Pays seul (quand disponible séparément). */
  pays?: string;
  /** VOLET 29 — adresse complète de l'entreprise (quand disponible). */
  adresse?: string;
  /** Numéro de téléphone (si disponible). */
  telephone?: string;
  /** Adresse email (si disponible). */
  email?: string;
  /** Lien du site web de l'entreprise (si disponible). */
  siteWeb?: string;
  /** Nombre d'employés (LinkedIn) ou taille d'audience, si connu. */
  employes?: string;
  /** VOLET 29 — nom du dirigeant / propriétaire de l'entreprise
   *  (recherché sur son site web — « s'il le trouve » ; sinon absent
   *  et l'espace affiche « Non trouvé »). */
  dirigeant?: string;
  /** VOLET 29 — horaires d'ouverture (quand disponibles). */
  horaires?: string;
  /** VOLET 29 — ancienneté de l'entreprise : depuis quand elle
   *  existe (quand la source la publie). */
  anciennete?: string;
  /** Identifiant public (username Instagram / slug LinkedIn). */
  contact?: string;
  /** Lien de la fiche d'origine (page publique). */
  urlSource?: string;
  /** VOLET 32 — diagnostic de la qualité du site web (quand la
   *  page d'accueil a pu être lue) : plateforme, année de mise à
   *  jour, HTTPS, mobile, score 0-100, verdict et problèmes —
   *  c'est le « pourquoi ce prospect a besoin de vous ». */
  qualiteSite?: import("./qualite-site").QualiteSite;
  /** Le site web est-il présent ? (calculé par l'outil) */
  siteWebPresent: boolean;
};

/** Réponse commune des trois outils. */
export type ResultatScraping = {
  ok: boolean;
  /** Entreprises APRÈS application du filtre « site web ». */
  entreprises: EntrepriseScraped[];
  /** Total trouvé AVANT le filtre. */
  totalTrouvees: number;
  /** Combien n'ont PAS de site web (prospection). */
  sansSiteWeb: number;
  /** Message d'information (source partielle, moteur indisponible…). */
  avertissement?: string;
  /** Message d'erreur fatale (si ok = false). */
  erreur?: string;
};
