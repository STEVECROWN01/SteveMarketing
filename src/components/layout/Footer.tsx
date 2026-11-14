"use client";

import React from "react";
import { Linkedin, Mail, MessageCircle } from "lucide-react";
import { useRouter } from "@/components/router-context";
import { ASSETS, SITE } from "@/lib/site";
import { Reveal } from "@/components/motion/Reveal";

/** Liens de la colonne « Services » — à la demande de l'éditeur
 *  (15/11/2026) : le premier libellé de la référence (« Get a
 *  Website ») est conservé, les deux suivants portent nos deux
 *  derniers services. Mène à la page Services. */
const FOOTER_SERVICES = [
  { label: "Get a Website", page: "services" },
  { label: "Refonte de site web", page: "services" },
  { label: "Système d'acquisition client", page: "services" },
] as const;

/** Liens de la colonne « Entreprise » (adaptation de « Company ») :
 *  « Portfolio » (conservé, comme la référence), « Me contacter »
 *  (adaptation de « Contact Us ») et « À propos » (adaptation de
 *  « Careers »). */
const FOOTER_COMPANY = [
  { label: "Portfolio", page: "realisations" },
  { label: "Me contacter", page: "contact" },
  { label: "À propos", page: "aPropos" },
] as const;

const FOOTER_LINK_PAGES: Record<string, string> = {
  accueil: "#/accueil",
  services: "#/services",
  realisations: "#/realisations",
  contact: "#/contact",
  aPropos: "#/a-propos",
  legal: "#/mentions-legales",
};

/**
 * PIED DE PAGE — présentation calquée sur le footer de
 * sheragency.com (demande de l'éditeur, 15/11/2026) :
 * 1. logo (même taille que celui du header) avec, à sa droite,
 *    trois pastilles blanches circulaires — email, LinkedIn et
 *    WhatsApp (leur design, nos coordonnées) ;
 * 2. à la place de leurs deux logos de reconnaissance sous le
 *    logo, notre mention : « Conception de site web professionnel
 *    qui vend. » ;
 * 3. colonne « Services » : « Get a Website » (comme la référence)
 *    suivi de nos deux derniers services ;
 * 4. colonne « Entreprise » : « Portfolio », « Me contacter » et
 *    « À propos » ;
 * 5. barre de séparation à extrémités fondues (la même que celle
 *    des sections du site) avant la barre de copyright ;
 * 6. copyright : « © Stevens Akpovi - {année} » à gauche et
 *    « Mentions légales » à droite.
 * Le fondu statique au sommet du pied de page (comme le bas du
 * hero) est conservé — la lueur circulante reste supprimée.
 */
export function Footer() {
  const router = useRouter();

  const go = (e: React.MouseEvent, key: string) => {
    e.preventDefault();
    router.navigate(key as never);
  };

  return (
    <footer className="section-deep relative mt-auto overflow-hidden">
      {/* Fondu au sommet du pied de page (comme le fondu bas du hero,
          demande de l'éditeur, 15/11/2026) : un voile blanc doux né sur
          la limite avec la section précédente, qui s'estompe vers le
          bas — aucune ligne dure ni animation. Pur décor, rogné par
          overflow-hidden. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#ffffff]/[0.08] to-transparent sm:h-14"
      />

      <div className="container-site relative pb-[10px] pt-12 sm:pt-[50px]">
        <Reveal direction="up" amount={0.15}>
          {/* Grille principale — comme la référence : colonne de
              marque à gauche, colonnes de menus à droite. */}
          <div className="grid gap-12 pb-10 lg:grid-cols-[minmax(0,375px)_minmax(0,1fr)] lg:gap-4">
            {/* ---------- Colonne de marque ---------- */}
            <div>
              <div className="flex items-center gap-4">
                {/* Logo officiel (version blanche, fond sombre) —
                    même taille que celui du header (demande de
                    l'éditeur, 15/11/2026). */}
                <a
                  href={FOOTER_LINK_PAGES.accueil}
                  onClick={(e) => go(e, "accueil")}
                  aria-label="Stevens Akpovi — retour à l'accueil"
                  className="inline-flex shrink-0"
                >
                  <img
                    src={ASSETS.logoLight}
                    alt="Stevens Akpovi"
                    width={240}
                    height={192}
                    loading="lazy"
                    className="h-10 w-auto lg:h-[64px]"
                  />
                </a>

                {/* Trois pastilles de contact — même design que la
                    référence : cercles blancs de 45px, icônes sombres,
                    espacement 10px. Chaque pastille redirige vers nos
                    coordonnées (email, LinkedIn, WhatsApp). */}
                <div className="flex items-center gap-2.5 pb-2.5">
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
              </div>

              {/* Mention sous le logo — à la place des deux logos de
                  reconnaissance de la référence (demande de l'éditeur,
                  15/11/2026). */}
              <p className="mt-5 max-w-[294px] text-sm leading-relaxed text-[#c8c8c8]">
                Conception de site web professionnel qui vend.
              </p>
            </div>

            {/* ---------- Colonnes de menus ---------- */}
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:gap-20">
              <nav aria-label="Services — pied de page">
                <p className="font-display text-[26px] font-semibold text-white sm:text-[32px]">
                  Services
                </p>
                <ul className="mt-[25px]">
                  {FOOTER_SERVICES.map((item) => (
                    <li key={item.label} className="mb-[5px]">
                      <a
                        href={FOOTER_LINK_PAGES[item.page]}
                        onClick={(e) => go(e, item.page)}
                        className="inline-block text-[18px] leading-[26px] text-white transition-colors duration-300 hover:text-[#c9baac]"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <nav aria-label="Entreprise — pied de page">
                <p className="font-display text-[26px] font-semibold text-white sm:text-[32px]">
                  Entreprise
                </p>
                <ul className="mt-[25px]">
                  {FOOTER_COMPANY.map((item) => (
                    <li key={item.label} className="mb-[5px]">
                      <a
                        href={FOOTER_LINK_PAGES[item.page]}
                        onClick={(e) => go(e, item.page)}
                        className="inline-block text-[18px] leading-[26px] text-white transition-colors duration-300 hover:text-[#c9baac]"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        </Reveal>

        {/* ---------- Barre de séparation avant le copyright ----------
            La même que celle des sections du site : demi-largeur,
            centrée, fade-in à gauche et fade-out à droite (demande de
            l'éditeur, 15/11/2026 — remplace la bordure pleine de la
            référence). */}
        <div aria-hidden="true" className="separator-fade separator-fade-half" />

        {/* ---------- Barre copyright (comme la référence) ----------
            « © Stevens Akpovi - {année} » à gauche, « Mentions
            légales » à droite (à la place de « Privacy Policy »). */}
        <div className="flex flex-col gap-3 py-[15px] text-[18px] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[#f5f5f5]">© Stevens Akpovi - {new Date().getFullYear()}</p>
          <a
            href={FOOTER_LINK_PAGES.legal}
            onClick={(e) => go(e, "legal")}
            className="text-white transition-colors duration-300 hover:text-[#c9baac]"
          >
            Mentions légales
          </a>
        </div>
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" aria-hidden="true" />
    </footer>
  );
}
