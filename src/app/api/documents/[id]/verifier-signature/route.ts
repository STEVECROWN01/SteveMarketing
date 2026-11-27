import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/admin-auth";
import { getDocument, isStorageConfigured } from "@/lib/documents/github";
import { extraireTextePdf, analyserDevisSigne } from "@/lib/documents/pdf-texte";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * VOLET 22 (27/11/2026) — ANALYSE DU DEVIS SIGNÉ À L'UPLOAD.
 *
 * Demande de l'éditeur : « ce n'est pas lors de l'enregistrement que
 * le système doit vérifier la correspondance : c'est lors de
 * l'UPLOAD. Le système lit le contenu du document et vérifie
 * strictement que le numéro du devis, le nom, les signatures, la
 * date d'émission et le tableau de détails figurent sur le document
 * téléversé — pendant l'analyse, un chargement circulaire vert
 * monte de 0 à 100 % ; à la fin, une coche verte (ou une croix
 * rouge) indique le verdict, et le bouton d'enregistrement ne se
 * dégrise QUE si le document correspond. »
 *
 * POST { data: base64 du PDF } → { ok, valide, manques[] } — aucun
 * enregistrement ici : la modale affiche le verdict et c'est
 * l'enregistrement (POST …/signature) qui sauvegarde ensuite le
 * fichier déjà analysé.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const dataBase64: string | undefined = body?.data;
  if (!dataBase64) {
    return NextResponse.json({ ok: false, error: "Fichier manquant." }, { status: 422 });
  }

  const buffer = Buffer.from(dataBase64, "base64");
  if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
    return NextResponse.json({
      ok: true,
      valide: false,
      manques: ["Le fichier téléversé n'est pas un PDF valide."],
    });
  }

  /* Le devis attendu est relu depuis le stockage privé pour la
   * comparaison ; sans stockage, l'analyse stricte est impossible. */
  if (!isStorageConfigured()) {
    return NextResponse.json({
      ok: true,
      valide: false,
      manques: ["Stockage non configuré (GITHUB_DOCS_TOKEN) — le devis à comparer est introuvable."],
    });
  }

  try {
    const document = await getDocument(id);
    if (!document || document.docType !== "devis") {
      return NextResponse.json({ ok: false, error: "Devis introuvable." }, { status: 404 });
    }
    const textePdf = await extraireTextePdf(buffer);
    const analyse = analyserDevisSigne(textePdf, {
      numero: document.numero,
      clientNom: document.client?.nom ?? "",
      date: document.date,
    });
    return NextResponse.json({ ok: true, ...analyse });
  } catch (e) {
    console.error("[documents/verifier-signature] Analyse impossible :", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Analyse impossible." },
      { status: 502 },
    );
  }
}
