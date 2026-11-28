/**
 * VOLET 27 — OUTIL « INSTAGRAM » : pages d'entreprises Instagram
 * (bio, catégorie, email, téléphone, site web, localisation,
 * abonnés), cloné gratuitement sur les scrapers de pages Instagram.
 *
 * Deux modes d'entrée (comme l'outil de référence) :
 *  - mots-clés / niche : découverte des comptes d'entreprises via les
 *    moteurs de recherche (chaîne gratuite — aucun compte, aucune
 *    clé), puis enrichissement de chaque profil ;
 *  - usernames directs : @comptes ou liens instagram.com/… collés.
 *
 * L'enrichissement essaie D'ABORD les points d'entrée publics
 * d'Instagram (web_profile_info) ; si le serveur d'Instagram refuse
 * (réseau du serveur), les données disponibles (nom, abonnés, bio)
 * sont extraites des extraits de recherche — l'outil reste utilisable
 * et le dit honnêtement.
 */
import { telechargerTexte, nettoyerTexte } from "./http";
import { chercherViaMoteurs } from "./moteurs";
import { extraireEmail, extraireTelephone, extraireSiteWeb, normaliserSiteWeb } from "./extraction";
import type { EntrepriseScraped } from "./types";

const EXCLUSIONS_IG = new Set([
  "p",
  "reel",
  "reels",
  "explore",
  "stories",
  "tv",
  "accounts",
  "about",
  "legal",
  "directory",
  "developer",
  "invites",
  "sessions",
  "login",
  "challenge",
]);

/** Extrait les usernames d'un texte libre (@comptes, liens, liste). */
export function extraireUsernames(texte: string): string[] {
  const trouves = new Set<string>();
  for (const m of texte.matchAll(/instagram\.com\/([A-Za-z0-9._]{2,30})/gi)) {
    const u = m[1].toLowerCase().replace(/\.$/, "");
    if (!EXCLUSIONS_IG.has(u)) trouves.add(u);
  }
  for (const m of texte.matchAll(/@([A-Za-z0-9._]{2,30})/g)) {
    const u = m[1].toLowerCase().replace(/\.$/, "");
    if (!EXCLUSIONS_IG.has(u)) trouves.add(u);
  }
  return [...trouves].slice(0, 40);
}

/** Découvre des comptes d'entreprises depuis des mots-clés. */
async function decouvrirComptes(recherche: string, limite: number): Promise<string[]> {
  const resultats = await chercherViaMoteurs(
    `site:instagram.com ${recherche}`,
    Math.max(20, limite * 2),
  );
  const usernames = new Set<string>();
  for (const r of resultats) {
    const m = r.url.match(/instagram\.com\/([A-Za-z0-9._]{2,30})/i);
    if (!m) continue;
    const u = m[1].toLowerCase();
    if (EXCLUSIONS_IG.has(u)) continue;
    usernames.add(u);
    if (usernames.size >= limite) break;
  }
  return [...usernames];
}

type ProfilInstagram = {
  username: string;
  nomComplet?: string;
  bio?: string;
  categorie?: string;
  email?: string;
  telephone?: string;
  siteWeb?: string;
  localisation?: string;
  abonnes?: number;
  bloque?: boolean;
};

/** Parse la réponse du point d'entrée public web_profile_info. */
function parserWebProfile(json: string, username: string): ProfilInstagram | null {
  try {
    const donnees = JSON.parse(json) as {
      data?: {
        user?: {
          username?: string;
          full_name?: string;
          biography?: string;
          category_name?: string;
          public_email?: string;
          public_phone_number?: string;
          contact_phone_number?: string;
          edge_followed_by?: { count?: number };
          edge_owner_to_timeline_media?: { count?: number };
          external_url?: string;
          business_address_json?: string;
        };
      };
    };
    const u = donnees?.data?.user;
    if (!u) return null;
    let localisation: string | undefined;
    try {
      const adr = JSON.parse(u.business_address_json || "null") as
        | { city?: string; city_name?: string; country?: string; country_code?: string }
        | null;
      if (adr) localisation = [adr.city || adr.city_name, adr.country].filter(Boolean).join(", ");
    } catch {
      /* adresse absente */
    }
    const tel = u.public_phone_number || u.contact_phone_number;
    return {
      username: (u.username || username).toLowerCase(),
      nomComplet: nettoyerTexte(u.full_name, 90) || undefined,
      bio: nettoyerTexte(u.biography, 300) || undefined,
      categorie: nettoyerTexte(u.category_name, 60) || undefined,
      email: u.public_email?.toLowerCase() || undefined,
      telephone: tel ? (tel.startsWith("+") ? tel : `+${tel.replace(/[^\d]/g, "")}`) : undefined,
      siteWeb: normaliserSiteWeb(u.external_url) ?? undefined,
      localisation: localisation || undefined,
      abonnes: u.edge_followed_by?.count,
    };
  } catch {
    return null;
  }
}

/** Profil public complet : point d'entrée Instagram, puis moteur. */
async function profilPublic(username: string): Promise<ProfilInstagram | null> {
  const entetes = {
    Accept: "application/json",
    "x-ig-app-id": "936619743392459",
    Referer: `https://www.instagram.com/${username}/`,
    "X-Requested-With": "XMLHttpRequest",
  };
  for (const hote of ["https://www.instagram.com", "https://i.instagram.com"]) {
    const corps = await telechargerTexte(
      `${hote}/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
      { timeoutMs: 12000, entetes },
    );
    if (corps && corps.trimStart().startsWith("{")) {
      const profil = parserWebProfile(corps, username);
      if (profil) return profil;
    }
  }
  /* Repli moteur : extraits « X Followers, Y Following, Z Posts —
     Instagram photos and videos from NAME (@username) » + bios. */
  const resultats = await chercherViaMoteurs(`"${username}" instagram followers`, 5);
  for (const r of resultats) {
    if (!r.url.toLowerCase().includes(`instagram.com/${username.toLowerCase()}`)) continue;
    const abonnes = r.titre.match(/([\d.,\s]{1,12})[KkMm]?[,\s]+Followers/i)?.[1];
    let nombre: number | undefined;
    if (abonnes) {
      const brut = Number(abonnes.replace(/[\s,]/g, ""));
      if (Number.isFinite(brut) && brut > 0) nombre = brut;
    }
    return {
      username,
      nomComplet: nettoyerTexte(r.titre.split("(")[0], 90) || undefined,
      bio: nettoyerTexte(r.extrait, 300) || undefined,
      abonnes: nombre,
      bloque: true,
    };
  }
  return null;
}

/** Construit l'entreprise depuis un profil public. */
function versEntreprise(profil: ProfilInstagram): EntrepriseScraped {
  const bio = profil.bio ?? "";
  const siteWeb =
    profil.siteWeb ?? (extraireSiteWeb(bio) ? normaliserSiteWeb(extraireSiteWeb(bio)) : undefined);
  return {
    source: "instagram",
    nom: profil.nomComplet || profil.username,
    niche: profil.categorie || "Entreprise Instagram",
    bio: bio || undefined,
    localisation: profil.localisation || undefined,
    pays: profil.localisation?.split(",").pop()?.trim() || undefined,
    telephone: profil.telephone || extraireTelephone(bio),
    email: profil.email || extraireEmail(bio),
    siteWeb: siteWeb ?? undefined,
    employes: profil.abonnes
      ? `${profil.abonnes.toLocaleString("fr-FR")} abonnés`
      : undefined,
    contact: profil.username,
    urlSource: `https://www.instagram.com/${profil.username}/`,
    siteWebPresent: Boolean(siteWeb),
  };
}

/** POINT D'ENTRÉE : pages d'entreprises Instagram. */
export async function scraperInstagram(params: {
  recherche: string;
  limite?: number;
}): Promise<{
  entreprises: EntrepriseScraped[];
  avertissement?: string;
}> {
  const limite = params.limite ?? 25;
  const recherche = params.recherche.trim();
  if (!recherche) return { entreprises: [], avertissement: "Recherche vide." };

  /* usernames directs (@comptes / liens) OU découverte par mots-clés */
  const directs = extraireUsernames(recherche);
  const usernames = directs.length > 0 ? directs : await decouvrirComptes(recherche, limite);
  if (usernames.length === 0) {
    return {
      entreprises: [],
      avertissement:
        "Aucun compte trouvé — les moteurs de recherche ne répondent pas depuis ce serveur. Collez directement des comptes (@entreprise ou liens instagram.com) et relancez.",
    };
  }

  /* enrichissement en parallèle (concurrence limitée) */
  const morceaux: string[][] = [];
  for (let i = 0; i < usernames.length; i += 4) morceaux.push(usernames.slice(i, i + 4));
  const entreprises: EntrepriseScraped[] = [];
  let bloques = 0;
  for (const morceau of morceaux) {
    const profils = await Promise.all(morceau.map((u) => profilPublic(u)));
    for (const profil of profils) {
      if (!profil) continue;
      if (profil.bloque) bloques++;
      entreprises.push(versEntreprise(profil));
    }
  }
  let avertissement: string | undefined;
  if (entreprises.length === 0) {
    avertissement =
      "Instagram n'a répondu à aucune requête depuis ce serveur (limitations d'accès). Depuis votre site en ligne, les profils publics répondent généralement — réessayez plus tard ou depuis la production.";
  } else if (bloques > 0) {
    avertissement =
      bloques === entreprises.length
        ? "Instagram a refusé la réponse complète depuis ce serveur — noms et données des extraits de recherche affichés. Depuis votre site en ligne (Vercel), les profils publics répondent généralement ; sinon réessayez plus tard."
        : `${bloques} profil(s) sur ${entreprises.length} n'ont répondu qu'en partie (limites d'Instagram) — coordonnées complètes pour les autres.`;
  }
  return { entreprises, avertissement };
}
