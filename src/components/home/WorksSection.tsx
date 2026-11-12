"use client";

import React from "react";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading, CTAButton, CTAIcons } from "@/components/marketing/Marketing";
import { ProjectCard } from "@/components/marketing/ProjectCard";
import { WORKS } from "@/content/site-content";
import { PROJECTS } from "@/lib/site";
import { useRouter } from "@/components/router-context";

/**
 * SECTION 09 — RÉALISATIONS (fond blanc)
 * Trois réalisations réelles uniquement, présentées sous forme de
 * mockups professionnels (desktop + mobile), monochrome par défaut
 * sur desktop, retour aux couleurs au survol, carte cliquable,
 * ouverture en nouvel onglet.
 */
export function WorksSection() {
  const router = useRouter();
  return (
    <section
      id="realisations"
      aria-labelledby="realisations-titre"
      className="section-bright scroll-mt-20 py-20 sm:py-24 lg:py-32"
    >
      <div className="container-site">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <SectionHeading eyebrow={WORKS.eyebrow} title={WORKS.title} intro={WORKS.intro} tone="light" />
          </div>
          <Reveal direction="up" delay={0.15}>
            <a
              href="#/realisations"
              onClick={(e) => {
                e.preventDefault();
                router.navigate("realisations");
              }}
              className="group inline-flex items-center gap-2 rounded-full border border-[#1c1c1c]/20 px-5 py-2.5 text-sm font-medium text-[#1c1c1c] transition-colors duration-300 hover:border-[#1c1c1c] hover:bg-[#1c1c1c] hover:text-white"
            >
              Voir la page Réalisations
              <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </a>
          </Reveal>
        </div>

        <div className="mt-12 flex flex-col gap-6 sm:mt-14">
          {PROJECTS.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>

        <Reveal direction="up" delay={0.15}>
          <div className="mt-12 rounded-2xl border border-[#e4e4e4] bg-[#f5f5f5] px-7 py-8 text-center sm:px-10 sm:py-10">
            <p className="font-display text-xl font-semibold text-[#1c1c1c] sm:text-2xl">
              {WORKS.cta}
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
              <CTAButton
                action={{ kind: "calendly" }}
                variant="ghostDark"
                size="lg"
                icon={CTAIcons.calendar}
                className="!text-[#1c1c1c] [&::before]:bg-[#e4e4e4]"
              >
                Réserver un appel
              </CTAButton>
              <CTAButton
                action={{ kind: "page", page: "contact", section: "devis" }}
                variant="ghostDark"
                size="lg"
                icon={CTAIcons.quote}
              >
                Demander un devis
              </CTAButton>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
