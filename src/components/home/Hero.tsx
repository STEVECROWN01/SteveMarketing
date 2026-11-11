"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { Reveal, RevealText } from "@/components/motion/Reveal";
import { CTAButton, CTAIcons, ReassuranceBar } from "@/components/marketing/Marketing";
import { BrowserMockup, PhoneMockup } from "@/components/media/Media";
import { HERO } from "@/content/site-content";
import { ASSETS, PROJECTS, SITE } from "@/lib/site";

/**
 * SECTION 01 — HERO
 * Sans scroller, le visiteur comprend : qui est Stevens, ce qu'il
 * propose, à qui s'adressent ses services, le bénéfice principal,
 * le travail à distance, comment réserver et comment demander un
 * devis. Portrait non cliquable + composition de mockups.
 */
export function Hero() {
  const reduce = useReducedMotion();

  const floatTransition = { duration: 5.5, repeat: Infinity, repeatType: "mirror" as const, ease: "easeInOut" as const };

  return (
    <section
      id="hero"
      aria-label="Introduction — Stevens Akpovi, conception de sites web orientés conversion"
      className="section-deep relative overflow-hidden pt-32 pb-20 sm:pt-40 lg:pt-44 lg:pb-28"
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

      <div className="container-site relative">
        <div className="grid items-center gap-14 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10 xl:gap-16">
          {/* ---------- Colonne texte ---------- */}
          <div className="order-1">
            <Reveal direction="up">
              <p className="text-eyebrow">{HERO.eyebrow}</p>
            </Reveal>

            <RevealText as="h1" text={HERO.h1} delay={0.08} className="text-hero-title mt-6 text-white" />

            <Reveal direction="up" delay={0.18}>
              <p className="mt-6 max-w-xl font-display text-lg font-medium leading-snug text-[#c9baac] sm:text-xl">
                {HERO.hook}
              </p>
            </Reveal>

            <Reveal direction="up" delay={0.24}>
              <p className="text-body mt-5 max-w-xl on-dark-muted">{HERO.text}</p>
            </Reveal>

            {/* CTA */}
            <Reveal direction="up" delay={0.3}>
              <div className="mt-9 flex flex-col gap-3.5 sm:flex-row sm:flex-wrap sm:items-center">
                <CTAButton
                  action={{ kind: "calendly" }}
                  variant="primary"
                  size="lg"
                  icon={CTAIcons.calendar}
                  ariaLabel={`Réserver un appel stratégique de 20 minutes sur Calendly — ${SITE.calendlyMention}`}
                >
                  {HERO.ctaPrimary}
                </CTAButton>
                <CTAButton
                  action={{ kind: "page", page: "contact", section: "devis" }}
                  variant="secondary"
                  size="lg"
                  icon={CTAIcons.quote}
                >
                  {HERO.ctaSecondary}
                </CTAButton>
              </div>
            </Reveal>

            <Reveal direction="up" delay={0.36}>
              <div className="mt-4">
                <CTAButton
                  action={{ kind: "page", page: "contact", section: "audit" }}
                  variant="ghostLight"
                  icon={CTAIcons.audit}
                  className="px-4 py-2 text-sm"
                >
                  {HERO.ctaTertiary}
                </CTAButton>
              </div>
            </Reveal>

            <Reveal direction="up" delay={0.42}>
              <ReassuranceBar mention={HERO.reassurance} className="mt-7" />
            </Reveal>

            <Reveal direction="up" delay={0.48}>
              <ul className="mt-5 flex flex-wrap gap-2.5">
                {HERO.perks.map((perk) => (
                  <li
                    key={perk}
                    className="inline-flex items-center gap-2 rounded-full border border-[#c9baac]/25 bg-[#c9baac]/8 px-3.5 py-1.5 text-xs font-medium text-[#c9baac]"
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    {perk}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          {/* ---------- Colonne visuelle : portrait + mockups ---------- */}
          <div className="order-2 relative mx-auto w-full max-w-md lg:max-w-none">
            {/* Bloc beige en décalage derrière le portrait */}
            <div
              aria-hidden="true"
              className="absolute -inset-3 rotate-[2.5deg] rounded-[2rem] bg-[#c9baac]/90 opacity-[0.16] sm:rotate-[3deg]"
            />
            <div className="relative">
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
                    className="block aspect-[2/3] w-full object-cover object-top"
                  />
                </span>
                <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-[#070707]/90 via-[#070707]/40 to-transparent px-5 pb-4 pt-16">
                  <div>
                    <p className="font-display text-base font-semibold text-white">Stevens Akpovi</p>
                    <p className="mt-0.5 text-xs text-[#c8c8c8]">
                      Concepteur de sites web professionnels
                    </p>
                  </div>
                  <span className="hidden h-2 w-2 rounded-full bg-[#c9baac] sm:block" aria-hidden="true" />
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
        </div>

        {/* Indicateur de défilement */}
        <Reveal direction="fade" delay={0.9}>
          <a
            href="#probleme"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("probleme")?.scrollIntoView({ behavior: "smooth" });
            }}
            aria-label="Découvrir la suite — le problème"
            className="mt-16 flex flex-col items-center gap-2 text-xs tracking-widest text-[#c8c8c8] transition-colors hover:text-[#c9baac] sm:mt-20"
          >
            DÉCOUVRIR
            <motion.span
              animate={reduce ? undefined : { y: [0, 7, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden="true"
            >
              <ChevronDown className="h-4 w-4" />
            </motion.span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
