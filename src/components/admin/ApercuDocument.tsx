"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DocumentRecord } from "@/lib/documents/types";
import { LABELS_DOC } from "@/lib/documents/types";
import { renderDocumentHtml } from "@/lib/documents/document-html";
import { estPropositionV2, type PropositionRecord } from "@/lib/documents/proposition";
import { renderPropositionHtml } from "@/lib/documents/proposition-html";

/**
 * APERÇU EN DIRECT DES DOCUMENTS (VOLET 14 → 16) — le VRAI HTML du
 * PDF, une page A4 à la fois :
 *
 *  - PLEINE HAUTEUR (VOLET 16, demande de l'éditeur) : l'aperçu est
 *    calé (sticky) pendant le défilement du formulaire et remplit
 *    TOUT la hauteur de l'espace qui lui est dédié — l'échelle se
 *    calcule sur la TAILLE RÉELLE du panneau (mesure continue,
 *    ResizeObserver) et s'adapte à tous les écrans ; l'espace laissé
 *    sous l'aperçu est identique à celui au-dessus.
 *  - PROPOSITION COMMERCIALE (VOLET 16) : rendu paginé par le script
 *    du document (renderPropositionHtml) — l'iframe annonce son
 *    nombre de pages (postMessage) et le panneau pilote la page
 *    affichée (« aller-page »).
 *  - DEVIS / FACTURES : pages explicites du gabarit historique,
 *    découpage sur le marqueur « PAGE 2 ».
 */

/** Dimensions d'une page A4 à 96 dpi. */
const A4_L = 794;
const A4_H = 1123;

export function ApercuDocument({ document }: { document: DocumentRecord | PropositionRecord }) {
  const conteneurRef = useRef<HTMLDivElement>(null);
  const iframePropRef = useRef<HTMLIFrameElement>(null);
  const pageRef = useRef(1);
  const [echelle, setEchelle] = useState(0.5);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const estProp = estPropositionV2(document);

  /* ---------- Contenu : proposition paginée OU gabarit historique ----------
     (débounce 350 ms : la saisie au clavier ne recharge pas l'iframe
     à chaque frappe — polices + pagination restent fluides) ---------- */
  const brut = useMemo(() => {
    if (estProp) {
      return { page1Html: "", page2Html: "", propHtml: renderPropositionHtml(document) };
    }
    const complet = renderDocumentHtml(document as DocumentRecord);
    const headMatch = complet.match(/<head>[\s\S]*?<\/head>/);
    const head = headMatch ? headMatch[0] : "";
    const marqueur = "<!-- ============ PAGE 2 ============ -->";
    const parties = complet.split(marqueur);
    const corps1 = parties[0].match(/<body>([\s\S]*)$/);
    const p1 = `<!DOCTYPE html><html lang="fr">${head}<body>${corps1 ? corps1[1] : parties[0]}</body></html>`;
    const corps2 = (parties[1] || "").replace(/<\/body>\s*<\/html>\s*$/, "");
    const p2 = corps2 ? `<!DOCTYPE html><html lang="fr">${head}<body>${corps2}</body></html>` : "";
    return { page1Html: p1, page2Html: p2, propHtml: "" };
  }, [document]);

  const [contenu, setContenu] = useState(brut);
  useEffect(() => {
    const t = setTimeout(() => setContenu(brut), 350);
    return () => clearTimeout(t);
  }, [brut]);
  const { page1Html, page2Html, propHtml } = contenu;

  /* Total de pages (gabarit historique : 1 ou 2 pages connues). */
  useEffect(() => {
    if (estProp) return;
    setPage(1);
    setTotalPages(page2Html ? 2 : 1);
  }, [estProp, page2Html]);

  /* ---------- Proposition : protocole postMessage avec l'iframe ----------
     Une re-pagination (polices arrivées en retard) ré-annonce « pages » :
     on conserve la PAGE COURANTE au lieu de revenir à la première. */
  useEffect(() => {
    if (!estProp) return;
    setPage(1);
    pageRef.current = 1;
    setTotalPages(0);
    const recevoir = (ev: MessageEvent) => {
      const m = ev.data;
      if (m && m.source === "apercu-document" && m.type === "pages") {
        const n = Number(m.total) || 1;
        setTotalPages(n);
        iframePropRef.current?.contentWindow?.postMessage(
          { type: "aller-page", page: Math.min(pageRef.current, n) },
          "*",
        );
      }
    };
    window.addEventListener("message", recevoir);
    return () => window.removeEventListener("message", recevoir);
  }, [estProp, propHtml]);

  /* Page demandée → l'iframe de la proposition. */
  useEffect(() => {
    if (!estProp || !totalPages) return;
    pageRef.current = page;
    iframePropRef.current?.contentWindow?.postMessage({ type: "aller-page", page }, "*");
  }, [estProp, page, totalPages]);

  /* ---------- Pleine hauteur : échelle sur la taille RÉELLE du panneau ---------- */
  useEffect(() => {
    const el = conteneurRef.current;
    if (!el) return;
    const maj = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) {
        /* même respiration au-dessus et au-dessous de l'aperçu */
        const marge = 12;
        setEchelle(Math.max(0.12, Math.min((w - 2 * marge) / A4_L, (h - 2 * marge) / A4_H)));
      }
    };
    maj();
    const ro = new ResizeObserver(maj);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
    boxShadow: "0 6px 30px rgba(0,0,0,0.4)",
  };

  const libelle = estProp
    ? "Proposition Commerciale"
    : LABELS_DOC[(document as DocumentRecord).docType];
  const numero = document.numero;
  const total = estProp ? totalPages || 1 : page2Html ? 2 : 1;
  const pageAffichee = Math.min(page, total);

  return (
    <div className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl border border-[#e4e4e4]/12 bg-[#232323]">
      <div className="flex items-center justify-between gap-3 border-b border-[#e4e4e4]/10 bg-[#1c1c1c] px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.22em] text-[#c8c8c8] uppercase">Aperçu</p>
          <p className="truncate font-display text-sm font-semibold text-white">
            {libelle} {numero}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
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
      </div>

      {/* Zone d'aperçu : la page remplît la hauteur disponible */}
      <div ref={conteneurRef} className="relative flex-1 overflow-hidden bg-[#141414]">
        {estProp ? (
          <div style={feuille}>
            <iframe
              ref={iframePropRef}
              title="Aperçu de la proposition commerciale"
              srcDoc={propHtml}
              scrolling="no"
              style={iframe}
            />
          </div>
        ) : (
          <div style={feuille}>
            <iframe
              key={`p1-${page}`}
              title="Aperçu du document — page 1"
              srcDoc={pageAffichee === 1 ? page1Html : page2Html}
              scrolling="no"
              style={iframe}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-[#e4e4e4]/10 bg-[#1c1c1c] px-4 py-2.5 text-[10px] text-[#c8c8c8]">
        <span className="font-mono tracking-wider uppercase">A4 · {libelle}</span>
        <span>Mise à jour en temps réel</span>
      </div>
    </div>
  );
}
