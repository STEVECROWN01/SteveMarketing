/**
 * VOLET 28 (28/11/2026) — OUTIL « SEO » DE L'AUDIT : audit on-page
 * en un clic, score
 * sur 100, note de A à F et verdict (Excellent, Bon, Correct,
 * Médiocre, Mauvais), familles de critères et PLAN D'ACTION
 * priorisé par points.
 *
 * Barème : A ≥ 90, B ≥ 80, C ≥ 70, D ≥ 55, E ≥ 40, F
 * ensuite. Chaque critère a un poids sur 100 ; un critère « moyen »
 * rapporte la moitié de ses points.
 *
 * Analyse (source publique) : balises title / meta
 * description / Hn, images et textes alternatifs, liens internes et
 * externes, canonical, robots, Open Graph / Twitter, données
 * structurées, HTTPS, viewport, favicon, sitemap et robots.txt,
 * volume de contenu, propreté de l'URL, temps de réponse.
 */
import { UA_NAVIGATEUR } from "@/lib/scraping/http";
import { noteDepuisScore, type CritereSeo, type FamilleSeo, type ReleveSeo } from "./types";

/** Renvoie un critère noté. */
function critere(
  libelle: string,
  points: number,
  etat: "ok" | "moyen" | "ko",
  detail: string,
  conseil: string,
): CritereSeo {
  return {
    libelle,
    points,
    etat,
    obtenu: etat === "ok" ? points : etat === "moyen" ? Math.round(points / 2) : 0,
    detail,
    conseil,
  };
}

function extraire(html: string, regexp: RegExp): string {
  const m = html.match(regexp);
  return m?.[1]?.trim() ?? "";
}

function texteBrut(html: string): string {
  const corps = html.replace(/<(script|style|noscript|svg|head)[^>]*>[\s\S]*?<\/\1>/gi, " ");
  return corps
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&eacute;/g, "é")
    .replace(/&egrave;/g, "è")
    .replace(/&ecirc;/g, "ê")
    .replace(/&agrave;/g, "à")
    .replace(/&ccedil;/g, "ç")
    .replace(/&rsquo;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** Compte les balises ouvrantes d'un type. */
function compterBalises(html: string, balise: string): string[] {
  return [...html.matchAll(new RegExp(`<${balise}\\b[^>]*>([\\s\\S]*?)</${balise}>`, "gi"))].map((m) => m[1].trim());
}

export async function auditerSeo(url: string): Promise<ReleveSeo> {
  const debut = Date.now();
  const res = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
    headers: {
      "User-Agent": UA_NAVIGATEUR,
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "fr,fr-FR;q=0.9,en;q=0.6",
    },
  }).catch(() => null);
  if (!res || !res.ok) {
    throw new Error(
      res ? `La page a répondu HTTP ${res.status}.` : "La page n'a pas répondu — vérifiez l'URL.",
    );
  }
  const html = await res.text();
  const ttfb = Date.now() - debut;
  const finalUrl = res.url || url;

  /* ================== familles de critères ================== */
  const titre = extraire(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaDescription = extraire(
    html,
    /<meta\s+(?:[^>]*?\s)?name=["']description["'][^>]*?\scontent=["']([\s\S]*?)["']/i,
  ) ||
    extraire(html, /<meta\s+(?:[^>]*?\s)?content=["']([\s\S]*?)["'][^>]*?\sname=["']description["']/i);
  const h1 = compterBalises(html, "h1").map((t) => texteBrut(t)).filter(Boolean);
  const h2 = compterBalises(html, "h2");
  const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const imagesAlt = images.filter((img) => /\balt\s*=\s*(["'][^"']*["'])/i.test(img));
  const imagesAltPleines = images.filter((img) => {
    const alt = img.match(/\balt\s*=\s*["']([^"']*)["']/i)?.[1] ?? "";
    return alt.trim().length >= 3;
  });
  const liens = [...html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"'#]+)["']/gi)].map((m) => m[1]);
  let hote = "";
  try {
    hote = new URL(finalUrl).hostname;
  } catch {
    hote = "";
  }
  const liensInternes = liens.filter((l) => l.startsWith("/") || l.includes(hote)).length;
  const liensExternes = liens.length - liensInternes;
  const canonical = extraire(html, /<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  const metaRobots = extraire(html, /<meta\s+(?:[^>]*?\s)?name=["']robots["'][^>]*?\scontent=["']([^"']*)["']/i);
  const lang = extraire(html, /<html\b[^>]*\slang=["']([^"']+)["']/i);
  const viewport = /<meta\b[^>]*name=["']viewport["']/i.test(html);
  const charset = /<meta\b[^>]*charset/i.test(html);
  const https = finalUrl.startsWith("https://");
  const og = /<meta\b[^>]*property=["']og:title["']/i.test(html) && /<meta\b[^>]*property=["']og:image["']/i.test(html);
  const ogPartiel = /<meta\b[^>]*property=["']og:/i.test(html);
  const twitter = /<meta\b[^>]*name=["']twitter:/i.test(html);
  const jsonLd = /<script\b[^>]*type=["']application\/ld\+json["']/i.test(html);
  const favicon = /<link\b[^>]*rel=["'][^"']*icon[^"']*["']/i.test(html);
  const mots = texteBrut(html).split(" ").filter(Boolean).length;
  const propreUrl = (() => {
    try {
      const u = new URL(finalUrl);
      return u.pathname.length <= 70 && !/[A-Z_]/.test(u.pathname) && u.search === "";
    } catch {
      return false;
    }
  })();
  const noindex = /noindex/i.test(metaRobots);

  /* robots.txt / sitemap.xml : existence (best-effort, 4 s) */
  const robotsTxt = await fetch(new URL("/robots.txt", finalUrl).toString(), {
    signal: AbortSignal.timeout(4000),
    headers: { "User-Agent": UA_NAVIGATEUR },
  })
    .then((r) => r.ok)
    .catch(() => false);
  const sitemap = await fetch(new URL("/sitemap.xml", finalUrl).toString(), {
    signal: AbortSignal.timeout(4000),
    headers: { "User-Agent": UA_NAVIGATEUR },
  })
    .then((r) => r.ok)
    .catch(() => false);

  /* ---------------- Balises fondamentales (30 pts) ---------------- */
  const balises: CritereSeo[] = [
    titre.length >= 30 && titre.length <= 60
      ? critere("Balise title optimale (30-60 caractères)", 8, "ok", `« ${titre} » (${titre.length} caractères).`, "")
      : titre.length > 0
        ? critere(
            "Balise title présente mais hors plage",
            8,
            "moyen",
            `« ${titre} » — ${titre.length} caractères (idéal : 30 à 60).`,
            "Raccourcissez le titre : Google le coupe au-delà de ~60 caractères.",
          )
        : critere("Balise title manquante", 8, "ko", "Aucune balise <title> sur la page.", "Ajoutez un titre unique avec le mot-clé principal."),
    metaDescription.length >= 70 && metaDescription.length <= 160
      ? critere("Meta description optimale (70-160 caractères)", 8, "ok", `${metaDescription.length} caractères.`, "")
      : metaDescription.length > 0
        ? critere(
            "Meta description hors plage",
            8,
            "moyen",
            `${metaDescription.length} caractères (idéal : 70 à 160) : « ${metaDescription.slice(0, 80)}… »`,
            "Décrivez la page en une phrase incitative avec le mot-clé, entre 70 et 160 caractères.",
          )
        : critere("Meta description manquante", 8, "ko", "Google en génère une — souvent moins bien.", "Rédigez une description d'appel au clic (70-160 caractères)."),
    h1.length === 1 && h1[0].length >= 10
      ? critere("Un seul H1 pertinent", 6, "ok", `« ${h1[0].slice(0, 70)} »`, "")
      : h1.length === 1
        ? critere("H1 trop court", 6, "moyen", `« ${h1[0]} » — un H1 décrit la page en quelques mots.`, "Étoffez le H1 avec le sujet et le bénéfice de la page.")
        : h1.length === 0
          ? critere("Aucun H1", 6, "ko", "La page n'a pas de titre principal.", "Ajoutez un H1 unique décrivant la page.")
          : critere("Plusieurs H1", 6, "ko", `${h1.length} balises H1 trouvées.`, "Gardez un seul H1 — la hiérarchie doit rester claire."),
    h2.length >= 2
      ? critere("Structure de titres Hn", 4, "ok", `${h2.length} sous-titres H2 organisent le contenu.`, "")
      : critere("Structure de titres Hn pauvre", 4, "moyen", `${h2.length} H2 — le contenu est peu balisé.`, "Structurez le contenu avec des H2/H3 pour les sujets."),
    viewport
      ? critere("Vue mobile (viewport)", 4, "ok", "Balise viewport présente — la page s'adapte au mobile.", "")
      : critere("Vue mobile manquante", 4, "ko", "Sans viewport, la page est zoomée sur mobile.", "Ajoutez <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">."),
  ];

  /* ---------------- Contenu et sémantique (30 pts) ---------------- */
  const ratioAlt = images.length > 0 ? Math.round((imagesAltPleines.length / images.length) * 100) : 100;
  const contenu: CritereSeo[] = [
    mots >= 300
      ? critere("Volume de contenu suffisant", 8, "ok", `${mots} mots sur la page.`, "")
      : mots >= 150
        ? critere("Contenu un peu court", 8, "moyen", `${mots} mots — visez au moins 300 mots.`, "Développez le contenu : questions fréquentes, détails, preuves.")
        : critere("Contenu trop court", 8, "ko", `${mots} mots seulement.`, "Rédigez au moins 300 mots utiles pour bien se classer."),
    images.length === 0 || ratioAlt >= 90
      ? critere("Images avec texte alternatif", 6, "ok", `${imagesAltPleines.length}/${images.length} images décrites.`, "")
      : ratioAlt >= 50
        ? critere("Textes alternatifs partiels", 6, "moyen", `${ratioAlt} % des images ont un alt utile.`, "Décrivez chaque image (accessibilité + Google Images).")
        : critere("Images sans texte alternatif", 6, "ko", `${ratioAlt} % des images ont un alt utile.`, "Ajoutez alt=\"description\" à chaque image informative."),
    liensInternes >= 3
      ? critere("Maillage interne", 6, "ok", `${liensInternes} liens internes, ${liensExternes} externes.`, "")
      : critere("Maillage interne faible", 6, "moyen", `${liensInternes} liens internes seulement.`, "Reliez les pages entre elles avec des liens contextuels."),
    jsonLd
      ? critere("Données structurées (JSON-LD)", 5, "ok", "La page embarque un schéma JSON-LD.", "")
      : critere("Données structurées absentes", 5, "ko", "Aucun bloc JSON-LD détecté.", "Ajoutez un schéma (Organization, LocalBusiness, Product…) pour les extraits enrichis."),
    og
      ? critere("Open Graph complet", 5, "ok", "og:title et og:image présents — bon partage social.", "")
      : ogPartiel
        ? critere("Open Graph partiel", 5, "moyen", "Balises og: présentes mais og:title/og:image manquants.", "Complétez og:title, og:description et og:image.")
        : critere("Open Graph manquant", 5, "ko", "Le partage social n'a ni titre ni visuel.", "Ajoutez les balises Open Graph du partage social."),
  ];

  /* ---------------- Technique (25 pts) ---------------- */
  const technique: CritereSeo[] = [
    https
      ? critere("HTTPS actif", 5, "ok", "La page est servie en HTTPS.", "")
      : critere("HTTPS manquant", 5, "ko", "La page n'est pas sécurisée.", "Passez le site en HTTPS (certificat gratuit : Let's Encrypt)."),
    canonical
      ? critere("Balise canonical", 5, "ok", canonical.slice(0, 80), "")
      : critere("Balise canonical absente", 5, "moyen", "Sans canonical, les URLs dupliquées se dispersent.", "Déclarez l'URL officielle de la page avec rel=canonical."),
    noindex
      ? critere("Page indexable", 5, "ko", "La balise robots contient « noindex ».", "Retirez noindex si la page doit être visible sur Google.")
      : critere("Page indexable", 5, "ok", "Aucune directive noindex.", ""),
    ttfb <= 600
      ? critere("Temps de réponse du serveur", 5, "ok", `Premier octet en ${ttfb} ms.`, "")
      : critere("Temps de réponse du serveur", 5, "moyen", `Premier octet en ${ttfb} ms (visez < 600 ms).`, "Activez un cache/CDN et vérifiez l'hébergement."),
    propreUrl
      ? critere("URL propre et lisible", 5, "ok", finalUrl.slice(0, 80), "")
      : critere("URL à assainir", 5, "moyen", "URL longue, majuscule ou avec paramètres.", "Utilisez des URLs courtes, minuscules, avec tirets."),
  ];

  /* ---------------- Écosystème (15 pts) ---------------- */
  const ecosysteme: CritereSeo[] = [
    lang
      ? critere("Langue déclarée", 3, "ok", `lang="${lang}".`, "")
      : critere("Langue non déclarée", 3, "ko", "Aucun attribut lang sur <html>.", "Ajoutez lang=\"fr\" (ou la langue de la page)."),
    charset
      ? critere("Encodage des caractères", 2, "ok", "Charset déclaré.", "")
      : critere("Encodage absent", 2, "ko", "Aucun charset déclaré.", "Déclarez <meta charset=\"utf-8\">."),
    robotsTxt
      ? critere("robots.txt présent", 3, "ok", "https://…/robots.txt répond.", "")
      : critere("robots.txt absent", 3, "moyen", "Aucun robots.txt à la racine.", "Publiez un robots.txt pour guider l'exploration."),
    sitemap
      ? critere("sitemap.xml présent", 4, "ok", "https://…/sitemap.xml répond.", "")
      : critere("sitemap.xml absent", 4, "moyen", "Aucun sitemap à la racine.", "Publiez un sitemap.xml et déclarez-le dans Search Console."),
    favicon
      ? critere("Favicon", 3, "ok", "Icône déclarée.", "")
      : critere("Favicon manquante", 3, "ko", "Aucune icône déclarée.", "Ajoutez une favicon (visibilité dans les onglets et résultats)."),
    twitter
      ? critere("Twitter Card", 2, "ok", "Balises twitter: présentes.", "")
      : critere("Twitter Card absente", 2, "ko", "Aucune balise twitter:.", "Ajoutez twitter:card pour les partages sur X."),
  ];

  const familles: FamilleSeo[] = [
    { nom: "Balises fondamentales", criteres: balises },
    { nom: "Contenu et sémantique", criteres: contenu },
    { nom: "Technique", criteres: technique },
    { nom: "Écosystème", criteres: ecosysteme },
  ];

  const tousCriteres = familles.flatMap((f) => f.criteres);
  const score = Math.max(
    0,
    Math.min(100, tousCriteres.reduce((somme, c) => somme + c.obtenu, 0)),
  );

  /* Barème : A ≥ 90, B ≥ 80, C ≥ 70, D ≥ 55, E ≥ 40. */
  const note = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 55 ? "D" : score >= 40 ? "E" : "F";
  const verdict =
    score >= 90 ? "Excellent" : score >= 80 ? "Bon" : score >= 70 ? "Correct" : score >= 55 ? "Médiocre" : "Mauvais";

  /* Plan d'action : critères non remplis, par perte de points. */
  const plan = tousCriteres
    .filter((c) => c.etat !== "ok")
    .sort((a, b) => b.points - b.obtenu - (a.points - a.obtenu))
    .slice(0, 12);

  return {
    ok: true,
    url: finalUrl,
    score,
    note,
    verdict,
    familles,
    plan,
    apercu: {
      titre: titre || "(aucun titre)",
      description: metaDescription || "(aucune description — Google en choisira un extrait)",
      url: finalUrl,
    },
    avertissement:
      !viewport || !titre
        ? "Page difficile à afficher correctement : corrigez d'abord les balises fondamentales."
        : undefined,
  };
}
