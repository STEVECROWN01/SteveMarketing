"use client";

import React from "react";
import { PageHero, CTAButton, CTAIcons, ReassuranceBar } from "@/components/marketing/Marketing";
import { ProjectCard } from "@/components/marketing/ProjectCard";
import { Reveal } from "@/components/motion/Reveal";
import { WORKS } from "@/content/site-content";
import { PROJECTS } from "@/lib/site";

/**
 * PAGE RÉALISATIONS — les trois réalisations réelles uniquement,
 * présentées comme la section « Websites We Created » de la
 * référence : grille de cartes (grande capture, nom, « Voir Le
 * Projet ») menant chacune à la page de présentation du projet.
 */
export function PortfolioPage() {
  return (
    <>
      <PageHero
        eyebrow="PROJETS RÉALISÉS · EXPÉRIENCES DIGITALES"
        title={WORKS.title}
        intro={WORKS.intro}
      >
        <CTAButton action={{ kind: "page", page: "contact", section: "devis" }} variant="secondary" size="lg" icon={CTAIcons.quote}>
          Discuter De Mon Projet
        </CTAButton>
      </PageHero>

      <section aria-label="Réalisations de Stevens Akpovi" className="section-bright py-20 sm:py-24 lg:py-28">
        <div className="container-site">
          <div className="grid gap-6 md:grid-cols-2">
            {PROJECTS.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} />
            ))}
          </div>

          <Reveal direction="up" delay={0.15}>
            <div className="mt-14 rounded-2xl bg-[#c9baac] p-8 text-center sm:p-10">
              <p className="font-display text-2xl font-semibold leading-snug text-[#1c1c1c] sm:text-3xl">
                {WORKS.cta}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
                <CTAButton action={{ kind: "calendly" }} variant="dark" size="lg" icon={CTAIcons.calendar}>
                  Réserver Un Appel
                </CTAButton>
                <CTAButton action={{ kind: "page", page: "contact", section: "devis" }} variant="ghostDark" size="lg" icon={CTAIcons.quote}>
                  Demander Un Devis
                </CTAButton>
              </div>
              <ReassuranceBar tone="light" className="mt-6 justify-center" />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
