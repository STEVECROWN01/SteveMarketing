"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { PageHero, SectionHeading, CTAButton, CTAIcons, ReassuranceBar } from "@/components/marketing/Marketing";
import { Reveal } from "@/components/motion/Reveal";
import { BrowserMockup, PhoneMockup } from "@/components/media/Media";
import { ProjectCard } from "@/components/marketing/ProjectCard";
/* VOLET 18 — i18n : CTA_LABELS via useContenu, textes inline et
   attributs interpolés via t()/tf().
   VOLET 19 (26/11/2026) — PORTFOLIO ÉVOLUTIF : les pages projet
   couvrent AUSSI les projets publiés depuis l'espace admin ; la
   capture mobile est OPTIONNELLE (le bureau occupe alors toute la
   largeur) ; la grille « autres projets » suit la même règle que
   l'accueil (trois → trois colonnes, quatre ou plus → deux). */
import { useContenu, useT } from "@/i18n";
import { useTousLesProjets } from "@/hooks/use-projets-admin";
import { PortfolioPage } from "./PortfolioPage";
import { SITE } from "@/lib/site";

/**
 * PAGE DE PRÉSENTATION D'UN PROJET (#/projet/<id>)
 * Structure inspirée des pages de cas client de sheragency.com :
 * titre du projet + « Voir le site en direct », section « Le Site »
 * avec les aperçus desktop et mobile, section « Autres Projets »,
 * et appel à l'action final. Contenu strictement factuel —
 * uniquement les données réelles du projet.
 */
export function ProjectPage({ projectId }: { projectId: string }) {
  const { t, tf } = useT();
  const { CTA_LABELS } = useContenu();
  const { projets: PROJECTS, chargement } = useTousLesProjets();
  const index = PROJECTS.findIndex((p) => p.id === projectId);
  /* VOLET 19 — identifiant ADMIN en cours de chargement : écran
     d'attente discret ; identifiant définitivement inconnu : repli
     sur la liste des réalisations (comportement historique). */
  if (index === -1) {
    if (chargement) {
      return (
        <div className="flex min-h-[60svh] items-center justify-center" aria-hidden="true">
          <Loader2 className="h-7 w-7 animate-spin text-[#e4e4e4]/70" />
        </div>
      );
    }
    return <PortfolioPage />;
  }
  const project = PROJECTS[index];
  const others = PROJECTS.filter((p) => p.id !== projectId);

  return (
    <>
      {/* ---------- En-tête du projet ---------- */}
      <PageHero
        eyebrow={tf("PROJETS RÉALISÉS · PROJET {num}", { num: String(index + 1).padStart(2, "0") })}
        title={project.name}
        intro={project.description}
      >
        <div className="flex flex-col gap-3.5 sm:flex-row sm:flex-wrap">
          <CTAButton
            action={{ kind: "external", url: project.url }}
            variant="secondary"
            size="lg"
            icon={CTAIcons.works}
            ariaLabel={tf("{cta} — {name} (nouvel onglet)", { cta: project.cta, name: project.name })}
          >
            {project.cta}
          </CTAButton>
          <CTAButton
            action={{ kind: "page", page: "devis" }}
            variant="ghostLight"
            size="lg"
            icon={CTAIcons.quote}
          >
            {CTA_LABELS.devis}
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
            eyebrow={t("LE SITE")}
            title={t("Le site, tel qu'il est en ligne.")}
            tone="light"
          />
          <Reveal direction="up" delay={0.15}>
            <p className="text-body mt-6 max-w-2xl on-paper-muted">
              {tf("{category}. Voici les aperçus de la version publiée — l'aperçu bureau et l'aperçu mobile, côte à côte.", { category: project.category })}
            </p>
          </Reveal>

          {/* Bureau et smartphone CÔTE À CÔTE, À LA MÊME HAUTEUR
              (demande de l'éditeur, 17/11/2026 : « la hauteur du
              mockup téléphone doit être à la même hauteur que le
              mockup desktop »). Le mockup téléphone garde son ratio
              390×844 : c'est sa LARGEUR qui est calculée pour que
              sa hauteur naturelle égale celle du mockup bureau.
              Mise en équation (bureau = figcaption c = 26 px mesurés
              + image 1440×900, 2 px de bordure ; téléphone = image
              390×844, 5 px de padding + 2 px de bordure) :
                7 + 2,1641·(X−7) = c + 2 + 0,625·(C − g − X − 2)
              avec C = largeur de la rangée et g = gouttière (48 px,
              lg:gap-12 à partir de lg et au-delà) — d'où
                X = (62,5 % + 4,9 px) / 2,7891
              constante calibrée au pixel par mesure navigateur
              headless (écart résiduel ≤ 0,3 px sur 1024–1920).
              En dessous de lg, la colonne empilée d'origine est
              conservée (téléphone sous le bureau, pleine largeur
              puis 1/3). */}
          <div
            className={`mt-12 flex flex-col gap-8 ${
              project.mobile ? "lg:flex-row lg:items-center lg:gap-12" : ""
            }`}
          >
            <Reveal direction="up" delay={0.1} className="min-w-0 flex-1">
              {/* Aperçu bureau — en COULEUR (mockups projets en couleur,
                  demande de l'éditeur, 16/11/2026) ; coins un peu plus
                  arrondis + zoom au survol (17/11/2026). VOLET 19 :
                  dimensions réelles du projet (admin) pour la réserve
                  de place. */}
              <BrowserMockup
                src={project.desktop}
                src2x={project.desktop2x}
                alt={tf("Aperçu desktop du site {name}", { name: project.name })}
                url={project.url}
                width={project.largeurDesktop ?? 1440}
                height={project.hauteurDesktop ?? 900}
                color
                softRadius
                zoom
                priority
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 80vw, 820px"
              />
            </Reveal>
            {project.mobile ? (
              <Reveal
                direction="left"
                delay={0.2}
                className="w-full shrink-0 sm:w-1/3 lg:w-[calc((62.5%_+_4.9px)/2.789)]"
              >
                {/* Aperçu mobile — coins adoucis (20 px : « l'angle est
                    trop pointu », 17/11/2026) + zoom au survol.
                    VOLET 19 : OPTIONNEL (projet admin sans capture
                    mobile → seul l'aperçu bureau est affiché). */}
                <PhoneMockup
                  src={project.mobile}
                  src2x={project.mobile2x}
                  alt={tf("Aperçu mobile du site {name}", { name: project.name })}
                  width={project.largeurMobile ?? 390}
                  height={project.hauteurMobile ?? 844}
                  color
                  softRadius
                  zoom
                  sizes="(max-width: 640px) 92vw, (max-width: 1023px) 33vw, 290px"
                />
              </Reveal>
            ) : null}
          </div>

          <Reveal direction="up" delay={0.25}>
            <div className="mt-12">
              <CTAButton
                action={{ kind: "external", url: project.url }}
                variant="secondary"
                size="lg"
                icon={CTAIcons.works}
                ariaLabel={tf("{cta} — {name} (nouvel onglet)", { cta: project.cta, name: project.name })}
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
            eyebrow={t("PROJETS RÉALISÉS")}
            title={t("Découvrez les autres réalisations.")}
            tone="light"
          />
          {/* VOLET 19 — même règle que l'accueil : TROIS cartes →
              trois colonnes ; QUATRE ou plus → deux par ligne.
              VOLET 19 — précision (26/11/2026) : mêmes PLAFONDS DE
              LARGEUR que la section « PROJETS RÉALISÉS » de l'accueil
              (mockups plus petits sur tablette et bureau, demande de
              l'éditeur) — la grille était ici pleine largeur du
              conteneur (cartes jusqu'à ~600 px). */}
          <div
            className={`mx-auto mt-12 grid w-full gap-6 ${
              others.length === 3
                ? "md:max-w-[700px] md:grid-cols-3 lg:max-w-[900px]"
                : "md:max-w-[600px] md:grid-cols-2 lg:max-w-[840px]"
            }`}
          >
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
            <p className="text-eyebrow">{t("IL EST TEMPS DE DONNER UNE NOUVELLE DIMENSION À VOTRE ACTIVITÉ")}</p>
          </Reveal>
          <Reveal direction="up" delay={0.08}>
            <h2 id="projet-cta-titre" className="text-section-title mx-auto mt-5 max-w-3xl text-white">
              {t("Votre projet peut être la prochaine réalisation.")}
            </h2>
          </Reveal>
          <Reveal direction="up" delay={0.16}>
            <div className="mt-10 flex flex-col items-center justify-center gap-3.5 sm:flex-row sm:flex-wrap">
              <CTAButton
                action={{ kind: "calendly" }}
                variant="secondary"
                size="lg"
                icon={CTAIcons.calendar}
                ariaLabel={tf("Réserver un appel de 30 minutes sur Calendly — {calendlyMention}", { calendlyMention: SITE.calendlyMention })}
              >
                {CTA_LABELS.appel}
              </CTAButton>
              <CTAButton
                action={{ kind: "page", page: "devis" }}
                variant="ghostLight"
                size="lg"
                icon={CTAIcons.quote}
              >
                {CTA_LABELS.devis}
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
