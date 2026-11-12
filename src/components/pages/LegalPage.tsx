"use client";

import React from "react";
import { PageHero } from "@/components/marketing/Marketing";
import { Reveal } from "@/components/motion/Reveal";
import { SITE } from "@/lib/site";

/**
 * PAGE MENTIONS LÉGALES
 * Les deux mentions restées ouvertes en développement sont désormais
 * complétées pour la production : hébergeur (Vercel — coordonnées
 * publiques vérifiées) et identifiant professionnel de l'éditeur
 * (renseignable via NEXT_PUBLIC_LEGAL_REGISTRATION, sans toucher au
 * code — aucune donnée inventée).
 */
export function LegalPage() {
  const sections: { title: string; body: React.ReactNode }[] = [
    {
      title: "Éditeur du site",
      body: (
        <>
          <p>
            Le présent site est édité et exploité par <strong>Stevens Akpovi</strong>, concepteur
            de sites web professionnels, exerçant à distance.
          </p>
          <ul>
            <li>
              Adresse email :{" "}
              <a className="mail-link" href={`mailto:${SITE.email}`}>
                {SITE.email}
              </a>
            </li>
            <li>LinkedIn : {SITE.linkedin}</li>
            <li>
              WhatsApp : disponible via le lien de contact du site (le numéro n'est pas affiché
              en clair).
            </li>
            <li>
              Numéro d'enregistrement / identifiant professionnel : {SITE.legalRegistration}
            </li>
            <li>
              Pays d'exercice : Bénin — collaboration à distance, au-delà des frontières.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "Hébergement",
      body: (
        <p>
          Le site est une application Next.js hébergée en production sur la plateforme Vercel.
          Hébergeur : <strong>{SITE.host.name}</strong> — {SITE.host.address} —{" "}
          <a
            className="mail-link"
            href={SITE.host.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            vercel.com
          </a>
        </p>
      ),
    },
    {
      title: "Propriété intellectuelle",
      body: (
        <p>
          L'ensemble des contenus présents sur ce site — textes, identité visuelle, composition,
          illustrations, portraits et code — est protégé. Toute reproduction, représentation ou
          exploitation, totale ou partielle, sans autorisation écrite préalable est interdite.
          Les réalisations présentées dans la section Réalisations demeurent la propriété de
          leurs titulaires respectifs et sont présentées à titre de références professionnelles.
        </p>
      ),
    },
    {
      title: "Données personnelles (RGPD)",
      body: (
        <>
          <p>
            Les formulaires de demande (devis, audit gratuit) collectent uniquement les
            informations strictement nécessaires au traitement de votre demande : nom, adresse
            email, éventuellement téléphone, site web concerné et contenu de votre message.
          </p>
          <ul>
            <li>
              <strong>Finalité :</strong> réponse à votre demande commerciale et suivi de projet.
            </li>
            <li>
              <strong>Destinataire :</strong> Stevens Akpovi ({SITE.email}). Aucune donnée n'est
              vendue, louée ou partagée à des tiers.
            </li>
            <li>
              <strong>Durée de conservation :</strong> le temps nécessaire au traitement de la
              demande, puis archivage selon la durée légale applicable.
            </li>
            <li>
              <strong>Vos droits :</strong> accès, rectification, effacement et opposition —
              exerçables par email à {SITE.email}.
            </li>
          </ul>
          <p>
            La réservation de rendez-vous s'effectue via Calendly : les données saisies sur
            cette plateforme relèvent de la politique de confidentialité de Calendly, disponible
            sur son site officiel.
          </p>
        </>
      ),
    },
    {
      title: "Cookies",
      body: (
        <p>
          Ce site n'utilise pas de cookies publicitaires ni de traceurs tiers à des fins de
          profilage. Seuls les échanges techniques indispensables au fonctionnement (session
          administrateur, soumission de formulaires) peuvent déposer des données éphémères.
          L'outil Calendly, intégré pour la réservation, est susceptible de déposer ses propres
          cookies conformément à sa politique.
        </p>
      ),
    },
    {
      title: "Responsabilité",
      body: (
        <p>
          Les informations diffusées sur ce site sont fournies à titre de présentation
          professionnelle. Stevens Akpovi s'efforce d'en garantir l'exactitude sans pouvoir
          garantir l'absence d'erreur ou d'omission. Les liens externes proposés (réalisations,
          réseaux professionnels) renvoient vers des sites tiers dont le contenu n'engage pas
          l'éditeur du présent site.
        </p>
      ),
    },
  ];

  return (
    <>
      <PageHero
        eyebrow="INFORMATIONS LÉGALES"
        title="Mentions légales"
        intro="Éditeur, hébergement, propriété intellectuelle, données personnelles et cookies."
      />
      <section aria-labelledby="mentions-legales-contenu" className="section-light py-16 sm:py-20 lg:py-24">
        <div className="container-site">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs tracking-widest text-[#525252] uppercase">
              Dernière mise à jour : novembre 2026
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
