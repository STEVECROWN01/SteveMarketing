"use client";

import { useMemo, useState, useEffect } from "react";
import type { DocumentRecord } from "@/lib/documents/types";
import { renderDocumentHtml } from "@/lib/documents/document-html";
import { LABELS_DOC } from "@/lib/documents/types";

/**
 * Aperçu en direct du document (VOLET 14) — copie du LivePreview de
 * K.Quotes : le VRAI HTML du PDF, découpé en pages A4 séparées
 * (une par iframe srcDoc, style et ombres de feuille), mise à
 * l'échelle responsive (0,40 mobile / 0,55 tablette / 0,62 bureau —
 * le panneau du back-office est plus étroit que celui de K.Quotes).
 */
export function ApercuDocument({ document }: { document: DocumentRecord }) {
  const { page1Html, page2Html } = useMemo(() => {
    const complet = renderDocumentHtml(document);
    const headMatch = complet.match(/<head>[\s\S]*?<\/head>/);
    const head = headMatch ? headMatch[0] : "";
    const marqueur = "<!-- ============ PAGE 2 ============ -->";
    const parties = complet.split(marqueur);
    const corps1 = parties[0].match(/<body>([\s\S]*)$/);
    const p1 = `<!DOCTYPE html><html lang="fr">${head}<body>${corps1 ? corps1[1] : parties[0]}</body></html>`;
    const corps2 = (parties[1] || "").replace(/<\/body>\s*<\/html>\s*$/, "");
    const p2 = corps2
      ? `<!DOCTYPE html><html lang="fr">${head}<body>${corps2}</body></html>`
      : "";
    return { page1Html: p1, page2Html: p2 };
  }, [document]);

  const [scale, setScale] = useState(0.62);
  useEffect(() => {
    const maj = () => {
      const w = window.innerWidth;
      if (w < 640) setScale(0.4);
      else if (w < 1024) setScale(0.55);
      else setScale(0.62);
    };
    maj();
    window.addEventListener("resize", maj);
    return () => window.removeEventListener("resize", maj);
  }, []);

  const margeBas = `-${297 * (1 - scale)}mm`;
  const feuille: React.CSSProperties = {
    transform: `scale(${scale})`,
    transformOrigin: "top center",
    width: "210mm",
    height: "297mm",
    marginBottom: margeBas,
    flexShrink: 0,
  };
  const iframe: React.CSSProperties = {
    width: "210mm",
    height: "297mm",
    border: "none",
    display: "block",
    background: "white",
    overflow: "hidden",
    boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
  };

  const nbPages = document.docType === "facture" || !page2Html ? 1 : 2;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#e4e4e4]/12 bg-[#232323]">
      <div className="flex items-center justify-between border-b border-[#e4e4e4]/10 bg-[#1c1c1c] px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.22em] text-[#c8c8c8] uppercase">Aperçu</p>
          <p className="mt-0.5 font-display text-sm font-semibold text-white">
            {LABELS_DOC[document.docType]} {document.numero}
          </p>
        </div>
        <div className="font-mono text-[10px] tracking-wider text-[#c8c8c8] uppercase">
          A4 · {nbPages} page{nbPages > 1 ? "s" : ""}
        </div>
      </div>
      <div className="scroll-slim flex-1 overflow-auto bg-[#141414] p-3 md:p-6">
        <div className="flex flex-col items-center gap-2">
          <div style={feuille}>
            <iframe title="Aperçu du document — page 1" srcDoc={page1Html} scrolling="no" style={iframe} />
          </div>
          {nbPages === 2 && (
            <div style={feuille}>
              <iframe title="Aperçu du document — page 2" srcDoc={page2Html} scrolling="no" style={iframe} />
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-[#e4e4e4]/10 bg-[#1c1c1c] px-4 py-2.5 text-[10px] text-[#c8c8c8]">
        <span className="font-mono tracking-wider uppercase">{LABELS_DOC[document.docType]}</span>
        <span>Mise à jour en temps réel</span>
      </div>
    </div>
  );
}
