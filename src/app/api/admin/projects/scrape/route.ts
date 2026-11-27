import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/admin-auth";
import { capturerMockups } from "@/lib/documents/pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * VOLET 22 (27/11/2026) — SCRAPER UN PROJET DEPUIS L'URL DE SON SITE.
 *
 * Demande de l'éditeur : « lorsqu'on clique sur le bouton ajouter un
 * projet, la première étape est un CHAMP qui demande l'URL du projet.
 * On insère l'URL et il y a un bouton SCRAPER. Le scraping va sur le
 * site, récupère et lit les informations — de quoi parle le projet —
 * pour en définir le titre ; le nom du projet est récupéré du nom du
 * site ; la description est récupérée aussi ; et les aperçus mobiles
 * et desktop sont récupérés automatiquement pendant le scraping. Le
 * formulaire est ensuite PRÉ-REMPLI avec ces informations (tout reste
 * modifiable). »
 *
 * POST { url } → { ok, nom, titre, description, desktop, mobile }
 *  - nom : og:site_name → <title> nettoyé → nom d'hôte ;
 *  - titre : og:title / premier <h1> (ce que fait le site) ;
 *  - description : og:description / meta description ;
 *  - desktop / mobile : captures 1280×800 et 390×844 (comme la
 *    capture manuelle — même moteur que les PDF).
 *
 * Réservé à l'espace administrateur authentifié.
 */

/** Décode les entités HTML courantes (numériques + nommées usuelles). */
function decoderEntites(t: string): string {
  return t
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&laquo;/g, "«")
    .replace(/&raquo;/g, "»")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&eacute;/g, "é")
    .replace(/&egrave;/g, "è")
    .replace(/&ecirc;/g, "ê")
    .replace(/&agrave;/g, "à")
    .replace(/&ccedil;/g, "ç")
    .replace(/&ocirc;/g, "ô")
    .replace(/&hellip;/g, "…")
    .replace(/&rsquo;/g, "’");
}

/** Nettoie un texte extrait : espaces, entités, coupes finales. */
function nettoyer(t: string | undefined | null, max = 200): string {
  if (!t) return "";
  const propre = decoderEntites(String(t))
    .replace(/\s+/g, " ")
    .trim();
  return propre.length > max ? propre.slice(0, max).trim() : propre;
}

/** <meta property/name="…" content="…"> → contenu (og:title,
 *  og:site_name, og:description, twitter:…, description…). */
function lireMeta(html: string, cles: string[]): string {
  for (const cle of cles) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)\\s*=\\s*["']${cle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*>`,
      "i",
    );
    const balise = html.match(re)?.[0];
    if (balise) {
      const contenu = balise.match(/content\s*=\s*["']([^"']*)["']/i)?.[1];
      const propre = nettoyer(contenu, 260);
      if (propre) return propre;
    }
  }
  return "";
}

/** Retire le suffixe « — site » / « | site » d'un titre (le nom du
 *  site est déjà affiché à part). */
function separerNomSite(titre: string, nomSite: string): string {
  let t = titre;
  if (nomSite) {
    const echappe = nomSite.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    t = t.replace(new RegExp(`\\s*[|—–·]\\s*${echappe}\\s*$`, "i"), "");
    t = t.replace(new RegExp(`^${echappe}\\s*[|—–·:]\\s*`, "i"), "");
  }
  return t.trim();
}

export async function POST(req: NextRequest) {
  if (!verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const brute: string = typeof body?.url === "string" ? body.url.trim() : "";
  if (!brute) {
    return NextResponse.json({ ok: false, error: "URL manquante." }, { status: 422 });
  }
  const url = /^https?:\/\//i.test(brute) ? brute : `https://${brute}`;
  let destination: URL;
  try {
    destination = new URL(url);
    const hote = destination.hostname;
    if (hote !== "localhost" && hote !== "127.0.0.1" && !hote.includes(".")) {
      throw new Error("URL invalide.");
    }
  } catch {
    return NextResponse.json({ ok: false, error: "URL invalide." }, { status: 422 });
  }

  try {
    /* ---- 1. Lecture du HTML du site (timeout 20 s, 3 Mo max) ---- */
    const controle = new AbortController();
    const minuteur = setTimeout(() => controle.abort(), 20000);
    let html = "";
    try {
      const res = await fetch(destination.toString(), {
        signal: controle.signal,
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "fr,en;q=0.8",
        },
      });
      html = (await res.text()).slice(0, 3_000_000);
    } finally {
      clearTimeout(minuteur);
    }

    /* ---- 2. Extraction des informations ---- */
    const titreBalise = nettoyer(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1], 140);
    const h1 = nettoyer(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, " "), 140);
    const ogSiteName = lireMeta(html, ["og:site_name", "twitter:site_name"]);
    const ogTitre = lireMeta(html, ["og:title", "twitter:title"]);

    /* Nom du projet : nom du SITE (og:site_name → <title> → hôte). */
    const hote = destination.hostname.replace(/^www\./, "");
    const nomBrut = ogSiteName || titreBalise || hote;
    const nom = nettoyer(separerNomSite(nomBrut, hote.split(".")[0]), 60) || hote;

    /* Titre (ce que fait le site) : og:title / h1 nettoyés du nom du
     * site ; repli : première phrase de la description. */
    let titre = separerNomSite(ogTitre || h1 || "", nom);
    titre = titre.replace(/\s*[|—–·]\s*$/, "").trim();
    if (titre.length < 6) titre = "";

    /* Description : og:description / meta description (→ <p>). */
    let description = lireMeta(html, ["og:description", "description", "twitter:description"]);
    if (!description) {
      description = nettoyer(
        html
          .replace(/<script[\s\S]*?<\/script>/gi, " ")
          .replace(/<style[\s\S]*?<\/style>/gi, " ")
          .match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1]
          ?.replace(/<[^>]+>/g, " "),
        240,
      );
    }
    if (!titre && description) {
      titre = nettoyer(description.split(/[.!?]/)[0], 70);
    }
    if (!titre) titre = "Site web professionnel";

    /* ---- 3. Captures ordinateur + mobile (même moteur que les PDF) ---- */
    const captures = await capturerMockups(destination.toString());

    return NextResponse.json({
      ok: true,
      nom,
      titre,
      description,
      desktop: captures.desktop,
      mobile: captures.mobile,
    });
  } catch (e) {
    console.error("[admin/projects/scrape] Scraping impossible :", e);
    return NextResponse.json(
      {
        ok: false,
        error:
          e instanceof Error
            ? `Scraping impossible : ${e.message}`
            : "Scraping impossible — vérifiez l'URL du site.",
      },
      { status: 502 },
    );
  }
}
