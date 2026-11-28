/**
 * VOLET 27 — extraction de coordonnées depuis un texte libre (bio
 * Instagram, description LinkedIn, fiche d'entreprise) : email,
 * téléphone et site web — « si possible », comme demandé par
 * l'éditeur : la bio d'une entreprise contient très souvent les
 * coordonnées en toutes lettres.
 */

/** Adresse email contenue dans un texte (la première, en minuscules). */
export function extraireEmail(texte: string | undefined | null): string | undefined {
  if (!texte) return undefined;
  const m = texte.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return m ? m[0].toLowerCase() : undefined;
}

/** Numéro de téléphone international ou local dans un texte. */
export function extraireTelephone(texte: string | undefined | null): string | undefined {
  if (!texte) return undefined;
  // Séquences d'au moins 8 chiffres avec séparateurs autorisés,
  // précédées le plus souvent de + ou du mot « tel ».
  const m = texte.match(/(?:\+\d{1,4}[\s.-]?)?(?:\d[\s.-]?){7,14}\d/);
  if (!m) return undefined;
  const tel = m[0].replace(/\s+/g, " ").trim();
  const nbChiffres = (tel.match(/\d/g) ?? []).length;
  if (nbChiffres < 8 || nbChiffres > 16) return undefined;
  return tel;
}

/** Domaines sociaux à ne PAS considérer comme le site web de l'entreprise. */
const DOMAINES_SOCIAUX = [
  "instagram.com",
  "facebook.com",
  "fb.com",
  "twitter.com",
  "x.com",
  "tiktok.com",
  "linkedin.com",
  "youtube.com",
  "wa.me",
  "whatsapp.com",
  "t.me",
  "telegram.me",
  "pinterest.com",
  "snapchat.com",
];

/** Lien de site web contenu dans un texte (hors réseaux sociaux). */
export function extraireSiteWeb(texte: string | undefined | null): string | undefined {
  if (!texte) return undefined;
  const m = texte.match(/https?:\/\/[^\s"'<>)]+/gi) ?? [];
  for (const brut of m) {
    const lien = brut.replace(/[.,;:)\]]+$/, "");
    let hote = "";
    try {
      hote = new URL(lien).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      continue;
    }
    if (!hote || DOMAINES_SOCIAUX.some((d) => hote === d || hote.endsWith(`.${d}`))) continue;
    return lien;
  }
  return undefined;
}

/** Normalise un site web saisi ou scrapé (https:// ajouté, slash final retiré). */
export function normaliserSiteWeb(lien: string | undefined | null): string | undefined {
  if (!lien) return undefined;
  const brut = lien.trim();
  if (!brut || /^(mailto:|tel:)/i.test(brut)) return undefined;
  const complet = /^https?:\/\//i.test(brut) ? brut : `https://${brut}`;
  try {
    const u = new URL(complet);
    return u.toString().replace(/\/$/, "");
  } catch {
    return undefined;
  }
}

/** Applique le FILTRE « site web » : c'est en fonction de ce filtre
 *  que l'outil renvoie les entreprises (demande de l'éditeur) :
 *  « sans » = uniquement les entreprises SANS site web (prospection
 *  pour un service de création de sites), « avec » = uniquement celles
 *  qui en ont un, « tous » = tout. */
export function appliquerFiltreSite<T extends { siteWebPresent: boolean }>(
  entreprises: T[],
  filtre: "tous" | "avec" | "sans",
): T[] {
  if (filtre === "tous") return entreprises;
  return entreprises.filter((e) => (filtre === "sans" ? !e.siteWebPresent : e.siteWebPresent));
}
