"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import type { DocumentRecord } from "@/lib/documents/types";
import { LABELS_DOC } from "@/lib/documents/types";
import { renderDocumentHtml } from "@/lib/documents/document-html";
import { estPropositionV2, type PropositionRecord } from "@/lib/documents/proposition";
import { renderPropositionHtml } from "@/lib/documents/proposition-html";

/**
 * APERÇU EN DIRECT DES DOCUMENTS (VOLET 14 → 19) — le VRAI HTML du
 * PDF, une page A4 à la fois :
 *
 *  - PLEINE HAUTEUR : l'aperçu est calé (sticky) pendant le
 *    défilement du formulaire et remplit TOUT la hauteur de l'espace
 *    dédié (échelle mesurée en continu, ResizeObserver) ; l'espace
 *    sous l'aperçu égale celui au-dessus.
 *  - PAGINATION UNIFIÉE (VOLET 17) : propositions, devis et factures
 *    partagent le MÊME moteur — l'iframe pagine le document et
 *    annonce son nombre de pages (postMessage) ; le panneau pilote
 *    la page affichée (« aller-page »).
 *  - PAGE CONSERVÉE (VOLET 17, demande de l'éditeur) : la mise à
 *    jour EN TEMPS RÉEL ne ramène PLUS à la première page — l'aperçu
 *    reste sur la page en cours de visualisation (bornée au
 *    nombre de pages) ; seul un CHANGEMENT de document repart de la page 1.
 *  - VOLET 19 (26/11/2026) — RÉORGANISATION DEMANDÉE PAR L'ÉDITEUR :
 *    + PIED du panneau : gauche « A4 · Mise à jour en temps réel »
 *      (l'ancien libellé de type « A4 · Proposition Commerciale »
 *      disparaît), DROITE : la NAVIGATION DE PAGE (flèches + compteur)
 *      descendue de l'entête ;
 *    + ENTÊTE du panneau : à la place de la navigation, un BOUTON
 *      PLEIN ÉCRAN (icône « deux flèches obliques opposées »,
 *      Maximize2) — un clic ouvre l'aperçu EN GRAND sur tout
 *      l'écran, comme le document ouvert, EN TEMPS RÉEL (même iframe,
 *      même page, mise à jour en continu), sur ordinateur, tablette
 *      et mobile ; Échap ou le bouton inverse (Minimize2) referme.
 */

/** Dimensions d'une page A4 à 96 dpi. */
const A4_L = 794;
const A4_H = 1123;

export function ApercuDocument({ document }: { document: DocumentRecord | PropositionRecord }) {
  const conteneurRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pageRef = useRef(1);
  const boutonPleinEcranRef = useRef<HTMLButtonElement>(null);
  const boutonQuitterRef = useRef<HTMLButtonElement>(null);
  const [echelle, setEchelle] = useState(0.5);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  /* VOLET 19 — plein écran : l'aperçu occupe tout le viewport. */
  const [pleinEcran, setPleinEcran] = useState(false);

  const estProp = estPropositionV2(document);
  const libelle = estProp
    ? "Proposition Commerciale"
    : LABELS_DOC[(document as DocumentRecord).docType];
  const numero = document.numero;

  /* ---------- Contenu (débounce 350 ms : frappe fluide) ---------- */
  const brut = useMemo(() => {
    if (estProp) return renderPropositionHtml(document);
    return renderDocumentHtml(document as DocumentRecord);
  }, [document]);

  const [contenu, setContenu] = useState(brut);
  useEffect(() => {
    const t = setTimeout(() => setContenu(brut), 350);
    return () => clearTimeout(t);
  }, [brut]);

  /* ---------- Changement de DOCUMENT → retour page 1 ---------- */
  const identite = `${libelle}-${numero}`;
  const identiteRef = useRef(identite);
  useEffect(() => {
    if (identiteRef.current !== identite) {
      identiteRef.current = identite;
      pageRef.current = 1;
      setPage(1);
    }
  }, [identite]);

  /* ---------- Protocole postMessage : pages annoncées ----------
     Toute re-pagination (mise à jour temps réel, polices arrivées)
     ré-annonce « pages » : on CONSERVE la page courante (bornée au
     total) au lieu de revenir à la première. */
  useEffect(() => {
    setTotalPages(1);
    const recevoir = (ev: MessageEvent) => {
      const m = ev.data;
      if (m && m.source === "apercu-document" && m.type === "pages") {
        const n = Math.max(1, Number(m.total) || 1);
        setTotalPages(n);
        pageRef.current = Math.min(pageRef.current, n);
        setPage((p) => Math.min(p, n));
        iframeRef.current?.contentWindow?.postMessage(
          { type: "aller-page", page: pageRef.current },
          "*",
        );
      }
    };
    window.addEventListener("message", recevoir);
    return () => window.removeEventListener("message", recevoir);
  }, [contenu]);

  /* Page demandée par les flèches → l'iframe. */
  useEffect(() => {
    pageRef.current = page;
    iframeRef.current?.contentWindow?.postMessage({ type: "aller-page", page }, "*");
  }, [page, totalPages]);

  /* ---------- Pleine hauteur : échelle sur la taille réelle ---------- */
  useEffect(() => {
    const el = conteneurRef.current;
    if (!el) return;
    const maj = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) {
        /* même respiration au-dessus et au-dessous de l'aperçu */
        const marge = pleinEcran ? 16 : 12;
        setEchelle(Math.max(0.12, Math.min((w - 2 * marge) / A4_L, (h - 2 * marge) / A4_H)));
      }
    };
    maj();
    const ro = new ResizeObserver(maj);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pleinEcran]);

  /* ---------- VOLET 19 — plein écran : Échap + défilement verrouillé ----------
     (NB : `window.document` — la PROP `document` du composant
     masque le global dans cette portée.) */
  useEffect(() => {
    if (!pleinEcran) return;
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setPleinEcran(false);
      }
    };
    window.addEventListener("keydown", surTouche);
    const precedent = window.document.body.style.overflow;
    window.document.body.style.overflow = "hidden";
    boutonQuitterRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", surTouche);
      window.document.body.style.overflow = precedent;
      boutonPleinEcranRef.current?.focus();
    };
  }, [pleinEcran]);

  const feuille: React.CSSProperties = {
    width: `${A4_L}px`,
    height: `${A4_H}px`,
    transform: `scale(${echelle})`,
    transformOrigin: "top left",
    position: "absolute",
    left: `max(12px, calc(50% - ${(A4_L * echelle) / 2}px))`,
    top: `max(12px, calc(50% - ${(A4_H * echelle) / 2}px))`,
    flexShrink: 0,
  };
  const iframe: React.CSSProperties = {
    width: `${A4_L}px`,
    height: `${A4_H}px`,
    border: "none",
    display: "block",
    background: "white",
    overflow: "hidden",
    boxShadow: pleinEcran ? "0 24px 90px rgba(0,0,0,0.55)" : "0 6px 30px rgba(0,0,0,0.4)",
  };

  const total = Math.max(totalPages, 1);
  const pageAffichee = Math.min(page, total);

  /* Navigation de page — VOLET 19 : elle vit désormais dans le PIED
   * du panneau (demande de l'éditeur), en haut comme en plein écran. */
  const navigation = (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={pageAffichee <= 1}
        aria-label="Page précédente"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e4e4e4]/20 text-[#c8c8c8] transition-colors hover:border-[#e4e4e4] hover:text-white disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[64px] text-center font-mono text-[11px] tracking-wider text-[#c8c8c8]">
        {pageAffichee} / {total}
      </span>
      <button
        type="button"
        onClick={() => setPage((p) => Math.min(total, p + 1))}
        disabled={pageAffichee >= total}
        aria-label="Page suivante"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e4e4e4]/20 text-[#c8c8c8] transition-colors hover:border-[#e4e4e4] hover:text-white disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div
      className={
        pleinEcran
          ? "fixed inset-0 z-[100] flex flex-col flex-none bg-[#0f0f0f]"
          : "flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl border border-[#e4e4e4]/12 bg-[#232323]"
      }
      role={pleinEcran ? "dialog" : undefined}
      aria-modal={pleinEcran ? "true" : undefined}
      aria-label={pleinEcran ? `Aperçu plein écran — ${libelle} ${numero}` : undefined}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#e4e4e4]/10 bg-[#1c1c1c] px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.22em] text-[#c8c8c8] uppercase">Aperçu</p>
          <p className="truncate font-display text-sm font-semibold text-white">
            {libelle} {numero}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* VOLET 19 — BOUTON PLEIN ÉCRAN (à la place de la
              navigation de pages, descendue au pied) : icône « deux
              flèches obliques opposées » (Maximize2), le pictogramme
              d'agrandissement des plateformes. Un clic ouvre l'aperçu
              sur TOUT l'écran, en temps réel ; l'icône inverse
              (Minimize2) le referme. */}
          {pleinEcran ? (
            <button
              ref={boutonQuitterRef}
              type="button"
              onClick={() => setPleinEcran(false)}
              aria-label="Quitter le plein écran"
              title="Quitter le plein écran (Échap)"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e4e4e4]/25 bg-[#232323] text-white transition-colors hover:border-[#e4e4e4] hover:bg-[#e4e4e4] hover:text-[#1c1c1c] focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              <Minimize2 className="h-4.5 w-4.5" aria-hidden="true" />
            </button>
          ) : (
            <button
              ref={boutonPleinEcranRef}
              type="button"
              onClick={() => setPleinEcran(true)}
              aria-label="Ouvrir l'aperçu en plein écran"
              title="Ouvrir l'aperçu en plein écran"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e4e4e4]/25 bg-[#232323] text-white transition-colors hover:border-[#e4e4e4] hover:bg-[#e4e4e4] hover:text-[#1c1c1c] focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              <Maximize2 className="h-4.5 w-4.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Zone d'aperçu : la page remplit la hauteur disponible
          (plein écran : tout l'écran, même iframe, temps réel). */}
      <div ref={conteneurRef} className="relative flex-1 overflow-hidden bg-[#141414]">
        <div style={feuille}>
          <iframe
            ref={iframeRef}
            title={`Aperçu du document — ${libelle}`}
            srcDoc={contenu}
            scrolling="no"
            style={iframe}
          />
        </div>
      </div>

      {/* VOLET 19 — PIED du panneau : « A4 · Mise à jour en temps
          réel » à gauche, NAVIGATION DE PAGE à droite (demande de
          l'éditeur : l'ancien texte « Mise à jour en temps réel —
          page conservée » cède la place à la navigation descendue de
          l'entête). */}
      <div className="flex items-center justify-between gap-3 border-t border-[#e4e4e4]/10 bg-[#1c1c1c] px-4 py-2 text-[10px] text-[#c8c8c8]">
        <span className="font-mono tracking-wider uppercase">A4 · Mise à jour en temps réel</span>
        {navigation}
      </div>
    </div>
  );
}
