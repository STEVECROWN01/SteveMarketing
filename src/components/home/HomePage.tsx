"use client";

import React from "react";
import { Hero } from "@/components/home/Hero";
import { ProblemSection, QuestioningSection } from "@/components/home/ProblemQuestioning";
import { TransformationSection, SolutionSection } from "@/components/home/TransformationSolution";
import { ServicesSection, IncludedSection } from "@/components/home/ServicesSections";
import { WorksSection } from "@/components/home/WorksSection";
import { AboutSection } from "@/components/home/MethodAbout";
import { FaqSection, FinalCtaSection } from "@/components/home/FaqFinal";
import { FadeSeparator } from "@/components/marketing/Marketing";
import { Reveal } from "@/components/motion/Reveal";
import { TARGETS } from "@/content/site-content";

/** Bandeau « à qui s'adressent les services » — sous le Hero.
 *  Plus de trait supérieur : le hero se fond dans cette section par un
 *  dégradé (demande de l'éditeur, 13/11/2026). */
function AudienceStrip() {
  return (
    <section
      aria-label="À qui s'adressent les services de Stevens Akpovi"
      className="section-dark py-10 sm:py-12"
    >
      <div className="container-site">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-10">
          <Reveal direction="right" className="shrink-0">
            <p className="text-eyebrow">{TARGETS.eyebrow}</p>
            <h2 className="text-card-title mt-2 max-w-xs text-white">{TARGETS.title}</h2>
          </Reveal>
          <Reveal direction="left" delay={0.1} className="min-w-0 flex-1">
            <ul className="flex flex-wrap gap-2.5">
              {TARGETS.items.map((target) => (
                <li
                  key={target}
                  className="inline-flex min-h-[40px] items-center rounded-full border border-[#e4e4e4]/15 bg-[#232323] px-4 py-2 text-[13px] text-[#d9d9d9]"
                >
                  {target}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** Page d'accueil — composition des sections (13/11/2026 :
 *  « DES SOLUTIONS ADAPTÉES » entre « ET SI VOTRE SITE DEVENAIT… » et
 *  « COMMENT ÇA FONCTIONNE ? » ; sections « DÉVELOPPER VOTRE
 *  VISIBILITÉ » et « COMMENT NOUS ALLONS TRAVAILLER ENSEMBLE »
 *  supprimées à la demande de l'éditeur).
 *  14/11/2026 : traits de séparation à extrémités fondues entre
 *  « POUR QUI JE CONÇOIS CES SITES » ↔ « VOTRE ACTIVITÉ MÉRITE… »
 *  et « COMMENT ÇA FONCTIONNE ? » ↔ « DAVANTAGE DE VALEUR… ». */
export function HomePage() {
  return (
    <>
      <Hero />
      <AudienceStrip />
      <FadeSeparator />
      <ProblemSection />
      <QuestioningSection />
      <TransformationSection />
      <ServicesSection />
      <SolutionSection />
      <FadeSeparator />
      <IncludedSection />
      <WorksSection />
      <AboutSection />
      <FaqSection />
      <FinalCtaSection />
    </>
  );
}
