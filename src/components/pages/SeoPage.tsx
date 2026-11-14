"use client";

import React from "react";
import {
  Search,
  FileSearch,
  KeyRound,
  LayoutTemplate,
  PenLine,
  LineChart,
  Globe,
  ArrowRight,
  Check,
} from "lucide-react";
import { useRouter } from "@/components/router-context";
import {
  PageHero,
  SectionHeading,
  CTAButton,
  CTAIcons,
  ReassuranceBar,
} from "@/components/marketing/Marketing";
import { Reveal } from "@/components/motion/Reveal";

/**
 * PAGE RÉFÉRENCEMENT SEO (demande de l'éditeur, 15/11/2026) — page
 * dédiée au service de référencement, designée dans la même langue
 * visuelle que le reste du site (alternance de fonds sombres/clairs,
 * grands titres, cartes, boutons pilule). Contenu éditorial dérivé
 * des éléments validés du site : « Référencement approfondi sur les
 * moteurs de recherche », « Optimisation SEO de base incluse » et la
 * FAQ — aucune statistique ni promesse inventée.
 * La section « Référencement International SEO » porte
 * id="seo-international" : le menu plein écran y ancre directement
 * (#/referencement-seo/seo-international).
 */

const SEO_ACTIONS = [
  {
    icon: FileSearch,
    title: "Audit de votre présence actuelle",
    text: "J'analyse votre site tel que les moteurs de recherche le comprennent : structure, titres, descriptions, images et éléments techniques de base.",
  },
  {
    icon: KeyRound,
    title: "Recherche de mots-clés",
    text: "Nous identifions les recherches réellement utilisées par vos futurs clients lorsqu'ils cherchent vos prestations.",
  },
  {
    icon: LayoutTemplate,
    title: "Optimisation des pages",
    text: "Titres, descriptions, structure des contenus et images sont retravaillés pour faciliter la compréhension de votre site par les moteurs de recherche.",
  },
  {
    icon: PenLine,
    title: "Contenus orientés référencement",
    text: "Les textes sont rédigés ou ajustés pour répondre aux questions de vos visiteurs et renforcer votre pertinence sur vos sujets clés.",
  },
  {
    icon: LineChart,
    title: "Suivi et ajustements",
    text: "Le référencement se construit dans la durée : les résultats sont suivis et les actions ajustées en fonction de votre marché.",
  },
];

const SEO_STEPS = [
  {
    name: "Audit initial",
    text: "État des lieux de votre site et de sa visibilité actuelle, et définition des priorités.",
  },
  {
    name: "Stratégie de référencement",
    text: "Choix des mots-clés et des pages à travailler, adaptés à votre marché et à vos objectifs.",
  },
  {
    name: "Mise en œuvre",
    text: "Optimisation technique et éditoriale de vos pages, dans la continuité de votre activité.",
  },
  {
    name: "Suivi durable",
    text: "Accompagnement dans la durée : lecture des résultats et ajustements réguliers.",
  },
];

export function SeoPage() {
  const router = useRouter();

  return (
    <>
      {/* ---------- En-tête de page ---------- */}
      <PageHero
        eyebrow="RÉFÉRENCEMENT · SEO"
        title="Référencement SEO : être trouvé par ceux qui vous cherchent."
        intro="Améliorez votre positionnement sur Google, renforcez votre visibilité et développez une présence organique durable grâce à une stratégie de référencement adaptée à votre marché."
      >
        <div className="flex flex-col gap-3.5 sm:flex-row sm:flex-wrap">
          <CTAButton action={{ kind: "calendly" }} variant="primary" size="lg" icon={CTAIcons.calendar}>
            Réserver Un Appel
          </CTAButton>
          <CTAButton action={{ kind: "page", page: "devis" }} variant="ghostLight" size="lg" icon={CTAIcons.quote}>
            Demander Un Devis Personnalisé
          </CTAButton>
        </div>
        <ReassuranceBar className="mt-6" />
      </PageHero>

      {/* ---------- Ce que comprend le référencement ---------- */}
      <section aria-label="Ce que comprend une stratégie de référencement" className="section-light bg-grid-light py-20 sm:py-24 lg:py-28">
        <div className="container-site">
          <SectionHeading
            eyebrow="RÉFÉRENCEMENT APPROFONDI"
            title="Ce que comprend une stratégie de référencement."
            tone="light"
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SEO_ACTIONS.map((item, i) => (
              <Reveal key={item.title} direction="up" delay={i * 0.05} as="article">
                <div className="group flex h-full flex-col rounded-2xl border border-[#e4e4e4] bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(28,28,28,0.3)]">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1c1c1c] text-[#e4e4e4] transition-colors duration-300 group-hover:bg-[#e4e4e4] group-hover:text-[#1c1c1c]">
                      <item.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="font-display text-sm font-semibold text-[#525252]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold text-[#1c1c1c]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#555555]">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- SEO de base / référencement approfondi ---------- */}
      <section aria-label="SEO de base et référencement approfondi" className="section-dark relative py-20 sm:py-24 lg:py-28">
        <div aria-hidden="true" className="separator-fade absolute inset-x-0 top-0" />
        <div className="container-site">
          <SectionHeading
            eyebrow="DEUX NIVEAUX, UNE MÊME EXIGENCE"
            title="SEO de base ou référencement approfondi ?"
            tone="dark"
            align="center"
            className="mx-auto"
          />
          <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-2">
            <Reveal direction="right" as="article">
              <div className="h-full rounded-2xl border border-[#e4e4e4]/25 bg-[#232323] p-7 sm:p-8">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e4e4e4]/12 text-[#e4e4e4]">
                  <Check className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-6 font-display text-xl font-semibold text-white">
                  Optimisation SEO de base — incluse
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed text-[#c8c8c8]">
                  Chaque site que je conçois est livré avec les optimisations essentielles :
                  titres, descriptions, structure, images et éléments techniques de base. C'est
                  le socle — sans facturation supplémentaire.
                </p>
              </div>
            </Reveal>
            <Reveal direction="left" delay={0.08} as="article">
              <div className="h-full rounded-2xl border border-[#e4e4e4]/35 bg-[#232323] p-7 sm:p-8">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e4e4e4] text-[#1c1c1c]">
                  <Search className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-6 font-display text-xl font-semibold text-white">
                  Référencement approfondi — prestation dédiée
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed text-[#c8c8c8]">
                  Au-delà du socle : une stratégie de référencement complète, adaptée à votre
                  marché, pour améliorer votre positionnement sur Google et développer une
                  présence organique durable. C'est le cœur de cette page.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Référencement international ---------- */}
      <section
        id="seo-international"
        aria-label="Référencement international SEO"
        className="section-bright scroll-mt-20 py-20 sm:py-24 lg:py-28"
      >
        <div className="container-site">
          <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
            <div>
              <Reveal direction="up">
                <p className="text-eyebrow">RÉFÉRENCEMENT INTERNATIONAL SEO</p>
              </Reveal>
              <Reveal direction="up" delay={0.08}>
                <h2 className="text-section-title mt-4 text-[#1c1c1c]">
                  Une visibilité au-delà de vos frontières.
                </h2>
              </Reveal>
              <Reveal direction="up" delay={0.16}>
                <p className="text-body mt-6 max-w-xl text-[#555555]">
                  Vous visez des clients dans plusieurs pays ou plusieurs langues ? Le
                  référencement international adapte votre présence à chaque marché : contenus
                  adaptés à chaque audience, structure pensée pour les recherches locales et
                  cohérence de votre image professionnelle d'un pays à l'autre.
                </p>
                <div className="mt-8">
                  <CTAButton action={{ kind: "page", page: "devis" }} variant="ghostDark" size="lg">
                    Discuter De Mon Marché International
                  </CTAButton>
                </div>
              </Reveal>
            </div>
            <Reveal direction="left" delay={0.1}>
              <div className="rounded-2xl border border-[#e4e4e4] bg-white p-7 sm:p-9">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1c1c1c] text-[#e4e4e4]">
                  <Globe className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-6 font-display text-xl font-semibold text-[#1c1c1c]">
                  Concrètement, pour votre activité
                </h3>
                <ul className="mt-5 space-y-4">
                  {[
                    "Des contenus pensés pour chaque langue et chaque audience visée.",
                    "Une structure de site qui facilite la compréhension par les moteurs de recherche, marché après marché.",
                    "Une stratégie cohérente avec votre positionnement de professionnel indépendant.",
                    "Un accompagnement à distance, au-delà des frontières.",
                  ].map((point) => (
                    <li key={point} className="flex items-start gap-3 text-[15px] leading-relaxed text-[#555555]">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#1c1c1c]" aria-hidden="true" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Comment je travaille ---------- */}
      <section aria-label="Comment je travaille le référencement" className="section-dark relative py-20 sm:py-24 lg:py-28">
        <div aria-hidden="true" className="separator-fade absolute inset-x-0 top-0" />
        <div className="container-site">
          <SectionHeading
            eyebrow="MA MÉTHODE"
            title="Comment je travaille votre référencement."
            tone="dark"
          />
          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SEO_STEPS.map((step, i) => (
              <Reveal key={step.name} direction="up" delay={i * 0.05} as="li">
                <div className="h-full rounded-2xl border border-[#e4e4e4]/12 bg-[#232323] p-6">
                  <p className="text-[11px] font-semibold tracking-widest text-[#e4e4e4] uppercase">
                    Étape {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-3 font-display text-lg font-semibold text-white">{step.name}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-[#c8c8c8]">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>

          {/* Lien croisé vers la publicité Meta Ads — l'autre levier de
              visibilité (génération de trafic de la méthode). */}
          <Reveal direction="up" delay={0.15}>
            <button
              type="button"
              onClick={() => router.navigate("publicite")}
              className="group mt-10 inline-flex items-center gap-2 rounded-full border border-[#e4e4e4]/30 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-300 hover:border-[#e4e4e4] hover:bg-[#e4e4e4] hover:text-[#1c1c1c]"
            >
              Vous préférez une visibilité immédiate ? Publicité Meta Ads
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </button>
          </Reveal>
        </div>
      </section>

      {/* ---------- Appel à l'action final ---------- */}
      <section aria-label="Parlons de votre visibilité" className="section-deep relative overflow-hidden py-20 sm:py-24 lg:py-28">
        <div className="bg-grid-dark absolute inset-0" aria-hidden="true" />
        <div className="container-site relative text-center">
          <Reveal direction="up">
            <p className="text-eyebrow">PARLONS DE VOTRE VISIBILITÉ</p>
            <h2 className="text-section-title mx-auto mt-4 max-w-2xl text-white">
              Votre site mérite d'être trouvé.
            </h2>
          </Reveal>
          <Reveal direction="up" delay={0.12}>
            <div className="mt-9 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
              <CTAButton action={{ kind: "calendly" }} variant="primary" size="lg" icon={CTAIcons.calendar}>
                Réserver Un Appel
              </CTAButton>
              <CTAButton action={{ kind: "page", page: "devis" }} variant="secondary" size="lg" icon={CTAIcons.quote}>
                Demander Un Devis Personnalisé
              </CTAButton>
            </div>
            <ReassuranceBar className="mt-7 justify-center" />
          </Reveal>
        </div>
      </section>
    </>
  );
}
