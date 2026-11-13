"use client";

import React from "react";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading, CTAButton, CTAIcons } from "@/components/marketing/Marketing";
import { ProjectCard } from "@/components/marketing/ProjectCard";
import { WORKS } from "@/content/site-content";
import { PROJECTS } from "@/lib/site";

/**
 * SECTION 09 — RÉALISATIONS (fond blanc)
 * Présentation calquée sur la section « Websites We Created » de
 * sheragency.com : titre + double CTA (bouton noir « Demander Un
 * Devis », bouton contour « Voir Nos Réalisations »), puis
 * grille de cartes projet — les TROIS projets sur une seule
 * ligne (demande de l'éditeur) — grande capture, nom, catégorie
 * et bouton « Voir Le Projet » ouvrant la page de présentation du
 * projet (#/projet/<id>), exactement comme la référence ouvre ses
 * pages de case study. Captures exclusivement en noir et blanc.
 */
export function WorksSection() {
  return (
    <section
      id="realisations"
      aria-labelledby="realisations-titre"
      className="section-bright scroll-mt-20 py-20 sm:py-24 lg:py-32"
    >
      <div className="container-site">
        {/* Titre + double CTA — comme la colonne gauche de la référence */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow={WORKS.eyebrow}
            title={WORKS.title}
            intro={WORKS.intro}
            tone="light"
            className="max-w-2xl"
          />
          <Reveal direction="up" delay={0.15}>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <CTAButton
                action={{ kind: "page", page: "devis" }}
                variant="dark"
                size="lg"
                icon={CTAIcons.quote}
              >
                Demander Un Devis
              </CTAButton>
              <CTAButton
                action={{ kind: "page", page: "realisations" }}
                variant="ghostDark"
                size="lg"
                icon={CTAIcons.works}
              >
                Voir Nos Réalisations
              </CTAButton>
            </div>
          </Reveal>
        </div>

        {/* Grille des projets — les trois projets présentés sur une seule
            ligne (desktop) ; captures en noir et blanc permanent +
            « Voir Le Projet ». */}
        <div className="mt-12 grid gap-5 sm:mt-14 md:grid-cols-3">
          {PROJECTS.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
