/**
 * PORTFOLIO ÉVOLUTIF — TYPES (VOLET 19, 26/11/2026).
 *
 * Demande de l'éditeur : « au fur et à mesure que j'aurai des
 * clients, je vais réaliser des projets et j'aurai besoin de mettre
 * à jour mon portfolio depuis l'espace admin… remplir toutes les
 * informations, enregistrer comme brouillon ou enregistrer et
 * publier directement. Le projet s'ajoute sur le site comme tous
 * les autres, présenté de la même façon. »
 *
 * Stockage : dossier `portfolio/` du DÉPÔT PRIVÉ déjà utilisé pour
 * les documents commerciaux (STEVECROWN01/SteveMarketing-Documents,
 * jeton GITHUB_DOCS_TOKEN) — JSON par projet, images EMBARQUÉES en
 * base64 dans le JSON (comprimées côté navigateur avant l'envoi).
 * Aucune base payante, aucun CDN tiers.
 *
 * Les projets enregistrés ici s'AJOUTENT à la suite des quatre
 * projets statiques du site (src/lib/site.ts) — les mockups du hero
 * (PROJECTS[2] par INDEX) ne sont jamais décalés.
 */

/** Une capture du projet, comprimée dans le navigateur puis
 *  enregistrée en base64 dans le JSON du projet. */
export type ImageProjet = {
  /** Octets de l'image en base64 (sans préfixe data:). */
  data: string;
  /** Type MIME (« image/webp », « image/jpeg », « image/png »). */
  mime: string;
  /** Dimensions enregistrées (px) — servent aux attributs
   *  width/height de l'img côté site (réserve de place, zéro CLS). */
  largeur: number;
  hauteur: number;
};

/** Traduction anglaise optionnelle des champs texte. */
export type TraductionProjet = {
  nom?: string;
  categorie?: string;
  description?: string;
  cta?: string;
};

/** Enregistrement complet d'un projet géré depuis l'espace admin. */
export type ProjetAdmin = {
  /** Identifiant de fichier (slug). */
  id: string;
  nom: string;
  categorie: string;
  description: string;
  /** Libellé du bouton (ex. « Voir Le Site »). */
  cta: string;
  /** URL du site en ligne. */
  url: string;
  /** brouillon (invisible sur le site) | publie (visible). */
  statut: "brouillon" | "publie";
  desktop: ImageProjet | null;
  mobile: ImageProjet | null;
  traductions?: TraductionProjet | null;
  /** VOLET 22 (27/11/2026) — « site » : projet ORIGINELMENT STATIQUE
   *  (les réalisations du code du site) converti en projet ADMIN :
   *  il REMPLACE le projet statique de même identifiant sur le
   *  site (même position, hero préservé) et sa suppression est
   *  DÉFINITIVE (l'original statique ne réapparaît pas). */
  origine?: "site" | null;
  createdAt: string;
  updatedAt: string;
};

/** Projet tel que servi au SITE PUBLIC (GET /api/projects) : les
 *  images deviennent des URLs servies par l'API, les brouillons
 *  sont exclus. */
export type ProjetPublic = {
  id: string;
  nom: string;
  categorie: string;
  description: string;
  cta: string;
  url: string;
  desktop: string;
  mobile: string | null;
  largeurDesktop: number;
  hauteurDesktop: number;
  largeurMobile: number | null;
  hauteurMobile: number | null;
  en: TraductionProjet | null;
  ajouteLe: string;
};

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export const TAILLE_IMAGE_MAX = 1_400_000; // ~1,4 Mo de base64 par image

export function slugifier(nom: string): string {
  return (
    nom
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "projet"
  );
}

/** Champs textuels obligatoires pour PUBLIER (le brouillon peut
 *  être partiel). Retourne la liste des manques (vide = complet). */
export function manquesPublication(p: {
  nom: string;
  categorie: string;
  description: string;
  cta: string;
  url: string;
  desktop: ImageProjet | null;
}): string[] {
  const manques: string[] = [];
  if (!p.nom.trim()) manques.push("le nom du projet");
  /* VOLET 20 — l'ancien champ « catégorie » s'appelle désormais
   * « TITRE » (ce n'est pas une catégorie, c'est un titre) ; le
   * libellé du bouton est posé automatiquement par le site (« Voir
   * Le Site ») : plus de contrôle à son sujet. */
  if (!p.categorie.trim()) manques.push("le titre");
  if (!p.description.trim()) manques.push("la description");
  if (!/^https?:\/\/.+\..+/i.test(p.url.trim())) manques.push("l'URL du site (https://…)");
  if (!p.desktop) manques.push("l'aperçu ordinateur (extrait automatiquement depuis l'URL)");
  return manques;
}
