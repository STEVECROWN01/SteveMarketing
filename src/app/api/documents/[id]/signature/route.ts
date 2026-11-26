import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/admin-auth";
import {
  getDocument,
  saveDocument,
  enregistrerFichier,
  lireFichier,
  supprimerFichier,
  isStorageConfigured,
} from "@/lib/documents/github";
import { extraireTextePdf, pdfCorrespondAuDevis } from "@/lib/documents/pdf-texte";
import type { DocumentRecord } from "@/lib/documents/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * VOLET 20 (26/11/2026) — DEVIS SIGNÉ.
 *
 * Demande de l'éditeur : « pour marquer un devis signé, il faut
 * uploader le devis signé. Et c'est ce devis signé qui sera ajouté
 * dans la partie des devis signés. Et automatiquement le devis
 * sera marqué. »
 *
 *  - POST : téléverse le PDF signé (dossier privé devis-signes/),
 *    marque le devis « signé » (métadonnées dans son JSON — le
 *    fichier lui-même ne vit PAS dans le JSON, les listes restent
 *    légères) ;
 *  - GET : télécharge le PDF signé du devis ;
 *  - DELETE : retire la marque (et le fichier) sans supprimer le
 *    devis.
 *
 * Réservé à l'espace administrateur authentifié.
 */

/** Taille maximale acceptée pour un PDF signé (base64 ~ 8 Mo). */
const TAILLE_MAX_BASE64 = 8 * 1024 * 1024;

function nonAutorise() {
  return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
}

/** POST — téléversement du devis signé + marquage du devis. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) {
    return nonAutorise();
  }
  if (!isStorageConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Stockage GitHub non configuré (GITHUB_DOCS_TOKEN)." },
      { status: 503 },
    );
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const dataBase64: string | undefined = body?.data;
  const nomFichier: string | undefined = body?.nomFichier;
  const mime: string = typeof body?.mime === "string" ? body.mime : "application/pdf";
  if (!dataBase64 || !nomFichier) {
    return NextResponse.json({ ok: false, error: "Fichier manquant." }, { status: 422 });
  }
  if (dataBase64.length > TAILLE_MAX_BASE64) {
    return NextResponse.json(
      { ok: false, error: "PDF trop lourd (maximum ~6 Mo)." },
      { status: 413 },
    );
  }

  /* VOLET 21 (27/11/2026) — VALIDATION DU CONTENU (demande de
   * l'éditeur : « lors du téléversement du devis signé, il faut
   * vérifier que le document téléversé correspond bien au devis
   * généré — et refuser tout autre document ») : le PDF doit être
   * un vrai PDF dont la couche texte (quand elle existe — un
   * devis scanné n'en a pas) porte le NUMÉRO du devis. Un PDF
   * avec du texte mais SANS le numéro = document étranger →
   * REFUS. */
  const buffer = Buffer.from(dataBase64, "base64");
  if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
    return NextResponse.json(
      { ok: false, error: "Fichier PDF invalide — le document téléversé doit être le devis signé (PDF)." },
      { status: 422 },
    );
  }

  try {
    const document = await getDocument(id);
    if (!document || document.docType !== "devis") {
      return NextResponse.json(
        { ok: false, error: "Devis introuvable." },
        { status: 404 },
      );
    }

    const textePdf = await extraireTextePdf(buffer);
    if (!pdfCorrespondAuDevis(textePdf, document.numero)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            `Ce PDF ne correspond pas au devis ${document.numero} : son numéro n'y figure pas. ` +
            "Téléversez le PDF de CE devis (imprimé puis signé, ou signé numériquement). " +
            "Un devis scanné (sans texte) reste accepté.",
        },
        { status: 422 },
      );
    }

    /* 1. Le PDF signé vit dans le dossier privé devis-signes/<id>.pdf. */
    await enregistrerFichier(
      `devis-signes/${id}.pdf`,
      dataBase64,
      `devis signés : ${document.numero}`,
    );

    /* 2. Le devis est marqué signé (métadonnées seules). */
    const maintenant = new Date().toISOString();
    const signe: DocumentRecord = {
      ...document,
      devisSigne: { nomFichier, mime, taille: Math.round((dataBase64.length * 3) / 4), date: maintenant },
      updatedAt: maintenant,
    };
    await saveDocument(signe);

    return NextResponse.json({ ok: true, document: signe });
  } catch (e) {
    console.error("[documents/signature] Téléversement impossible :", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Téléversement impossible." },
      { status: 502 },
    );
  }
}

/** GET — téléchargement du PDF signé du devis. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) {
    return nonAutorise();
  }
  if (!isStorageConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Stockage GitHub non configuré (GITHUB_DOCS_TOKEN)." },
      { status: 503 },
    );
  }
  const { id } = await params;
  try {
    const document = await getDocument(id);
    if (!document || document.docType !== "devis" || !document.devisSigne) {
      return NextResponse.json(
        { ok: false, error: "Aucun devis signé pour ce document." },
        { status: 404 },
      );
    }
    const pdf = await lireFichier(`devis-signes/${id}.pdf`);
    if (!pdf) {
      return NextResponse.json({ ok: false, error: "PDF signé introuvable." }, { status: 404 });
    }
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(document.devisSigne.nomFichier)}"`,
        "Content-Length": String(pdf.length),
      },
    });
  } catch (e) {
    console.error("[documents/signature] Téléchargement impossible :", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Téléchargement impossible." },
      { status: 502 },
    );
  }
}

/** DELETE — retire la marque « signé » (et le fichier) du devis. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) {
    return nonAutorise();
  }
  if (!isStorageConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Stockage GitHub non configuré (GITHUB_DOCS_TOKEN)." },
      { status: 503 },
    );
  }
  const { id } = await params;
  try {
    const document = await getDocument(id);
    if (!document || document.docType !== "devis") {
      return NextResponse.json({ ok: false, error: "Devis introuvable." }, { status: 404 });
    }
    await supprimerFichier(`devis-signes/${id}.pdf`, `devis signés : retrait ${document.numero}`);
    const maintenant = new Date().toISOString();
    const { devisSigne: _supprime, ...reste } = document;
    const devis: DocumentRecord = { ...reste, updatedAt: maintenant };
    await saveDocument(devis);
    return NextResponse.json({ ok: true, document: devis });
  } catch (e) {
    console.error("[documents/signature] Retrait impossible :", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Retrait impossible." },
      { status: 502 },
    );
  }
}
