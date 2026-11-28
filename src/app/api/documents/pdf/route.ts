import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/admin-auth";
import { completerDocument, saveDocument, getDocument, isStorageConfigured, type ToutDocument } from "@/lib/documents/github";
import { generatePdf } from "@/lib/documents/pdf";
import { buildIdDocument, buildNomFichier } from "@/lib/documents/format";
import { LOGO_DOC_DATA_URI } from "@/lib/documents/logo-base64";
import { type DemandeDocument } from "@/lib/documents/types";
import { estPropositionV2, type DemandeProposition } from "@/lib/documents/proposition";

export const runtime = "nodejs";
export const maxDuration = 60;

/** POST /api/documents/pdf — génération du PDF d'un document
 *  commercial (proposition v2 / devis / facture) :
 *  - corps : { document, enregistrer?, langueSortie? } ;
 *  - renvoie TOUJOURS le PDF (téléchargement automatique côté
 *    back-office) ;
 *  - effet secondaire NON BLOQUANT :
 *    `enregistrer` → stockage GitHub du document (dépôt privé).
 *
 *  VOLET 30 (29/11/2026) — PLUS AUCUN EMAIL : les documents du
 *  back-office ne sont plus envoyés par copie email (l'ancienne
 *  copie PDF à l'éditeur est SUPPRIMÉE — tout est déjà archivé
 *  dans le dépôt GitHub privé, la boîte mail ne se remplit plus).
 *  Seules les DEMANDES DES VISITEURS du site public partent par
 *  email (voir /api/leads).
 *
 *  VOLET 18 — `langueSortie` ("fr" | "en", optionnel) : langue de la
 *  VERSION TÉLÉCHARGÉE choisie dans le back-office. Elle ne modifie
 *  que le PDF rendu — l'enregistrement conserve la langue DU
 *  document (document.langue) : une version de sortie n'écrase
 *  JAMAIS la langue enregistrée. Sans ce champ, le PDF suit la
 *  langue du document (comportement historique). */
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
    /* VOLET 18 — le PDF est rendu dans la langue CHOISIE ; le
     * document ENREGISTRÉ garde sa propre langue.
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
    /* Proposition v2 : pas de fiche client — le nom de fichier
       porte le PROJET ; les autres documents gardent le nom du
       client. */
    const nomPourFichier = estProp
      ? document.projet || document.titre || "proposition"
      : document.client.nom;
    const nomFichier = buildNomFichier(document.docType, document.numero, nomPourFichier);

    /* VOLET 30 — PLUS DE COPIE EMAIL : seul le stockage GitHub reste
       (effet secondaire non bloquant, le PDF est renvoyé même s'il
       échoue). */
    let stockageErreur: string | null = null;
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
    const stockageOk = await enregistrerStockage();

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nomFichier}"`,
        "Content-Length": String(pdf.length),
        "X-Stockage-Ok": stockageOk ? "1" : "0",
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
