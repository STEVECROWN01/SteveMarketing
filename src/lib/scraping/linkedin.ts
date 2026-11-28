/**
 * VOLET 27 — OUTIL « LINKEDIN » : pages d'entreprises LinkedIn
 * (nom, description, industrie/niche, siège/localisation, taille /
 * nombre d'employés, site web, type) des pages d'entreprises
 * LinkedIn.
 *
 * Les pages d'entreprises LinkedIn sont PUBLIQUES (visitables sans
 * compte) : l'outil lit directement chaque page
 * linkedin.com/company/<entreprise>/ et en extrait les blocs publics
 * « à propos » (industrie, taille, siège, site web, spécialités).
 *
 * Découverte depuis des mots-clés : moteurs de recherche gratuits
 * (site:linkedin.com/company …) ; si aucun moteur ne répond depuis
 * le serveur, l'outil accepte les URL et noms d'entreprises directs.
 */
import { telechargerTexte, decoderEntites, nettoyerTexte } from "./http";
import { chercherViaMoteurs } from "./moteurs";
import { extraireEmail, extraireTelephone, extraireSiteWeb, normaliserSiteWeb } from "./extraction";
import type { EntrepriseScraped } from "./types";

/** Extrait les slugs d'entreprise d'un texte libre (URLs / noms). */
export function extraireSlugs(texte: string): string[] {
  const trouves = new Set<string>();
  for (const m of texte.matchAll(/linkedin\.com\/company\/([A-Za-z0-9_\-%-]{2,100})/gi)) {
    const slug = decodeURIComponent(m[1]).toLowerCase().replace(/\/+$/, "");
    if (slug) trouves.add(slug);
  }
  return [...trouves].slice(0, 40);
}

/** Découvre des slugs d'entreprises depuis des mots-clés. */
async function decouvrirEntreprises(recherche: string, limite: number): Promise<string[]> {
  const resultats = await chercherViaMoteurs(
    `site:linkedin.com/company ${recherche}`,
    Math.max(20, limite * 2),
  );
  const slugs = new Set<string>();
  for (const r of resultats) {
    const m = r.url.match(/linkedin\.com\/company\/([A-Za-z0-9_\-%-]{2,100})/i);
    if (!m) continue;
    const slug = decodeURIComponent(m[1]).toLowerCase().split(/[/?#]/)[0];
    if (!slug || slug === "about" || slug === "dir") continue;
    slugs.add(slug);
    if (slugs.size >= limite) break;
  }
  return [...slugs];
}

/** Nom d'entreprise → slug probable (repli sans moteur). */
function slugifier(nom: string): string {
  return nom
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

type ChampPage = {
  nom?: string;
  description?: string;
  industrie?: string;
  taille?: string;
  siege?: string;
  siteWeb?: string;
  type?: string;
  specialites?: string;
  abonnes?: string;
};

/** Parse une page publique linkedin.com/company/<slug>/. */
function parserPageEntreprise(html: string): ChampPage | null {
  const page: ChampPage = {};
  /* Blocs publics « à propos » : dt/dd par data-test-id.
     NOTE : m[1] = clé (about-us__…), m[2] = LIBELLÉ (dt — affiché
     dans la langue du navigateur, ex. « Secteur »), m[3] = VALEUR
     (dd — la donnée réelle). */
  for (const m of html.matchAll(
    /data-test-id="(about-us__(?:industry|size|headquarters|organizationType|website|specialties))">\s*<dt[^>]*>\s*([^<]*?)\s*<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/g,
  )) {
    const cle = m[1];
    const valeur = nettoyerTexte(decoderEntites(m[3].replace(/<[^>]+>/g, " ")), 400);
    if (!valeur) continue;
    if (cle === "about-us__industry") page.industrie = valeur;
    if (cle === "about-us__size") page.taille = valeur;
    if (cle === "about-us__headquarters") page.siege = valeur;
    if (cle === "about-us__organizationType") page.type = valeur;
    if (cle === "about-us__specialties") page.specialites = valeur;
    if (cle === "about-us__website") {
      /* le lien public passe par une redirection LinkedIn : l'URL
         réelle de l'entreprise est dans le paramètre url= */
      const dansLien = m[3].match(/href="([^"]+)"/)?.[1] ?? "";
      let cible = dansLien;
      const u = dansLien.match(/[?&]url=([^&"']+)/);
      if (u) {
        try {
          cible = decodeURIComponent(u[1]);
        } catch {
          cible = dansLien;
        }
      }
      page.siteWeb = normaliserSiteWeb(cible) ?? normaliserSiteWeb(valeur) ?? undefined;
    }
  }
  /* Nom + description publics (og:title / og:description). */
  const ogTitre = html.match(/<meta property="og:title" content="([^"]*)"/i)?.[1];
  const ogDesc = html.match(/<meta property="og:description" content="([^"]*)"/i)?.[1];
  page.nom = nettoyerTexte(decoderEntites(ogTitre ?? ""), 100) || undefined;
  page.description = nettoyerTexte(decoderEntites(ogDesc ?? ""), 320) || undefined;
  page.abonnes = page.description?.match(/([\d.,\s]{1,14})\s*followers/i)?.[1]?.trim();
  if (!page.nom && !page.industrie && !page.taille && !page.description) return null;
  return page;
}

/** Lit la page publique d'une entreprise LinkedIn.
 *  NB : l'entête Referer fait REFUSER la requête par LinkedIn
 *  (statut 999 mesuré) — l'identité d'application suffit. */
async function pageEntreprise(
  slug: string,
): Promise<{ slug: string; page: ChampPage | null }> {
  const html = await telechargerTexte(`https://www.linkedin.com/company/${slug}/`, {
    timeoutMs: 15000,
  });
  if (!html) return { slug, page: null };
  return { slug, page: parserPageEntreprise(html) };
}

/** « 11-50 employés » / « 10 001+ employés » → maximum d'employés
 *  (les séparateurs — espaces, espaces fines, virgules — sont
 *  retirés avant la lecture des nombres, quelle que soit la langue
 *  de la page : « 10,001+ employees », « 10 001+ employés »). */
export function maximumEmployes(taille?: string): number {
  if (!taille) return 0;
  const nettoye = taille.replace(/[\s.,\u00a0\u202f\u2009']/g, "");
  const nombres = nettoye.match(/\d+/g);
  if (!nombres || nombres.length === 0) return 0;
  return Math.max(...nombres.map((n) => Number(n) || 0));
}

/** Construit l'entreprise depuis une page LinkedIn publique. */
function versEntreprise(slug: string, page: ChampPage): EntrepriseScraped {
  const bio = page.description ?? "";
  const nom = (page.nom || slug.replace(/[-_]/g, " ")).replace(/\s*\|\s*LinkedIn\s*$/i, "");
  /* niche : industrie (ce que fait l'entreprise), sinon spécialités */
  const niche = page.industrie || (page.specialites ? page.specialites.split(/,\s*/)[0] : "Entreprise LinkedIn");
  return {
    source: "linkedin",
    nom,
    niche,
    bio: bio || undefined,
    localisation: page.siege || undefined,
    pays: page.siege?.split(",").pop()?.trim() || undefined,
    telephone: extraireTelephone(bio) || extraireTelephone(page.specialites ?? ""),
    email: extraireEmail(bio),
    siteWeb: page.siteWeb ?? (extraireSiteWeb(bio) ? normaliserSiteWeb(extraireSiteWeb(bio)) : undefined) ?? undefined,
    employes: page.taille || undefined,
    contact: slug,
    urlSource: `https://www.linkedin.com/company/${slug}/`,
    siteWebPresent: Boolean(page.siteWeb),
  };
}

/** POINT D'ENTRÉE : pages d'entreprises LinkedIn. */
export async function scraperLinkedIn(params: {
  recherche: string;
  limite?: number;
}): Promise<{
  entreprises: EntrepriseScraped[];
  avertissement?: string;
}> {
  const limite = params.limite ?? 25;
  const recherche = params.recherche.trim();
  if (!recherche) return { entreprises: [], avertissement: "Recherche vide." };

  /* URL LinkedIn directes OU découverte par mots-clés */
  const directs = extraireSlugs(recherche);
  let slugs = directs;
  let avertissement: string | undefined;
  if (slugs.length === 0) {
    slugs = await decouvrirEntreprises(recherche, limite);
    /* Repli sans moteur : un NOM d'entreprise devient un slug probable */
    if (slugs.length === 0) {
      const candidat = slugifier(recherche.split(/[,\n]/)[0] ?? "");
      if (candidat.length >= 3) slugs = [candidat];
    }
    if (slugs.length === 0) {
      return {
        entreprises: [],
        avertissement:
          "Aucune entreprise trouvée — les moteurs de recherche ne répondent pas depuis ce serveur. Collez directement des URL LinkedIn (linkedin.com/company/…) ou le nom exact d'une entreprise et relancez.",
      };
    }
  }
  if (directs.length === 0 && slugs.length < limite) {
    avertissement = undefined;
  }

  /* lecture des pages en parallèle (concurrence limitée) */
  const morceaux: string[][] = [];
  for (let i = 0; i < slugs.length; i += 3) morceaux.push(slugs.slice(i, i + 3));
  const entreprises: EntrepriseScraped[] = [];
  const introuvables: string[] = [];
  for (const morceau of morceaux) {
    const pages = await Promise.all(morceau.map((s) => pageEntreprise(s)));
    for (const { slug, page } of pages) {
      if (!page) {
        introuvables.push(slug);
        continue;
      }
      entreprises.push(versEntreprise(slug, page));
    }
  }
  if (entreprises.length === 0) {
    return {
      entreprises: [],
      avertissement: `Aucune page publique n'a répondu${introuvables.length > 0 ? ` (« ${introuvables.slice(0, 3).join("», « ")} »)` : ""} — LinkedIn limite parfois les serveurs distants : réessayez plus tard, ou ouvrez la page linkedin.com/company/<entreprise>/ et collez son URL ici.`,
    };
  }
  if (introuvables.length > 0) {
    avertissement = `${introuvables.length} page(s) n'ont pas répondu (limitations LinkedIn) — les autres sont affichées.`;
  }
  return { entreprises, avertissement };
}
