import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/admin-auth";
import { scraperGoogleMaps } from "@/lib/scraping/google-maps";
import { appliquerFiltreSite } from "@/lib/scraping/extraction";
import { enrichirSites } from "@/lib/scraping/qualite-site";
import type { ResultatScraping } from "@/lib/scraping/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * VOLET 27 (28/11/2026) — OUTIL DE SCRAPING « GOOGLE MAPS » :
 * fiches d'entreprises PAR LIEU ET PAR NICHE, avec les coordonnées
 * (nom, catégorie/niche, adresse, ville, pays, téléphone, email,
 * site web) et le FILTRE « avec site web / sans site web ».
 *
 * VOLET 29 (28/11/2026 soir) :
 *  - `nicheProspection` : la clé de la niche du fichier de
 *    prospection d'origine de la recherche (ex. « #11 ») suit chaque
 *    entreprise scrapée — elle sert à adapter le message personnalisé
 *    de l'espace Prospects ;
 *  - le NOM DU DIRIGEANT est recherché sur le site web des
 *    entreprises qui en ont un (« s'il le trouve » — sinon la fiche
 *    affiche « Non trouvé ») ;
 *  - les horaires d'ouverture, l'adresse complète et l'ancienneté
 *    (depuis quand l'entreprise existe) sont récupérés des fiches.
 *
 * VOLET 32 (29/11/2026) — DIAGNOSTIC DE QUALITÉ DU SITE WEB : chaque
 * entreprise qui a un site reçoit, sur UNE SEULE lecture de sa page
 * d'accueil, sa PLATEFORME (WordPress, Wix…), son ANNÉE de mise à
 * jour, ce qui lui MANQUE (HTTPS, version mobile, titre, description
 * Google, H1), son POIDS, un SCORE 0-100 et un VERDICT (« À
 * refaire » / « Moyen » / « Correct ») avec la liste des PROBLÈMES
 * en français — plus l'EMAIL de la page et le nom du DIRIGEANT :
 * c'est la recherche des entreprises DONT LE SITE A DE VRAIS
 * PROBLÈMES — les prospects idéaux d'un service de création de
 * sites.
 *
 * POST { niche, lieu, filtreSite?, limite?, nicheProspection? } → ResultatScraping.
 * Réservé à l'espace administrateur authentifié.
 */
export async function POST(req: NextRequest) {
  if (!verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const niche = typeof body?.niche === "string" ? body.niche.trim() : "";
  const lieu = typeof body?.lieu === "string" ? body.lieu.trim() : "";
  const filtre = body?.filtreSite === "avec" || body?.filtreSite === "sans" ? body.filtreSite : "tous";
  const limite = Math.min(50, Math.max(5, Number(body?.limite) || 40));
  const nicheProspection =
    typeof body?.nicheProspection === "string" && /^#\d{1,2}$/.test(body.nicheProspection.trim())
      ? body.nicheProspection.trim()
      : undefined;
  if (!niche || !lieu) {
    return NextResponse.json(
      { ok: false, error: "Indiquez la niche (ce que font les entreprises) et le lieu (ville, pays)." },
      { status: 422 },
    );
  }

  try {
    const { entreprises, avertissement } = await scraperGoogleMaps({ niche, lieu, limite });
    for (const e of entreprises) e.nicheProspection = nicheProspection;
    /* VOLET 32 — UNE SEULE lecture de la page d'accueil de chaque
     * entreprise avec un site : diagnostic complet (plateforme, année,
     * HTTPS, mobile, score, verdict, problèmes) + email de la page
     * + nom du dirigeant — au plus 12 sites, par vagues discrètes,
     * dans un budget de temps ; les autres restent sans diagnostic
     * (ce n'est pas grave). */
    await enrichirSites(entreprises, { max: 12, parallele: 4 });
    const sansSiteWeb = entreprises.filter((e) => !e.siteWebPresent).length;
    const sitesARefaire = entreprises.filter((e) => e.qualiteSite?.verdict === "a-refaire").length;
    const resultats = appliquerFiltreSite(entreprises, filtre);
    const reponse: ResultatScraping & { entreprises: typeof resultats; sitesARefaire: number } = {
      ok: true,
      entreprises: resultats,
      totalTrouvees: entreprises.length,
      sansSiteWeb,
      sitesARefaire,
      avertissement,
    };
    return NextResponse.json(reponse);
  } catch (e) {
    console.error("[admin/scraping/google-maps] Erreur :", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Scraping impossible." },
      { status: 502 },
    );
  }
}
