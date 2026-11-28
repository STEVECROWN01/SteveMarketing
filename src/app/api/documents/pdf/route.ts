import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/admin-auth";
import { completerDocument, saveDocument, getDocument, isStorageConfigured, type ToutDocument } from "@/lib/documents/github";
import { generatePdf } from "@/lib/documents/pdf";
import { buildIdDocument, buildNomFichier, formatDate, formatCurrency, totalDocument, fmtMontantSimple } from "@/lib/documents/format";
import { LOGO_DOC_DATA_URI } from "@/lib/documents/logo-base64";
import { isEmailServiceConfigured, sendDocumentCopy } from "@/lib/email";
import { LABELS_DOC, type DemandeDocument } from "@/lib/documents/types";
import { estPropositionV2, type DemandeProposition } from "@/lib/documents/proposition";

export const runtime = "nodejs";
export const maxDuration = 60;

/** POST /api/documents/pdf — génération du PDF d'un document
 *  commercial (proposition v2 / devis / facture) :
 *  - corps : { document, enregistrer?, envoyerEmail?, langueSortie? } ;
 *  - renvoie TOUJOURS le PDF (téléchargement automatique côté
 *    back-office) ;
 *  - effets secondaires NON BLOQUANTS :
 *    `enregistrer` → stockage GitHub du document (dépôt privé),
 *    `envoyerEmail` → copie PDF à l'adresse personnelle de
 *    l'éditeur via Resend ;
 *  - en-tête X-Email-Sent : 1 si la copie est partie.
 *
 *  VOLET 18 — `langueSortie` ("fr" | "en", optionnel) : langue de la
 *  VERSION TÉLÉCHARGÉE choisie dans le back-office. Elle ne modifie
 *  que le PDF rendu (et sa copie email jointe) — l'enregistrement
 *  conserve la langue DU document (document.langue) : une version
 *  de sortie n'écrase JAMAIS la langue enregistrée. Sans ce champ,
 *  le PDF suit la langue du document (comportement historique). */
export async function POST(req: NextRequest) {
  if (!verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const brut: (DemandeDocument | DemandeProposition) | null = body?.document ?? body;
  if (!brut || !["proposition", "devis", "facture"].includes(brut?.docType)) {
    return NextResponse.json({ ok: false, error: "Document invalide." }, { status: 422 });
  }

  const enregistrer = Boolean(body?.enregistrer ?? true);
  const envoyerEmail = Boolean(body?.envoyerEmail ?? true);
  /* VOLET 18 — langue de la VERSION DE SORTIE (uniquement "fr" ou
   * "en" ; absent → la langue du document elle-même). */
  const langueSortie: "fr" | "en" | null =
    body?.langueSortie === "fr" || body?.langueSortie === "en" ? body.langueSortie : null;

  try {
    const document = completerDocument(brut) as ToutDocument;
    /* VOLET 23 — ANTI-DOUBLON (garde serveur, demande de l'éditeur :
     * « quand on clique encore sur générer une seconde fois, ça doit
     * refuser par un toast et dire que le document existe déjà ») :
     * une CRÉATION (aucun identifiant fourni) d'un numéro déjà
     * enregistré est REFUSÉE ; la mise à jour d'un document existant
     * (identifiant fourni — c'est le cas des factures régénérées)
     * reste libre.
     * CORRECTIF 28/11 — VITESSE (retour de l'éditeur : « la génération
     * prend trop de temps ») : la vérification anti-doublon (lecture
     * GitHub) et la GÉNÉRATION DU PDF partent EN PARALLÈLE — le PDF
     * ne dépend pas de la vérification ; en cas de doublon le PDF
     * simplement n'est pas utilisé. */
    const verificationDoublon =
      enregistrer && !brut?.id && isStorageConfigured()
        ? getDocument(buildIdDocument(document.docType, document.numero)).catch(() => null)
        : Promise.resolve(null);
    /* VOLET 18 — le PDF (et sa copie email) est rendu dans la langue
     * CHOISIE ; le document ENREGISTRÉ garde sa propre langue.
     * Les propositions commerciales ignorent la langue (template
     * français uniquement — langueSortie jamais envoyée pour elles). */
    const documentPdf: ToutDocument =
      langueSortie && !estPropositionV2(document)
        ? ({ ...document, langue: langueSortie } as ToutDocument)
        : document;
    const [existant, pdf] = await Promise.all([
      verificationDoublon,
      generatePdf(documentPdf, LOGO_DOC_DATA_URI),
    ]);
    if (existant) {
      return NextResponse.json(
        {
          ok: false,
          error: `Le document ${document.numero} existe déjà — il est disponible dans la liste (ouvrez-le ou modifiez-le depuis la liste).`,
        },
        { status: 409 },
      );
    }
    const estProp = estPropositionV2(document);
    /* Proposition v2 : pas de fiche client — le nom de fichier et le
       libellé email portent le PROJET ; les autres documents gardent
       le nom du client. */
    const nomPourFichier = estProp
      ? document.projet || document.titre || "proposition"
      : document.client.nom;
    const nomFichier = buildNomFichier(document.docType, document.numero, nomPourFichier);
    const label = LABELS_DOC[document.docType];

    /* Effets 1 + 2 (CORRECTIF 28/11 — VITESSE) : stockage GitHub ET
       copie email partent EN PARALLÈLE (ils étaient enchaînés : le
       temps de l'un s'ajoutait à l'autre) — tous deux restent non
       bloquants, le PDF est renvoyé même si l'un échoue. */
    const envoyerCopieEmail = async (): Promise<boolean> => {
      if (!envoyerEmail) return false;
      if (!isEmailServiceConfigured()) {
        emailErreur = "Email non configuré (RESEND_API_KEY).";
        return false;
      }
      try {
        const dateLabel = formatDate(document.date);
        const sujet = estProp
          ? `${label} ${document.numero} — ${document.projet}`
          : `${label} ${document.numero} — ${document.client.nom}`;
        const lignesResume: [string, string][] = estProp
          ? [
              ["Projet", document.projet],
              ["Titre", document.titre],
              ["Date", dateLabel],
              ["Total", fmtMontantSimple(document.montant, document.devise)],
            ]
          : [
              ["Client", `${document.client.nom}${document.client.entreprise ? " — " + document.client.entreprise : ""}`],
              ["Date", dateLabel],
              ["Objet", document.objet],
              ["Total", formatCurrency(totalDocument(document.items), document.devise)],
            ];
        const html = `
          <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:560px;margin:0 auto;color:#1f2937;">
            <div style="background:#070707;padding:16px 24px;border-radius:4px 4px 0 0;">
              <div style="font-size:18px;font-weight:700;color:#e4e4e4;letter-spacing:0.06em;">${label.toUpperCase()} ${document.numero}</div>
            </div>
            <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 4px 4px;">
              <p style="margin:0 0 12px;">Un exemplaire de ce document est joint pour vos archives.</p>
              <table style="width:100%;font-size:14px;border-collapse:collapse;">
                ${lignesResume.map(([k, v]) => `<tr><td style="padding:4px 0;color:#6b7280;width:150px;">${k}</td><td style="padding:4px 0;font-weight:600;">${v}</td></tr>`).join("")}
              </table>
              <p style="margin:16px 0 0;font-size:12px;color:#6b7280;">— Back-office Stevens Akpovi</p>
            </div>
          </div>`;
        const texte = `${label} ${document.numero}\n${sujet.split(" — ").slice(1).join(" — ")}\nDate : ${dateLabel}\n\nUn exemplaire est joint.`;
        const envoye = await sendDocumentCopy({
          subject: sujet,
          html,
          text: texte,
          filename: nomFichier,
          contenuBase64: pdf.toString("base64"),
        });
        if (!envoye) emailErreur = "Envoi de la copie refusé par Resend.";
        return envoye;
      } catch (e) {
        emailErreur = e instanceof Error ? e.message : "Envoi impossible.";
        console.warn("[documents/pdf] Copie email échouée (PDF renvoyé) :", emailErreur);
        return false;
      }
    };
    const enregistrerStockage = async (): Promise<boolean> => {
      if (!enregistrer) return false;
      if (!isStorageConfigured()) {
        stockageErreur = "Stockage GitHub non configuré (GITHUB_DOCS_TOKEN).";
        return false;
      }
      try {
        await saveDocument(document);
        return true;
      } catch (e) {
        stockageErreur = e instanceof Error ? e.message : "Stockage impossible.";
        console.warn("[documents/pdf] Enregistrement échoué (PDF renvoyé) :", stockageErreur);
        return false;
      }
    };
    let stockageOk = false;
    let emailOk = false;
    let stockageErreur: string | null = null;
    let emailErreur: string | null = null;
    [stockageOk, emailOk] = await Promise.all([enregistrerStockage(), envoyerCopieEmail()]);

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
