"use client";

import React from "react";
import { ArrowRight, Star } from "lucide-react";
import { PageHero, CTAButton, CTAIcons, ReassuranceBar } from "@/components/marketing/Marketing";
import { Reveal, RevealText } from "@/components/motion/Reveal";
import { MonoImage } from "@/components/media/Media";
import { useRouter } from "@/components/router-context";
import { CTA_LABELS, WORKS } from "@/content/site-content";
import { PROJECTS } from "@/lib/site";

/**
 * PAGE RÉALISATIONS — les trois réalisations réelles uniquement.
 * La seconde section est présentée exactement comme la page
 * « Our Work » de sheragency.com (design uniquement) : sur fond
 * sombre, chaque projet occupe une ligne pleine largeur — à gauche
 * la mention de catégorie (simple texte avec ÉTOILE au début, posée
 * AU-DESSUS du titre — plus AUCUNE pastille : demandes de l'éditeur
 * 17/11/2026 : « on va croire que c'est un bouton. Or, ce n'est pas
 * un bouton », puis « ça devrait être au-dessus du titre… pas une
 * épingle mais une étoile au début de la mention »), le grand nom
 * du projet (blanc, graisse normale), la phrase descriptive du
 * projet, puis le bouton blanc « Voir Le Projet » ; à droite la
 * grande capture du site. Le clic (bouton ou
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
                {/* Texte : mention au-dessus du titre + grand titre +
                    phrase descriptive + bouton */}
                <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                  {/* Mention de catégorie — SIMPLE TEXTE posé
                      AU-DESSUS du titre (correction de l'éditeur,
                      17/11/2026 : « ça devrait pas être à droite du
                      titre.. ça devrait être au-dessus du titre »),
                      avec une ÉTOILE AU DÉBUT de la mention (« pas une
                      épingle mais plutôt une étoile au début de la
                      mention »). Pas de pastille, pas de fond, pas de
                      bordure : aucune forme de bouton. Étoile remplie
                      (fill-current) pour rester lisible à 14 px. */}
                  <Reveal direction="up">
                    <p className="inline-flex items-center gap-2 text-sm font-medium on-dark-muted">
                      <Star
                        className="h-3.5 w-3.5 shrink-0 fill-current text-[#e4e4e4]/80"
                        aria-hidden="true"
                      />
                      {project.category}
                    </p>
                  </Reveal>

                  <RevealText
                    as="h2"
                    text={project.name}
                    delay={0.08}
                    className="font-display mt-6 text-[clamp(2rem,5vw,3.75rem)] font-normal leading-[1.05] tracking-[-0.02em] text-white"
                  />

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
                  {CTA_LABELS.appel}
                </CTAButton>
                <CTAButton action={{ kind: "page", page: "devis" }} variant="ghostDark" size="lg" icon={CTAIcons.quote}>
                  {CTA_LABELS.devis}
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
