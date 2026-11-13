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
          // Animation uniquement en défilement descendant ; en
          // remontant, le contenu apparaît d'emblée (sans animation).
          setAnimated(scrollState.direction === "down");
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

  return { ref, inView, animated };
}

interface RevealProps {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "article" | "li" | "span" | "figure" | "header" | "footer";
  amount?: number;
}

export function Reveal({
  children,
  direction = "up",
  delay = 0,
  className,
  as = "div",
  amount = 0.25,
}: RevealProps) {
  const reduce = useReducedMotion();
  const { ref, inView, animated } = useInView<HTMLDivElement>(
    Math.min(Math.max(amount, 0.05), 0.9)
  );
  const Comp = as as React.ElementType;

  if (reduce) {
    // Mouvement réduit : contenu statique, aucune animation
    return <Comp className={className}>{children}</Comp>;
  }

  const transition = `opacity ${DURATION}ms ${EASE} ${delay}ms, transform ${DURATION}ms ${EASE} ${delay}ms`;
  const style: React.CSSProperties = inView
    ? { opacity: 1, transform: "none", transition: animated ? transition : "none" }
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
}: {
  text: string;
  boldText?: string;
  className?: string;
  as?: "span" | "h1" | "h2" | "h3" | "p";
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const { ref, inView, animated } = useInView<HTMLElement>(0.3);
  const Comp = Tag as React.ElementType;

  const boldStart = boldText ? text.indexOf(boldText) : -1;
  const hasBold = boldStart >= 0;

  if (reduce) {
    return (
      <Comp className={className} ref={ref}>
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

  return (
    <Comp className={className} ref={ref}>
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
