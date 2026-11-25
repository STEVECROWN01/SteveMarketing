"use client";

import React from "react";
import { PageHero } from "@/components/marketing/Marketing";
import { Reveal } from "@/components/motion/Reveal";
/* VOLET 18 — i18n : textes inline via t()/tf(), SITE via useSite.
   Phrases RECONSTITUÉES : celles coupées autour d'un LIEN ou d'un
   <strong> DYNAMIQUE (nom, hébergeur) sont traduites ENTIÈRES puis
   découpées sur la valeur pour reconstruire le JSX ; les libellés en
   gras des puces RGPD sont retrouvés par la découpe sur « : » — la
   typographie FR (espace) / EN (aucune) est préservée. */
import { useSite, useT } from "@/i18n";

/**
 * PAGE MENTIONS LÉGALES
 * Les deux mentions restées ouvertes en développement sont désormais
 * complétées pour la production : hébergeur (Vercel — coordonnées
 * publiques vérifiées) et identifiant professionnel de l'éditeur
 * (renseignable via NEXT_PUBLIC_LEGAL_REGISTRATION, sans toucher au
 * code — aucune donnée inventée).
 */
export function LegalPage() {
  const { t, tf } = useT();
  const { SITE } = useSite();

  /* Découpe défensive d'une phrase traduite autour d'un libellé
     interactif ou dynamique : libellé introuvable ⇒ phrase entière
     avant, rien après (aucun crash, le texte reste affiché). */
  const couper = (phrase: string, libelle: string): [string, string] => {
    const i = phrase.indexOf(libelle);
    return i === -1 ? [phrase, ""] : [phrase.slice(0, i), phrase.slice(i + libelle.length)];
  };
  /* Puce RGPD « <strong>Libellé :</strong> suite » — le libellé gras
     est tout ce qui précède le PREMIER « : » (espace FR conservée,
     collée en EN). */
  const puceRGPD = (cle: string, valeurs?: Record<string, string>): [string, string] => {
    const phrase = valeurs ? tf(cle, valeurs) : t(cle);
    const i = phrase.indexOf(":");
    return i === -1 ? [phrase, ""] : [phrase.slice(0, i + 1), phrase.slice(i + 1)];
  };

  /* Éditeur — nom en <strong> dans la phrase d'ouverture. */
  const nomEditeur = t("Stevens Akpovi");
  const [avantNomEditeur, apresNomEditeur] = couper(
    t("Le présent site est édité et exploité par Stevens Akpovi, concepteur de sites web professionnels, exerçant à distance."),
    nomEditeur,
  );

  /* Hébergement — <strong> sur l'hébergeur + lien vercel.com,
     reconstruits par découpe de la phrase traduite. */
  const phraseHeberge = tf(
    "Le site est une application Next.js hébergée en production sur la plateforme Vercel. Hébergeur : {hostName} — {hostAddress} — vercel.com",
    { hostName: SITE.host.name, hostAddress: SITE.host.address },
  );
  const [avantNomHeb, apresNomHeb] = couper(phraseHeberge, SITE.host.name);
  const [apresAdresse, apresVercel] = couper(apresNomHeb, "vercel.com");

  const sections: { title: string; body: React.ReactNode }[] = [
    {
      title: t("Éditeur du site"),
      body: (
        <>
          <p>
            {avantNomEditeur}
            <strong>{nomEditeur}</strong>
            {apresNomEditeur}
          </p>
          <ul>
            <li>
              {t("Adresse email :")}{" "}
              <a className="mail-link" href={`mailto:${SITE.email}`}>
                {SITE.email}
              </a>
            </li>
            <li>{t("LinkedIn :")} {SITE.linkedin}</li>
            <li>
              {t("WhatsApp : disponible via le lien de contact du site (le numéro n'est pas affiché en clair).")}
            </li>
            <li>
              {tf("Numéro d'enregistrement / identifiant professionnel : {legalRegistration}", { legalRegistration: SITE.legalRegistration })}
            </li>
            <li>
              {t("Pays d'exercice : Bénin — collaboration à distance, au-delà des frontières.")}
            </li>
          </ul>
        </>
      ),
    },
    {
      title: t("Hébergement"),
      body: (
        <p>
          {avantNomHeb}
          <strong>{SITE.host.name}</strong>
          {apresAdresse}
          <a
            className="mail-link"
            href={SITE.host.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            vercel.com
          </a>
          {apresVercel}
        </p>
      ),
    },
    {
      title: t("Propriété intellectuelle"),
      body: (
        <p>
          {t("L'ensemble des contenus présents sur ce site — textes, identité visuelle, composition, illustrations, portraits et code — est protégé. Toute reproduction, représentation ou exploitation, totale ou partielle, sans autorisation écrite préalable est interdite. Les réalisations présentées dans la section Réalisations demeurent la propriété de leurs titulaires respectifs et sont présentées à titre de références professionnelles.")}
        </p>
      ),
    },
    {
      title: t("Données personnelles (RGPD)"),
      body: (
        <>
          <p>
            {t("Les formulaires de demande (devis, audit gratuit) collectent uniquement les informations strictement nécessaires au traitement de votre demande : nom, adresse email, éventuellement téléphone, site web concerné et contenu de votre message.")}
          </p>
          <ul>
            <li>
              <strong>{puceRGPD("Finalité : réponse à votre demande commerciale et suivi de projet.")[0]}</strong>
              {puceRGPD("Finalité : réponse à votre demande commerciale et suivi de projet.")[1]}
            </li>
            <li>
              <strong>{puceRGPD("Destinataire : Stevens Akpovi ({email}). Aucune donnée n'est vendue, louée ou partagée à des tiers.", { email: SITE.email })[0]}</strong>
              {puceRGPD("Destinataire : Stevens Akpovi ({email}). Aucune donnée n'est vendue, louée ou partagée à des tiers.", { email: SITE.email })[1]}
            </li>
            <li>
              <strong>{puceRGPD("Durée de conservation : le temps nécessaire au traitement de la demande, puis archivage selon la durée légale applicable.")[0]}</strong>
              {puceRGPD("Durée de conservation : le temps nécessaire au traitement de la demande, puis archivage selon la durée légale applicable.")[1]}
            </li>
            <li>
              <strong>{puceRGPD("Vos droits : accès, rectification, effacement et opposition — exerçables par email à {email}.", { email: SITE.email })[0]}</strong>
              {puceRGPD("Vos droits : accès, rectification, effacement et opposition — exerçables par email à {email}.", { email: SITE.email })[1]}
            </li>
          </ul>
          <p>
            {t("La réservation de rendez-vous s'effectue via Calendly : les données saisies sur cette plateforme relèvent de la politique de confidentialité de Calendly, disponible sur son site officiel.")}
          </p>
        </>
      ),
    },
    {
      title: t("Cookies"),
      body: (
        <p>
          {t("Ce site n'utilise pas de cookies publicitaires ni de traceurs tiers à des fins de profilage. Seuls les échanges techniques indispensables au fonctionnement (session administrateur, soumission de formulaires) peuvent déposer des données éphémères. L'outil Calendly, intégré pour la réservation, est susceptible de déposer ses propres cookies conformément à sa politique.")}
        </p>
      ),
    },
    {
      title: t("Responsabilité"),
      body: (
        <p>
          {t("Les informations diffusées sur ce site sont fournies à titre de présentation professionnelle. Stevens Akpovi s'efforce d'en garantir l'exactitude sans pouvoir garantir l'absence d'erreur ou d'omission. Les liens externes proposés (réalisations, réseaux professionnels) renvoient vers des sites tiers dont le contenu n'engage pas l'éditeur du présent site.")}
        </p>
      ),
    },
  ];

  return (
    <>
      <PageHero
        eyebrow={t("INFORMATIONS LÉGALES")}
        title={t("Mentions légales")}
        intro={t("Éditeur, hébergement, propriété intellectuelle, données personnelles et cookies.")}
      />
      <section aria-labelledby="mentions-legales-contenu" className="section-light py-16 sm:py-20 lg:py-24">
        <div className="container-site">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs tracking-widest text-[#525252] uppercase">
              {t("Dernière mise à jour : novembre 2026")}
            </p>
            {sections.map((section, i) => (
              <Reveal key={section.title} direction="up" delay={i * 0.04} as="article">
                <div className="mt-10 scroll-mt-28">
                  <h2 className="font-display text-xl font-semibold text-[#1c1c1c] sm:text-2xl">
                    {section.title}
                  </h2>
                  <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-[#555555] [&_a]:text-[#1c1c1c] [&_a]:underline [&_a]:underline-offset-4 [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-[#1c1c1c]">
                    {section.body}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
