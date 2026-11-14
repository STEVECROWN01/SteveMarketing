"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * DÉFILEMENT FLUIDE (demande de l'éditeur, 15/11/2026) : le site
 * doit défiler aussi souplement que sheragency.com — même lorsqu'on
 * lance un défilement d'un coup et qu'on relâche la souris, la page
 * continue sur son élan au lieu de s'arrêter net.
 * Lenis intercepte la molette et anime scrollTop avec une inertie
 * douce (c'est le mécanisme utilisé par le site de référence).
 *
 * - Désactivé quand « prefers-reduced-motion » est actif (le
 *   défilement natif, instantané, est alors la bonne réponse) ;
 * - le menu plein écran STOPPE Lenis pendant son ouverture (événement
 *   « app:lenis-control » émis par le header) — le fond ne défile pas
 *   derrière l'overlay ;
 * - les scrolls programmatiques (retour en haut, ancres de section)
 *   restent natifs et fonctionnent en parallèle.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    // Contrôle externe (ouverture du menu plein écran).
    const onControl = (e: Event) => {
      const detail = (e as CustomEvent<"stop" | "start">).detail;
      if (detail === "stop") lenis.stop();
      else lenis.start();
    };
    window.addEventListener("app:lenis-control", onControl as EventListener);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("app:lenis-control", onControl as EventListener);
      lenis.destroy();
    };
  }, []);

  return null;
}
