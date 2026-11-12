"use client";

import React from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

/**
 * Animations au scroll — révélation progressive, translations
 * verticales et horizontales légères. Bidirectionnelles : les
 * éléments se révèlent au défilement descendant ET remontant
 * (once: false), sans scroll-jacking. Respect de
 * prefers-reduced-motion.
 */

type Direction = "up" | "down" | "left" | "right" | "fade" | "zoom";

const OFFSET = 28;

const buildVariants = (direction: Direction): Variants => {
  const hidden: Record<string, unknown> = { opacity: 0 };
  switch (direction) {
    case "up":
      hidden.y = OFFSET;
      break;
    case "down":
      hidden.y = -OFFSET;
      break;
    case "left":
      hidden.x = OFFSET;
      break;
    case "right":
      hidden.x = -OFFSET;
      break;
    case "zoom":
      hidden.scale = 0.96;
      break;
    case "fade":
    default:
      break;
  }
  return {
    hidden,
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
  };
};

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
  const Comp = motion[as] as typeof motion.div;

  if (reduce) {
    // Mouvement réduit : contenu statique, aucune animation
    return <Comp className={className}>{children}</Comp>;
  }

  const variants = buildVariants(direction);
  const delayed =
    delay > 0
      ? {
          ...variants,
          visible: {
            ...variants.visible,
            transition: {
              ...(variants.visible as { transition?: Record<string, unknown> }).transition,
              delay,
            },
          },
        }
      : variants;

  return (
    <Comp
      className={className}
      variants={delayed}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount }}
    >
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
  if (reduce) return <Tag className={className}>{text}</Tag>;

  const words = text.split(" ");
  return (
    <Tag className={className}>
      {words.map((word, i) => (
        <span key={`${i}-${word}`} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "0.9em", opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{
              duration: 0.55,
              delay: delay + i * 0.035,
              ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
            }}
          >
            {word}
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
