"use client";

import React, { useEffect, useState } from "react";
import { X, CalendarCheck, ArrowUpRight, Linkedin, Mail, MessageCircle } from "lucide-react";
import { useRouter } from "@/components/router-context";
import { useCalendly } from "@/components/calendly/CalendlyContext";
import { NAV_ITEMS, SITE } from "@/lib/site";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const NAV_PAGES: Record<string, string> = {
  accueil: "accueil",
  services: "services",
  realisations: "realisations",
  aPropos: "a-propos",
  contact: "contact",
};

/**
 * EN-TÊTE — présentation calquée sur le header de sheragency.com :
 * trois blocs sombres #1c1c1c posés sur un bandeau transparent :
 * 1. pastille logo à gauche, collée au bord haut, coins arrondis
 *    en bas uniquement (tab 94×98 sur bureau) ;
 * 2. pilule de navigation centrale (85px, arrondie 9px) : liens
 *    blancs 16px + soulignement qui s'étend depuis le centre au
 *    survol, bouton blanc « Démarrer un projet » à droite (pastille
 *    flèche ↗ de 28px) ;
 * 3. pastille hamburger à droite, collée au bord haut — ouvre le
 *    menu plein écran (liens XL + CTA), comme la référence.
 * Le bandeau reste fixe : les pastilles étant opaques, la présentation
 * est identique sur tous les fonds.
 */
export function Header() {
  const router = useRouter();
  const calendly = useCalendly();
  const [menuOpen, setMenuOpen] = useState(false);
  const reduce = useReducedMotion();

  // Bloque le défilement quand le menu plein écran est ouvert
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Fermeture au clavier (Échap) et lors d'une navigation par fragment
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const onHash = () => setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("hashchange", onHash);
    };
  }, [menuOpen]);

  const isActive = (key: string) => router.page === key;

  /** « Démarrer un projet » → formulaire de demande de projet (devis). */
  const startProject = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setMenuOpen(false);
    router.navigate("contact", "devis");
  };

  const openCalendly = () => {
    setMenuOpen(false);
    calendly.openCalendly();
  };

  const goPage = (e: React.MouseEvent, key: string) => {
    e.preventDefault();
    setMenuOpen(false);
    router.navigate(key as never);
  };

  /** Bouton blanc « Démarrer un projet » — pastille flèche ↗ (style sher). */
  const StartProjectButton = ({ className = "" }: { className?: string }) => (
    <button
      type="button"
      onClick={startProject}
      aria-label="Démarrer un projet — formulaire de demande de projet"
      className={`group/cta inline-flex min-h-[52px] items-center gap-3 rounded-full bg-white py-2 pl-6 pr-1.5 transition-colors duration-300 hover:bg-[#efefef] focus-visible:outline-2 focus-visible:outline-offset-4 ${className}`}
    >
      <span className="text-[15px] font-medium tracking-[0.01em] text-[#1c1c1c]">
        Démarrer un projet
      </span>
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e4e4e4] transition-colors duration-300 group-hover/cta:bg-[#1c1c1c]">
        <ArrowUpRight
          className="h-3.5 w-3.5 text-[#1c1c1c] transition-colors duration-300 group-hover/cta:text-white"
          aria-hidden="true"
        />
      </span>
    </button>
  );

  /** Icône hamburger à deux lignes inégales (style sher) / croix si ouvert. */
  const BurgerIcon = menuOpen ? (
    <X className="h-5 w-5 text-white" aria-hidden="true" />
  ) : (
    <span className="flex w-6 flex-col gap-[5px]" aria-hidden="true">
      <span className="block h-[2px] w-full bg-white" />
      <span className="block h-[2px] w-4 bg-white" />
    </span>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <a
        href="#contenu-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-[#c9baac] focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-[#1c1c1c]"
      >
        Aller au contenu principal
      </a>

      <div className="mx-auto flex w-full max-w-[1400px] items-start justify-between px-5 sm:px-8 lg:px-10">
        {/* ---------- 1. Pastille logo — collée en haut, coins bas arrondis ---------- */}
        <a
          href="#/accueil"
          onClick={(e) => goPage(e, "accueil")}
          aria-label="Stevens Akpovi — retour à l'accueil"
          className="flex h-14 w-12 items-center justify-center rounded-b-lg bg-[#1c1c1c] transition-colors duration-300 hover:bg-[#232323] lg:h-[98px] lg:w-[94px] lg:rounded-b-[9px]"
        >
          {/* Logo officiel (version blanche, fond transparent) */}
          <img
            src="/assets/logo-blanc.png"
            alt="Stevens Akpovi"
            width={220}
            height={176}
            fetchPriority="high"
            className="h-9 w-auto lg:h-[58px]"
          />
        </a>

        {/* ---------- 2. Pilule de navigation (bureau) ---------- */}
        <nav
          aria-label="Navigation principale"
          className="mt-[13px] hidden h-[85px] items-center justify-between rounded-[9px] bg-[#1c1c1c] pl-[57px] pr-[7px] lg:flex"
        >
          <ul className="flex items-center">
            {NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <a
                  href={`#/${NAV_PAGES[item.key]}`}
                  onClick={(e) => {
                    e.preventDefault();
                    router.navigate(item.key as never);
                  }}
                  aria-current={isActive(item.key) ? "page" : undefined}
                  className={`relative mx-[10px] py-2 text-[16px] font-normal leading-5 text-white transition-colors duration-300 hover:text-[#efefef] after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-0 after:bg-white after:transition-all after:duration-300 hover:after:left-0 hover:after:w-full ${
                    isActive(item.key) ? "after:left-0 after:w-full" : ""
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <StartProjectButton className="ml-6" />
        </nav>

        {/* ---------- 3. Pastille hamburger — collée en haut ---------- */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="menu-plein-ecran"
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          className="flex h-14 w-12 items-center justify-center rounded-b-lg bg-[#1c1c1c] transition-colors duration-300 hover:bg-[#232323] lg:h-[98px] lg:w-[94px] lg:rounded-b-[9px]"
        >
          {BurgerIcon}
        </button>
      </div>

      {/* ---------- Menu plein écran (comme sheragency) ---------- */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="menu-plein-ecran"
            initial={reduce ? { opacity: 0 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 overflow-y-auto bg-[#1c1c1c]"
          >
            <div className="container-site flex min-h-full flex-col pb-10 pt-[88px] lg:pt-[140px]">
              <nav aria-label="Navigation plein écran">
                <ul className="flex flex-col">
                  {NAV_ITEMS.map((item, i) => (
                    <motion.li
                      key={item.key}
                      initial={reduce ? undefined : { opacity: 0, x: -18 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 + 0.05 * i, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <a
                        href={`#/${NAV_PAGES[item.key]}`}
                        onClick={(e) => goPage(e, item.key)}
                        aria-current={isActive(item.key) ? "page" : undefined}
                        className={`group relative inline-block py-3.5 font-display text-[clamp(1.6rem,6vw,2.5rem)] font-medium leading-tight text-white transition-colors duration-300 hover:text-[#efefef] after:absolute after:bottom-1.5 after:left-1/2 after:h-px after:w-0 after:bg-white after:transition-all after:duration-300 hover:after:left-0 hover:after:w-full ${
                          isActive(item.key) ? "after:left-0 after:w-full" : ""
                        }`}
                      >
                        {item.label}
                      </a>
                    </motion.li>
                  ))}
                </ul>
              </nav>

              <motion.div
                initial={reduce ? undefined : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.34, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-8 sm:flex-row sm:flex-wrap sm:items-center"
              >
                <StartProjectButton />
                <button
                  type="button"
                  onClick={openCalendly}
                  className="inline-flex min-h-[52px] items-center gap-2.5 rounded-full border border-white/30 px-6 py-3 text-[15px] font-medium text-white transition-colors duration-300 hover:border-[#c9baac] hover:text-[#c9baac]"
                >
                  <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                  Réserver un appel (30 min)
                </button>
              </motion.div>

              <motion.p
                initial={reduce ? undefined : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.42, duration: 0.4 }}
                className="mt-6 flex flex-wrap items-center gap-x-3 text-sm text-[#c8c8c8]"
              >
                <span>30 minutes</span>
                <span className="h-1 w-1 rounded-full bg-[#c9baac]" aria-hidden="true" />
                <span>Gratuit</span>
                <span className="h-1 w-1 rounded-full bg-[#c9baac]" aria-hidden="true" />
                <span>Sans engagement</span>
              </motion.p>

              <motion.div
                initial={reduce ? undefined : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="mt-auto flex flex-wrap gap-x-7 gap-y-3 pt-12 text-sm text-[#c8c8c8]"
              >
                <a
                  href={`mailto:${SITE.email}`}
                  className="inline-flex items-center gap-2 transition-colors hover:text-white"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  {SITE.email}
                </a>
                <a
                  href={SITE.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 transition-colors hover:text-white"
                >
                  <Linkedin className="h-4 w-4" aria-hidden="true" />
                  LinkedIn
                </a>
                <a
                  href={SITE.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 transition-colors hover:text-white"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  WhatsApp
                </a>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
