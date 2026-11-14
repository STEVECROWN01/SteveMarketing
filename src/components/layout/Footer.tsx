"use client";

import React from "react";
import { useRouter } from "@/components/router-context";
import { ASSETS, SITE } from "@/lib/site";
import { Reveal } from "@/components/motion/Reveal";
import {
  EmailBrandIcon,
  LinkedInBrandIcon,
  WhatsAppBrandIcon,
} from "@/components/media/BrandIcons";

/** Liens de la colonne « Services » — à la demande de l'éditeur
 *  (15/11/2026) : trois services, chacun vers SA page dédiée —
 *  « Obtention ou Refonte de Site Web » vers la page Méthode,
 *  « Référencement SEO » vers la page dédiée au référencement,
 *  « Publicité Meta Ads » vers la page dédiée à la publicité. */
const FOOTER_SERVICES = [
  { label: "Obtention ou Refonte de Site Web", page: "processus" },
  { label: "Référencement SEO", page: "referencement" },
  { label: "Publicité Meta Ads", page: "publicite" },
] as const;

/** Liens de la colonne « Professionnel » (demande de l'éditeur,
 *  15/11/2026) : le nom de colonne ne doit plus évoquer une
 *  entreprise — Stevens Akpovi est un professionnel indépendant
 *  freelance, concepteur et vendeur de sites web. « Portfolio »
 *  (conservé, comme la référence), « Contact » et « À propos ». */
const FOOTER_PROFESSIONAL = [
  { label: "Portfolio", page: "realisations" },
  { label: "Contact", page: "contact" },
  { label: "À propos", page: "aPropos" },
] as const;

/** Liens internes du pied de page — clés du routeur applicatif. */
const FOOTER_LINK_PAGES: Record<string, string> = {
  accueil: "#/accueil",
  processus: "#/methode",
  referencement: "#/referencement-seo",
  publicite: "#/publicite-meta-ads",
  realisations: "#/realisations",
  contact: "#/contact",
  aPropos: "#/a-propos",
  legal: "#/mentions-legales",
};

/** Classe commune des liens des colonnes : AUCUN changement de
 *  couleur au survol — un soulignement qui s'étend depuis le centre,
 *  exactement comme les menus du header (demande de l'éditeur,
 *  15/11/2026). */
const FOOTER_LINK_CLASS =
  "relative inline-block text-[18px] leading-[26px] text-white after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-0 after:bg-white after:transition-all after:duration-300 hover:after:left-0 hover:after:w-full focus-visible:outline-2 focus-visible:outline-offset-4";

/**
 * PIED DE PAGE — présentation calquée sur le footer de
 * sheragency.com (demande de l'éditeur, 15/11/2026) :
 * 1. logo (même taille que celui du header) avec, à sa droite,
 *    trois pastilles blanches circulaires — VRAIES icônes des
 *    réseaux (glyphes officiels monochromes « en blanc-noir ») :
 *    email, LinkedIn et WhatsApp, réduites à la demande de
 *    l'éditeur (15/11/2026) ;
 * 2. à la place de leurs deux logos de reconnaissance sous le
 *    logo, notre mention : « Conception de Sites Web
 *    Professionnel qui Vendent. » ;
 * 3. colonne « Services » : Obtention ou Refonte de Site Web,
 *    Référencement SEO, Publicité Meta Ads — chacun vers sa page ;
 * 4. colonne « Professionnel » : « Portfolio », « Contact » et
 *    « À propos » ;
 * 5. barre de séparation à extrémités fondues (la même que celle
 *    des sections du site) avant la barre de copyright ;
 * 6. copyright : « © Stevens Akpovi - {année} » à gauche et
 *    « Mentions légales » à droite.
 * Le fondu statique au sommet du pied de page (comme le bas du
 * hero) est conservé.
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
                    même taille que celui du header, agrandi à la
                    demande de l'éditeur (15/11/2026). */}
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
                    className="h-11 w-auto lg:h-[72px]"
                  />
                </a>

                {/* Trois pastilles de contact — VRAIES icônes des
                    réseaux (glyphes officiels en monochrome),
                    réduites à la demande de l'éditeur (15/11/2026) :
                    cercles blancs de 36px, icônes sombres de 15px. */}
                <div className="flex items-center gap-2.5 pb-2.5">
                  <a
                    href={`mailto:${SITE.email}`}
                    aria-label={`Écrire un email à Stevens Akpovi — ${SITE.email}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#1c1c1c] transition-colors duration-300 hover:bg-[#e4e4e4] focus-visible:outline-2 focus-visible:outline-offset-4"
                  >
                    <EmailBrandIcon className="h-[15px] w-[15px]" />
                  </a>
                  <a
                    href={SITE.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn — Stevens Akpovi"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#1c1c1c] transition-colors duration-300 hover:bg-[#e4e4e4] focus-visible:outline-2 focus-visible:outline-offset-4"
                  >
                    <LinkedInBrandIcon className="h-[15px] w-[15px]" />
                  </a>
                  <a
                    href={SITE.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp — Stevens Akpovi"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#1c1c1c] transition-colors duration-300 hover:bg-[#e4e4e4] focus-visible:outline-2 focus-visible:outline-offset-4"
                  >
                    <WhatsAppBrandIcon className="h-[15px] w-[15px]" />
                  </a>
                </div>
              </div>

              {/* Mention sous le logo — à la place des deux logos de
                  reconnaissance de la référence (texte corrigé par
                  l'éditeur, 15/11/2026). */}
              <p className="mt-5 max-w-[294px] text-sm leading-relaxed text-[#c8c8c8]">
                Conception de Sites Web Professionnel qui Vendent.
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
                        className={FOOTER_LINK_CLASS}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <nav aria-label="Professionnel — pied de page">
                <p className="font-display text-[26px] font-semibold text-white sm:text-[32px]">
                  Professionnel
                </p>
                <ul className="mt-[25px]">
                  {FOOTER_PROFESSIONAL.map((item) => (
                    <li key={item.label} className="mb-[5px]">
                      <a
                        href={FOOTER_LINK_PAGES[item.page]}
                        onClick={(e) => go(e, item.page)}
                        className={FOOTER_LINK_CLASS}
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
            centrée, fade-in à gauche et fade-out à droite. */}
        <div aria-hidden="true" className="separator-fade separator-fade-half" />

        {/* ---------- Barre copyright (comme la référence) ----------
            « © Stevens Akpovi - {année} » à gauche, « Mentions
            légales » à droite (à la place de « Privacy Policy ») —
            survol en soulignement, sans changement de couleur. */}
        <div className="flex flex-col gap-3 py-[15px] text-[18px] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[#f5f5f5]">© Stevens Akpovi - {new Date().getFullYear()}</p>
          <a
            href={FOOTER_LINK_PAGES.legal}
            onClick={(e) => go(e, "legal")}
            className="relative inline-block w-fit text-white after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-0 after:bg-white after:transition-all after:duration-300 hover:after:left-0 hover:after:w-full focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            Mentions légales
          </a>
        </div>
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" aria-hidden="true" />
    </footer>
  );
}
