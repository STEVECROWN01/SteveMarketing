import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/admin-auth";
import { completerDocument, saveDocument, isStorageConfigured } from "@/lib/documents/github";
import { generatePdf } from "@/lib/documents/pdf";
import { buildNomFichier, formatDate, formatCurrency, totalDocument } from "@/lib/documents/format";
import { LOGO_DATA_URI } from "@/lib/documents/logo-base64";
import { isEmailServiceConfigured, sendDocumentCopy } from "@/lib/email";
import { LABELS_DOC, type DemandeDocument } from "@/lib/documents/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/documents/pdf — génération du PDF d'un document
 * commercial (proposition / devis / facture), système K.Quotes :
 *  - corps : { document, enregistrer?, envoyerEmail? } ;
 *  - renvoie TOUJOURS le PDF (téléchargement automatique côté
 *    back-office) ;
 *  - effets secondaires NON BLOQUANTS (comme K.Quotes) :
 *    `enregistrer` → stockage GitHub du document (dépôt privé),
 *    `envoyerEmail` → copie PDF à l'adresse personnelle de
 *    l'éditeur via Resend ;
 *  - en-tête X-Email-Sent : 1 si la copie est partie.
 */
export async function POST(req: NextRequest) {
  if (!verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const demande: DemandeDocument | null = body?.document ?? body;
  if (!demande || !["proposition", "devis", "facture"].includes(demande?.docType)) {
    return NextResponse.json({ ok: false, error: "Document invalide." }, { status: 422 });
  }

  const enregistrer = Boolean(body?.enregistrer ?? true);
  const envoyerEmail = Boolean(body?.envoyerEmail ?? true);

  try {
    const document = completerDocument(demande);
    const pdf = await generatePdf(document, LOGO_DATA_URI);
    const nomFichier = buildNomFichier(document.docType, document.numero, document.client.nom);
    const label = LABELS_DOC[document.docType];

    /* Effet 1 : stockage GitHub (dépôt privé dédié) — non bloquant,
       le téléchargement réussit même si le stockage échoue. */
    let stockageOk = false;
    let stockageErreur: string | null = null;
    if (enregistrer) {
      if (!isStorageConfigured()) {
        stockageErreur = "Stockage GitHub non configuré (GITHUB_DOCS_TOKEN).";
      } else {
        try {
          await saveDocument(document);
          stockageOk = true;
        } catch (e) {
          stockageErreur = e instanceof Error ? e.message : "Stockage impossible.";
          console.warn("[documents/pdf] Enregistrement échoué (PDF renvoyé) :", stockageErreur);
        }
      }
    }

    /* Effet 2 : copie email à l'éditeur — non bloquant, système
       K.Quotes (auto-copie Resend avec pièce jointe). */
    let emailOk = false;
    let emailErreur: string | null = null;
    if (envoyerEmail) {
      if (!isEmailServiceConfigured()) {
        emailErreur = "Email non configuré (RESEND_API_KEY).";
      } else {
        try {
          const dateLabel = formatDate(document.date);
          const sujet = `${label} ${document.numero} — ${document.client.nom}`;
          const html = `
          <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:560px;margin:0 auto;color:#1f2937;">
            <div style="background:#070707;padding:16px 24px;border-radius:4px 4px 0 0;">
              <div style="font-size:18px;font-weight:700;color:#e4e4e4;letter-spacing:0.06em;">${label.toUpperCase()} ${document.numero}</div>
            </div>
            <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 4px 4px;">
              <p style="margin:0 0 12px;">Un exemplaire de ce document est joint pour vos archives.</p>
              <table style="width:100%;font-size:14px;border-collapse:collapse;">
                <tr><td style="padding:4px 0;color:#6b7280;width:150px;">Client</td><td style="padding:4px 0;font-weight:600;">${document.client.nom}${document.client.entreprise ? " — " + document.client.entreprise : ""}</td></tr>
                <tr><td style="padding:4px 0;color:#6b7280;">Date</td><td style="padding:4px 0;">${dateLabel}</td></tr>
                <tr><td style="padding:4px 0;color:#6b7280;">Objet</td><td style="padding:4px 0;">${document.objet}</td></tr>
                <tr><td style="padding:4px 0;color:#6b7280;">Total</td><td style="padding:4px 0;font-weight:700;">${formatCurrency(totalDocument(document.items), document.devise)}</td></tr>
              </table>
              <p style="margin:16px 0 0;font-size:12px;color:#6b7280;">— Back-office Stevens Akpovi</p>
            </div>
          </div>`;
          const texte = `${label} ${document.numero}\nClient : ${document.client.nom}\nDate : ${dateLabel}\n\nUn exemplaire est joint.`;
          emailOk = await sendDocumentCopy({
            subject: sujet,
            html,
            text: texte,
            filename: nomFichier,
            contenuBase64: pdf.toString("base64"),
          });
          if (!emailOk) emailErreur = "Envoi de la copie refusé par Resend.";
        } catch (e) {
          emailErreur = e instanceof Error ? e.message : "Envoi impossible.";
          console.warn("[documents/pdf] Copie email échouée (PDF renvoyé) :", emailErreur);
        }
      }
    }

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nomFichier}"`,
        "Content-Length": String(pdf.length),
        "X-Email-Sent": emailOk ? "1" : "0",
        "X-Stockage-Ok": stockageOk ? "1" : "0",
        ...(emailErreur ? { "X-Email-Error": encodeURIComponent(emailErreur) } : {}),
        ...(stockageErreur ? { "X-Stockage-Error": encodeURIComponent(stockageErreur) } : {}),
      },
    });
  } catch (e) {
    console.error("[documents/pdf] Génération impossible :", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Génération impossible." },
      { status: 500 },
    );
  }
}
