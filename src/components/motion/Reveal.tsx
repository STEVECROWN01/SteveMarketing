"use client";

import React, { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Animations au scroll — révélation progressive BIDIRECTIONNELLE :
 * les éléments s'animent à l'entrée dans le viewport, retrouvent
 * leur état masqué à la sortie, puis se réaniment au retour — aussi
 * bien en descendant qu'en remontant la page (demande de l'éditeur).
 *
 * Implémentation IntersectionObserver + transitions CSS (remplace les
 * états whileInView de framer-motion) : l'opacité et la translation
 * suivent à tout instant l'état réel d'intersection — un texte ne peut
 * plus rester bloqué invisible après un défilement rapide (défaut
 * constaté avec whileInView + once: false, qui exigeait un rechargement
 * de page), tout en conservant des animations dans les deux sens.
 * Respect de prefers-reduced-motion (contenu statique).
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

/** Vrai tant que l'élément observé intersecte le viewport (les deux sens). */
function useInView<T extends HTMLElement>(threshold: number) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setInView(entry.isIntersecting);
      },
      { threshold }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
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
  const { ref, inView } = useInView<HTMLDivElement>(
    Math.min(Math.max(amount, 0), 0.2)
  );
  const Comp = as as React.ElementType;

  if (reduce) {
    // Mouvement réduit : contenu statique, aucune animation
    return <Comp className={className}>{children}</Comp>;
  }

  const transition = `opacity ${DURATION}ms ${EASE} ${delay}ms, transform ${DURATION}ms ${EASE} ${delay}ms`;
  const style: React.CSSProperties = inView
    ? { opacity: 1, transform: "none", transition }
    : { ...hiddenStyle(direction), transition };

  return (
    <Comp ref={ref} className={className} style={style}>
      {children}
    </Comp>
  );
}

/** Révélation mot à mot pour les titres (dévoilement progressif des textes). */
export function RevealText({
  text,
  className,
  as: Tag = "span",
  delay = 0,
}: {
  text: string;
  className?: string;
  as?: "span" | "h1" | "h2" | "h3" | "p";
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const { ref, inView } = useInView<HTMLElement>(0.3);
  const Comp = Tag as React.ElementType;

  if (reduce) return <Comp className={className}>{text}</Comp>;

  const words = text.split(" ");
  return (
    <Comp className={className} ref={ref}>
      {words.map((word, i) => {
        const wordDelay = delay + i * 35;
        const transition = `transform 550ms ${EASE} ${wordDelay}ms, opacity 550ms ${EASE} ${wordDelay}ms`;
        const style: React.CSSProperties = inView
          ? { transform: "translateY(0)", opacity: 1, transition }
          : { transform: "translateY(0.9em)", opacity: 0, transition };
        return (
          <span key={`${i}-${word}`} className="inline-block overflow-hidden align-bottom">
            <span className="inline-block" style={style}>
              {word}
              {i < words.length - 1 ? "\u00A0" : ""}
            </span>
          </span>
        );
      })}
    </Comp>
  );
}
