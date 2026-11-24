import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/admin-auth";
import { getDocument, deleteDocument, isStorageConfigured } from "@/lib/documents/github";

export const runtime = "nodejs";

function nonAutorise() {
  return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
}

/** Un document enregistré (par identifiant de fichier). */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) {
    return nonAutorise();
  }
  if (!isStorageConfigured()) {
    return NextResponse.json(
      { ok: false, configured: false, error: "Stockage GitHub non configuré (GITHUB_DOCS_TOKEN)." },
      { status: 503 },
    );
  }
  const { id } = await params;
  try {
    const document = await getDocument(id);
    if (!document) {
      return NextResponse.json({ ok: false, error: "Document introuvable." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, document });
  } catch (e) {
    console.error("[documents] Lecture impossible :", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Lecture impossible." },
      { status: 502 },
    );
  }
}

/** Suppression d'un document enregistré. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) {
    return nonAutorise();
  }
  if (!isStorageConfigured()) {
    return NextResponse.json(
      { ok: false, configured: false, error: "Stockage GitHub non configuré (GITHUB_DOCS_TOKEN)." },
      { status: 503 },
    );
  }
  const { id } = await params;
  try {
    await deleteDocument(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[documents] Suppression impossible :", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Suppression impossible." },
      { status: 502 },
    );
  }
}
