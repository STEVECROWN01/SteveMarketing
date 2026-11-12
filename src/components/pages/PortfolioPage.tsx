"use client";

import React from "react";
import { PageHero, CTAButton, CTAIcons, ReassuranceBar } from "@/components/marketing/Marketing";
import { ProjectDetail } from "@/components/marketing/ProjectCard";
import { Reveal } from "@/components/motion/Reveal";
import { WORKS } from "@/content/site-content";
import { PROJECTS } from "@/lib/site";

/** PAGE RÉALISATIONS — les trois réalisations réelles uniquement. */
export function PortfolioPage() {
  return (
    <>
      <PageHero
        eyebrow="PROJETS RÉALISÉS · EXPÉRIENCES DIGITALES"
        title={WORKS.title}
        intro={WORKS.intro}
      >
        <CTAButton action={{ kind: "page", page: "contact", section: "devis" }} variant="primary" size="lg" icon={CTAIcons.quote}>
          Discuter de mon projet
        </CTAButton>
      </PageHero>

      <section aria-label="Réalisations de Stevens Akpovi" className="section-dark py-20 sm:py-24 lg:py-28">
        <div className="container-site">
          <div className="flex flex-col gap-8 lg:gap-10">
            {PROJECTS.map((project, i) => (
              <ProjectDetail key={project.id} project={project} index={i} />
            ))}
          </div>

          <Reveal direction="up" delay={0.15}>
            <div className="mt-14 rounded-2xl bg-[#c9baac] p-8 text-center sm:p-10">
              <p className="font-display text-2xl font-semibold leading-snug text-[#1c1c1c] sm:text-3xl">
                {WORKS.cta}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
                <CTAButton action={{ kind: "calendly" }} variant="dark" size="lg" icon={CTAIcons.calendar}>
                  Réserver un appel
                </CTAButton>
                <CTAButton action={{ kind: "page", page: "contact", section: "devis" }} variant="ghostDark" size="lg" icon={CTAIcons.quote}>
                  Demander un devis
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
