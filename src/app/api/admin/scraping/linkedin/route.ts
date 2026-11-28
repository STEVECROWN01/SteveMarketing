import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/admin-auth";
import { scraperLinkedIn, maximumEmployes } from "@/lib/scraping/linkedin";
import { appliquerFiltreSite } from "@/lib/scraping/extraction";
import type { ResultatScraping } from "@/lib/scraping/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * VOLET 27 (28/11/2026) — OUTIL DE SCRAPING « LINKEDIN » : pages
 * d'entreprises LinkedIn avec nom, description (ce que fait
 * l'entreprise), industrie/niche, siège/localisation, nombre
 * d'employés, site web, type — et les FILTRES :
 *  - « avec site web / sans site web » (prospection) ;
 *  - « employés minimum » (ex. ≥ 5 employés — les fourchettes
 *    LinkedIn « 2-10 employés » sont retenues si leur maximum
 *    atteint le seuil : c'est une prospection, à vérifier au contact).
 *
 * POST { recherche, filtreSite?, minEmployes?, limite? } → ResultatScraping.
 *  - recherche : mots-clés / nom d'entreprise OU URL LinkedIn
 *    (linkedin.com/company/…) collées directement.
 * Réservé à l'espace administrateur authentifié.
 */
export async function POST(req: NextRequest) {
  if (!verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const recherche = typeof body?.recherche === "string" ? body.recherche.trim() : "";
  const filtre = body?.filtreSite === "avec" || body?.filtreSite === "sans" ? body.filtreSite : "tous";
  const minEmployes = Math.max(0, Math.min(100000, Number(body?.minEmployes) || 0));
  const limite = Math.min(40, Math.max(3, Number(body?.limite) || 25));
  /* VOLET 29 — clé de la niche du fichier de prospection d'origine de
   *  la recherche (ex. « #11 ») : suit chaque entreprise scrapée
   *  pour adapter son message personnalisé. */
  const nicheProspection =
    typeof body?.nicheProspection === "string" && /^#\d{1,2}$/.test(body.nicheProspection.trim())
      ? body.nicheProspection.trim()
      : undefined;
  if (!recherche) {
    return NextResponse.json(
      { ok: false, error: "Indiquez une recherche : mots-clés, nom d'entreprise ou URL LinkedIn." },
      { status: 422 },
    );
  }

  try {
    const { entreprises, avertissement } = await scraperLinkedIn({ recherche, limite });
    for (const e of entreprises) e.nicheProspection = nicheProspection;
    let candidates = entreprises;
    let note = avertissement;
    if (minEmployes > 0) {
      const avant = candidates.length;
      candidates = candidates.filter((e) => maximumEmployes(e.employes) >= minEmployes);
      if (candidates.length < avant) {
        note =
          (note ? `${note} ` : "") +
          `${avant - candidates.length} entreprise(s) sous ${minEmployes} employés masquée(s) par le filtre.`;
      }
    }
    const sansSiteWeb = candidates.filter((e) => !e.siteWebPresent).length;
    const resultats = appliquerFiltreSite(candidates, filtre);
    const reponse: ResultatScraping & { entreprises: typeof resultats } = {
      ok: true,
      entreprises: resultats,
      totalTrouvees: entreprises.length,
      sansSiteWeb,
      avertissement: note,
    };
    return NextResponse.json(reponse);
  } catch (e) {
    console.error("[admin/scraping/linkedin] Erreur :", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Scraping impossible." },
      { status: 502 },
    );
  }
}
