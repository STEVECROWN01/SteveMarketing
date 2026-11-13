"use client";

import React from "react";
import { PageHero, SectionHeading, CTAButton, CTAIcons, ReassuranceBar } from "@/components/marketing/Marketing";
import { Reveal } from "@/components/motion/Reveal";
import { BrowserMockup, PhoneMockup } from "@/components/media/Media";
import { ProjectCard } from "@/components/marketing/ProjectCard";
import { PROJECTS, SITE } from "@/lib/site";

/**
 * PAGE DE PRÉSENTATION D'UN PROJET (#/projet/<id>)
 * Structure inspirée des pages de cas client de sheragency.com :
 * titre du projet + « Voir le site en direct », section « Le Site »
 * avec les aperçus desktop et mobile, section « Autres Projets »,
 * et appel à l'action final. Contenu strictement factuel —
 * uniquement les données réelles du projet.
 */
export function ProjectPage({ projectId }: { projectId: string }) {
  const index = PROJECTS.findIndex((p) => p.id === projectId);
  if (index === -1) return null;
  const project = PROJECTS[index];
  const others = PROJECTS.filter((p) => p.id !== projectId);

  return (
    <>
      {/* ---------- En-tête du projet ---------- */}
      <PageHero
        eyebrow={`PROJETS RÉALISÉS · PROJET ${String(index + 1).padStart(2, "0")}`}
        title={project.name}
        intro={project.description}
      >
        <div className="flex flex-col gap-3.5 sm:flex-row sm:flex-wrap">
          <CTAButton
            action={{ kind: "external", url: project.url }}
            variant="secondary"
            size="lg"
            icon={CTAIcons.works}
            ariaLabel={`${project.cta} — ${project.name} (nouvel onglet)`}
          >
            {project.cta}
          </CTAButton>
          <CTAButton
            action={{ kind: "page", page: "devis" }}
            variant="ghostLight"
            size="lg"
            icon={CTAIcons.quote}
          >
            Demander Un Devis
          </CTAButton>
        </div>
        <ReassuranceBar className="mt-6" />
      </PageHero>

      {/* ---------- Le site : aperçus ---------- */}
      <section
        id="le-site"
        aria-labelledby="le-site-titre"
        className="section-light bg-grid-light scroll-mt-20 py-16 sm:py-20 lg:py-24"
      >
        <div className="container-site">
          <SectionHeading
            eyebrow="LE SITE"
            title="Le site, tel qu'il est en ligne."
            tone="light"
          />
          <Reveal direction="up" delay={0.15}>
            <p className="text-body mt-6 max-w-2xl on-paper-muted">
              {project.category}. Voici les aperçus de la version publiée —
              l'aperçu bureau et l'aperçu mobile, côte à côte.
            </p>
          </Reveal>

          <div className="mt-12 flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
            <Reveal direction="up" delay={0.1} className="min-w-0 flex-1">
              <BrowserMockup
                src={project.desktop}
                src2x={project.desktop2x}
                alt={`Aperçu desktop du site ${project.name}`}
                url={project.url}
                width={1440}
                height={900}
                priority
              />
            </Reveal>
            <Reveal direction="left" delay={0.2} className="w-full shrink-0 sm:w-1/3 lg:w-[24%]">
              <PhoneMockup
                src={project.mobile}
                src2x={project.mobile2x}
                alt={`Aperçu mobile du site ${project.name}`}
                width={390}
                height={844}
              />
            </Reveal>
          </div>

          <Reveal direction="up" delay={0.25}>
            <div className="mt-12">
              <CTAButton
                action={{ kind: "external", url: project.url }}
                variant="secondary"
                size="lg"
                icon={CTAIcons.works}
                ariaLabel={`${project.cta} — ${project.name} (nouvel onglet)`}
              >
                {project.cta}
              </CTAButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Autres projets ---------- */}
      <section
        aria-labelledby="autres-projets-titre"
        className="section-bright py-16 sm:py-20 lg:py-24"
      >
        <div className="container-site">
          <SectionHeading
            eyebrow="PROJETS RÉALISÉS"
            title="Découvrez les autres réalisations."
            tone="light"
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {others.map((other) => (
              <ProjectCard key={other.id} project={other} index={PROJECTS.indexOf(other)} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Conversion finale ---------- */}
      <section
        aria-labelledby="projet-cta-titre"
        className="section-deep relative overflow-hidden py-20 sm:py-24 lg:py-28"
      >
        <div className="bg-grid-dark absolute inset-0" aria-hidden="true" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e4e4e4] opacity-[0.08] blur-[130px]"
        />
        <div className="container-site relative text-center">
          <Reveal direction="up">
            <p className="text-eyebrow">IL EST TEMPS DE DONNER UNE NOUVELLE DIMENSION À VOTRE ACTIVITÉ</p>
          </Reveal>
          <Reveal direction="up" delay={0.08}>
            <h2 id="projet-cta-titre" className="text-section-title mx-auto mt-5 max-w-3xl text-white">
              Votre projet peut être la prochaine réalisation.
            </h2>
          </Reveal>
          <Reveal direction="up" delay={0.16}>
            <div className="mt-10 flex flex-col items-center justify-center gap-3.5 sm:flex-row sm:flex-wrap">
              <CTAButton
                action={{ kind: "calendly" }}
                variant="secondary"
                size="lg"
                icon={CTAIcons.calendar}
                ariaLabel={`Réserver un appel de 30 minutes sur Calendly — ${SITE.calendlyMention}`}
              >
                Réserver Un Appel
              </CTAButton>
              <CTAButton
                action={{ kind: "page", page: "devis" }}
                variant="ghostLight"
                size="lg"
                icon={CTAIcons.quote}
              >
                Demander Un Devis
              </CTAButton>
            </div>
          </Reveal>
          <Reveal direction="fade" delay={0.24}>
            <ReassuranceBar className="mt-8 justify-center" />
          </Reveal>
        </div>
      </section>
    </>
  );
}
