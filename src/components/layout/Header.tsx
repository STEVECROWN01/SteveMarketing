"use client";

import React, { useEffect, useState } from "react";
import { X, Linkedin, Mail, MessageCircle } from "lucide-react";
import { useRouter } from "@/components/router-context";
import { ASSETS, NAV_ITEMS, SITE } from "@/lib/site";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { StartProjectButton } from "@/components/marketing/StartProjectButton";

const NAV_PAGES: Record<string, string> = {
  accueil: "accueil",
  processus: "processus",
  services: "services",
  realisations: "realisations",
  aPropos: "a-propos",
  contact: "contact",
};

/** Navigation du header — « Accueil » retiré à la demande de l'éditeur
 *  (le logo ramène déjà à l'accueil ; le pied de page le conserve). */
const HEADER_NAV_ITEMS = NAV_ITEMS.filter((item) => item.key !== "accueil");

/** Menus listés dans le menu plein écran (mobile/tablette) — à la
 *  demande de l'éditeur (15/11/2026) : la liste est resserrée sur
 *  « Mon Process » puis « Nos Réalisations », suivis d'une barre de
 *  séparation à extrémités fondues, des trois icônes de contact
 *  (email, LinkedIn, WhatsApp) et du menu « Me Contacter ». */
const MENU_FULLSCREEN_ITEMS: { key: string; label: string }[] = [
  { key: "processus", label: "Mon Process" },
  { key: "realisations", label: "Nos Réalisations" },
];

/**
 * EN-TÊTE — présentation calquée sur le header de sheragency.com :
 * trois blocs sombres #1c1c1c posés sur un bandeau transparent :
 * 1. pastille logo à gauche, collée au bord haut, coins arrondis
 *    en bas uniquement (tab 94×98 sur bureau) ;
 * 2. pilule de navigation centrale (85px, arrondie 9px) : liens
 *    blancs 16px + soulignement qui s'étend depuis le centre au
 *    survol, bouton blanc « Démarrer un projet » à droite (pastille
 *    flèche ↗ de 28px) — mène à la page de demande de devis ;
 * 3. pastille hamburger à droite, collée au bord haut — ouvre le
 *    menu plein écran (liens XL + CTA), comme la référence.
 * Le bandeau reste fixe : les pastilles étant opaques, la présentation
 * est identique sur tous les fonds.
 *
 * MENU PLEIN ÉCRAN — entièrement visible sans défilement sur tout
 * écran (hauteur 100svh, contenu compact et adaptatif) + croix de
 * fermeture dédiée dans le menu, en plus de la pastille hamburger
 * qui se transforme en croix.
 */
export function Header() {
  const router = useRouter();
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

  /** « Démarrer un projet » → page dédiée de demande de devis
   *  (#/demander-un-devis) — demande de l'éditeur, 13/11/2026. */
  const startProject = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setMenuOpen(false);
    router.navigate("devis");
  };

  const goPage = (e: React.MouseEvent, key: string) => {
    e.preventDefault();
    setMenuOpen(false);
    router.navigate(key as never);
  };

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
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-[#e4e4e4] focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-[#1c1c1c]"
      >
        Aller au contenu principal
      </a>

      <div className="mx-auto flex w-full max-w-[1400px] items-start justify-between px-5 sm:px-8 lg:px-10">
        {/* ---------- 1. Pastille logo — collée en haut, coins bas arrondis ---------- */}
        <a
          href="#/accueil"
          onClick={(e) => goPage(e, "accueil")}
          aria-label="Stevens Akpovi — retour à l'accueil"
          className="flex h-14 w-14 items-center justify-center rounded-b-lg bg-[#1c1c1c] transition-colors duration-300 hover:bg-[#232323] lg:h-[104px] lg:w-[100px] lg:rounded-b-[9px]"
        >
          {/* Logo officiel (version blanche, pour fond sombre) — légèrement
              agrandi à la demande de l'éditeur */}
          <img
            src={ASSETS.logoLight}
            alt="Stevens Akpovi"
            width={240}
            height={192}
            fetchPriority="high"
            className="h-10 w-auto lg:h-[64px]"
          />
        </a>

        {/* ---------- 2. Pilule de navigation (bureau) ---------- */}
        {/* Espaces à la demande de l'éditeur (15/11/2026) : air à
            gauche du premier lien (« Mon Process ») ; l'espace à
            droite du bouton « Démarrer un projet », élargi puis
            jugé trop grand, est légèrement réduit (40 → 30px). */}
        <nav
          aria-label="Navigation principale"
          className="mt-[13px] hidden h-[85px] items-center justify-between rounded-[9px] bg-[#1c1c1c] pl-[30px] pr-[30px] lg:flex"
        >
          <ul className="flex items-center">
            {HEADER_NAV_ITEMS.map((item) => (
              <li key={item.key}>
                {/* Soulignement actif : pleine largeur, aligné à gauche
                    (avant : demi-largeur décalée — conflit left-1/2/w-0
                    contre left-0/w-full). Chaque état porte ses propres
                    utilitaires left/w pour éviter tout conflit d'ordre CSS. */}
                <a
                  href={`#/${NAV_PAGES[item.key]}`}
                  onClick={(e) => {
                    e.preventDefault();
                    router.navigate(item.key as never);
                  }}
                  aria-current={isActive(item.key) ? "page" : undefined}
                  className={`relative mx-[10px] py-2 text-[16px] font-normal leading-5 text-white transition-colors duration-300 hover:text-[#efefef] after:absolute after:bottom-0 after:h-px after:bg-white after:transition-all after:duration-300 ${
                    isActive(item.key)
                      ? "after:left-0 after:w-full"
                      : "after:left-1/2 after:w-0 hover:after:left-0 hover:after:w-full"
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <StartProjectButton className="ml-6" onClick={startProject} />
        </nav>

        {/* ---------- 3. Pastille hamburger — collée en haut ---------- */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="menu-plein-ecran"
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          className="flex h-14 w-14 items-center justify-center rounded-b-lg bg-[#1c1c1c] transition-colors duration-300 hover:bg-[#232323] lg:h-[104px] lg:w-[100px] lg:rounded-b-[9px]"
        >
          {BurgerIcon}
        </button>
      </div>

      {/* ---------- Menu plein écran (comme sheragency) ---------- */}
      {/* Hauteur 100svh, contenu compact : tout est visible sans
          défilement, sur tous les écrans. Croix de fermeture dédiée
          sous la pastille hamburger (qui devient elle aussi une
          croix). Ouverture/fermeture douces et légèrement animées
          (fondu + translation courte). */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="menu-plein-ecran"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -18, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.997 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-[#1c1c1c]"
          >
            {/* Espacements à la demande de l'éditeur (15/11/2026) :
                l'espace au-dessus des menus est légèrement réduit
                (−8px mobile/tablette, −12px bureau) et la même quantité
                est ajoutée sous le dernier élément (« Me Contacter »). */}
            <div className="container-site relative flex min-h-0 flex-1 flex-col pb-[28px] pt-[68px] sm:pb-[32px] sm:pt-[80px] lg:pb-[44px] lg:pt-[120px]">
              {/* Croix de fermeture dédiée — sous la pastille hamburger.
                  Au survol, TOUT le bouton prend la couleur de survol du
                  bouton du header (remplissage #e4e4e4, bordure #c9baac,
                  croix sombre) — pas seulement la bordure circulaire. */}
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Fermer le menu"
                className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#e4e4e4]/25 bg-[#232323] text-white transition-colors duration-300 hover:border-[#c9baac] hover:bg-[#e4e4e4] hover:text-[#1c1c1c] focus-visible:outline-2 focus-visible:outline-offset-4 sm:h-14 sm:w-14"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
              </button>

              {/* Menus — « Mon Process » puis « Nos Réalisations »
                  (demande de l'éditeur, 15/11/2026). */}
              <nav aria-label="Navigation plein écran">
                <ul className="flex flex-col">
                  {MENU_FULLSCREEN_ITEMS.map((item, i) => (
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
                        className={`group relative inline-block py-1.5 font-display text-[clamp(1.3rem,6vw,2.5rem)] font-medium leading-tight text-white transition-colors duration-300 hover:text-[#efefef] after:absolute after:bottom-1.5 after:h-px after:bg-white after:transition-all after:duration-300 sm:py-2.5 lg:py-3 ${
                          isActive(item.key)
                            ? "after:left-0 after:w-full"
                            : "after:left-1/2 after:w-0 hover:after:left-0 hover:after:w-full"
                        }`}
                      >
                        {item.label}
                      </a>
                    </motion.li>
                  ))}
                </ul>
              </nav>

              {/* Barre de séparation à extrémités fondues — comme
                  toutes les barres de séparation du site (fade-in à
                  gauche, fade-out à droite). */}
              <motion.div
                initial={reduce ? undefined : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="mt-5 sm:mt-7 lg:mt-9"
              >
                <div aria-hidden="true" className="separator-fade" />

                {/* Trois icônes de contact (email, LinkedIn, WhatsApp) —
                    mêmes pastilles blanches que le pied de page, style
                    sheragency. Elles remplacent les deux boutons
                    précédents (demande de l'éditeur, 15/11/2026). */}
                <div className="mt-5 flex items-center gap-2.5 sm:mt-6">
                  <a
                    href={`mailto:${SITE.email}`}
                    aria-label={`Écrire un email à Stevens Akpovi — ${SITE.email}`}
                    className="flex h-[45px] w-[45px] items-center justify-center rounded-full bg-white text-[#1c1c1c] transition-colors duration-300 hover:bg-[#e4e4e4] focus-visible:outline-2 focus-visible:outline-offset-4"
                  >
                    <Mail className="h-[18px] w-[18px]" aria-hidden="true" />
                  </a>
                  <a
                    href={SITE.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn — Stevens Akpovi"
                    className="flex h-[45px] w-[45px] items-center justify-center rounded-full bg-white text-[#1c1c1c] transition-colors duration-300 hover:bg-[#e4e4e4] focus-visible:outline-2 focus-visible:outline-offset-4"
                  >
                    <Linkedin className="h-[18px] w-[18px]" aria-hidden="true" />
                  </a>
                  <a
                    href={SITE.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp — Stevens Akpovi"
                    className="flex h-[45px] w-[45px] items-center justify-center rounded-full bg-white text-[#1c1c1c] transition-colors duration-300 hover:bg-[#e4e4e4] focus-visible:outline-2 focus-visible:outline-offset-4"
                  >
                    <MessageCircle className="h-[18px] w-[18px]" aria-hidden="true" />
                  </a>
                </div>

                {/* Menu « Me Contacter » — remplace la mention
                    « 30 minutes · Gratuit · Sans engagement ». */}
                <a
                  href="#/contact"
                  onClick={(e) => goPage(e, "contact")}
                  aria-current={isActive("contact") ? "page" : undefined}
                  className={`group relative mt-3 inline-block font-display text-[clamp(1.3rem,6vw,2.5rem)] font-medium leading-tight text-white transition-colors duration-300 hover:text-[#efefef] after:absolute after:bottom-1.5 after:h-px after:bg-white after:transition-all after:duration-300 sm:mt-4 ${
                    isActive("contact")
                      ? "after:left-0 after:w-full"
                      : "after:left-1/2 after:w-0 hover:after:left-0 hover:after:w-full"
                  }`}
                >
                  Me Contacter
                </a>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
