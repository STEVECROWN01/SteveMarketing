"use client";

import React from "react";
import { ArrowRight, Pin } from "lucide-react";
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
 * le grand nom du projet (blanc, graisse normale) accompagné de la
 * mention de catégorie (simple texte + icône d'épingle à droite du
 * titre — plus AUCUNE pastille, demande de l'éditeur 17/11/2026 :
 * « on va croire que c'est un bouton. Or, ce n'est pas un bouton »),
 * la phrase descriptive du projet, puis le bouton blanc « Voir Le
 * Projet » ; à droite la grande capture du site. Le clic (bouton ou
 * capture) mène à la page de présentation du projet (#/projet/<id>),
 * comme les case studies de la référence.
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

      {/* ---------- Réalisations — présentation façon « Our Work » ----------
          Fond SANS grille (demande de l'éditeur, 15/11/2026) : seule
          la première section « PROJETS RÉALISÉS · EXPÉRIENCES
          DIGITALES » garde le fond quadrillé ; les projets sont
          séparés par des traits de séparation horizontaux à
          extrémités fondues (le style du site). */}
      <section
        aria-label="Réalisations de Stevens Akpovi"
        className="section-deep scroll-mt-20 py-20 sm:py-24 lg:py-28"
      >
        <div className="container-site">
          <div className="flex flex-col gap-14 lg:gap-20">
            {PROJECTS.map((project, i) => (
              <React.Fragment key={project.id}>
                {i > 0 && <div aria-hidden="true" className="separator-fade" />}
                <article
                  className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
                >
                {/* Texte : grand titre (mention à sa droite) +
                    phrase descriptive + bouton */}
                <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                  {/* Mention de catégorie — PLUS DE PASTILLE BLANCHE
                      (demande de l'éditeur, 17/11/2026 : elle donnait
                      l'impression d'être un bouton alors qu'elle n'en
                      est pas un). C'est désormais un SIMPLE TEXTE posé
                      à DROITE du titre, suivi d'une icône d'épingle :
                      aucun fond, aucune bordure, aucune forme de
                      bouton. Quand le titre est trop long pour la
                      colonne, la mention passe naturellement sur la
                      ligne suivante (flex-wrap, alignée sur la ligne
                      de base du titre quand ils partagent la ligne). */}
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2.5">
                    <RevealText
                      as="h2"
                      text={project.name}
                      delay={0.08}
                      className="font-display text-[clamp(2rem,5vw,3.75rem)] font-normal leading-[1.05] tracking-[-0.02em] text-white"
                    />
                    <Reveal direction="up" delay={0.24}>
                      <p className="text-sm font-medium on-dark-muted">
                        {project.category}
                        <Pin
                          className="ml-1.5 inline-block h-3.5 w-3.5 -translate-y-[1px] text-[#e4e4e4]/80"
                          aria-hidden="true"
                        />
                      </p>
                    </Reveal>
                  </div>

                  {/* Phrase descriptive du projet, sous le titre
                      (demande de l'éditeur, 17/11/2026). */}
                  <Reveal direction="up" delay={0.16}>
                    <p className="text-body on-dark-muted mt-5 max-w-md">
                      {project.description}
                    </p>
                  </Reveal>

                  <Reveal direction="up" delay={0.22}>
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

                {/* Grande capture du site — sur bureau : noir et
                    blanc au repos, la véritable couleur se révèle +
                    zoom léger au survol ; sur tablette et mobile :
                    couleur d'origine directe (demande de l'éditeur,
                    16/11/2026). */}
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
                      sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 560px"
                      src2xWidth={1920}
                    />
                  </a>
                </Reveal>
              </article>
              </React.Fragment>
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
