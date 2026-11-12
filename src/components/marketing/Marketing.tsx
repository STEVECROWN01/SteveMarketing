"use client";

import React from "react";
import { ArrowRight, ArrowUpRight, CalendarCheck, Eye, FileText, SearchCheck } from "lucide-react";
import { useRouter } from "@/components/router-context";
import { useCalendly } from "@/components/calendly/CalendlyContext";
import { Reveal, RevealText } from "@/components/motion/Reveal";
import { SITE } from "@/lib/site";
import type { AppPage } from "@/components/router-context";

/* ============================ En-têtes de section ============================ */

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
  tone = "dark",
  className = "",
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  align?: "left" | "center";
  tone?: "dark" | "light";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <div className={`${centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"} ${className}`}>
      <Reveal direction="up">
        <p className="text-eyebrow">{eyebrow}</p>
      </Reveal>
      <RevealText
        as="h2"
        text={title}
        delay={0.05}
        className={`text-section-title mt-4 ${tone === "dark" ? "text-white" : "on-paper"}`}
      />
      {intro && (
        <Reveal direction="up" delay={0.12}>
          <p className={`text-body mt-5 ${tone === "dark" ? "on-dark-muted" : "on-paper-muted"}`}>
            {intro}
          </p>
        </Reveal>
      )}
    </div>
  );
}

/* ============================ Boutons d'action ============================ */

type CTAAction =
  | { kind: "calendly" }
  | { kind: "page"; page: AppPage; section?: string }
  | { kind: "external"; url: string }
  | { kind: "anchor"; sectionId: string };

type Variant = "primary" | "secondary" | "dark" | "ghostLight" | "ghostDark";

export function CTAButton({
  action,
  variant = "primary",
  children,
  icon,
  className = "",
  size = "md",
  ariaLabel,
}: {
  action: CTAAction;
  variant?: Variant;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  size?: "md" | "lg";
  ariaLabel?: string;
}) {
  const router = useRouter();
  const calendly = useCalendly();

  const handleClick = (e: React.MouseEvent) => {
    if (action.kind === "calendly") {
      e.preventDefault();
      calendly.openCalendly();
      return;
    }
    if (action.kind === "page") {
      e.preventDefault();
      router.navigate(action.page, action.section ?? null);
      return;
    }
    if (action.kind === "anchor") {
      e.preventDefault();
      const el = document.getElementById(action.sectionId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    // external : comportement natif (nouvel onglet)
  };

  const href =
    action.kind === "calendly"
      ? SITE.calendly
      : action.kind === "page"
        ? `#/${action.page}${action.section ? `/${action.section}` : ""}`
        : action.kind === "external"
          ? action.url
          : `#${action.sectionId}`;

  const base =
    "group/btn btn-fill inline-flex items-center justify-center gap-2.5 rounded-full font-medium tracking-[0.01em] transition-[transform,box-shadow,border-color] duration-300 focus-visible:outline-2 focus-visible:outline-offset-3 hover:-translate-y-0.5";
  const sizes = size === "lg" ? "px-7 py-4 text-[15px] min-h-[52px]" : "px-6 py-3.5 text-sm min-h-[48px]";

  const variants: Record<Variant, string> = {
    primary:
      "bg-[#c9baac] text-[#1c1c1c] shadow-[0_14px_34px_-14px_rgba(201,186,172,0.5)] [&::before]:bg-[#e4e4e4]",
    secondary:
      "bg-white text-[#1c1c1c] border border-[#e4e4e4] hover:border-[#c9baac] [&::before]:bg-[#e4e4e4]",
    dark: "bg-[#3c3c3c] text-white border border-[#3c3c3c] [&::before]:bg-[#525252]",
    ghostLight:
      "bg-transparent text-white border border-[#e4e4e4]/30 [&::before]:bg-[#3c3c3c]",
    ghostDark:
      "bg-transparent text-[#1c1c1c] border border-[#1c1c1c]/25 [&::before]:bg-[#e4e4e4]",
  };

  const external = action.kind === "external";

  return (
    <a
      href={href}
      onClick={handleClick}
      aria-label={ariaLabel}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`${base} ${sizes} ${variants[variant]} ${className}`}
    >
      <span className="inline-flex items-center gap-2.5">
        {icon}
        {children}
        <ArrowRight
          className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1"
          aria-hidden="true"
        />
      </span>
    </a>
  );
}

/* ============================ Icônes d'action ============================ */

export const CTAIcons = {
  calendar: <CalendarCheck className="h-[18px] w-[18px]" aria-hidden="true" />,
  quote: <FileText className="h-[18px] w-[18px]" aria-hidden="true" />,
  audit: <SearchCheck className="h-[18px] w-[18px]" aria-hidden="true" />,
  works: <Eye className="h-[18px] w-[18px]" aria-hidden="true" />,
};

/* ============================ Réassurance ============================ */

export function ReassuranceBar({
  tone = "dark",
  className = "",
  mention,
}: {
  tone?: "dark" | "light";
  className?: string;
  mention?: string;
}) {
  const items = (mention ?? "30 minutes · Gratuit · Sans engagement").split(" · ");
  return (
    <ul
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 text-sm ${
        tone === "dark" ? "text-[#c8c8c8]" : "on-paper-soft"
      } ${className}`}
    >
      {items.map((item, i) => (
        <li key={item} className="flex items-center gap-3">
          {i > 0 && <span className="h-1 w-1 rounded-full bg-[#c9baac]" aria-hidden="true" />}
          {item}
        </li>
      ))}
    </ul>
  );
}

/* ============================ Héro de page secondaire ============================ */

export function PageHero({
  eyebrow,
  title,
  intro,
  children,
  tone = "dark",
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children?: React.ReactNode;
  tone?: "dark" | "light";
}) {
  return (
    <header
      className={`${tone === "dark" ? "section-deep bg-grid-dark" : "section-light"} relative overflow-hidden pt-36 pb-16 sm:pt-44 sm:pb-20 lg:pt-48 lg:pb-24`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-[#c9baac] opacity-[0.07] blur-[110px]"
      />
      <div className="container-site relative">
        <Reveal direction="up">
          <p className="text-eyebrow">{eyebrow}</p>
        </Reveal>
        <RevealText
          as="h1"
          text={title}
          delay={0.08}
          className={`text-hero-title mt-5 max-w-4xl ${tone === "dark" ? "text-white" : "on-paper"}`}
        />
        {intro && (
          <Reveal direction="up" delay={0.16}>
            <p
              className={`text-body mt-6 max-w-2xl ${tone === "dark" ? "on-dark-muted" : "on-paper-muted"}`}
            >
              {intro}
            </p>
          </Reveal>
        )}
        {children && (
          <Reveal direction="up" delay={0.22}>
            <div className="mt-9">{children}</div>
          </Reveal>
        )}
      </div>
    </header>
  );
}

/* ============================ Lien externe avec icône ============================ */

export function ExternalLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group/link inline-flex items-center gap-1.5 underline decoration-[#c9baac]/50 decoration-2 underline-offset-[6px] transition-colors hover:decoration-[#c9baac] ${className}`}
    >
      {children}
      <ArrowUpRight
        className="h-3.5 w-3.5 transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
        aria-hidden="true"
      />
    </a>
  );
}
