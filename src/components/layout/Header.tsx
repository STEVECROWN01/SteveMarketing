"use client";

import React, { useEffect, useState } from "react";
import { Menu, X, CalendarCheck } from "lucide-react";
import { useRouter } from "@/components/router-context";
import { useCalendly } from "@/components/calendly/CalendlyContext";
import { NAV_ITEMS } from "@/lib/site";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const NAV_PAGES: Record<string, string> = {
  accueil: "accueil",
  services: "services",
  realisations: "realisations",
  aPropos: "a-propos",
  contact: "contact",
};

export function Header() {
  const router = useRouter();
  const calendly = useCalendly();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Bloque le défilement quand le menu mobile est ouvert
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const isActive = (key: string) => router.page === key;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled || menuOpen
          ? "border-b border-[#e4e4e4]/10 bg-[#1c1c1c]/92 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <a
        href="#contenu-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-[#c9baac] focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-[#1c1c1c]"
      >
        Aller au contenu principal
      </a>
      <div className="container-site flex h-[76px] items-center justify-between gap-6 lg:h-[84px]">
        {/* Marque */}
        <a
          href="#/accueil"
          onClick={(e) => {
            e.preventDefault();
            setMenuOpen(false);
            router.navigate("accueil");
          }}
          className="group flex items-baseline gap-1.5"
          aria-label="Stevens Akpovi — retour à l'accueil"
        >
          <span className="font-display text-lg font-semibold tracking-tight text-white sm:text-xl">
            Stevens Akpovi
          </span>
          <span
            className="hidden h-2 w-2 rounded-full bg-[#c9baac] transition-transform duration-300 group-hover:scale-125 sm:block"
            aria-hidden="true"
          />
        </a>

        {/* Navigation bureau */}
        <nav aria-label="Navigation principale" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <a
                  href={`#/${NAV_PAGES[item.key]}`}
                  onClick={(e) => {
                    e.preventDefault();
                    router.navigate(item.key as never);
                  }}
                  aria-current={isActive(item.key) ? "page" : undefined}
                  className={`relative rounded-full px-4 py-2 text-sm transition-colors duration-300 ${
                    isActive(item.key)
                      ? "text-white"
                      : "text-[#c8c8c8] hover:text-white"
                  }`}
                >
                  {item.label}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-4 -bottom-0.5 h-px bg-[#c9baac] transition-transform duration-300 ${
                      isActive(item.key) ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* CTA + menu mobile */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => calendly.openCalendly()}
            className="btn-fill hidden min-h-[44px] items-center gap-2 rounded-full bg-[#c9baac] px-5 py-2.5 text-sm font-medium text-[#1c1c1c] transition-transform duration-300 hover:-translate-y-0.5 sm:inline-flex [&::before]:bg-[#e4e4e4]"
          >
            <span className="inline-flex items-center gap-2">
              <CalendarCheck className="h-4 w-4" aria-hidden="true" />
              Réserver un appel
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="menu-mobile"
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e4e4e4]/25 text-white transition-colors hover:border-[#c9baac] lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="menu-mobile"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="border-t border-[#e4e4e4]/10 bg-[#1c1c1c]/98 backdrop-blur-md lg:hidden"
          >
            <nav aria-label="Navigation principale mobile" className="container-site py-6">
              <ul className="flex flex-col gap-1">
                {NAV_ITEMS.map((item, i) => (
                  <motion.li
                    key={item.key}
                    initial={reduce ? undefined : { opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * i, duration: 0.3 }}
                  >
                    <a
                      href={`#/${NAV_PAGES[item.key]}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setMenuOpen(false);
                        router.navigate(item.key as never);
                      }}
                      aria-current={isActive(item.key) ? "page" : undefined}
                      className={`flex min-h-[52px] items-center justify-between rounded-xl px-4 py-3 font-display text-lg font-medium transition-colors ${
                        isActive(item.key)
                          ? "bg-[#232323] text-white"
                          : "text-[#c8c8c8] hover:bg-[#232323]/60 hover:text-white"
                      }`}
                    >
                      {item.label}
                      <span
                        aria-hidden="true"
                        className={`h-1.5 w-1.5 rounded-full ${
                          isActive(item.key) ? "bg-[#c9baac]" : "bg-[#3c3c3c]"
                        }`}
                      />
                    </a>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-5 flex flex-col gap-3 border-t border-[#e4e4e4]/10 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    calendly.openCalendly();
                  }}
                  className="btn-fill flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#c9baac] px-6 py-3.5 font-medium text-[#1c1c1c] [&::before]:bg-[#e4e4e4]"
                >
                  <span className="inline-flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                    Réserver un appel stratégique
                  </span>
                </button>
                <p className="text-center text-xs text-[#c8c8c8]">
                  30 minutes · Gratuit · Sans engagement · À distance
                </p>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
