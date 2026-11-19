"use client";

import React, { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Animations au scroll — EXCLUSIVEMENT au défilement vers le bas
 * (demande de l'éditeur) :
 * - en descendant, chaque élément s'anime (translation + fondu) à
 *   l'entrée dans le viewport ;
 * - en remontant, le contenu apparaît immédiatement, sans rejouer
 *   l'animation — aucune animation ne se déclenche au scroll-up ;
 * - un élément qui quitte le viewport est masqué instantanément et
 *   se réanimera à la prochaine descente.
 *
 * Implémentation IntersectionObserver + transitions CSS (remplace les
 * états whileInView de framer-motion) : l'opacité et la translation
 * suivent à tout instant l'état réel d'intersection — un texte ne peut
 * plus rester bloqué invisible après un défilement rapide. Respect de
 * prefers-reduced-motion (contenu statique).
 *
 * MODE « aboveFold » (volet 7 de l'audit, 19/11/2026 — LCP ≤ 1 s) :
 * pour le contenu visible DÈS LE PREMIER RENDU (texte du hero de
 * l'accueil), l'animation d'entrée devient une ANIMATION CSS
 * (.reveal-fold--up / .reveal-fold-word dans globals.css) : elle
 * démarre au premier rendu, SANS attendre l'hydratation ni
 * l'IntersectionObserver. Raison : le mode scroll ci-dessus sert le
 * HTML avec opacity: 0 en état initial — l'élément LCP de l'accueil
 * (le paragraphe du hero) n'était donc peint qu'après chargement du
 * JS + hydratation + retour de l'observateur + délai, mesuré à
 * ~950 ms en laboratoire (FCP 168 ms) : tout l'écart entre les deux
 * était du temps d'attente JavaScript. Mêmes courbes, durées et
 * décalages que les transitions JS — seul le déclencheur change.
 */

type Direction = "up" | "down" | "left" | "right" | "fade" | "zoom";

const OFFSET = 28;
const DURATION = 700;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/** Style « masqué » (hors viewport) selon la direction. */
function hiddenStyle(direction: Direction): React.CSSProperties {
  const style: React.CSSProperties = { opacity: 0 };
  switch (direction) {
    case "up":
      return { ...style, transform: `translateY(${OFFSET}px)` };
    case "down":
      return { ...style, transform: `translateY(-${OFFSET}px)` };
    case "left":
      return { ...style, transform: `translateX(${OFFSET}px)` };
    case "right":
      return { ...style, transform: `translateX(-${OFFSET}px)` };
    case "zoom":
      return { ...style, transform: "scale(0.96)" };
    case "fade":
    default:
      return style;
  }
}

/* ---------- Direction de défilement (partagée, passive) ---------- */

const scrollState = {
  direction: "down" as "down" | "up",
  lastY: 0,
  bound: false,
};

/** Branche un unique écouteur passif partagé par toutes les révélations. */
function ensureScrollListener() {
  if (scrollState.bound || typeof window === "undefined") return;
  scrollState.bound = true;
  scrollState.lastY = window.scrollY;
  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      if (Math.abs(y - scrollState.lastY) > 2) {
        scrollState.direction = y > scrollState.lastY ? "down" : "up";
      }
      scrollState.lastY = y;
    },
    { passive: true }
  );
}

/** Vrai tant que l'élément observé intersecte le viewport (les deux sens). */
function useInView<T extends HTMLElement>(threshold: number) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  const [animated, setAnimated] = useState(true);
  /* VOLET 7 (LCP ≤ 1 s) : « visible dès le montage » — vrai lorsque la
   * PREMIÈRE intersection arrive sans aucun défilement, sur une page
   * ouverte par LIEN PROFOND (écran d'amorçage — window.__amorcageProfond
   * posé par le script boot-deep-route de layout.tsx). Le composant
   * Reveal s'en sert pour sauter le FONDU : une transition d'opacité
   * est pilotée par le compositeur — AUCUNE repaint n'est émise
   * pendant le fondu, donc l'API LCP n'enregistre l'élément qu'à la
   * prochaine paint forcée (mesuré : contenu rendu à ~670 ms, candidate
   * LCP à ~1476 ms — 800 ms de fondu invisibles pour la mesure, et un
   * premier écran qui tarde). Pour du contenu déjà dans le viewport à
   * son montage, il n'y a d'ailleurs rien à « révéler » : le fondu n'a
   * de sens que pour du contenu qui ENTRE dans l'écran au défilement
   * — comportement inchangé dans tous les autres cas (navigation
   * interne, défilement, remontée). */
  const [visibleDesMontage, setVisibleDesMontage] = useState(false);
  const dejaVu = useRef(false);

  useEffect(() => {
    const element = ref.current;
    // Navigateurs sans IntersectionObserver (obsolètes) : contenu
    // laissé masqué — tous les navigateurs cibles (svh, :where…) le
    // prennent en charge depuis 2019.
    if (!element || typeof IntersectionObserver === "undefined") return;
    ensureScrollListener();
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          const premiereIntersection = !dejaVu.current;
          dejaVu.current = true;
          // Animation uniquement en défilement descendant ; en
          // remontant, le contenu apparaît d'emblée (sans animation).
          setAnimated(scrollState.direction === "down");
          setVisibleDesMontage(
            premiereIntersection &&
              scrollState.lastY < 1 &&
              (window as unknown as { __amorcageProfond?: boolean }).__amorcageProfond === true
          );
          setInView(true);
        } else {
          setInView(false);
        }
      },
      { threshold }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView, animated, visibleDesMontage };
}

interface RevealProps {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "article" | "li" | "span" | "figure" | "header" | "footer";
  amount?: number;
  /** Contenu visible dès le premier rendu (au-dessus du pli) :
   *  animation CSS au lieu de l'attente hydratation + IO (volet 7).
   *  Valeur spéciale "rise" : translation SEULE, sans fondu — pour
   *  l'ÉLÉMENT LCP : les animations d'opacité ne reçoivent aucune
   *  repaint du compositeur, l'API LCP n'enregistrerait l'élément
   *  qu'à la prochaine paint forcée (mesuré 1584 ms pour un texte
   *  visible dès 200 ms) ; en transform seul l'élément est peint
   *  dès la première frame et devient candidate LCP immédiatement. */
  aboveFold?: boolean | "rise";
}

export function Reveal({
  children,
  direction = "up",
  delay = 0,
  className,
  as = "div",
  amount = 0.25,
  aboveFold = false,
}: RevealProps) {
  const reduce = useReducedMotion();
  const { ref, inView, animated, visibleDesMontage } = useInView<HTMLDivElement>(
    Math.min(Math.max(amount, 0.05), 0.9)
  );
  const Comp = as as React.ElementType;

  if (reduce) {
    // Mouvement réduit : contenu statique, aucune animation
    return <Comp className={className}>{children}</Comp>;
  }

  if (aboveFold) {
    // Volet 7 : animation CSS au premier rendu — voir l'en-tête du
    // fichier. « both » : l'élément tient son état initial pendant
    // son délai, comme le font les chorégraphies .hero-anim-* du
    // bloc visuel (même mécanique, déjà utilisée depuis le 15/11).
    // aboveFold="rise" : voir RevealProps — réservé à l'élément LCP.
    const foldClass =
      aboveFold === "rise" ? "reveal-fold-rise" : direction === "up" ? "reveal-fold--up" : null;
    return (
      <Comp
        className={foldClass ? `${className ?? ""} ${foldClass}`.trim() : className}
        style={{ animationDelay: `${delay}ms` }}
      >
        {children}
      </Comp>
    );
  }

  const transition = `opacity ${DURATION}ms ${EASE} ${delay}ms, transform ${DURATION}ms ${EASE} ${delay}ms`;
  const style: React.CSSProperties = inView
    ? visibleDesMontage
      ? {
          /* Volet 7 : opacité INSTANTANÉE (la candidate LCP est
           * enregistrée dès la paint de bascule), translation
           * conservée — voir useInView. */
          opacity: 1,
          transform: "none",
          transition: `opacity 0ms, transform ${DURATION}ms ${EASE} ${delay}ms`,
        }
      : { opacity: 1, transform: "none", transition: animated ? transition : "none" }
    : { ...hiddenStyle(direction), transition: "none" };

  return (
    <Comp ref={ref} className={className} style={style}>
      {children}
    </Comp>
  );
}

/** Révélation mot à mot pour les titres (dévoilement progressif des textes).
 *  `boldText` : fragment final du texte à afficher en gras (700) — le reste
 *  du titre reste en graisse normale (400), quel que soit le poids porté
 *  par la classe du conteneur. */
export function RevealText({
  text,
  boldText,
  className,
  as: Tag = "span",
  delay = 0,
  id,
  aboveFold = false,
}: {
  text: string;
  boldText?: string;
  className?: string;
  as?: "span" | "h1" | "h2" | "h3" | "p";
  delay?: number;
  /** Identifiant DOM du titre — nécessaire quand une section le
   *  désigne par aria-labelledby (ex. page Réservation d'appel,
   *  audit intégral du 18/11/2026). */
  id?: string;
  /** Titre visible dès le premier rendu : cascade de mots en
   *  animation CSS, sans attendre l'hydratation (volet 7). */
  aboveFold?: boolean;
}) {
  const reduce = useReducedMotion();
  const { ref, inView, animated } = useInView<HTMLElement>(0.3);
  const Comp = Tag as React.ElementType;

  const boldStart = boldText ? text.indexOf(boldText) : -1;
  const hasBold = boldStart >= 0;

  if (reduce) {
    return (
      <Comp className={className} ref={ref} id={id}>
        {hasBold ? (
          <>
            {text.slice(0, boldStart)}
            <span style={{ fontWeight: 700 }}>{boldText}</span>
          </>
        ) : (
          text
        )}
      </Comp>
    );
  }

  // Découpage pur : tête (graisse normale) + partie en gras, dans
  // l'ordre du texte d'origine.
  const entries = hasBold
    ? [
        ...text
          .slice(0, boldStart)
          .trimEnd()
          .split(" ")
          .map((word) => ({ word, bold: false })),
        ...boldText!.split(" ").map((word) => ({ word, bold: true })),
      ]
    : text.split(" ").map((word) => ({ word, bold: false }));

  if (aboveFold) {
    // Volet 7 : cascade de mots en animations CSS (reveal-fold-word)
    // — même cadence (35 ms/mot), même durée (550 ms), même courbe que
    // la version scroll, mais déclenchée au premier rendu (rien sur le
    // chemin critique : ni hydratation, ni IntersectionObserver).
    return (
      <Comp className={className} id={id}>
        {entries.map(({ word, bold }, i) => (
          <span key={`${i}-${word}`} className="inline-block overflow-hidden align-bottom">
            <span
              className="reveal-fold-word inline-block"
              style={{
                animationDelay: `${delay + i * 35}ms`,
                fontWeight: hasBold ? (bold ? 700 : 400) : undefined,
              }}
            >
              {word}
              {i < entries.length - 1 ? "\u00A0" : ""}
            </span>
          </span>
        ))}
      </Comp>
    );
  }

  return (
    <Comp className={className} ref={ref} id={id}>
      {entries.map(({ word, bold }, i) => {
        const wordDelay = delay + i * 35;
        const transition = animated
          ? `transform 550ms ${EASE} ${wordDelay}ms, opacity 550ms ${EASE} ${wordDelay}ms`
          : "none";
        const style: React.CSSProperties = inView
          ? {
              transform: "translateY(0)",
              opacity: 1,
              transition,
              fontWeight: hasBold ? (bold ? 700 : 400) : undefined,
            }
          : {
              transform: "translateY(0.9em)",
              opacity: 0,
              transition: "none",
              fontWeight: hasBold ? (bold ? 700 : 400) : undefined,
            };
        return (
          <span key={`${i}-${word}`} className="inline-block overflow-hidden align-bottom">
            <span className="inline-block" style={style}>
              {word}
              {i < entries.length - 1 ? "\u00A0" : ""}
            </span>
          </span>
        );
      })}
    </Comp>
  );
}
