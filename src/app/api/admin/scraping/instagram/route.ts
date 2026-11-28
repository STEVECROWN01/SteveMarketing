import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/admin-auth";
import { scraperInstagram } from "@/lib/scraping/instagram";
import { appliquerFiltreSite } from "@/lib/scraping/extraction";
import type { ResultatScraping } from "@/lib/scraping/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * VOLET 27 (28/11/2026) — OUTIL DE SCRAPING « INSTAGRAM » : pages
 * d'entreprises Instagram avec nom, bio (ce que fait l'entreprise),
 * catégorie/niche, localisation, email, téléphone, site web et
 * abonnés — et le FILTRE « avec site web / sans site web ».
 *
 * POST { recherche, filtreSite?, limite? } → ResultatScraping.
 *  - recherche : mots-clés / niche (découverte) OU @comptes / liens
 *    instagram.com collés directement ;
 * Réservé à l'espace administrateur authentifié.
 */
export async function POST(req: NextRequest) {
  if (!verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const recherche = typeof body?.recherche === "string" ? body.recherche.trim() : "";
  const filtre = body?.filtreSite === "avec" || body?.filtreSite === "sans" ? body.filtreSite : "tous";
  const limite = Math.min(40, Math.max(3, Number(body?.limite) || 25));
  if (!recherche) {
    return NextResponse.json(
      { ok: false, error: "Indiquez une recherche : mots-clés, @comptes ou liens Instagram." },
      { status: 422 },
    );
  }

  try {
    const { entreprises, avertissement } = await scraperInstagram({ recherche, limite });
    const sansSiteWeb = entreprises.filter((e) => !e.siteWebPresent).length;
    const resultats = appliquerFiltreSite(entreprises, filtre);
    const reponse: ResultatScraping & { entreprises: typeof resultats } = {
      ok: true,
      entreprises: resultats,
      totalTrouvees: entreprises.length,
      sansSiteWeb,
      avertissement,
    };
    return NextResponse.json(reponse);
  } catch (e) {
    console.error("[admin/scraping/instagram] Erreur :", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Scraping impossible." },
      { status: 502 },
    );
  }
}
