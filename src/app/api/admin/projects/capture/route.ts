import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/admin-auth";
import { capturerMockups } from "@/lib/documents/pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * VOLET 20 (26/11/2026) — CAPTURE AUTOMATIQUE DES MOCKUPS D'UN
 * PROJET DU PORTFOLIO (demande de l'éditeur : « je n'ai qu'à ajouter
 * l'URL du projet et le site extrait directement le mockup mobile et
 * desktop »).
 *
 * POST { url } → ouvre le site en ligne dans Chromium (même moteur
 * que la génération des PDF) et renvoie les DEUX captures prêtes à
 * enregistrer : ordinateur (1280 × 800) et mobile (390 × 844),
 * compressées en WebP (qualité 82) — forme ImageProjet (base64).
 *
 * Réservé à l'espace administrateur authentifié.
 */
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
  try {
    const destination = new URL(url);
    /* NB : « localhost » / 127.0.0.1 acceptés (tests locaux). */
    const hote = destination.hostname;
    if (hote !== "localhost" && hote !== "127.0.0.1" && !hote.includes(".")) {
      throw new Error("URL invalide.");
    }
    const captures = await capturerMockups(destination.toString());
    return NextResponse.json({ ok: true, ...captures });
  } catch (e) {
    console.error("[admin/projects/capture] Capture impossible :", e);
    return NextResponse.json(
      {
        ok: false,
        error:
          e instanceof Error
            ? `Capture impossible : ${e.message}`
            : "Capture impossible — vérifiez l'URL du site.",
      },
      { status: 502 },
    );
  }
}
