"use client";

import React, { useRef, useState } from "react";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  BUDGET_RANGES,
  DISCOVERY_SOURCES,
  SERVICE_TYPES,
  TIMELINES,
  type LeadInput,
} from "@/lib/validation";
import { SITE } from "@/lib/site";
import { useRouter } from "@/components/router-context";

/**
 * Formulaire de demande — trois variantes (13/11/2026) :
 * - « quote » (page #/demander-un-devis) : thème CLAIR, présentation
 *   calquée sur la page « Request a quote » de sheragency.com — champs
 *   d'identité en deux colonnes, message pleine largeur, bouton noir
 *   pleine largeur. Confirmation inline.
 * - « contact » (page #/contact) : thème SOMBRE, présentation calquée
 *   sur « Contact Us » de sheragency.com — champs pleine largeur aux
 *   entrées BLANCHES empilées, bouton blanc demi-largeur
 *   « Envoyer Le Message ». Après envoi (email automatique à
 *   stevensakpovi@gmail.com), redirection vers la page dédiée à la
 *   réservation d'appel (#/reserver-un-appel).
 * - « audit » (variante historique sombre, conservée pour référence).
 * Validation frontend (contrôles) + backend (API), protection
 * anti-spam (honeypot + délai), enregistrement fiable et accusé de
 * réception. Aucun secret côté client.
 */

type FormKind = "quote" | "audit" | "contact";

interface FormState {
  name: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  activity: string;
  discovery: string;
  serviceType: string;
  budget: string;
  timeline: string;
  message: string;
  honeypot: string;
}

const EMPTY: FormState = {
  name: "",
  email: "",
  phone: "",
  company: "",
  website: "",
  activity: "",
  discovery: "",
  serviceType: "",
  budget: "",
  timeline: "",
  message: "",
  honeypot: "",
};

export function LeadForm({ kind }: { kind: FormKind }) {
  const isQuote = kind === "quote";
  const isContact = kind === "contact";
  const isLight = isQuote;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const mountedAt = useRef<number>(Date.now());
  const { toast } = useToast();
  const router = useRouter();

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = "Indiquez votre nom complet.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
      errs.email = "Indiquez une adresse email valide.";
    if (!isQuote && !isContact && form.website.trim().length < 4)
      errs.website = "L'URL de votre site actuel est nécessaire pour l'audit.";
    if (form.phone.trim() && !/^[+\d][\d\s().-]{5,}$/.test(form.phone.trim()))
      errs.phone = "Numéro de téléphone invalide.";
    if (isContact && form.phone.trim().length < 6)
      errs.phone = "Indiquez votre numéro de téléphone.";
    if (isContact && form.company.trim().length < 2)
      errs.company = "Indiquez le nom de votre entreprise ou activité.";
    if (isContact && form.discovery === "")
      errs.discovery = "Indiquez comment vous m'avez découvert.";
    if (form.message.trim().length < 10)
      errs.message = "Décrivez votre besoin en quelques mots (10 caractères minimum).";
    if (isQuote && form.serviceType === "") errs.serviceType = "Choisissez le service souhaité.";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    // Anti-spam : leurre invisible
    if (form.honeypot) return;

    // Anti-spam : soumission trop rapide (< 3 secondes)
    if (Date.now() - mountedAt.current < 3000) {
      setErrors({ form: "Prenez quelques instants pour compléter votre message, puis renvoyez." });
      return;
    }

    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      const first = document.getElementById(`${kind}-field-${Object.keys(clientErrors)[0]}`);
      first?.focus();
      return;
    }

    setSubmitting(true);
    setErrors({});

    const payload: Partial<LeadInput> = {
      type: kind,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      company: form.company.trim() || undefined,
      website: form.website.trim() || undefined,
      activity: form.activity.trim() || undefined,
      discovery: isContact ? form.discovery : undefined,
      serviceType: isQuote ? form.serviceType : undefined,
      budget: isQuote ? form.budget || undefined : undefined,
      timeline: isQuote ? form.timeline || undefined : undefined,
      message: form.message.trim(),
      honeypot: "",
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: boolean; id?: string; error?: string; fieldErrors?: Record<string, string> }
        | null;

      if (!res.ok || !data?.ok) {
        if (data?.fieldErrors) setErrors(data.fieldErrors);
        throw new Error(data?.error ?? "Erreur inconnue");
      }

      setForm(EMPTY);

      if (isContact) {
        // Message de contact : redirection vers la page dédiée à la
        // réservation d'appel (demande de l'éditeur, 13/11/2026) —
        // les informations ont déjà été transmises par email.
        toast({
          title: "Message envoyé",
          description:
            "Merci ! Votre message est bien parti. Réservez maintenant votre créneau d'appel stratégique.",
        });
        router.navigate("appel");
        return;
      }

      setDone(true);
      toast({
        title: "Demande enregistrée",
        description:
          "Votre demande a bien été envoyée. Un accusé de réception vous est adressé par email.",
      });
      // Confirmation visible après enregistrement effectif
      document
        .getElementById(`${kind}-confirmation`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      const message =
        err instanceof Error && err.message !== "Erreur inconnue"
          ? err.message
          : `Une erreur est survenue pendant l'envoi. Merci de réessayer ou de m'écrire directement à ${SITE.email}.`;
      setErrors({ form: message });
      toast({
        title: "Envoi impossible",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------- Styles par thème ---------- */
  const inputBase = isLight
    ? "min-h-[48px] w-full rounded-lg border border-[#e4e4e4] bg-white px-4 py-3 text-[15px] text-[#1c1c1c] placeholder:text-[#525252]/60 transition-colors focus:border-[#1c1c1c] focus:outline-none"
    : isContact
      ? "min-h-[50px] w-full rounded-md bg-white px-4 py-3 text-[15px] text-[#1c1c1c] placeholder:text-[#525252]/70 transition-shadow duration-200 focus:outline-none focus:shadow-[0_0_0_2px_rgba(228,228,228,0.55)]"
      : "min-h-[48px] w-full rounded-lg border border-[#e4e4e4]/18 bg-[#1c1c1c] px-4 py-3 text-[15px] text-white placeholder:text-[#c8c8c8]/50 transition-colors focus:border-[#e4e4e4] focus:outline-none";
  const labelBase = isLight
    ? "mb-1.5 block text-sm font-medium text-[#1c1c1c]"
    : "mb-1.5 block text-sm font-medium text-white";
  const errorBase = "mt-1.5 text-xs text-[#ea384c]";

  /* ---------- Confirmation (devis / audit) ---------- */
  if (done) {
    return (
      <div
        id={`${kind}-confirmation`}
        className={
          isLight
            ? "rounded-2xl border border-[#e4e4e4] bg-white p-8 text-center sm:p-10"
            : "rounded-2xl border border-[#e4e4e4]/40 bg-[#232323] p-8 text-center sm:p-10"
        }
      >
        <span
          className={
            isLight
              ? "mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1c1c1c] text-white"
              : "mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e4e4e4] text-[#1c1c1c]"
          }
        >
          <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
        </span>
        <h3
          className={`mt-6 font-display text-2xl font-semibold ${isLight ? "text-[#1c1c1c]" : "text-white"}`}
        >
          Votre demande a bien été enregistrée.
        </h3>
        <p className={`mx-auto mt-4 max-w-md text-[15px] leading-relaxed ${isLight ? "text-[#525252]" : "text-[#c8c8c8]"}`}>
          {isQuote
            ? "Merci pour votre confiance. Je reviens vers vous très rapidement pour préparer votre devis personnalisé."
            : "Merci pour votre confiance. Je reviens vers vous très rapidement avec les premières observations sur votre site."}
        </p>
        <p className={`mt-4 text-sm ${isLight ? "text-[#525252]" : "text-[#c8c8c8]"}`}>
          Un accusé de réception vous est adressé par email.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              setDone(false);
              mountedAt.current = Date.now();
            }}
            className={
              isLight
                ? "btn-fill min-h-[44px] rounded-full border border-[#1c1c1c]/25 bg-transparent px-6 py-3 text-sm font-medium text-[#1c1c1c] [&::before]:bg-[#e4e4e4]"
                : "btn-fill min-h-[44px] rounded-full border border-[#e4e4e4]/30 px-6 py-3 text-sm font-medium text-white [&::before]:bg-[#3c3c3c]"
            }
          >
            <span className="inline-flex items-center">Envoyer Une Autre Demande</span>
          </button>
        </div>
        <p className={`mt-6 text-xs ${isLight ? "text-[#525252]/80" : "text-[#c8c8c8]/70"}`}>
          Vous préférez avancer plus vite&nbsp;?{" "}
          <a
            href={SITE.calendly}
            target="_blank"
            rel="noopener noreferrer"
            className={`font-medium underline underline-offset-4 ${isLight ? "text-[#1c1c1c]" : "text-[#e4e4e4]"}`}
          >
            Réservez un appel de 30 minutes
          </a>{" "}
          — {SITE.calendlyMention.toLowerCase()}
        </p>
      </div>
    );
  }

  /* ---------- Formulaire ---------- */
  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      aria-label={
        isContact
          ? "Formulaire de contact — laissez un message"
          : isQuote
            ? "Formulaire de demande de devis personnalisé"
            : "Formulaire de demande d'audit gratuit"
      }
      className={
        isQuote
          ? // Page claire (#/demander-un-devis) : champs posés directement
            // sur le fond blanc, façon sheragency.
            "relative"
          : isContact
            ? // Page sombre (#/contact) : champs posés directement sur le
              // fond sombre, entrées blanches, façon sheragency.
              "relative"
            : "rounded-2xl border border-[#e4e4e4]/12 bg-[#232323] p-6 sm:p-8 lg:p-9"
      }
    >
      {/* Piège anti-robots (invisible) */}
      <input
        type="text"
        name="societe_verification"
        value={form.honeypot}
        onChange={set("honeypot")}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="pointer-events-none absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      {/* ------- Variante « contact » : champs empilés (sheragency) ------- */}
      {isContact ? (
        <div className="flex flex-col gap-5">
          <div>
            <label htmlFor={`${kind}-field-name`} className={labelBase}>
              Nom complet <span className={isLight ? "text-[#1c1c1c]" : "text-[#e4e4e4]"}>*</span>
            </label>
            <input
              id={`${kind}-field-name`}
              name="name"
              autoComplete="name"
              required
              value={form.name}
              onChange={set("name")}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? `${kind}-error-name` : undefined}
              className={inputBase}
              placeholder="Votre nom et prénom"
            />
            {errors.name && (
              <p id={`${kind}-error-name`} className={errorBase}>
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${kind}-field-phone`} className={labelBase}>
              Téléphone <span className={isLight ? "text-[#1c1c1c]" : "text-[#e4e4e4]"}>*</span>
            </label>
            <input
              id={`${kind}-field-phone`}
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              value={form.phone}
              onChange={set("phone")}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? `${kind}-error-phone` : undefined}
              className={inputBase}
              placeholder="+229 …"
            />
            {errors.phone && (
              <p id={`${kind}-error-phone`} className={errorBase}>
                {errors.phone}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${kind}-field-email`} className={labelBase}>
              Email <span className={isLight ? "text-[#1c1c1c]" : "text-[#e4e4e4]"}>*</span>
            </label>
            <input
              id={`${kind}-field-email`}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={set("email")}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? `${kind}-error-email` : undefined}
              className={inputBase}
              placeholder="vous@exemple.com"
            />
            {errors.email && (
              <p id={`${kind}-error-email`} className={errorBase}>
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${kind}-field-company`} className={labelBase}>
              Entreprise <span className={isLight ? "text-[#1c1c1c]" : "text-[#e4e4e4]"}>*</span>
            </label>
            <input
              id={`${kind}-field-company`}
              name="company"
              autoComplete="organization"
              required
              value={form.company}
              onChange={set("company")}
              aria-invalid={Boolean(errors.company)}
              aria-describedby={errors.company ? `${kind}-error-company` : undefined}
              className={inputBase}
              placeholder="Nom de votre entreprise ou activité"
            />
            {errors.company && (
              <p id={`${kind}-error-company`} className={errorBase}>
                {errors.company}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${kind}-field-discovery`} className={labelBase}>
              Comment m'avez-vous découvert&nbsp;?{" "}
              <span className={isLight ? "text-[#1c1c1c]" : "text-[#e4e4e4]"}>*</span>
            </label>
            <select
              id={`${kind}-field-discovery`}
              name="discovery"
              required
              value={form.discovery}
              onChange={set("discovery")}
              aria-invalid={Boolean(errors.discovery)}
              className={`${inputBase} appearance-none`}
            >
              <option value="">— Choisir —</option>
              {DISCOVERY_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {errors.discovery && (
              <p id={`${kind}-error-discovery`} className={errorBase}>
                {errors.discovery}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${kind}-field-message`} className={labelBase}>
              Comment puis-je vous aider&nbsp;?{" "}
              <span className={isLight ? "text-[#1c1c1c]" : "text-[#e4e4e4]"}>*</span>
            </label>
            <textarea
              id={`${kind}-field-message`}
              name="message"
              required
              rows={5}
              value={form.message}
              onChange={set("message")}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? `${kind}-error-message` : undefined}
              className={`${inputBase} min-h-[140px] resize-y py-3.5`}
              placeholder="Décrivez votre demande…"
            />
            {errors.message && (
              <p id={`${kind}-error-message`} className={errorBase}>
                {errors.message}
              </p>
            )}
          </div>
        </div>
      ) : (
        /* ------- Variante « devis » / « audit » : grille deux colonnes ------- */
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={`${kind}-field-name`} className={labelBase}>
              Nom complet{" "}
              <span className={isLight ? "text-[#1c1c1c]" : "text-[#e4e4e4]"}>*</span>
            </label>
            <input
              id={`${kind}-field-name`}
              name="name"
              autoComplete="name"
              required
              value={form.name}
              onChange={set("name")}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? `${kind}-error-name` : undefined}
              className={inputBase}
              placeholder="Votre nom et prénom"
            />
            {errors.name && (
              <p id={`${kind}-error-name`} className={errorBase}>
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${kind}-field-email`} className={labelBase}>
              Email <span className={isLight ? "text-[#1c1c1c]" : "text-[#e4e4e4]"}>*</span>
            </label>
            <input
              id={`${kind}-field-email`}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={set("email")}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? `${kind}-error-email` : undefined}
              className={inputBase}
              placeholder="vous@exemple.com"
            />
            {errors.email && (
              <p id={`${kind}-error-email`} className={errorBase}>
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${kind}-field-phone`} className={labelBase}>
              Téléphone <span className={isLight ? "text-[#525252]" : "text-[#c8c8c8]/60"}>(optionnel)</span>
            </label>
            <input
              id={`${kind}-field-phone`}
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={set("phone")}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? `${kind}-error-phone` : undefined}
              className={inputBase}
              placeholder="+229 …"
            />
            {errors.phone && (
              <p id={`${kind}-error-phone`} className={errorBase}>
                {errors.phone}
              </p>
            )}
          </div>

          {isQuote ? (
            <div>
              <label htmlFor={`${kind}-field-company`} className={labelBase}>
                Entreprise <span className={isLight ? "text-[#525252]" : "text-[#c8c8c8]/60"}>(optionnel)</span>
              </label>
              <input
                id={`${kind}-field-company`}
                name="company"
                autoComplete="organization"
                value={form.company}
                onChange={set("company")}
                className={inputBase}
                placeholder="Nom de votre entreprise"
              />
            </div>
          ) : (
            <div>
              <label htmlFor={`${kind}-field-website`} className={labelBase}>
                URL de votre site actuel{" "}
                <span className={isLight ? "text-[#1c1c1c]" : "text-[#e4e4e4]"}>*</span>
              </label>
              <input
                id={`${kind}-field-website`}
                name="website"
                type="url"
                inputMode="url"
                required
                value={form.website}
                onChange={set("website")}
                aria-invalid={Boolean(errors.website)}
                aria-describedby={errors.website ? `${kind}-error-website` : undefined}
                className={inputBase}
                placeholder="https://votre-site.com"
              />
              {errors.website && (
                <p id={`${kind}-error-website`} className={errorBase}>
                  {errors.website}
                </p>
              )}
            </div>
          )}

          {isQuote && (
            <>
              <div>
                <label htmlFor={`${kind}-field-service`} className={labelBase}>
                  Service souhaité <span className={isLight ? "text-[#1c1c1c]" : "text-[#e4e4e4]"}>*</span>
                </label>
                <select
                  id={`${kind}-field-service`}
                  name="serviceType"
                  required
                  value={form.serviceType}
                  onChange={set("serviceType")}
                  aria-invalid={Boolean(errors.serviceType)}
                  className={`${inputBase} appearance-none`}
                >
                  <option value="">— Choisir —</option>
                  {SERVICE_TYPES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {errors.serviceType && <p className={errorBase}>{errors.serviceType}</p>}
              </div>

              <div>
                <label htmlFor={`${kind}-field-activity`} className={labelBase}>
                  Votre activité{" "}
                  <span className={isLight ? "text-[#525252]" : "text-[#c8c8c8]/60"}>(optionnel)</span>
                </label>
                <input
                  id={`${kind}-field-activity`}
                  name="activity"
                  value={form.activity}
                  onChange={set("activity")}
                  className={inputBase}
                  placeholder="Secteur, métier, offre principale"
                />
              </div>

              <div>
                <label htmlFor={`${kind}-field-budget`} className={labelBase}>
                  Budget envisagé{" "}
                  <span className={isLight ? "text-[#525252]" : "text-[#c8c8c8]/60"}>(optionnel)</span>
                </label>
                <select
                  id={`${kind}-field-budget`}
                  name="budget"
                  value={form.budget}
                  onChange={set("budget")}
                  className={`${inputBase} appearance-none`}
                >
                  <option value="">— Choisir —</option>
                  {BUDGET_RANGES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor={`${kind}-field-timeline`} className={labelBase}>
                  Échéance souhaitée{" "}
                  <span className={isLight ? "text-[#525252]" : "text-[#c8c8c8]/60"}>(optionnel)</span>
                </label>
                <select
                  id={`${kind}-field-timeline`}
                  name="timeline"
                  value={form.timeline}
                  onChange={set("timeline")}
                  className={`${inputBase} appearance-none`}
                >
                  <option value="">— Choisir —</option>
                  {TIMELINES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="sm:col-span-2">
            <label htmlFor={`${kind}-field-message`} className={labelBase}>
              {isQuote ? "Votre projet" : "Votre site et vos objectifs"}{" "}
              <span className={isLight ? "text-[#1c1c1c]" : "text-[#e4e4e4]"}>*</span>
            </label>
            <textarea
              id={`${kind}-field-message`}
              name="message"
              required
              rows={5}
              value={form.message}
              onChange={set("message")}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? `${kind}-error-message` : undefined}
              className={`${inputBase} min-h-[140px] resize-y py-3.5`}
              placeholder={
                isQuote
                  ? "Présentez votre activité et ce que vous attendez de votre futur site…"
                  : "Indiquez l'adresse de votre site et ce qui vous préoccupe aujourd'hui…"
              }
            />
            {errors.message && (
              <p id={`${kind}-error-message`} className={errorBase}>
                {errors.message}
              </p>
            )}
          </div>
        </div>
      )}

      {errors.form && (
        <p
          role="alert"
          className="mt-5 flex items-start gap-2.5 rounded-lg border border-[#ea384c]/40 bg-[#ea384c]/10 px-4 py-3 text-sm text-[#ffdede]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {errors.form}
        </p>
      )}

      {/* ------- Bouton d'envoi ------- */}
      {isContact ? (
        <div className="mt-7">
          <p className={`text-xs leading-relaxed ${isLight ? "text-[#525252]" : "text-[#c8c8c8]/80"}`}>
            Vos informations sont transmises automatiquement à {SITE.email} et servent
            uniquement à traiter votre demande — elles ne sont jamais partagées.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="btn-fill group/btn mt-5 inline-flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-full border border-[#e4e4e4] bg-white px-7 py-4 font-medium tracking-[0.01em] text-[#1c1c1c] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-[#c9baac] focus-visible:outline-2 focus-visible:outline-offset-3 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 [&::before]:bg-[#e4e4e4] sm:w-1/2"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2.5">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Envoi en cours…
              </span>
            ) : (
              <span className="inline-flex items-center gap-2.5">Envoyer Le Message</span>
            )}
          </button>
        </div>
      ) : isQuote ? (
        <div className="mt-7">
          <p className="text-xs leading-relaxed text-[#525252]">
            Vos informations servent uniquement à préparer votre devis et ne sont
            jamais partagées.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="btn-fill group/btn mt-5 inline-flex min-h-[54px] w-full items-center justify-center gap-2.5 rounded-full border border-[#e4e4e4]/30 bg-[#000000] px-7 py-4 font-medium tracking-[0.01em] text-white transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-3 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 [&::before]:bg-[#3c3c3c]"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2.5">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Envoi en cours…
              </span>
            ) : (
              <span className="inline-flex items-center gap-2.5">Envoyer Ma Demande De Devis</span>
            )}
          </button>
        </div>
      ) : (
        <div className="mt-7 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-xs leading-relaxed text-[#c8c8c8]/80">
            Vos informations servent uniquement à traiter votre demande d'audit et ne
            sont jamais partagées.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="btn-fill group/btn inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full border border-[#e4e4e4] bg-white px-7 py-4 font-medium tracking-[0.01em] text-[#1c1c1c] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-[#c9baac] focus-visible:outline-2 focus-visible:outline-offset-3 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 [&::before]:bg-[#e4e4e4]"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2.5">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Envoi en cours…
              </span>
            ) : (
              <span className="inline-flex items-center gap-2.5">Envoyer Ma Demande D'Audit</span>
            )}
          </button>
        </div>
      )}
    </form>
  );
}
