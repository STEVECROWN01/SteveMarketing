"use client";

import React, { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Star } from "lucide-react";
import { Reveal, RevealText } from "@/components/motion/Reveal";
import { CTAButton, CTAIcons, ReassuranceBar } from "@/components/marketing/Marketing";
import { BrowserMockup, PhoneMockup } from "@/components/media/Media";
import { HERO } from "@/content/site-content";
import { ASSETS, PROJECTS } from "@/lib/site";

/**
 * SECTION 01 — HERO
 * Totalement visible à l'écran, sans défilement : la section occupe
 * exactement la hauteur du viewport (100svh, y compris barres
 * dynamiques mobiles) et son contenu s'adapte en taille à tous les
 * écrans (typographie fluide, portrait dimensionné en svh). Sans
 * scroller, le visiteur comprend : qui est Stevens, ce qu'il propose,
 * le bénéfice principal, comment réserver et comment découvrir les
 * réalisations. Mobile : l'image se place entre le titre et la
 * description. Les mentions « Copywriting inclus » / « SEO de base »
 * sont volontairement absentes : elles appartiennent à la section
 * « Avantages inclus » qui présente l'offre.
 */
export function Hero() {
  const reduce = useReducedMotion();

  const floatTransition = { duration: 5.5, repeat: Infinity, repeatType: "mirror" as const, ease: "easeInOut" as const };

  /* Équilibre vertical de la description (bureau uniquement) :
     même espace au-dessus et au-dessous de la description — la
     description seule est déplacée verticalement, le titre et les
     boutons restent strictement immobiles (demande de l'éditeur,
     13/11/2026). L'écart dépend de la hauteur du viewport (le
     portrait dimensionne les rangées de la grille), d'où un ajustement
     mesuré plutôt qu'une marge fixe. Mesure après les animations de
     révélation (~1,05 s) puis à chaque redimensionnement. */
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const adjust = () => {
      const p = descRef.current;
      const row = ctaRowRef.current;
      const h1 = p?.closest("section")?.querySelector("h1");
      if (!p || !row || !h1) return;
      if (!window.matchMedia("(min-width: 1024px)").matches) {
        p.style.top = "0px";
        return;
      }
      // Décalage éventuellement déjà appliqué : les mesures le
      // contiennent, on le neutralise pour obtenir le vrai écart.
      const currentShift = Math.max(0, -parseFloat(p.style.top) || 0);
      const gapAbove = p.getBoundingClientRect().top - h1.getBoundingClientRect().bottom;
      const gapBelow = row.getBoundingClientRect().top - p.getBoundingClientRect().bottom;
      // Titre et boutons immobiles : la description est centrée dans
      // l'espace disponible — autant d'air au-dessus qu'au-dessous.
      const naturalAbove = gapAbove + currentShift;
      const naturalBelow = gapBelow - currentShift;
      const newShift = Math.round((naturalAbove - naturalBelow) / 2);
      p.style.top = newShift > 0 ? `${-newShift}px` : "0px";
    };
    const schedule = (delay: number) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        raf = requestAnimationFrame(adjust);
      }, delay);
    };
    schedule(1150);
    const onResize = () => schedule(140);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (timer) clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      id="hero"
      aria-label="Introduction — Stevens Akpovi, conception de sites web orientés conversion"
      className="section-deep relative flex min-h-svh flex-col overflow-hidden"
    >
      {/* Décor : grille discrète + halo beige */}
      <div className="bg-grid-dark absolute inset-0" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-[-10%] h-[560px] w-[560px] rounded-full bg-[#e4e4e4] opacity-[0.09] blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-20%] left-[-12%] h-[420px] w-[420px] rounded-full bg-[#e4e4e4] opacity-[0.05] blur-[110px]"
      />

      <div className="container-site relative flex flex-1 flex-col justify-center pb-4 pt-[64px] sm:pb-8 sm:pt-[68px] lg:pb-8 lg:pt-[112px]">
        <div className="grid items-center gap-3.5 sm:gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:gap-7 xl:gap-9">
          {/* ---------- Bloc texte haut : note 5 étoiles, titre ---------- */}
          {/* Mobile : note → H1, puis image (bloc visuel), puis
              suite du texte. Desktop : colonne gauche, ligne 1. */}
          <div className="order-1 lg:col-start-1 lg:row-start-1">
            {/* Cinq étoiles — la cinquième à moitié remplie horizontalement —
                suivies de « 4,9/5 » (remplace l'ancien eyebrow). */}
            <Reveal direction="up">
              <p
                className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] font-medium tracking-[0.02em] text-[#c8c8c8] sm:text-sm"
                aria-label="Note moyenne de 4,9 sur 5"
              >
                <span className="flex items-center gap-1" aria-hidden="true">
                  {[0, 1, 2, 3].map((i) => (
                    <Star key={i} fill="#e4e4e4" strokeWidth={0} className="h-4 w-4" />
                  ))}
                  {/* Cinquième étoile : moitié gauche remplie, moitié droite vide */}
                  <span className="relative inline-flex h-4 w-4 items-center justify-center">
                    <Star className="absolute h-4 w-4 text-[#525252]" strokeWidth={1.5} />
                    <span className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
                      <Star fill="#e4e4e4" strokeWidth={0} className="h-4 w-4" />
                    </span>
                  </span>
                </span>
                <span>4,9/5</span>
              </p>
            </Reveal>

            <RevealText
              as="h1"
              text={HERO.h1}
              boldText={HERO.h1Bold}
              delay={0.08}
              className="text-hero-title-viewport mt-3 text-white sm:mt-4"
            />
          </div>

          {/* ---------- Colonne visuelle : portrait + mockups ---------- */}
          {/* Mobile : placée entre le titre et la description (demande
              explicite de l'éditeur), avec un espace accru entre le
              titre et l'image, et une réserve sous le portrait pour les
              mockups flottants (présents aussi sur mobile) ; desktop :
              colonne droite sur les deux lignes de la grille, hauteur
              plafonnée en svh pour que le hero tienne dans l'écran. */}
          <div className="order-2 relative mx-auto mt-9 mb-14 w-full max-w-md sm:mb-36 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:mb-0 lg:max-w-none">
            {/* Bloc neutre en décalage derrière le portrait */}
            <div
              aria-hidden="true"
              className="absolute -inset-3 rotate-[2.5deg] rounded-[2rem] bg-[#e4e4e4]/90 opacity-[0.16] sm:rotate-[3deg]"
            />
            <div className="relative flex justify-center">
              {/* Portrait professionnel — NON cliquable */}
              <figure className="relative overflow-hidden rounded-[1.75rem] border border-[#e4e4e4]/15 bg-[#232323] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.7)]">
                <span className="mono-media block">
                  <img
                    src={ASSETS.portrait}
                    alt={HERO.portraitAlt}
                    width={1024}
                    height={1536}
                    loading="eager"
                    fetchPriority="high"
                    decoding="sync"
                    className="block h-[min(29svh,270px)] w-full object-cover object-top lg:h-[min(64svh,570px)] lg:w-auto"
                  />
                </span>
                <figcaption className="absolute left-4 top-4">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#070707]/75 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#e4e4e4]" aria-hidden="true" />
                    Stevens Akpovi
                  </span>
                </figcaption>
              </figure>

              {/* Mockup navigateur flottant — MR STEVE ENGLISH.
                  Présent aussi sur mobile (taille et bords adaptés).
                  Exclusivement noir et blanc (forceMono) — aucune
                  couleur au survol. */}
              <motion.div
                className="absolute -bottom-5 -left-1 w-[46%] sm:-bottom-8 sm:-left-4 sm:w-[58%] lg:-left-14 lg:w-[62%]"
                initial={reduce ? undefined : { opacity: 0, y: 26, rotate: -5 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, rotate: -3 }}
                transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div animate={reduce ? undefined : { y: [0, -7, 0] }} transition={floatTransition}>
                  <BrowserMockup
                    src={PROJECTS[0].desktop}
                    alt={`Aperçu du site ${PROJECTS[0].name}`}
                    url={PROJECTS[0].url}
                    width={1440}
                    height={900}
                    forceMono
                  />
                </motion.div>
              </motion.div>

              {/* Mockup smartphone flottant — AFRIBAYIT. Présent aussi
                  sur mobile. Exclusivement noir et blanc (forceMono) —
                  aucune couleur au survol. */}
              <motion.div
                className="absolute -right-1 -top-5 w-[22%] sm:-right-2 sm:-top-10 sm:w-[26%] lg:-right-8 lg:w-[28%]"
                initial={reduce ? undefined : { opacity: 0, y: 26, rotate: 5 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, rotate: 2 }}
                transition={{ delay: 0.75, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div animate={reduce ? undefined : { y: [0, 8, 0] }} transition={{ ...floatTransition, delay: 1.2 }}>
                  <PhoneMockup
                    src={PROJECTS[2].mobile}
                    alt={`Aperçu mobile du site ${PROJECTS[2].name}`}
                    width={390}
                    height={844}
                    forceMono
                  />
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* ---------- Bloc texte bas : description, CTA, réassurance ---------- */}
          {/* Mobile : succède à l'image ; desktop : colonne gauche, ligne 2.
              Bureau : l'effet « descriptionEquilibree » place la description
              pour qu'il y ait autant d'espace au-dessus qu'au-dessous — sans
              bouger le titre ni les boutons. */}
          <div className="order-3 lg:col-start-1 lg:row-start-2">
            <Reveal direction="up" delay={0.18}>
              <p
                ref={descRef}
                className="relative mt-2.5 max-w-xl text-[12.5px] leading-[1.55] text-[#c8c8c8] transition-[top] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:mt-3 sm:text-[15px] lg:text-[15px] xl:text-base"
              >
                {HERO.text}
              </p>
            </Reveal>

            {/* CTA — les deux boutons partagent la même ligne sur desktop :
                réservation d'appel (blanc, sans icône à gauche — mène à la
                page de demande de devis) + découverte des réalisations
                (noir, sans flèche à droite). */}
            <Reveal direction="up" delay={0.24}>
              <div
                ref={ctaRowRef}
                className="mt-3 flex flex-wrap items-center gap-2.5 sm:mt-5 sm:gap-3 lg:mt-5"
              >
                <CTAButton
                  action={{ kind: "page", page: "devis" }}
                  variant="secondary"
                  size="lg"
                  ariaLabel="Réserver un appel — page de demande de devis personnalisé"
                >
                  {HERO.ctaPrimary}
                </CTAButton>
                <CTAButton
                  action={{ kind: "page", page: "realisations" }}
                  variant="ghostLight"
                  icon={CTAIcons.works}
                  hideArrow
                  className="px-3.5 py-2.5 text-[13px] sm:px-4 sm:py-3 sm:text-sm"
                >
                  {HERO.ctaTertiary}
                </CTAButton>
              </div>
            </Reveal>

            <Reveal direction="up" delay={0.3}>
              <ReassuranceBar mention={HERO.reassurance} className="mt-3 sm:mt-4 lg:mt-5" />
            </Reveal>
          </div>
        </div>
      </div>

      {/* Fondu progressif vers la section suivante : plus de trait de
          séparation — le fond du hero (#070707) se fond dans celui de la
          section suivante (#1c1c1c) sur ~112 px, sans limite nette
          (demande de l'éditeur, 13/11/2026). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#1c1c1c] sm:h-28"
      />
    </section>
  );
}
