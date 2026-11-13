"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { SITE } from "@/lib/site";

/**
 * Intégration Calendly — embed officiel (widget.js) affichant les
 * VRAIES disponibilités du calendrier (aucune simulation).
 * Mention obligatoire : « Gratuit, 30 minutes et sans engagement. »
 */

const WIDGET_SRC = "https://assets.calendly.com/assets/external/widget.js";
const CALENDLY_PARAMS =
  "hide_gdpr_banner=1&background_color=1c1c1c&text_color=ffffff&primary_color=e4e4e4";

const CalendlyContext = createContext<{ openCalendly: () => void } | null>(null);

interface CalendlyGlobal {
  Calendly?: {
    initInlineWidget?: (options: { url: string; parentElement: HTMLElement }) => void;
    closePopupWidget?: () => void;
  };
}

/** Embed inline officiel Calendly (widget.js, API documentée). */
export function CalendlyEmbed({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;

    const init = () => {
      if (cancelled || !containerRef.current) return;
      const w = window as unknown as CalendlyGlobal;
      if (!w.Calendly?.initInlineWidget) return;
      containerRef.current.innerHTML = "";
      w.Calendly.initInlineWidget({
        url: `${SITE.calendly}?${CALENDLY_PARAMS}`,
        parentElement: containerRef.current,
      });
    };

    const w = window as unknown as CalendlyGlobal;
    let script = document.querySelector<HTMLScriptElement>(`script[src="${WIDGET_SRC}"]`);

    if (w.Calendly?.initInlineWidget || script?.dataset.loaded === "true") {
      // Widget déjà chargé : initialisation immédiate
      init();
      return () => {
        cancelled = true;
        container.innerHTML = "";
      };
    }

    if (!script) {
      script = document.createElement("script");
      script.src = WIDGET_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
    const onLoad = () => {
      if (script) script.dataset.loaded = "true";
      init();
    };
    script.addEventListener("load", onLoad);
    // Filet de sécurité : si le script était déjà chargé entre-temps
    const t = window.setTimeout(() => {
      if ((window as unknown as CalendlyGlobal).Calendly?.initInlineWidget) init();
    }, 600);

    return () => {
      cancelled = true;
      script?.removeEventListener("load", onLoad);
      window.clearTimeout(t);
      container.innerHTML = "";
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`calendly-inline-mount ${className}`}
      data-url={`${SITE.calendly}?${CALENDLY_PARAMS}`}
      style={{ minWidth: "280px", width: "100%", height: "100%" }}
      role="region"
      aria-label="Calendly — Réservation d'un appel de 30 minutes avec Stevens Akpovi"
    />
  );
}

export function CalendlyProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const openCalendly = useCallback(() => setOpen(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Bloque le défilement du corps quand le popup est ouvert
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <CalendlyContext.Provider value={{ openCalendly }}>
      {children}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Réserver un appel de 30 minutes avec Stevens Akpovi"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#070707]/85 p-3 backdrop-blur-sm sm:p-8"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="relative flex h-full max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#e4e4e4]/15 bg-[#1c1c1c] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#e4e4e4]/10 px-5 py-4 sm:px-7">
              <div>
                <p className="text-eyebrow">Appel découverte</p>
                <h2 className="text-card-title mt-1 text-white">Réservez votre créneau</h2>
                <p className="mt-1 text-sm text-[#c8c8c8]">
                  {SITE.calendlyMention} Les disponibilités affichées sont les vraies
                  disponibilités de Calendly.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer la fenêtre de réservation"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e4e4e4] bg-white text-[#1c1c1c] transition-[transform,border-color] duration-300 hover:scale-105 hover:border-[#c9baac] focus-visible:scale-105"
              >
                <X className="h-4.5 w-4.5" aria-hidden="true" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <CalendlyEmbed className="!h-[680px] sm:!h-[720px]" />
            </div>
          </div>
        </div>
      )}
    </CalendlyContext.Provider>
  );
}

export function useCalendly() {
  const ctx = useContext(CalendlyContext);
  if (!ctx) throw new Error("useCalendly doit être utilisé dans CalendlyProvider");
  return ctx;
}
