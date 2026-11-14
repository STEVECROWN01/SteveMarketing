"use client";

import React from "react";
import {
  Megaphone,
  Target,
  Layers,
  BarChart3,
  Search,
  ArrowRight,
  Facebook,
  Instagram,
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
 * PAGE PUBLICITÉ META ADS (demande de l'éditeur, 15/11/2026) — page
 * dédiée au service de publicité sur Facebook et Instagram,
 * designée dans la même langue visuelle que le reste du site.
 * Contenu éditorial dérivé des éléments validés du site : « Meta
 * Ads — développez votre présence sur Facebook et Instagram grâce à
 * des campagnes publicitaires ciblées et structurées autour de vos
 * objectifs » et l'étape « Génération de trafic » de la méthode —
 * aucune statistique ni promesse inventée.
 */

const ADS_ACTIONS = [
  {
    icon: Target,
    title: "Objectifs de campagne",
    text: "Chaque campagne est structurée autour d'un objectif précis : faire connaître votre activité, générer des demandes ou guider vers une offre.",
  },
  {
    icon: Megaphone,
    title: "Ciblage de l'audience",
    text: "Vos publicités sont présentées aux personnes les plus susceptibles d'être intéressées par vos services, sur Facebook et Instagram.",
  },
  {
    icon: Layers,
    title: "Structure des campagnes",
    text: "Les campagnes sont organisées et configurées proprement, pour rester lisibles et faciles à faire évoluer avec votre activité.",
  },
  {
    icon: BarChart3,
    title: "Suivi des résultats",
    text: "Les performances sont suivies et les campagnes ajustées, pour que votre budget publicitaire travaille pour vos objectifs.",
  },
];

const ADS_STEPS = [
  {
    name: "Compréhension de l'objectif",
    text: "Nous définissons ce que la publicité doit apporter à votre activité : visibilité, demandes, promotion d'une offre.",
  },
  {
    name: "Définition des audiences",
    text: "Nous identifions les audiences à toucher, en cohérence avec vos clients réels et votre marché.",
  },
  {
    name: "Mise en place des campagnes",
    text: "Les campagnes sont créées et structurées autour de vos objectifs, prêtes à diffuser votre message.",
  },
  {
    name: "Suivi et ajustements",
    text: "Les résultats sont observés et les campagnes ajustées pour accompagner l'évolution de votre activité.",
  },
];

export function MetaAdsPage() {
  const router = useRouter();

  return (
    <>
      {/* ---------- En-tête de page ---------- */}
      <PageHero
        eyebrow="PUBLICITÉ · META ADS"
        title="Meta Ads : faites connaître votre activité sur Facebook et Instagram."
        intro="Développez votre présence sur Facebook et Instagram grâce à des campagnes publicitaires ciblées et structurées autour de vos objectifs — le complément naturel d'un site web pensé pour convertir."
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

      {/* ---------- Ce que comprennent les campagnes ---------- */}
      <section aria-label="Ce que comprennent vos campagnes publicitaires" className="section-light bg-grid-light py-20 sm:py-24 lg:py-28">
        <div className="container-site">
          <SectionHeading
            eyebrow="CAMPAGNES CIBLÉES ET STRUCTURÉES"
            title="Ce que comprennent vos campagnes."
            tone="light"
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ADS_ACTIONS.map((item, i) => (
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

          {/* Plateformes couvertes — Facebook et Instagram */}
          <Reveal direction="up" delay={0.15}>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-[#525252]">Plateformes couvertes :</span>
              <span className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[#e4e4e4] bg-white px-4 py-2 text-[13px] text-[#1c1c1c]">
                <Facebook className="h-4 w-4" aria-hidden="true" />
                Facebook
              </span>
              <span className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[#e4e4e4] bg-white px-4 py-2 text-[13px] text-[#1c1c1c]">
                <Instagram className="h-4 w-4" aria-hidden="true" />
                Instagram
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- SEO ou Meta Ads ? ---------- */}
      <section aria-label="SEO ou Meta Ads : deux leviers de visibilité" className="section-dark relative py-20 sm:py-24 lg:py-28">
        <div aria-hidden="true" className="separator-fade absolute inset-x-0 top-0" />
        <div className="container-site">
          <SectionHeading
            eyebrow="VOTRE SITE EST PRÊT. MAINTENANT, FAISONS-LE CONNAÎTRE."
            title="Deux leviers de visibilité, au service du même objectif."
            tone="dark"
            align="center"
            className="mx-auto"
          />
          <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-2">
            <Reveal direction="right" as="article">
              <button
                type="button"
                onClick={() => router.navigate("referencement")}
                className="group flex h-full w-full flex-col rounded-2xl border border-[#e4e4e4]/25 bg-[#232323] p-7 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#e4e4e4]/45 sm:p-8"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e4e4e4]/12 text-[#e4e4e4]">
                  <Search className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-6 font-display text-xl font-semibold text-white">
                  Référencement SEO
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed text-[#c8c8c8]">
                  Une présence organique durable : votre site gagne en positionnement sur les
                  recherches de vos futurs clients et continue de travailler pour vous sur la
                  durée.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white">
                  Découvrir le Référencement SEO
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </button>
            </Reveal>
            <Reveal direction="left" delay={0.08} as="article">
              <div className="flex h-full flex-col rounded-2xl border border-[#e4e4e4]/35 bg-[#232323] p-7 sm:p-8">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e4e4e4] text-[#1c1c1c]">
                  <Megaphone className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-6 font-display text-xl font-semibold text-white">
                  Publicité Meta Ads
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed text-[#c8c8c8]">
                  Une visibilité ciblée sur Facebook et Instagram : vos campagnes présentent
                  votre activité aux personnes les plus susceptibles d'être intéressées, avec
                  un suivi des résultats.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#e4e4e4]">
                  Vous êtes sur la bonne page
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Comment je travaille ---------- */}
      <section aria-label="Comment je travaille vos campagnes publicitaires" className="section-bright py-20 sm:py-24 lg:py-28">
        <div className="container-site">
          <SectionHeading
            eyebrow="MA MÉTHODE"
            title="Comment je travaille vos campagnes."
            tone="light"
          />
          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ADS_STEPS.map((step, i) => (
              <Reveal key={step.name} direction="up" delay={i * 0.05} as="li">
                <div className="h-full rounded-2xl border border-[#e4e4e4] bg-white p-6">
                  <p className="text-[11px] font-semibold tracking-widest text-[#525252] uppercase">
                    Étape {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-3 font-display text-lg font-semibold text-[#1c1c1c]">{step.name}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-[#555555]">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Appel à l'action final ---------- */}
      <section aria-label="Parlons de votre publicité" className="section-deep relative overflow-hidden py-20 sm:py-24 lg:py-28">
        <div className="bg-grid-dark absolute inset-0" aria-hidden="true" />
        <div className="container-site relative text-center">
          <Reveal direction="up">
            <p className="text-eyebrow">PARLONS DE VOTRE PUBLICITÉ</p>
            <h2 className="text-section-title mx-auto mt-4 max-w-2xl text-white">
              Votre activité mérite d'être connue.
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
