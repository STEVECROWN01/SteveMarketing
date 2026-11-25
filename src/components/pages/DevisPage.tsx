"use client";

import React from "react";
import { Star } from "lucide-react";
import { Reveal, RevealText } from "@/components/motion/Reveal";
import { LeadForm } from "@/components/forms/LeadForm";
/* VOLET 18 — i18n : textes inline via t()/tf() ; la phrase croisée
   « Vous préférez commencer par une conversation ?… » est traduite
   ENTIÈRE (clé complète) puis découpée sur le libellé du lien pour
   reconstruire le JSX (convention RECONSTITUTION de trad-ui-en.ts). */
import { useT } from "@/i18n";

/** Icône « coche pleine » (icon-park-solid:check-one) — celle de la
 *  liste de bénéfices de sheragency.com, reproduite en inline SVG
 *  (aucune requête réseau) ; cercle dans l'accent du site #e4e4e4
 *  (purge du beige, 13/11/2026 — la coche de la référence est
 *  beige) et coche sombre, comme la référence. */
function CheckOne({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 31 30" fill="none" className={className} aria-hidden="true">
      <circle cx="15.72" cy="15" r="13.75" fill="#e4e4e4" />
      <path
        d="M10.72 15l3.75 3.75 7.5-7.5"
        stroke="#070707"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * PAGE DEMANDER UN DEVIS (#/demander-un-devis) — présentation
 * calquée sur « /request-a-quote » de sheragency.com : page claire,
 * grand titre centré, sous-texte, trois bénéfices à cocher (icône
 * coche pleine, empilés verticalement — exactement comme la
 * référence, demande de l'éditeur, 15/11/2026), badge de note
 * 4,9/5, puis le formulaire de devis — reproduit EXACTEMENT le
 * widget « New Client Application » de la référence (15/11/2026) :
 * carte blanche à ombre douce, Prénom/Nom sur deux colonnes,
 * consentement SMS, questions à choix unique et bouton vert
 * « Obtenir Un Devis » pleine largeur.
 */
const BENEFITS = [
  "Attirer les bons visiteurs",
  "Transformer les visiteurs en clients",
  "Présenter votre activité avec professionnalisme",
];

export function DevisPage() {
  const { t } = useT();
  const libelleAppel = t("Réservez un appel de 30 minutes");
  const [avantAppel, apresAppel] = (() => {
    const phrase = t("Vous préférez commencer par une conversation\u00A0? Réservez un appel de 30 minutes — gratuit et sans engagement.");
    const i = phrase.indexOf(libelleAppel);
    return i === -1 ? [phrase, ""] : [phrase.slice(0, i), phrase.slice(i + libelleAppel.length)];
  })();

  return (
    <>
      <section
        aria-label={t("Demande de devis personnalisé")}
        className="section-bright relative overflow-hidden pb-20 pt-[128px] sm:pb-24 sm:pt-[150px] lg:pt-[160px]"
      >
        <div className="container-site">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal direction="up">
              <p className="text-eyebrow">{t("DEMANDE DE DEVIS PERSONNALISÉ")}</p>
            </Reveal>

            <RevealText
              as="h1"
              text={t("Optimisez Votre Site Web Pour Augmenter Vos Ventes")}
              boldText={t("Augmenter Vos Ventes")}
              delay={0.06}
              className="text-hero-title on-paper mt-5"
            />

            <Reveal direction="up" delay={0.14}>
              <p className="text-body mx-auto mt-6 max-w-2xl on-paper-muted">
                {t("Je prends des sites web obsolètes et les transforme en sites web qui attirent davantage de visiteurs, transforment ces visiteurs en clients et valorisent votre image de marque.")}
              </p>
            </Reveal>

            {/* Trois bénéfices à cocher — exactement comme sheragency.com
                (demande de l'éditeur, 15/11/2026) : icône coche pleine dans
                un cercle, un par ligne, alignés à gauche, le groupe centré. */}
            <Reveal direction="up" delay={0.18}>
              <ul className="mx-auto mt-8 flex w-fit flex-col items-start gap-3.5">
                {BENEFITS.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-center gap-3 text-left text-[16px] font-medium text-[#1c1c1c]"
                  >
                    <CheckOne className="h-[26px] w-[27px] shrink-0" />
                    {t(benefit)}
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* Badge de note — la cinquième étoile à moitié remplie */}
            <Reveal direction="up" delay={0.22}>
              <p
                className="mt-8 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[13px] font-medium tracking-[0.02em] text-[#525252]"
                aria-label={t("Note moyenne de 4,9 sur 5")}
              >
                <span className="flex items-center gap-1" aria-hidden="true">
                  {[0, 1, 2, 3].map((i) => (
                    <Star key={i} fill="#1c1c1c" strokeWidth={0} className="h-4 w-4" />
                  ))}
                  <span className="relative inline-flex h-4 w-4 items-center justify-center">
                    <Star className="absolute h-4 w-4 text-[#c8c8c8]" strokeWidth={1.5} />
                    <span className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
                      <Star fill="#1c1c1c" strokeWidth={0} className="h-4 w-4" />
                    </span>
                  </span>
                </span>
                <span>{t("4,9/5")}</span>
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Bande gris clair pleine largeur portant la carte du formulaire —
          comme le widget GoHighLevel de sheragency.com/request-a-quote :
          bande #f5f5f5, carte blanche à ombre douce flottant dedans. */}
      <section aria-label={t("Formulaire de demande de devis")} className="section-light pb-24 pt-4 sm:pb-28">
        <div className="container-site">
          {/* Formulaire de devis — carte blanche façon sheragency
              (« New Client Application ») */}
          <Reveal direction="up" delay={0.26}>
            <div className="mx-auto max-w-[680px]">
              <LeadForm kind="quote" />
            </div>
          </Reveal>

          <Reveal direction="up" delay={0.3}>
            <p className="mx-auto mt-8 max-w-xl text-center text-sm on-paper-muted">
              {avantAppel}
              <a
                href="#/reserver-un-appel"
                className="font-medium text-[#1c1c1c] underline underline-offset-4"
              >
                {libelleAppel}
              </a>
              {apresAppel}
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
