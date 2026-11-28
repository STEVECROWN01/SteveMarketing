import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/admin-auth";
import { auditerPerformance } from "@/lib/audit/performance";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * VOLET 28 (28/11/2026) — OUTIL « PERFORMANCE » DE L'ESPACE AUDIT
 * : mesure la page dans un vrai Chrome (note
 * A-F, scores Performance et Structure, Web Vitals LCP/TBT/CLS/FCP,
 * détails de la page, audits et cascade des requêtes).
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
    const releve = await auditerPerformance(url);
    return NextResponse.json(releve);
  } catch (e) {
    console.error("[admin/audit/performance] Erreur :", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Analyse impossible." },
      { status: 502 },
    );
  }
}
