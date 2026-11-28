/**
 * VOLET 27 — chaîne de MOTEURS DE RECHERCHE pour
 * découvrir les pages d'entreprises (Instagram, LinkedIn) depuis des
 * mots-clés. Un moteur peut être indisponible selon l'environnement
 * d'exécution (réseau du serveur, limitation de débit…) : les moteurs
 * sont essayés EN CHAÎNE — l'outil fonctionne dès qu'UN moteur
 * répond, et le premier qui donne des résultats est retenu.
 */
import { telechargerTexte, decoderEntites, nettoyerTexte } from "./http";

export type ResultatMoteur = {
  url: string;
  titre: string;
  extrait: string;
};

/** Décode une URL redirigée par un moteur (uddg, /url?q=, u=a1 base64). */
function decoderUrlMoteur(hrefBrut: string): string | null {
  const href = hrefBrut.replace(/&amp;/g, "&").trim();
  if (href.startsWith("//")) return null; // protocole relatif : traité par q/uddg ci-dessous
  try {
    // Bing enveloppe : https://www.bing.com/ck/a?...&u=a1<base64>
    const b = href.match(/[?&]u=a1([A-Za-z0-9_\-=]+)/);
    if (b) {
      const pad = "=".repeat(-b[1].length % 4);
      const dec = Buffer.from(
        b[1].replace(/-/g, "+").replace(/_/g, "/") + pad,
        "base64",
      ).toString("utf-8");
      if (dec.startsWith("http")) return dec;
    }
    // DuckDuckGo enveloppe : .../l/?uddg=<enc>
    const d = href.match(/[?&]uddg=([^&]+)/);
    if (d) return decodeURIComponent(d[1]);
    // Google enveloppe : /url?q=<enc>
    const g = href.match(/^[/?]+url\?[?&]*q=([^&]+)/) ?? href.match(/[?&]q=(https?[^&]+)/);
    if (g) return decodeURIComponent(g[1]);
    if (/^https?:\/\//.test(href)) return href;
    return null;
  } catch {
    return null;
  }
}

/** URL de résultat acceptée ? (domaine vide = tout accepter) */
function hoteAccepte(url: string, domaines: string[]): boolean {
  if (domaines.length === 0) return true;
  let hote: string;
  try {
    hote = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }
  return domaines.some((d) => hote === d || hote.endsWith(`.${d}`));
}

/** Extrait les résultats (url + titre + extrait) d'une page de moteur. */
function extraireResultats(html: string): ResultatMoteur[] {
  const sorties: ResultatMoteur[] = [];
  const vus = new Set<string>();
  /* On parcourt les ancre candidates dans l'ordre du document ; le
     titre est le texte de l'ancre (ou son <h3> intérieur), l'extrait
     le premier bloc « snippet » qui suit. */
  const ancres = [...html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]{0,400}?)<\/a>/gi)];
  for (const a of ancres) {
    const url = decoderUrlMoteur(a[1]);
    if (!url) continue;
    if (!hoteAccepte(url, [])) continue;
    if (vus.has(url)) continue;
    vus.add(url);
    const titre = nettoyerTexte(a[2].replace(/<[^>]+>/g, " "), 120);
    /* extrait : premier paragraphe « snippet » après cette ancre */
    const apres = html.slice((a.index ?? 0) + a[0].length, (a.index ?? 0) + a[0].length + 1500);
    const morceauSn = apres.match(
      /class="[^"]*(?:snippet|b_caption|b_lineclamp|b_algoSlug)[^"]*"[^>]*>([\s\S]{5,700}?)<\/(?:p|div|span)>/i,
    );
    const extrait = morceauSn
      ? nettoyerTexte(decoderEntites(morceauSn[1].replace(/<[^>]+>/g, " ")), 280)
      : "";
    if (!titre && !extrait) continue;
    sorties.push({ url, titre, extrait });
  }
  return sorties;
}

/** Moteurs gratuits essayés en chaîne (ordre = préférence). */
const MOTEURS: ((q: string) => string)[] = [
  (q) => `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`,
  (q) => `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(q)}`,
  (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}&num=30&hl=fr`,
  (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}&count=30`,
];

/** Recherche : renvoie les résultats du premier moteur qui répond. */
export async function chercherViaMoteurs(
  requete: string,
  limite = 30,
): Promise<ResultatMoteur[]> {
  for (const construire of MOTEURS) {
    const html = await telechargerTexte(construire(requete), {
      timeoutMs: 12000,
      entetes: { Accept: "text/html,*/*" },
    });
    if (!html) continue;
    const resultats = extraireResultats(html).slice(0, limite);
    if (resultats.length > 0) return resultats;
  }
  return [];
}
