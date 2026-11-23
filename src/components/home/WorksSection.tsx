"use client";

import React from "react";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading, CTAButton, CTAIcons } from "@/components/marketing/Marketing";
import { ProjectCard } from "@/components/marketing/ProjectCard";
import { CTA_LABELS, WORKS } from "@/content/site-content";
import { PROJECTS } from "@/lib/site";

/**
 * SECTION 09 — RÉALISATIONS (fond blanc)
 * Présentation calquée sur la section « Websites We Created » de
 * sheragency.com : titre + double CTA (bouton noir « Demander Un
 * Devis », bouton contour « Voir Mes Réalisations »), puis
 * grille de cartes projet — les TROIS projets sur une seule
 * ligne (demande de l'éditeur) — grande capture, nom, catégorie
 * et bouton « Voir Le Projet » ouvrant la page de présentation du
 * projet (#/projet/<id>), exactement comme la référence ouvre ses
 * pages de case study. Captures en COULEUR (16/11/2026).
 */
export function WorksSection() {
  return (
    /* Padding inférieur réduit d'un cran (demande de l'éditeur,
       16/11/2026) : l'espace clair entre les dernières cartes et la
       bande noire défilante qui suit était trop généreux —
       80/96/128 px → 64/80/96 px. Le padding supérieur (vers la
       section précédente) est inchangé. */
    <section
      id="realisations"
      aria-labelledby="realisations-titre"
      className="section-bright scroll-mt-20 py-20 pb-16 sm:py-24 sm:pb-20 lg:py-32 lg:pb-24"
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
                {CTA_LABELS.devis}
              </CTAButton>
              <CTAButton
                action={{ kind: "page", page: "realisations" }}
                variant="ghostDark"
                size="lg"
                icon={CTAIcons.works}
              >
                {CTA_LABELS.realisations}
              </CTAButton>
            </div>
          </Reveal>
        </div>

        {/* Grille des projets — captures en COULEUR + « Voir Le
            Projet ». QUATRE projets depuis le 24/11/2026 (volet 13 :
            ajout d'ALEXANDRE MOREL) : la grille passe à DEUX colonnes
            (2×2) au lieu de trois — quatre cartes sur une grille de
            trois auraient laissé la quatrième seule orpheline sur sa
            rangée ; deux rangées de deux restent équilibrées à
            toutes les largeurs. */}
        <div className="mt-12 grid gap-5 sm:mt-14 md:grid-cols-2">
          {PROJECTS.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
