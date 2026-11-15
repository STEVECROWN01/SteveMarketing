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
 *  « Conception de Sites Web » vers la page Méthode,
 *  « Référencement SEO » vers la page dédiée au référencement,
 *  « Publicité Meta Ads » vers la page dédiée à la publicité. */
const FOOTER_SERVICES = [
  { label: "Conception de Sites Web", page: "processus" },
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
 *  15/11/2026). Taille responsive (16/11/2026) : les deux colonnes
 *  étant désormais côte à côte sur TOUTES les tailles d'écran, les
 *  liens sont légèrement plus compacts sur téléphone. */
const FOOTER_LINK_CLASS =
  "relative inline-block text-[15px] leading-[24px] text-white after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-0 after:bg-white after:transition-all after:duration-300 hover:after:left-0 hover:after:w-full focus-visible:outline-2 focus-visible:outline-offset-4 sm:text-[18px] sm:leading-[26px]";

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
 * 3. colonne « Services » : Conception de Sites Web,
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
                    légèrement AGRANDI sur tablette et mobile à la
                    demande de l'éditeur (16/11/2026) : il reste
                    nettement plus grand que les pastilles réseaux à
                    sa droite. */}
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
                    className="h-12 w-auto sm:h-14 lg:h-[72px]"
                  />
                </a>

                {/* Trois pastilles de contact — VRAIES icônes des
                    réseaux (glyphes officiels en monochrome), à la
                    taille RESPONSIVE (demande de l'éditeur, 16/11/2026) :
                    32 px sur téléphone, 36 px à partir de sm — toujours
                    plus PETITES que le logo à leur gauche (c'est
                    l'inverse qui était reproché). Au survol, la pastille
                    prend la couleur OFFICIELLE du réseau et le glyphe
                    passe en blanc (16/11/2026) : LinkedIn #0A66C2,
                    WhatsApp #25D366 ; l'email n'ayant pas de couleur
                    officielle, il prend le noir #1c1c1c du site. */}
                <div className="flex items-center gap-2.5 pb-2.5">
                  <a
                    href={`mailto:${SITE.email}`}
                    aria-label={`Écrire un email à Stevens Akpovi — ${SITE.email}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#1c1c1c] transition-colors duration-300 hover:bg-[#1c1c1c] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 sm:h-9 sm:w-9"
                  >
                    <EmailBrandIcon className="h-[13px] w-[13px] sm:h-[15px] sm:w-[15px]" />
                  </a>
                  <a
                    href={SITE.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn — Stevens Akpovi"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#1c1c1c] transition-colors duration-300 hover:bg-[#0A66C2] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 sm:h-9 sm:w-9"
                  >
                    <LinkedInBrandIcon className="h-[13px] w-[13px] sm:h-[15px] sm:w-[15px]" />
                  </a>
                  <a
                    href={SITE.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp — Stevens Akpovi"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#1c1c1c] transition-colors duration-300 hover:bg-[#25D366] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 sm:h-9 sm:w-9"
                  >
                    <WhatsAppBrandIcon className="h-[13px] w-[13px] sm:h-[15px] sm:w-[15px]" />
                  </a>
                </div>
              </div>

              {/* Mention sous le logo — graisse NORMALE (l'éditeur
                  l'avait demandée en gras le 16/11/2026 puis s'est
                  ravisé dans la foulée : gras retiré), à la place des
                  deux logos de reconnaissance de la référence. */}
              <p className="mt-5 max-w-[294px] text-sm leading-relaxed text-[#c8c8c8]">
                Votre activité mérite un site web qui travaille pour vous.
              </p>
            </div>

            {/* ---------- Colonnes de menus ---------- */}
            {/* Les deux colonnes « Services » et « Professionnel » sont
                alignées horizontalement — côte à côte, titres sur la
                même ligne — sur TOUTES les tailles d'écran (demande de
                l'éditeur, 16/11/2026) ; sur téléphone, titres et liens
                sont légèrement plus compacts pour tenir. */}
            <div className="grid grid-cols-2 gap-6 sm:gap-10 lg:gap-20">
              <nav aria-label="Services — pied de page">
                <p className="font-display text-[20px] font-semibold text-white sm:text-[32px]">
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
                <p className="font-display text-[20px] font-semibold text-white sm:text-[32px]">
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
            légales » à droite — TOUJOURS sur la même ligne
            horizontale, quelle que soit la taille d'écran (demande
            de l'éditeur, 15/11/2026) : le premier totalement à
            gauche, le second totalement à droite ; sur mobile, la
            taille de police est réduite (13 px) pour que les deux
            restent alignés sans retour à la ligne. */}
        <div className="flex items-center justify-between gap-3 py-[15px] text-[13px] sm:text-[18px]">
          <p className="whitespace-nowrap text-[#f5f5f5]">© Stevens Akpovi - {new Date().getFullYear()}</p>
          <a
            href={FOOTER_LINK_PAGES.legal}
            onClick={(e) => go(e, "legal")}
            className="relative inline-block w-fit whitespace-nowrap text-white after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-0 after:bg-white after:transition-all after:duration-300 hover:after:left-0 hover:after:w-full focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            Mentions légales
          </a>
        </div>
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" aria-hidden="true" />
    </footer>
  );
}
