"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, X } from "lucide-react";
import type { DocumentRecord } from "@/lib/documents/types";

/**
 * VISIONNEUSE DU DEVIS SIGNÉ — VOLET 21 (27/11/2026).
 *
 * Demande de l'éditeur : les DEUX versions d'un devis restent
 * VISUALISABLES — la version générée (bouton « œil » de la liste :
 * aperçu HTML paginé) ET la version SIGNÉE téléversée (PDF). Le
 * bouton « devis signé » de la liste ne TÉLÉCHARGE plus : il OUVRE
 * ce panneau plein écran qui affiche le PDF signé (dépôt privé →
 * blob local) ; le TÉLÉCHARGEMENT vit DANS l'aperçu (bouton dédié).
 * Échap ou la croix referment.
 */
export function ApercuDevisSigne({
  document,
  onFermer,
}: {
  /** Devis portant un PDF signé téléversé (devisSigne). */
  document: DocumentRecord;
  onFermer: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  /* Chargement du PDF signé (API → blob local). (NB : la PROP
   * `document` masque le global — `window.document` ci-dessous.) */
  useEffect(() => {
    let objet: string | null = null;
    let annule = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/documents/${encodeURIComponent(document.id)}/signature`,
        );
        /* Le corps d'une réponse ne se lit qu'UNE fois : JSON si
           erreur, blob sinon. */
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? "Téléchargement impossible.");
        }
        const blob = await res.blob();
        if (annule) return;
        objet = URL.createObjectURL(blob);
        setUrl(objet);
      } catch (e) {
        if (!annule) {
          setErreur(e instanceof Error ? e.message : "Téléchargement impossible.");
        }
      }
    })();
    return () => {
      annule = true;
      if (objet) URL.revokeObjectURL(objet);
    };
  }, [document.id]);

  /* Échap referme + défilement de la page verrouillé (cohérent avec
   * l'aperçu plein écran des documents). */
  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onFermer();
      }
    };
    window.addEventListener("keydown", surTouche);
    const precedent = window.document.body.style.overflow;
    window.document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", surTouche);
      window.document.body.style.overflow = precedent;
    };
  }, [onFermer]);

  const nomFichier =
    document.devisSigne?.nomFichier?.replace(/[^\w.\-]+/g, "_") ??
    `${document.numero}-signe.pdf`;

  function telecharger() {
    if (!url) return;
    const a = window.document.createElement("a");
    a.href = url;
    a.download = nomFichier;
    window.document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-[#0f0f0f]"
      role="dialog"
      aria-modal="true"
      aria-label={`Devis signé — ${document.numero}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#e4e4e4]/10 bg-[#1c1c1c] px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.22em] text-[#c8c8c8] uppercase">
            Devis signé
          </p>
          <p className="truncate font-display text-sm font-semibold text-white">
            {document.numero} — {document.devisSigne?.nomFichier ?? "PDF signé"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* VOLET 21 — le TÉLÉCHARGEMENT vit DANS l'aperçu (le
              bouton de la liste ne fait qu'ouvrir la visionneuse). */}
          <button
            type="button"
            onClick={telecharger}
            disabled={!url}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[#e4e4e4]/25 bg-[#232323] px-4 py-2 text-xs font-medium text-white transition-colors hover:border-[#e4e4e4] disabled:opacity-50"
            aria-label="Télécharger le devis signé"
            title="Télécharger le devis signé"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Télécharger
          </button>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer l'aperçu du devis signé"
            title="Fermer (Échap)"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e4e4e4]/25 bg-[#232323] text-white transition-colors hover:border-[#e4e4e4] hover:bg-[#e4e4e4] hover:text-[#1c1c1c] focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            <X className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="relative flex-1 bg-[#141414]">
        {erreur ? (
          <div className="flex h-full items-center justify-center p-6">
            <p className="max-w-md text-center text-sm leading-relaxed text-[#c8c8c8]">
              {erreur}
            </p>
          </div>
        ) : url ? (
          <iframe
            src={url}
            title={`Devis signé — ${document.numero}`}
            className="h-full w-full border-none bg-white"
          />
        ) : (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-[#c8c8c8]">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            Chargement du devis signé…
          </div>
        )}
      </div>
    </div>
  );
}
