"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Reveal, RevealText } from "@/components/motion/Reveal";
import { CTAButton, CTAIcons, ReassuranceBar } from "@/components/marketing/Marketing";
import { BrowserMockup, PhoneMockup } from "@/components/media/Media";
import { HERO } from "@/content/site-content";
import { ASSETS, PROJECTS, SITE } from "@/lib/site";

/**
 * SECTION 01 — HERO
 * Totalement visible à l'écran, sans défilement : la section occupe
 * exactement la hauteur du viewport (100svh, y compris barres
 * dynamiques mobiles) et son contenu s'adapte en taille à tous les
 * écrans (typographie fluide, portrait dimensionné en svh). Sans
 * scroller, le visiteur comprend : qui est Stevens, ce qu'il propose,
 * le bénéfice principal, comment réserver et comment découvrir les
 * réalisations. Mobile : l'image se place entre le titre et la
 * description. Les mentions « Copywriting inclus » / « SEO de base »
 * sont volontairement absentes : elles appartiennent à la section
 * « Avantages inclus » qui présente l'offre.
 */
export function Hero() {
  const reduce = useReducedMotion();

  const floatTransition = { duration: 5.5, repeat: Infinity, repeatType: "mirror" as const, ease: "easeInOut" as const };

  return (
    <section
      id="hero"
      aria-label="Introduction — Stevens Akpovi, conception de sites web orientés conversion"
      className="section-deep relative flex min-h-svh flex-col overflow-hidden"
    >
      {/* Décor : grille discrète + halo beige */}
      <div className="bg-grid-dark absolute inset-0" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-[-10%] h-[560px] w-[560px] rounded-full bg-[#c9baac] opacity-[0.09] blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-20%] left-[-12%] h-[420px] w-[420px] rounded-full bg-[#c9baac] opacity-[0.05] blur-[110px]"
      />

      <div className="container-site relative flex flex-1 flex-col justify-center pb-4 pt-[64px] sm:pb-8 sm:pt-[68px] lg:pb-8 lg:pt-[112px]">
        <div className="grid items-center gap-3.5 sm:gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:gap-7 xl:gap-9">
          {/* ---------- Bloc texte haut : eyebrow, titre ---------- */}
          {/* Mobile : eyebrow → H1, puis image (bloc visuel), puis
              suite du texte. Desktop : colonne gauche, ligne 1. */}
          <div className="order-1 lg:col-start-1 lg:row-start-1">
            <Reveal direction="up">
              <p className="text-eyebrow">
                {HERO.eyebrow}
                <span className="hidden sm:inline"> · STRATÉGIE DIGITALE</span>
              </p>
            </Reveal>

            <RevealText
              as="h1"
              text={HERO.h1}
              delay={0.08}
              className="text-hero-title-viewport mt-3 text-white sm:mt-4"
            />
          </div>

          {/* ---------- Colonne visuelle : portrait + mockups ---------- */}
          {/* Mobile : placée entre le titre et la description (demande
              explicite de l'éditeur) ; desktop : colonne droite sur les
              deux lignes de la grille, hauteur plafonnée en svh pour
              que le hero tienne dans l'écran. */}
          <div className="order-2 relative mx-auto w-full max-w-md lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:max-w-none">
            {/* Bloc beige en décalage derrière le portrait */}
            <div
              aria-hidden="true"
              className="absolute -inset-3 rotate-[2.5deg] rounded-[2rem] bg-[#c9baac]/90 opacity-[0.16] sm:rotate-[3deg]"
            />
            <div className="relative flex justify-center">
              {/* Portrait professionnel — NON cliquable */}
              <figure className="relative overflow-hidden rounded-[1.75rem] border border-[#e4e4e4]/15 bg-[#232323] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.7)]">
                <span className="mono-media block">
                  <img
                    src={ASSETS.portrait}
                    alt={HERO.portraitAlt}
                    width={1024}
                    height={1536}
                    loading="eager"
                    fetchPriority="high"
                    decoding="sync"
                    className="block h-[min(29svh,270px)] w-full object-cover object-top lg:h-[min(64svh,570px)] lg:w-auto"
                  />
                </span>
                <figcaption className="absolute left-4 top-4">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#070707]/75 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#c9baac]" aria-hidden="true" />
                    Stevens Akpovi
                  </span>
                </figcaption>
              </figure>

              {/* Mockup navigateur flottant — MR STEVE ENGLISH */}
              <motion.div
                className="absolute -bottom-8 -left-4 hidden w-[58%] sm:block lg:-left-14 lg:w-[62%]"
                initial={reduce ? undefined : { opacity: 0, y: 26, rotate: -5 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, rotate: -3 }}
                transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div animate={reduce ? undefined : { y: [0, -7, 0] }} transition={floatTransition}>
                  <BrowserMockup
                    src={PROJECTS[0].desktop}
                    alt={`Aperçu du site ${PROJECTS[0].name}`}
                    url={PROJECTS[0].url}
                    width={1440}
                    height={900}
                  />
                </motion.div>
              </motion.div>

              {/* Mockup smartphone flottant — AFRIBAYIT */}
              <motion.div
                className="absolute -right-2 -top-10 hidden w-[26%] sm:block lg:-right-8 lg:w-[28%]"
                initial={reduce ? undefined : { opacity: 0, y: 26, rotate: 5 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, rotate: 2 }}
                transition={{ delay: 0.75, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div animate={reduce ? undefined : { y: [0, 8, 0] }} transition={{ ...floatTransition, delay: 1.2 }}>
                  <PhoneMockup
                    src={PROJECTS[2].mobile}
                    alt={`Aperçu mobile du site ${PROJECTS[2].name}`}
                    width={390}
                    height={844}
                  />
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* ---------- Bloc texte bas : description, CTA, réassurance ---------- */}
          {/* Mobile : succède à l'image ; desktop : colonne gauche, ligne 2. */}
          <div className="order-3 lg:col-start-1 lg:row-start-2">
            <Reveal direction="up" delay={0.18}>
              <p className="mt-2.5 max-w-xl text-[12.5px] leading-[1.55] text-[#c8c8c8] sm:mt-3 sm:text-[15px] lg:mt-3 lg:text-[15px] xl:text-base">
                {HERO.text}
              </p>
            </Reveal>

            {/* CTA — les deux boutons partagent la même ligne sur desktop :
                réservation d'appel (blanc) + découverte des réalisations (noir). */}
            <Reveal direction="up" delay={0.24}>
              <div className="mt-3 flex flex-wrap items-center gap-2.5 sm:mt-5 sm:gap-3 lg:mt-5">
                <CTAButton
                  action={{ kind: "calendly" }}
                  variant="secondary"
                  size="lg"
                  icon={CTAIcons.calendar}
                  ariaLabel={`Réserver un appel de 30 minutes sur Calendly — ${SITE.calendlyMention}`}
                >
                  {HERO.ctaPrimary}
                </CTAButton>
                <CTAButton
                  action={{ kind: "page", page: "realisations" }}
                  variant="ghostLight"
                  icon={CTAIcons.works}
                  className="px-3.5 py-2.5 text-[13px] sm:px-4 sm:py-3 sm:text-sm"
                >
                  {HERO.ctaTertiary}
                </CTAButton>
              </div>
            </Reveal>

            <Reveal direction="up" delay={0.3}>
              <ReassuranceBar mention={HERO.reassurance} className="mt-3 sm:mt-4 lg:mt-5" />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
