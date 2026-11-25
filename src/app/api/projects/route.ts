import { NextResponse } from "next/server";
import { listerProjetsAdmin, versPublic, isStorageConfigured } from "@/lib/portfolio/stockage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/projects — PROJETS PUBLIÉS du portfolio évolatif
 * (VOLET 19, 26/11/2026), pour le site public.
 *
 * Public (aucune authentification — ce sont des contenus publiés).
 * Réponse : { ok, projets: ProjetPublic[] } — les images sont des
 * URLs servies par /api/projects/<id>/<desktop|mobile>. Les
 * BROUILLONS sont exclus. Si le stockage n'est pas configuré ou
 * inaccessible, la réponse est une liste VIDE (le site retombe sur
 * ses quatre projets statiques — jamais de page cassée).
 */
export async function GET() {
  if (!isStorageConfigured()) {
    return NextResponse.json({ ok: true, projets: [] });
  }
  try {
    const projets = await listerProjetsAdmin();
    return NextResponse.json({
      ok: true,
      projets: projets.filter((p) => p.statut === "publie").map(versPublic),
    });
  } catch (e) {
    console.warn("[projects] liste impossible :", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: true, projets: [] });
  }
}
