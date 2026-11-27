/**
 * EXTRACTION DU TEXTE D'UN PDF — VOLET 21 (27/11/2026).
 *
 * Sert la VALIDATION des devis signés téléversés (demande de
 * l'éditeur : « quand je téléverse le devis signé, il faut VÉRIFIER
 * que le document correspond bien au devis généré — et refuser tout
 * autre document ») : le texte du PDF téléversé doit contenir le
 * NUMÉRO du devis (D2600001 figure en tête du document et dans le
 * pied de chaque page).
 *
 * Implémentation : pdfjs-dist (build LEGACY — Node, sans canvas)
 * chargé DYNAMIQUEMENT côté serveur uniquement ; aucune dépendance
 * native. Les polices embarquées du PDF (Identity-H) sont décodées
 * via leurs tables ToUnicode — un extracteur « naïf » (regex sur les
 * opérateurs Tj/TJ) ne trouve RIEN sur les PDF produits par
 * Chromium (vérifié au volet 21).
 *
 * En cas d'échec d'extraction (PDF illisible, scanné en image…),
 * la fonction répond "" — l'appelant décide (un PDF scanné n'a PAS
 * de texte extractible : on ne peut pas le vérifier).
 */

type PagePdf = {
  getTextContent: () => Promise<{
    items: { str?: string }[];
  }>;
};

type DocumentPdf = {
  numPages: number;
  getPage: (n: number) => Promise<PagePdf>;
};

/** Nombre de pages lues (garde-fou : documents très longs). */
const MAX_PAGES = 20;

/** Extrait le TEXTE d'un PDF (toutes ses pages, jusqu'à MAX_PAGES).
 *  Renvoie "" si aucune couche texte n'est extractible. */
export async function extraireTextePdf(buffer: Buffer): Promise<string> {
  /* En-tête %PDF : pas un PDF → aucun texte. */
  if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") return "";
  try {
    /* Import dynamique du build legacy (Node) — jamais embarqué dans
     * le bundle client. Dans un contexte BUNDLÉ (Next.js dev &
     * Vercel), pdf.js installe son « fake worker » par un import
     * dynamique que le bundler ne résout pas : on lui fournit
     * DIRECTEMENT le module worker via globalThis.pdfjsWorker
     * (chemin d'API public de pdf.js — #mainThreadWorkerMessageHandler). */
    const pdfjs = (await import(
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      "pdfjs-dist/legacy/build/pdf.mjs" as string
    )) as {
      getDocument: (opts: { data: Uint8Array; isEvalSupported: boolean; useSystemFonts: boolean }) => {
        promise: Promise<DocumentPdf>;
      };
    };
    const portee = globalThis as { pdfjsWorker?: { WorkerMessageHandler?: unknown } };
    if (!portee.pdfjsWorker?.WorkerMessageHandler) {
      portee.pdfjsWorker = (await import(
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        "pdfjs-dist/legacy/build/pdf.worker.mjs" as string
      )) as { WorkerMessageHandler?: unknown };
    }
    const doc = await pdfjs.getDocument({
      data: new Uint8Array(buffer),
      isEvalSupported: false,
      useSystemFonts: false,
    }).promise;
    const morceaux: string[] = [];
    const total = Math.min(doc.numPages, MAX_PAGES);
    for (let i = 1; i <= total; i++) {
      const page = await doc.getPage(i);
      const contenu = await page.getTextContent();
      for (const item of contenu.items) {
        if (typeof item.str === "string") morceaux.push(item.str);
      }
    }
    return morceaux.join(" ");
  } catch (e) {
    /* PDF illisible pour l'extracteur : considéré sans texte —
     * journalisé pour distinguer un échec d'extraction d'un vrai
     * PDF scanné (aucun texte par nature). */
    console.warn(
      "[pdf-texte] Extraction impossible (PDF considéré sans texte) :",
      e instanceof Error ? e.message : e,
    );
    return "";
  }
}

/** Normalisation de comparaison : sans espaces ni casse. */
function normaliser(texte: string): string {
  return texte.replace(/[\s\u00a0]+/g, "").toUpperCase();
}

/** Le PDF téléversé CORRESPOND-IL au devis attendu ?
 *  - `texte` : texte extrait du PDF (extraireTextePdf) ;
 *  - `numero` : numéro du devis (D2600001).
 *
 *  Règles :
 *  - texte extrait PRÉSENT (PDF avec couche texte) : le NUMÉRO du
 *    devis doit y figurer → sinon REFUS (document étranger) ;
 *  - AUCUN texte extractible (PDF scanné en image — le cas d'un
 *    devis imprimé, signé puis scanné) : on ne peut pas vérifier →
 *    ACCEPTÉ (la vérification ne bloque pas les scans légitimes). */
export function pdfCorrespondAuDevis(texte: string, numero: string): boolean {
  const plat = normaliser(texte);
  /* Seuil : en dessous, on considère qu'il n'y a pas de vraie
   * couche texte (scan) — vérification impossible. */
  if (plat.length < 40) return true;
  return plat.includes(normaliser(numero));
}

/* ------------------------------------------------------------------
 * VOLET 22 (27/11/2026) — ANALYSE STRICTE À L'UPLOAD (devis signé).
 *
 * Demande de l'éditeur : « c'est lors de l'upload que le système
 * doit vérifier STRICTEMENT le document, lire les informations et
 * voir si le numéro du devis figure sur le document uploadé, si le
 * NOM figure sur le document, s'il y a des SIGNATURES sur le
 * document, si la DATE D'ÉMISSION du devis figure sur le document
 * uploadé, si le TABLEAU DE DÉTAILS du devis figure sur le document
 * uploadé. »
 *
 * L'analyse (côté serveur, avant l'enregistrement) vérifie donc
 * CINQ points sur la couche texte du PDF et répond la liste précise
 * des éléments manquants (affichés en rouge dans la modale).
 * ------------------------------------------------------------------ */

/** Résultat de l'analyse stricte d'un devis signé téléversé. */
export type AnalyseDevisSigne = {
  /** true = le PDF correspond bien à CE devis signé. */
  valide: boolean;
  /** Éléments manquants (libellés courts, affichés en rouge). */
  manques: string[];
};

/** Analyse STRICTE du PDF téléversé : le numéro du devis, le nom du
 *  client, la zone de signature (« Bon pour accord » / « Signature
 *  et cachet »), la date d'émission (formatée comme sur le devis)
 *  et le tableau de détails (en-tête « Détail » + colonnes) doivent
 *  tous figurer dans le texte du PDF. Un PDF SANS couche texte
 *  (scan image) est refusé : impossible de vérifier strictement. */
export function analyserDevisSigne(
  texte: string,
  devis: { numero: string; clientNom: string; date: string },
): AnalyseDevisSigne {
  const plat = normaliser(texte);
  const manques: string[] = [];

  /* PDF sans vraie couche texte → vérification stricte impossible :
   * refusé (l'éditeur doit téléverser le PDF du devis signé, pas un
   * scan image). */
  if (plat.length < 40) {
    return {
      valide: false,
      manques: [
        "Aucun texte lisible dans ce PDF (document scanné en image) — impossible de vérifier qu'il s'agit bien du devis signé.",
      ],
    };
  }

  if (!plat.includes(normaliser(devis.numero))) {
    manques.push(`le numéro du devis (${devis.numero}) n'y figure pas`);
  }
  if (devis.clientNom.trim() && !plat.includes(normaliser(devis.clientNom))) {
    manques.push(`le nom du client (${devis.clientNom}) n'y figure pas`);
  }
  const zoneSignature =
    plat.includes(normaliser("Bon pour accord")) ||
    plat.includes(normaliser("Signature et cachet")) ||
    plat.includes(normaliser("Signature et cachet | Qualité de signataire"));
  if (!zoneSignature) {
    manques.push("la zone de signature (« Bon pour accord ») n'y figure pas");
  }
  /* Date d'émission : formats imprimés par le gabarit (« 26 novembre
   * 2026 », « 26 Nov 2026 », « 26/11/2026 »). */
  const d = new Date(`${devis.date}T00:00:00`);
  let datePresente = false;
  if (!isNaN(d.getTime())) {
    const moisFr = [
      "janvier", "février", "mars", "avril", "mai", "juin",
      "juillet", "août", "septembre", "octobre", "novembre", "décembre",
    ];
    const moisEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const jj = String(d.getDate()).padStart(2, "0");
    const annee = String(d.getFullYear());
    for (const variante of [
      `${jj} ${moisFr[d.getMonth()]} ${annee}`,
      `${jj} ${moisEn[d.getMonth()]} ${annee}`,
      `${jj}/${String(d.getMonth() + 1).padStart(2, "0")}/${annee}`,
    ]) {
      if (plat.includes(normaliser(variante))) {
        datePresente = true;
        break;
      }
    }
  }
  if (!datePresente) {
    manques.push("la date d'émission du devis n'y figure pas");
  }
  /* Tableau de détails : en-tête « Détail » + colonnes du tableau. */
  const tableauDetail =
    plat.includes(normaliser("Détail")) &&
    (plat.includes(normaliser("Description")) || plat.includes(normaliser("Prix unitaire")));
  if (!tableauDetail) {
    manques.push("le tableau de détails du devis n'y figure pas");
  }

  return { valide: manques.length === 0, manques };
}
