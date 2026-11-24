"use client";

import { useEffect } from "react";

/**
 * VOLET 14 (24/11/2026) — RÉVÉLATION DE COULEUR À L'APPUI (tactile).
 *
 * Demande de l'éditeur : « sur mobile et tablette, c'est un appui
 * sur l'image qui va faire révéler la vraie couleur de l'image. Et
 * quand on fait encore un appui à l'extérieur de l'image, la
 * couleur va revenir en blanc noir. Mais tout en gardant les deux
 * mockups épinglés du hero exclusivement en couleur originale. »
 *
 * Toutes les images du site enveloppées dans .mono-media sont en
 * NOIR ET BLANC PAR DÉFAUT sur tous les écrans (règle volet 14 de
 * globals.css). Ce composant ajoute, sur les écrans TACTILES
 * uniquement :
 *  - UN APPUI SIMPLE sur une image → sa couleur originale (classe
 *    .couleur-active sur l'enveloppe .mono-media) ;
 *  - UN APPUI À L'EXTÉRIEUR de toute image → retour au noir et
 *    blanc (une seule image colorée à la fois) ;
 *  - si l'image est CLIQUABLE (carte de réalisation, mockup d'une
 *    page projet), le PREMIER appui ne fait QUE révéler la couleur
 *    (la navigation est suspendue une fois) ; l'appui SUIVANT,
 *    l'image étant déjà en couleur, suit son cours normal — le
 *    visiteur ne découvre jamais la couleur et quitte la page dans
 *    le même geste.
 *
 * Sur les écrans capables de survol (bureau), le composant ne fait
 * STRICTEMENT RIEN : la couleur se révèle au survol (CSS
 * .mono-media:where(:hover), media (hover: hover)) et les clics
 * naviguent normalement. Les mockups épinglés du hero (prop
 * `color`) ne portent pas .mono-media : ils restent en couleur
 * permanente et l'appui ne les concerne pas.
 *
 * Monté UNE fois dans l'arbre public (src/app/page.tsx) : le
 * routeur par fragment change les pages SANS remonter ce composant,
 * les écouteurs couvrent donc toutes les images de toutes les pages.
 */
export function InteractionCouleurs() {
  useEffect(() => {
    /* Périphériques capables de survol « purs » : aucun écouteur —
       le CSS gère la révélation au survol, le clic reste un clic.
       Les hybrides (écran tactile + souris) gardent les écouteurs :
       le doigt doit révéler, et la souris bénéficie déjà du survol. */
    const peutSurvoler =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const tactile = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (peutSurvoler && !tactile) return;

    const retirerCouleurs = () => {
      document
        .querySelectorAll(".mono-media.couleur-active")
        .forEach((el) => el.classList.remove("couleur-active"));
    };

    const surAppui = (e: MouseEvent) => {
      const cible = e.target as HTMLElement | null;
      /* L'appui « sur l'image » désigne l'enveloppe .mono-media
         complète (l'image elle-même ou son remplissage) — pas le
         reste d'une éventuelle carte cliquable : appuyer sur le
         titre d'une carte de réalisation ne révèle rien. */
      const enveloppe = cible?.closest?.(".mono-media") as HTMLElement | null;
      if (enveloppe) {
        if (enveloppe.classList.contains("couleur-active")) {
          /* Déjà en couleur : l'appui suit son cours — navigation,
             lien, agrandissement — et la couleur reste en place. */
          return;
        }
        /* Premier appui sur CETTE image : on révèle SA couleur (et
           uniquement la sienne). Si l'image est dans un LIEN, la
           navigation attend l'appui suivant : le routeur du site
           (les cartes de réalisation appellent navigate() dans
           leur onClick React) réagit AVANT tout écouteur document
           en phase bulle — l'écouteur est donc posé en phase de
           CAPTURE : preventDefault + stopPropagation interceptent
           le PREMIER appui avant le lien, l'appui suivant (image
           déjà en couleur) traverse et navigue. */
        const dansUnLien = enveloppe.closest("a, button");
        if (dansUnLien) {
          e.preventDefault();
          e.stopPropagation();
        }
        retirerCouleurs();
        enveloppe.classList.add("couleur-active");
      } else {
        /* Appui à l'extérieur de toute image : retour au noir et
           blanc partout (demande explicite de l'éditeur). */
        retirerCouleurs();
      }
    };

    document.addEventListener("click", surAppui, true);
    return () => document.removeEventListener("click", surAppui, true);
  }, []);

  return null;
}
