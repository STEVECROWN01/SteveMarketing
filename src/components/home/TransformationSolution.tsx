"use client";

import React, { useState } from "react";
import { Clock, TrendingUp, Users, Home, RefreshCw, Plus, Minus } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading, CTAButton, CTAIcons, RichText } from "@/components/marketing/Marketing";
import { StartProjectButton } from "@/components/marketing/StartProjectButton";
import { useRouter } from "@/components/router-context";
import { MonoImage } from "@/components/media/Media";
import { TRANSFORMATION, SOLUTION } from "@/content/site-content";
import { ASSETS } from "@/lib/site";

const BENEFIT_ICONS = [Clock, TrendingUp, Users, Home, RefreshCw];

/**
 * SECTION 04 — LA TRANSFORMATION (fond sombre)
 * SECTION 05 — MA SOLUTION (fond sombre, trois piliers)
 */
export function TransformationSection() {
  return (
    <section
      id="transformation"
      aria-labelledby="transformation-titre"
      className="section-dark scroll-mt-20 py-20 sm:py-24 lg:py-32"
    >
      <div className="container-site">
        <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 xl:gap-24">
          {/* Visuel */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none lg:order-2">
            <div
              aria-hidden="true"
              className="absolute -inset-3 -rotate-[2.5deg] rounded-[2rem] bg-[#e4e4e4] opacity-[0.12]"
            />
            <Reveal direction="right">
              <MonoImage
                src={ASSETS.benefitGrowth}
                alt="Illustration : croissance de l'activité grâce à une présence professionnelle en ligne"
                width={1280}
                height={853}
                className="relative rounded-2xl border border-[#e4e4e4]/12 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.7)]"
              />
            </Reveal>
          </div>

          {/* Texte */}
          <div className="lg:order-1">
            <SectionHeading eyebrow={TRANSFORMATION.eyebrow} title={TRANSFORMATION.title} tone="dark" />
            <Reveal direction="up" delay={0.15}>
              <RichText text={TRANSFORMATION.text} className="text-body mt-6 max-w-xl on-dark-muted" />
            </Reveal>
          </div>
        </div>

        {/* Bénéfices */}
        <div className="mt-16 sm:mt-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {TRANSFORMATION.benefits.map((benefit, i) => {
              const Icon = BENEFIT_ICONS[i] ?? TrendingUp;
              return (
                <Reveal key={benefit.title} direction="up" delay={i * 0.06} as="article">
                  <div className="group h-full rounded-2xl border border-[#e4e4e4]/12 bg-[#232323] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#e4e4e4]/35">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e4e4e4]/12 text-[#e4e4e4]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 font-display text-base font-semibold text-white">
                      {benefit.title}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-[#c8c8c8]">{benefit.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal direction="up" delay={0.15}>
            <div className="mt-12">
              <CTAButton
                action={{ kind: "page", page: "devis" }}
                variant="primary"
                size="lg"
                icon={CTAIcons.quote}
              >
                {TRANSFORMATION.cta}
              </CTAButton>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** SECTION 05 — « COMMENT ÇA FONCTIONNE ? » (fond sombre)
 *  Ex-« UNE APPROCHE QUI VA AU-DELÀ DU DESIGN », renommée et
 *  refondée à la demande de l'éditeur (13/11/2026) :
 *  à gauche, titre « Un processus clair. Une collaboration
 *  structurée », texte « Je ne crée pas simplement des sites web… »
 *  et deux boutons (« Démarrons Votre Projet » blanc style header,
 *  « Voir Nos Travaux » noir) ; à droite, SIX cartes à accordéon
 *  « + »/« − » — numéros stylisés en angle supérieur GAUCHE, plus
 *  de mention « Pilier 01 », et la carte « Comprendre votre
 *  activité avant de concevoir votre site. » a été supprimée. */
export function SolutionSection() {
  const router = useRouter();
  // Une seule étape ouverte à la fois — la première par défaut,
  // comme le déroulé de lecture de la référence.
  const [open, setOpen] = useState<number | null>(0);

  const goToDevis = () => router.navigate("devis");

  return (
    <section
      id="solution"
      aria-label="Comment ça fonctionne — processus de collaboration"
      className="section-dark relative scroll-mt-20 py-20 sm:py-24 lg:py-32"
    >
      {/* Barre de séparation à extrémités fondues — fade-in à gauche,
          fade-out à droite, comme toutes les barres de séparation du
          site (demande de l'éditeur, 15/11/2026) ; remplace l'ancienne
          bordure pleine. */}
      <div aria-hidden="true" className="separator-fade absolute inset-x-0 top-0" />
      <div className="container-site">
        <div className="grid gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          {/* Colonne gauche : titre, texte, boutons */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading eyebrow={SOLUTION.eyebrow} title={SOLUTION.title} tone="dark" />
            <Reveal direction="up" delay={0.15}>
              <RichText text={SOLUTION.text} className="text-body mt-6 max-w-xl on-dark-muted" />
            </Reveal>
            <Reveal direction="up" delay={0.2}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {/* Bouton blanc « Démarrons Votre Projet » — exactement
                    comme celui du header (pastille flèche ↗) ; mène à la
                    page de demande de devis. */}
                <StartProjectButton
                  label={SOLUTION.cta1}
                  onClick={goToDevis}
                  className="min-h-[52px]"
                />
                {/* Bouton noir « Voir Nos Travaux » — exactement comme le
                    bouton « Parlons De Votre Projet » (pastille noire,
                    remplissage #3c3c3c au survol) ; mène aux réalisations. */}
                <CTAButton
                  action={{ kind: "page", page: "realisations" }}
                  variant="dark"
                  size="lg"
                >
                  {SOLUTION.cta2}
                </CTAButton>
              </div>
            </Reveal>
          </div>

          {/* Colonne droite : six cartes à accordéon « + »/« − » */}
          <ol className="flex flex-col gap-4">
            {SOLUTION.steps.map((step, i) => {
              const isOpen = open === i;
              return (
                <Reveal key={step.name} direction="left" delay={0.06 * i} as="li">
                  <div
                    className={`relative overflow-hidden rounded-2xl border bg-[#232323] transition-colors duration-300 ${
                      isOpen ? "border-[#e4e4e4]/35" : "border-[#e4e4e4]/12"
                    }`}
                  >
                    {/* Numérotation stylisée — angle supérieur GAUCHE
                        (demande de l'éditeur ; elle était à droite). */}
                    <span
                      aria-hidden="true"
                      className="font-display pointer-events-none absolute -left-2 -top-6 select-none text-[5.5rem] font-bold leading-none text-[#e4e4e4]/10"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      aria-controls={`etape-panneau-${i}`}
                      id={`etape-bouton-${i}`}
                      className="relative flex w-full items-center justify-between gap-4 px-6 py-6 text-left focus-visible:outline-2 focus-visible:outline-offset-4 sm:px-8"
                    >
                      <span className="font-display text-xl font-semibold leading-snug text-white sm:text-2xl">
                        {step.name}
                      </span>
                      {/* Bascule « + »/« − » à droite de la carte */}
                      <span
                        aria-hidden="true"
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
                          isOpen
                            ? "border-[#e4e4e4] bg-[#e4e4e4] text-[#1c1c1c]"
                            : "border-[#e4e4e4]/25 text-[#e4e4e4]"
                        }`}
                      >
                        {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </span>
                    </button>

                    {/* Panneau : hauteur animée via grid-template-rows */}
                    <div
                      id={`etape-panneau-${i}`}
                      role="region"
                      aria-labelledby={`etape-bouton-${i}`}
                      className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-6 pb-7 sm:px-8">
                          <RichText
                            text={step.text}
                            className="max-w-xl text-[15px] leading-relaxed text-[#c8c8c8]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
