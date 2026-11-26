"use client";

import React from "react";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading, CTAButton, CTAIcons } from "@/components/marketing/Marketing";
import { ProjectCard } from "@/components/marketing/ProjectCard";
/* VOLET 18 — i18n : CTA_LABELS / WORKS traduits via useContenu.
 * VOLET 19 (26/11/2026) — PORTFOLIO ÉVOLUTIF : les projets PUBLIÉS
 * depuis l'espace admin s'ajoutent aux projets statiques
 * (useTousLesProjets) ; la grille suit la règle demandée par
 * l'éditeur — TROIS projets : trois sur la MÊME ligne ; QUATRE ou
 * plus : TOUJOURS deux par ligne. */
import { useContenu } from "@/i18n";
import { useTousLesProjets } from "@/hooks/use-projets-admin";

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
  const { CTA_LABELS, WORKS } = useContenu();
  const { projets: PROJECTS } = useTousLesProjets();

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
            Projet ».
            VOLET 19 (26/11/2026) — RÈGLE DE PRÉSENTATION (demande de
            l'éditeur) : TROIS projets → TROIS SUR LA MÊME LIGNE ;
            QUATRE OU PLUS → TOUJOURS DEUX PAR LIGNE. Les projets
            ajoutés depuis l'espace admin suivent la même
            présentation, partout.
            VOLET 20 (26/11/2026) — MOCKUPS ENCORE RÉDUITS sur
            tablette et bureau (nouvelle demande de l'éditeur :
            « dans la section MES RÉALISATIONS de cette page,
            reduit la taille des mockup des projects ») : les
            plafonds de largeur de la grille sont resserrés d'un
            cran — trois projets : 640 px / 800 px (au lieu de
            700 / 900) ; quatre et plus : 540 px / 720 px (au lieu
            de 600 / 840). Le mobile (< 768 px) garde ses cartes
            pleine largeur. */}
        <div
          className={`mx-auto mt-12 grid w-full gap-5 sm:mt-14 ${
            PROJECTS.length === 3
              ? "md:max-w-[640px] md:grid-cols-3 lg:max-w-[800px]"
              : "md:max-w-[540px] md:grid-cols-2 lg:max-w-[720px]"
          }`}
        >
          {PROJECTS.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
