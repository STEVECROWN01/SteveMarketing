import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/admin-auth";
import { auditerSeo } from "@/lib/audit/seo";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * VOLET 28 (28/11/2026) — OUTIL « SEO » DE L'ESPACE AUDIT (cloné sur
 * RankFlow SEO) : audit on-page en un clic — score sur 100, note
 * A-F, verdict, familles de critères et plan d'action priorisé.
 *
 * POST { url } — réservé à l'espace administrateur authentifié.
 */
export async function POST(req: NextRequest) {
  if (!verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  if (!/^https?:\/\/.+\..+/.test(url)) {
    return NextResponse.json(
      { ok: false, error: "Indiquez l'URL complète de la page (https://…)." },
      { status: 422 },
    );
  }
  try {
    const releve = await auditerSeo(url);
    return NextResponse.json(releve);
  } catch (e) {
    console.error("[admin/audit/seo] Erreur :", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Analyse impossible." },
      { status: 502 },
    );
  }
}
