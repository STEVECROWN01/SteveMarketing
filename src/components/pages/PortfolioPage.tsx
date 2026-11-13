"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { PageHero, CTAButton, CTAIcons, ReassuranceBar } from "@/components/marketing/Marketing";
import { Reveal, RevealText } from "@/components/motion/Reveal";
import { MonoImage } from "@/components/media/Media";
import { useRouter } from "@/components/router-context";
import { WORKS } from "@/content/site-content";
import { PROJECTS } from "@/lib/site";

/**
 * PAGE RÉALISATIONS — les trois réalisations réelles uniquement.
 * La seconde section est présentée exactement comme la page
 * « Our Work » de sheragency.com (design uniquement) : sur fond
 * sombre, chaque projet occupe une ligne pleine largeur — à gauche
 * la pastille de catégorie, le grand nom du projet (blanc, graisse
 * normale) et le bouton blanc « Voir Le Projet » ; à droite la
 * grande capture du site. Le clic (bouton ou capture) mène à la
 * page de présentation du projet (#/projet/<id>), comme les case
 * studies de la référence.
 */
export function PortfolioPage() {
  const router = useRouter();

  const goProject = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    router.navigate("projet", id);
  };

  return (
    <>
      <PageHero
        eyebrow="PROJETS RÉALISÉS · EXPÉRIENCES DIGITALES"
        title={WORKS.title}
        intro={WORKS.intro}
      >
        <CTAButton action={{ kind: "page", page: "devis" }} variant="secondary" size="lg" icon={CTAIcons.quote}>
          Discuter De Mon Projet
        </CTAButton>
      </PageHero>

      {/* ---------- Réalisations — présentation façon « Our Work » ---------- */}
      <section
        aria-label="Réalisations de Stevens Akpovi"
        className="section-deep bg-grid-dark scroll-mt-20 py-20 sm:py-24 lg:py-28"
      >
        <div className="container-site">
          <div className="flex flex-col gap-20 lg:gap-28">
            {PROJECTS.map((project, i) => (
              <article
                key={project.id}
                className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
              >
                {/* Texte : pastille catégorie + grand titre + bouton */}
                <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                  <Reveal direction="up">
                    <span className="inline-flex rounded-full bg-[#e4e4e4] px-4 py-2.5 text-sm font-medium text-[#1c1c1c]">
                      {project.category}
                    </span>
                  </Reveal>

                  <RevealText
                    as="h2"
                    text={project.name}
                    delay={0.08}
                    className="font-display mt-6 text-[clamp(2rem,5vw,3.75rem)] font-normal leading-[1.05] tracking-[-0.02em] text-white"
                  />

                  <Reveal direction="up" delay={0.16}>
                    <div className="mt-9">
                      {/* Bouton blanc « Voir Le Projet » — même style que le
                          bouton hero (fond #ffffff, bordure #e4e4e4 devenue
                          beige au survol, remplissage progressif, flèche). */}
                      <a
                        href={`#/projet/${project.id}`}
                        onClick={(e) => goProject(e, project.id)}
                        aria-label={`Voir Le Projet — ${project.name}`}
                        className="group/btn btn-fill inline-flex min-h-[48px] items-center justify-center gap-2.5 rounded-full border border-[#e4e4e4] bg-white px-6 py-3.5 text-sm font-medium tracking-[0.01em] text-[#1c1c1c] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-[#c9baac] focus-visible:outline-2 focus-visible:outline-offset-4 [&::before]:bg-[#e4e4e4]"
                      >
                        Voir Le Projet
                        <ArrowRight
                          className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1"
                          aria-hidden="true"
                        />
                      </a>
                    </div>
                  </Reveal>
                </div>

                {/* Grande capture du site — monochrome au repos,
                    couleur au survol (comme la référence) */}
                <Reveal direction={i % 2 === 1 ? "right" : "left"} delay={0.1} className={i % 2 === 1 ? "lg:order-1" : ""}>
                  <a
                    href={`#/projet/${project.id}`}
                    onClick={(e) => goProject(e, project.id)}
                    aria-label={`Aperçu du site ${project.name} — Voir Le Projet`}
                    className="group media-group block overflow-hidden rounded-2xl border border-[#e4e4e4]/12"
                  >
                    <MonoImage
                      src={project.desktop}
                      src2x={project.desktop2x}
                      alt={`Aperçu du site ${project.name}`}
                      width={1440}
                      height={900}
                      eager={i === 0}
                    />
                  </a>
                </Reveal>
              </article>
            ))}
          </div>

          <Reveal direction="up" delay={0.15}>
            <div className="mt-20 rounded-2xl bg-[#e4e4e4] p-8 text-center sm:mt-24 sm:p-10">
              <p className="font-display text-2xl font-semibold leading-snug text-[#1c1c1c] sm:text-3xl">
                {WORKS.cta}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
                <CTAButton action={{ kind: "calendly" }} variant="dark" size="lg" icon={CTAIcons.calendar}>
                  Réserver Un Appel
                </CTAButton>
                <CTAButton action={{ kind: "page", page: "devis" }} variant="ghostDark" size="lg" icon={CTAIcons.quote}>
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
