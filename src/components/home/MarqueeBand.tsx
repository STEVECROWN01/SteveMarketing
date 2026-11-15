import React from "react";

/**
 * BANDE DÉFILANTE NOIRE (demande de l'éditeur, 16/11/2026) — placée
 * sur l'accueil entre la section « Projets Réalisés » (NOS
 * RÉALISATIONS) et la section qui suit (QUI SUIS-JE).
 * Bande noire #070707 pleine largeur, défilement CONTINU de la
 * droite vers la gauche (animation CSS .marquee-track de
 * globals.css), texte BLANC : les mots-clés du copywriting du site —
 * optimisés SEO — séparés par un GROS point de séparation.
 * La piste embarque deux copies identiques de la liste : la
 * boucle translateX(0 → -50 %) est parfaitement continue, sans
 * couture. La seconde copie est masquée aux lecteurs d'écran
 * (aria-hidden) pour ne pas doubler la lecture.
 * En `prefers-reduced-motion`, la règle globale du site fige le
 * défilement : les mots-clés restent statiques et lisibles.
 */

/** Mots-clés du copywriting du site (optimisés SEO) — reprennent
 *  exactement le vocabulaire de l'offre : le titre du hero (« sites
 *  web qui génèrent des ventes »), les avantages inclus
 *  (« copywriting inclus », « SEO »), les services (site vitrine,
 *  page de vente, refonte) et les pages Méthode / Référencement /
 *  Publicité. */
const KEYWORDS: readonly string[] = [
  "Création De Sites Web",
  "Sites Web Qui Génèrent Des Ventes",
  "Copywriting Inclus",
  "Référencement SEO",
  "Trafic Qualifié",
  "Publicité Meta Ads",
  "Design Premium",
  "Site Vitrine Professionnel",
  "Page De Vente",
  "Refonte De Site Web",
  "Optimisation De Conversion",
  "Présence Professionnelle En Ligne",
] as const;

export function MarqueeBand() {
  return (
    <section
      aria-label="Expertises de Stevens Akpovi — création de sites web, copywriting, référencement SEO, publicité"
      className="relative overflow-hidden bg-[#070707] py-4 sm:py-5"
    >
      {/* Liserés discrets en haut et en bas de la bande, comme les
          bords doux du site — aucune ligne dure. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e4e4e4]/15 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#e4e4e4]/15 to-transparent"
      />

      <div className="marquee-track">
        {/* Deux copies identiques : la seconde (aria-hidden) boucle
            la première sans couture. */}
        {[0, 1].map((copy) => (
          <div
            key={copy}
            className="flex shrink-0 items-center"
            aria-hidden={copy === 1 ? "true" : undefined}
          >
            {KEYWORDS.map((keyword) => (
              <span key={`${copy}-${keyword}`} className="flex shrink-0 items-center">
                <span className="whitespace-nowrap px-5 font-display text-[13px] font-semibold uppercase tracking-[0.14em] text-white sm:px-7 sm:text-base">
                  {keyword}
                </span>
                {/* Gros point de séparation entre les mots-clés. */}
                <span
                  aria-hidden="true"
                  className="text-xl leading-none text-[#e4e4e4] sm:text-2xl"
                >
                  •
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
