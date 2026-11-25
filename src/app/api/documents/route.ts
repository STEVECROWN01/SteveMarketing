import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/admin-auth";
import {
  listDocuments,
  saveDocument,
  completerDocument,
  isStorageConfigured,
  type ToutDocument,
} from "@/lib/documents/github";
import { isEmailServiceConfigured } from "@/lib/email";

export const runtime = "nodejs";

function nonAutorise() {
  return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
}

/** Liste des documents enregistrés (back-office) — réservé à
 *  l'espace administrateur authentifié. */
export async function GET(req: NextRequest) {
  if (!verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) {
    return nonAutorise();
  }
  /* VOLET 14 : la liste répond TOUJOURS 200 une fois la session
     ouverte — avec les DRAPEAUX d'état du tableau de bord
     (stockageConfigure / emailConfigure) : quand le stockage n'est
     pas encore configuré, le back-office affiche sa bande
     d'explication au lieu d'une erreur, et la GÉNÉRATION de
     documents reste pleinement opérationnelle. */
  if (!isStorageConfigured()) {
    return NextResponse.json({
      ok: true,
      documents: [] as ToutDocument[],
      stockageConfigure: false,
      emailConfigure: isEmailServiceConfigured(),
    });
  }
  try {
    const documents = await listDocuments();
    return NextResponse.json({
      ok: true,
      documents,
      stockageConfigure: true,
      emailConfigure: isEmailServiceConfigured(),
    });
  } catch (e) {
    console.error("[documents] Liste impossible :", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Liste impossible." },
      { status: 502 },
    );
  }
}

/** Enregistrement (création ou mise à jour) d'un document. */
export async function POST(req: NextRequest) {
  if (!verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) {
    return nonAutorise();
  }
  const body = await req.json().catch(() => null);
  const d = body?.document ?? body;
  if (!d || !["proposition", "devis", "facture"].includes(d?.docType)) {
    return NextResponse.json({ ok: false, error: "Document invalide." }, { status: 422 });
  }
  /* Proposition commerciale v2 (VOLET 16) : structure en sections,
     sans tableau d'items. */
  const estPropV2 = d.docType === "proposition" && d.sections && typeof d.titre === "string";
  if (!Number.isFinite(Number(d?.numeroClient))) {
    return NextResponse.json({ ok: false, error: "Document invalide." }, { status: 422 });
  }
  if (!estPropV2 && !Array.isArray(d?.items)) {
    return NextResponse.json({ ok: false, error: "Document invalide." }, { status: 422 });
  }
  try {
    const document = completerDocument(d as Parameters<typeof completerDocument>[0]) as ToutDocument;
    await saveDocument(document);
    return NextResponse.json({ ok: true, document });
  } catch (e) {
    console.error("[documents] Enregistrement impossible :", e);
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Enregistrement impossible.",
        configured: isStorageConfigured(),
      },
      { status: 503 },
    );
  }
}
