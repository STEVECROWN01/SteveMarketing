import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/admin-auth";
import { auditerDesign } from "@/lib/audit/design";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * VOLET 28 (28/11/2026) — OUTIL « AUDIT COMPLET » DE L'ESPACE AUDIT :
 * analyse le site dans son entièreté — design (moderne ou non),
 * structure, copywriting et conversion — avec capture d'écran de la
 * page.
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
    const releve = await auditerDesign(url);
    return NextResponse.json(releve);
  } catch (e) {
    console.error("[admin/audit/design] Erreur :", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Analyse impossible." },
      { status: 502 },
    );
  }
}
