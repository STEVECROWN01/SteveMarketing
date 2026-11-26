"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X, ZoomIn, ZoomOut } from "lucide-react";
import type { DocumentRecord } from "@/lib/documents/types";
import { LABELS_DOC } from "@/lib/documents/types";
import { renderDocumentHtml } from "@/lib/documents/document-html";
import { estPropositionV2, type PropositionRecord } from "@/lib/documents/proposition";
import { renderPropositionHtml } from "@/lib/documents/proposition-html";

/**
 * APERÇU EN DIRECT DES DOCUMENTS (VOLET 14 → 20) — le VRAI HTML du
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
 *  - PAGE CONSERVÉE (VOLET 17) : la mise à jour EN TEMPS RÉEL ne
 *    ramène PLUS à la première page.
 *  - PLEIN ÉCRAN (VOLET 19) : bouton « deux flèches obliques opposées »
 *    (Maximize2) — l'aperçu occupe tout l'écran, EN TEMPS RÉEL, sur
 *    ordinateur, tablette et mobile ; Échap ou Minimize2 referme.
 *  - VOLET 20 (26/11/2026) — ZOOM DU DOCUMENT (demande de l'éditeur) :
 *    SUR TOUS LES APERÇUS PLEIN ÉCRAN, à GAUCHE du bouton plein écran,
 *    un groupe LOUPE « − / % / + » ajuste l'échelle du document par
 *    PALIERS DE POURCENTAGE : 50 %, 75 %, 100 % (taille normale),
 *    125 %, 150 %. À 100 % l'aperçu s'ajuste pour tenir dans l'écran ;
 *    au-delà, la zone défile ; en dessous, le document se réduit,
 *    toujours centré.
 *  - VOLET 20 — OUVERTURE DEPUIS LES LISTES : prop `initialPleinEcran`
 *    + `onFermer` — le bouton « œil » d'une liste affiche DIRECTEMENT
 *    le PANNEAU d'aperçu en plein écran (plus de modale intermédiaire
 *    avec le nom du client) ; la croix ou Échap referment l'aperçu.
 */

/** Dimensions d'une page A4 à 96 dpi. */
const A4_L = 794;
const A4_H = 1123;

/** VOLET 20 — paliers de zoom (pourcentages), 100 % = taille normale.
 *  VOLET 21 (27/11/2026) — paliers ÉTENDUS au-delà de 200 %
 *  (demande de l'éditeur) : jusqu'à 300 %. */
const PALIERS_ZOOM = [50, 75, 100, 125, 150, 175, 200, 250, 300];

export function ApercuDocument({
  document,
  initialPleinEcran = false,
  onFermer,
}: {
  document: DocumentRecord | PropositionRecord;
  /** Ouvrir DIRECTEMENT en plein écran (bouton « œil » des listes). */
  initialPleinEcran?: boolean;
  /** Présent = aperçu plein écran AUTONOME (croix + Échap referment
   *  TOUT l'aperçu) — utilisé par les listes de documents. */
  onFermer?: () => void;
}) {
  const conteneurRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pageRef = useRef(1);
  const boutonPleinEcranRef = useRef<HTMLButtonElement>(null);
  const boutonQuitterRef = useRef<HTMLButtonElement>(null);
  const [echelle, setEchelle] = useState(0.5);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  /* VOLET 19 — plein écran : l'aperçu occupe tout le viewport.
   * VOLET 20 — `initialPleinEcran` : ouvert d'emblée en plein écran
   * (bouton « œIL » des listes : le panneau s'affiche directement,
   * sans modale). */
  const [pleinEcran, setPleinEcran] = useState(initialPleinEcran);
  /* VOLET 20 — zoom du document (plein écran) : indice dans PALIERS_ZOOM. */
  const [zoomIndex, setZoomIndex] = useState(() => PALIERS_ZOOM.indexOf(100));
  const zoom = PALIERS_ZOOM[zoomIndex] ?? 100;

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

  /* ---------- Changement de DOCUMENT → retour page 1 et zoom 100 % ---------- */
  const identite = `${libelle}-${numero}`;
  const identiteRef = useRef(identite);
  useEffect(() => {
    if (identiteRef.current !== identite) {
      identiteRef.current = identite;
      pageRef.current = 1;
      setPage(1);
      /* VOLET 20 — le zoom revient à 100 % quand on change de document. */
      setZoomIndex(PALIERS_ZOOM.indexOf(100));
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

  /* ---------- Plein écran : Échap + défilement verrouillé ----------
     VOLET 20 — en mode AUTONOME (onFermer fourni, ouvert par le
     bouton « œIL » d'une liste), Échap referme TOUT l'aperçu ;
     sinon Échap quitte simplement le plein écran (retour au panneau).
     (NB : `window.document` — la PROP `document` du composant
     masque le global dans cette portée.) */
  useEffect(() => {
    if (!pleinEcran) return;
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (onFermer) onFermer();
        else setPleinEcran(false);
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
  }, [pleinEcran, onFermer]);

  /* ---------- VOLET 20 — échelle effective : ajustée × zoom ---------- */
  const echelleEffective = echelle * (zoom / 100);
  /* Au-delà de 100 %, le document dépasse la zone : la zone DÉFILE
   * (plus de centrage absolu) ; à 100 % ou moins, il reste centré. */
  const depasse = echelleEffective > echelle + 0.0001;

  const feuille: React.CSSProperties = {
    width: `${A4_L}px`,
    height: `${A4_H}px`,
    transform: `scale(${echelleEffective})`,
    transformOrigin: "top left",
    position: "absolute",
    left: `max(12px, calc(50% - ${(A4_L * echelleEffective) / 2}px))`,
    top: `max(12px, calc(50% - ${(A4_H * echelleEffective) / 2}px))`,
    flexShrink: 0,
  };
  /* Variante « document agrandi » : ancré en haut à gauche dans une
   * boîte à la taille du document agrandi — la zone d'aperçu défile
   * naturellement dans les deux directions. */
  const feuilleAgrandie: React.CSSProperties = {
    width: `${A4_L}px`,
    height: `${A4_H}px`,
    transform: `scale(${echelleEffective})`,
    transformOrigin: "top left",
    position: "absolute",
    left: "16px",
    top: "16px",
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

  /* Navigation de page — vit dans le PIED du panneau, en haut comme
   * en plein écran. */
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
          {/* VOLET 20 — ZOOM DU DOCUMENT (plein écran uniquement, à
              GAUCHE du bouton plein écran — demande de l'éditeur) :
              groupe « − / % / + ». VOLET 21 : l'icône LOUPE (non
              cliquable, purement décorative) est SUPPRIMÉE ; paliers
              étendus 50 → 300 %. 100 % = taille d'aperçu normale
              (ajustée à l'écran) ; en dessous le document se réduit ;
              au-dessus il s'agrandit et la zone défile. */}
          {pleinEcran ? (
            <div
              className="flex items-center gap-1 rounded-full border border-[#e4e4e4]/25 bg-[#232323] px-2 py-1"
              role="group"
              aria-label="Zoom de l'aperçu"
            >
              <button
                type="button"
                onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
                disabled={zoomIndex <= 0}
                aria-label="Dézoomer le document"
                title="Dézoomer"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-[#e4e4e4]/15 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ZoomOut className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="min-w-[46px] text-center font-mono text-[11px] tracking-wider text-white" aria-live="polite">
                {zoom}&nbsp;%
              </span>
              <button
                type="button"
                onClick={() => setZoomIndex((i) => Math.min(PALIERS_ZOOM.length - 1, i + 1))}
                disabled={zoomIndex >= PALIERS_ZOOM.length - 1}
                aria-label="Zoomer le document"
                title="Zoomer"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-[#e4e4e4]/15 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ZoomIn className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : null}

          {/* Bouton plein écran — en mode AUTONOME (ouvert depuis une
              liste), une CROIX referme l'aperçu ; sinon Minimize2
              ramène au panneau intégré au formulaire. */}
          {pleinEcran ? (
            onFermer ? (
              <button
                ref={boutonQuitterRef}
                type="button"
                onClick={onFermer}
                aria-label="Fermer l'aperçu"
                title="Fermer l'aperçu (Échap)"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e4e4e4]/25 bg-[#232323] text-white transition-colors hover:border-[#e4e4e4] hover:bg-[#e4e4e4] hover:text-[#1c1c1c] focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                <X className="h-4.5 w-4.5" aria-hidden="true" />
              </button>
            ) : (
              <button
                ref={boutonQuitterRef}
                type="button"
                onClick={() => {
                  setPleinEcran(false);
                  setZoomIndex(PALIERS_ZOOM.indexOf(100));
                }}
                aria-label="Quitter le plein écran"
                title="Quitter le plein écran (Échap)"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e4e4e4]/25 bg-[#232323] text-white transition-colors hover:border-[#e4e4e4] hover:bg-[#e4e4e4] hover:text-[#1c1c1c] focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                <Minimize2 className="h-4.5 w-4.5" aria-hidden="true" />
              </button>
            )
          ) : (
            <button
              ref={boutonPleinEcranRef}
              type="button"
              onClick={() => {
                setPleinEcran(true);
                setZoomIndex(PALIERS_ZOOM.indexOf(100));
              }}
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
          (plein écran : tout l'écran, même iframe, temps réel).
          VOLET 20 — au-delà de 100 % de zoom, la zone DÉFILE
          (document agrandi). VOLET 21 : le document agrandi qui
          TIENT ENCORE en largeur reste CENTRÉ horizontalement (marge
          auto) — il ne se colle plus à gauche ; trop grand, il
          s'ancre à gauche et la zone défile (comportement inchangé). */}
      <div
        ref={conteneurRef}
        className={`relative flex-1 bg-[#141414] ${depasse ? "overflow-auto" : "overflow-hidden"}`}
      >
        {depasse ? (
          <div
            style={{
              width: `${Math.round(A4_L * echelleEffective) + 32}px`,
              height: `${Math.round(A4_H * echelleEffective) + 32}px`,
              position: "relative",
              margin: "0 auto",
            }}
          >
            <div style={feuilleAgrandie}>
              <iframe
                ref={iframeRef}
                title={`Aperçu du document — ${libelle}`}
                srcDoc={contenu}
                scrolling="no"
                style={iframe}
              />
            </div>
          </div>
        ) : (
          <div style={feuille}>
            <iframe
              ref={iframeRef}
              title={`Aperçu du document — ${libelle}`}
              srcDoc={contenu}
              scrolling="no"
              style={iframe}
            />
          </div>
        )}
      </div>

      {/* PIED du panneau : « A4 · Mise à jour en temps réel » à
          gauche, NAVIGATION DE PAGE à droite. */}
      <div className="flex items-center justify-between gap-3 border-t border-[#e4e4e4]/10 bg-[#1c1c1c] px-4 py-2 text-[10px] text-[#c8c8c8]">
        <span className="font-mono tracking-wider uppercase">A4 · Mise à jour en temps réel</span>
        {navigation}
      </div>
    </div>
  );
}
