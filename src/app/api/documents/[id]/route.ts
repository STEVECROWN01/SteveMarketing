import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/admin-auth";
import {
  getDocument,
  deleteDocument,
  supprimerFichier,
  listDocuments,
  isStorageConfigured,
} from "@/lib/documents/github";

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

/**
 * Suppression d'un document enregistré.
 *
 * VOLET 20 (26/11/2026) — SUPPRESSION EN CASCADE (demande de
 * l'éditeur) : « un devis supprimé doit entraîner automatiquement
 * la suppression de la facture correspondante. Donc lors de la
 * suppression d'un devis, le modal de confirmation doit avertir et
 * préciser que la suppression de ce devis va automatiquement
 * engendrer la suppression de la facture correspondante. » La
 * facture liée (devisSource = numéro du devis) et le PDF signé
 * éventuel sont supprimés avec le devis.
 */
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
    /* VOLET 20 — avant la suppression : si le document est un DEVIS,
     * retrouver SA FACTURE liée (devisSource) pour l'entraîner. */
    let factureLiee: { id: string; numero: string } | null = null;
    const cible = await getDocument(id);
    if (cible && cible.docType === "devis") {
      try {
        const tous = await listDocuments();
        const facture = tous.find(
          (d) => d.docType === "facture" && d.devisSource === cible.numero,
        );
        if (facture) factureLiee = { id: facture.id, numero: facture.numero };
      } catch {
        /* la recherche de la facture liée est non bloquante */
      }
    }

    /* VOLET 20 — le PDF SIGNÉ du devis part avec lui. */
    if (cible && cible.docType === "devis" && cible.devisSigne) {
      await supprimerFichier(
        `devis-signes/${id}.pdf`,
        `devis signés : suppression ${cible.numero}`,
      ).catch(() => undefined);
    }

    await deleteDocument(id);

    /* VOLET 20 — cascade : la facture correspondante disparaît avec
     * son devis. */
    if (factureLiee) {
      await deleteDocument(factureLiee.id).catch(() => undefined);
    }

    return NextResponse.json({ ok: true, ...(factureLiee ? { factureSupprimee: factureLiee.numero } : {}) });
  } catch (e) {
    console.error("[documents] Suppression impossible :", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Suppression impossible." },
      { status: 502 },
    );
  }
}
