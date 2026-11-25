"use client";

import React, { useRef, useState } from "react";
import { CheckCircle2, Loader2, AlertCircle, Mail, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DISCOVERY_SOURCES,
  SERVICE_TYPES,
  BUDGET_RANGES,
  TIMELINES,
  type LeadInput,
} from "@/lib/validation";
import { SITE } from "@/lib/site";
import { useRouter } from "@/components/router-context";
/* VOLET 18 — i18n : libellés, placeholders, options de select et
   messages via t()/tf() ; les messages d'erreur sont stockés FR
   (validation locale ou renvois serveur) et traduits À L'AFFICHAGE —
   les messages zod dynamiques « Minimum N caractères » sont reconnus
   par motif (une clé par valeur de N serait impossible). */
import { useT } from "@/i18n";

/**
 * Formulaire de demande — trois variantes :
 * - « quote » (page #/demander-un-devis) : REFAITE pour reproduire
 *   EXACTEMENT le widget « New Client Application » de
 *   sheragency.com/request-a-quote (demande de l'éditeur,
 *   15/11/2026 — layout ET design) : carte blanche à ombre douce,
 *   Prénom/Nom en deux colonnes, Email professionnel (icône
 *   enveloppe dans le champ), Téléphone, consentement SMS, trois
 *   questions à choix unique, bouton vert #039855 « Obtenir Un
 *   Devis », pleine largeur, coins 8 px. Champs blancs bordés
 *   #ACACAC, coins 5 px, libellés #2c3345.
 * - « contact » (page #/contact) : REFAITE pour reproduire
 *   EXACTEMENT le widget « Website Contact Form » de
 *   sheragency.com/contact-us (15/11/2026) : libellés blancs
 *   17 px/500 (Satoshi, letter-spacing 0,34 px, marge basse
 *   15 px) au-dessus d'entrées BLANCHES empilées à bordure
 *   invisible, rangées deux colonnes (nom+téléphone, email+
 *   entreprise), liste déroulante et zone de texte pleine largeur,
 *   bouton pilule blanc (rayon 44 px, hauteur 52 px, demi-largeur,
 *   texte noir 17 px) « Envoyer Mon Message » (18/11/2026 —
 *   ex-« Entrer En Contact » : le libellé décrit désormais
 *   l'action réelle au clic). Après envoi (email
 *   automatique à stevensakpovi@gmail.com), redirection vers la
 *   page dédiée à la réservation d'appel (#/reserver-un-appel).
 * - « audit » (page #/audit-gratuit) : montée le 18/11/2026 —
 *   le bouton « Demander Mon Audit Gratuit » de l'accueil
 *   promettait un audit mais menait au formulaire de contact ;
 *   la page dédiée tient la promesse (l'URL du site actuel y
 *   est un champ obligatoire).
 * Validation frontend (contrôles) + backend (API), protection
 * anti-spam (honeypot + délai), enregistrement fiable et accusé de
 * réception. Aucun secret côté client.
 */

type FormKind = "quote" | "audit" | "contact";

/** Questions du formulaire de devis — options traduites de
 *  « New Client Application » (sheragency.com) ; libellés
 *  marketing reformulés sans jargon (17/11/2026) : « Faible taux
 *  de conversion » → « Trop peu de visiteurs deviennent clients »,
 *  « Faible volume de trafic » → « Pas assez de visiteurs ». */
const WHY_NOW_OPTIONS = [
  "Il n'est pas attrayant visuellement",
  "Trop peu de visiteurs deviennent clients",
  "Pas assez de visiteurs",
  "Je n'ai pas encore de site web",
  "Problèmes techniques (bugs, lenteur, etc.)",
] as const;

const REVENUE_OPTIONS = [
  "Moins de 50 000 $/mois",
  "50 000 – 100 000 $/mois",
  "100 000 – 200 000 $/mois",
  "200 000 – 500 000 $/mois",
  "Plus de 500 000 $/mois",
] as const;

const QUOTE_TIMELINES = [
  "Dès que possible",
  "Dans les 1 à 3 prochains mois",
  "Dans 4 mois ou plus",
] as const;

interface FormState {
  /* Devis — structure « New Client Application » */
  firstName: string;
  lastName: string;
  whyNow: string;
  revenue: string;
  quoteTimeline: string;
  smsConsent: boolean;
  /* Contact / audit */
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
  firstName: "",
  lastName: "",
  whyNow: "",
  revenue: "",
  quoteTimeline: "",
  smsConsent: false,
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
  const { t, tf, lang } = useT();

  /** Traduit un message d'erreur à l'affichage : les messages zod
   *  dynamiques « Minimum N caractères » (aucune clé possible par N)
   *  sont reconnus par motif ; les autres passent par t(). */
  const traduitErreur = (message: string) => {
    const m = message.match(/^Minimum (\d+) caractères$/);
    return m && lang === "en" ? `Minimum ${m[1]} characters` : t(message);
  };

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
    if (isQuote) {
      if (form.firstName.trim().length < 2) errs.firstName = "Indiquez votre prénom.";
      if (form.lastName.trim().length < 2) errs.lastName = "Indiquez votre nom.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
        errs.email = "Indiquez une adresse email valide.";
      if (form.phone.trim().replace(/\D/g, "").length < 6)
        errs.phone = "Indiquez votre numéro de téléphone.";
      if (form.whyNow === "") errs.whyNow = "Choisissez la principale raison.";
      if (form.revenue === "") errs.revenue = "Indiquez votre chiffre d'affaires mensuel.";
      return errs;
    }
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
    if (!isQuote && !isContact && form.serviceType === "")
      errs.serviceType = "Choisissez le service souhaité.";
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

    /* Devis — façon « New Client Application » : les réponses aux
       questions à choix unique composent le contenu transmis (le
       formulaire de référence n'a pas de zone de texte libre). */
    const quoteMessage = [
      tf("Pourquoi refaire le site maintenant : {whyNow}", { whyNow: form.whyNow }),
      tf("Chiffre d'affaires mensuel approximatif : {revenue}", { revenue: form.revenue }),
      form.quoteTimeline
        ? tf("Échéance envisagée : {quoteTimeline}", { quoteTimeline: form.quoteTimeline })
        : null,
      form.smsConsent
        ? t("Consentement SMS : accepté — des frais de messages et de données peuvent s'appliquer, STOP pour se désinscrire.")
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    const payload: Partial<LeadInput> = {
      type: kind,
      name: isQuote ? `${form.firstName.trim()} ${form.lastName.trim()}`.trim() : form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      company: form.company.trim() || undefined,
      website: form.website.trim() || undefined,
      activity: form.activity.trim() || undefined,
      discovery: isContact ? form.discovery : undefined,
      serviceType: undefined,
      budget: undefined,
      timeline: isQuote ? form.quoteTimeline || undefined : form.timeline || undefined,
      message: isQuote ? quoteMessage : form.message.trim(),
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
        throw new Error(data?.error ?? t("Erreur inconnue"));
      }

      setForm(EMPTY);

      if (isContact) {
        // Message de contact : redirection vers la page dédiée à la
        // réservation d'appel (demande de l'éditeur, 13/11/2026) —
        // les informations ont déjà été transmises par email.
        toast({
          title: t("Message envoyé"),
          description: t(
            "Merci ! Votre message est bien parti. Réservez maintenant votre créneau d'appel stratégique.",
          ),
        });
        router.navigate("appel");
        return;
      }

      setDone(true);
      toast({
        title: t("Demande enregistrée"),
        description: t(
          "Votre demande a bien été envoyée. Un accusé de réception vous est adressé par email.",
        ),
      });
      // Confirmation visible après enregistrement effectif
      document
        .getElementById(`${kind}-confirmation`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      const message =
        err instanceof Error && err.message !== t("Erreur inconnue")
          ? err.message
          : tf("Une erreur est survenue pendant l'envoi. Merci de réessayer ou de m'écrire directement à {email}.", { email: SITE.email });
      setErrors({ form: message });
      toast({
        title: t("Envoi impossible"),
        description: traduitErreur(message),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------- Styles par thème ---------- */
  /* Devis (sheragency « New Client Application ») : entrées blanches
     bordées #ACACAC, coins 5 px, libellés #2c3345. Contact
     (sheragency « Website Contact Form ») : entrées blanches sans
     bordure visible, libellés blancs 17 px (Satoshi → Sora),
     letter-spacing 0,34 px, marge basse 15 px. */
  const inputQuote =
    "min-h-[50px] w-full rounded-[5px] border border-[#ACACAC] bg-white px-[15px] text-[16px] text-[#2c3345] placeholder:text-[#8c8c8c] transition-colors duration-150 focus:border-[#039855] focus:outline-none";
  const inputContact =
    "min-h-[50px] w-full rounded-[5px] bg-white pb-2 pl-5 pr-[15px] pt-2 text-[16px] text-[#1c1c1c] placeholder:text-[#8c8c8c] transition-shadow duration-200 focus:outline-none focus:shadow-[0_0_0_2px_rgba(228,228,228,0.5)] sm:text-[18px]";
  const inputAudit =
    "min-h-[48px] w-full rounded-lg border border-[#e4e4e4]/18 bg-[#1c1c1c] px-4 py-3 text-[15px] text-white placeholder:text-[#c8c8c8]/50 transition-colors focus:border-[#e4e4e4] focus:outline-none";
  const inputBase = isQuote ? inputQuote : isContact ? inputContact : inputAudit;
  const labelQuote = "mb-2 block font-sans text-[15px] font-medium text-[#2c3345]";
  const labelContact = "mb-[15px] block font-display text-[17px] font-medium tracking-[0.34px] text-white";
  const labelBase = isQuote ? labelQuote : isContact ? labelContact : "mb-1.5 block text-sm font-medium text-white";
  /* Texte d'erreur par variante — accessibilité 1.4.3 (audit intégral du
     19/11/2026, suite a11y) : #ea384c à 12 px ne faisait que 4,06:1 sur la
     carte blanche du devis et 3,87–4,19:1 sur les fonds sombres (requis
     AA : 4,5:1). Carte blanche → rouge foncé #c53030 (5,47:1) ; fonds
     sombres → rouge clair #f87171 (5,7 à 6,2:1). Même famille de rouge,
     seule la profondeur change selon le fond. */
  const errorBase = isQuote
    ? "mt-1.5 text-xs text-[#c53030]"
    : "mt-1.5 text-xs text-[#f87171]";

  /* ---------- Confirmation (devis / audit) ---------- */
  if (done) {
    return (
      <div
        id={`${kind}-confirmation`}
        /* Accessibilité 4.1.3 « Messages d'état » (audit du 19/11/2026) :
           le toast de succès n'est pas annoncé aux lecteurs d'écran dans
           cette version de Radix (aucune zone aria-live dans le DOM,
           mesuré) — le bloc de confirmation porte désormais role=status :
           son apparition est annoncée dès le montage. */
        role="status"
        className={
          isLight
            ? "rounded-2xl border border-[#e4e4e4] bg-white p-8 text-center sm:p-10"
            : "rounded-2xl border border-[#e4e4e4]/40 bg-[#232323] p-8 text-center sm:p-10"
        }
      >
        <span
          className={
            isLight
              ? "mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#039855] text-white"
              : "mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e4e4e4] text-[#1c1c1c]"
          }
        >
          <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
        </span>
        <h3
          className={`mt-6 font-display text-2xl font-semibold ${isLight ? "text-[#1c1c1c]" : "text-white"}`}
        >
          {t("Votre demande a bien été enregistrée.")}
        </h3>
        <p className={`mx-auto mt-4 max-w-md text-[15px] leading-relaxed ${isLight ? "text-[#525252]" : "text-[#c8c8c8]"}`}>
          {isQuote
            ? t("Merci pour votre confiance. Je reviens vers vous très rapidement pour préparer votre devis personnalisé.")
            : t("Merci pour votre confiance. Je reviens vers vous très rapidement avec les premières observations sur votre site.")}
        </p>
        <p className={`mt-4 text-sm ${isLight ? "text-[#525252]" : "text-[#c8c8c8]"}`}>
          {t("Un accusé de réception vous est adressé par email.")}
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
            <span className="inline-flex items-center">{t("Envoyer Une Autre Demande")}</span>
          </button>
        </div>
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
          ? t("Formulaire de contact — laissez un message")
          : isQuote
            ? t("Formulaire de demande de devis personnalisé")
            : t("Formulaire de demande d'audit gratuit")
      }
      className={
        isQuote
          ? // Carte blanche à ombre douce — présentation du widget
            // « New Client Application » de sheragency.
            "relative rounded-xl border border-[#e4e4e4] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_12px_36px_rgba(0,0,0,0.07)] sm:p-9 lg:p-10"
          : isContact
            ? // Champs posés directement sur le fond sombre — présentation
              // du widget « Website Contact Form » de sheragency.
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

      {/* ------- Variante « quote » : New Client Application (sher) ------- */}
      {isQuote ? (
        <div className="flex flex-col gap-6">
          {/* Rangée 1 — Prénom / Nom (deux colonnes, comme la référence) */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor={`${kind}-field-firstName`} className={labelBase}>
                {t("Prénom")} <span className="text-[#2c3345]">*</span>
              </label>
              <input
                id={`${kind}-field-firstName`}
                name="firstName"
                autoComplete="given-name"
                required
                value={form.firstName}
                onChange={set("firstName")}
                aria-invalid={Boolean(errors.firstName)}
                aria-describedby={errors.firstName ? `${kind}-error-firstName` : undefined}
                className={inputBase}
                placeholder={t("Prénom")}
              />
              {errors.firstName && (
                <p id={`${kind}-error-firstName`} className={errorBase}>
                  {traduitErreur(errors.firstName)}
                </p>
              )}
            </div>
            <div>
              <label htmlFor={`${kind}-field-lastName`} className={labelBase}>
                {t("Nom")} <span className="text-[#2c3345]">*</span>
              </label>
              <input
                id={`${kind}-field-lastName`}
                name="lastName"
                autoComplete="family-name"
                required
                value={form.lastName}
                onChange={set("lastName")}
                aria-invalid={Boolean(errors.lastName)}
                aria-describedby={errors.lastName ? `${kind}-error-lastName` : undefined}
                className={inputBase}
                placeholder={t("Nom")}
              />
              {errors.lastName && (
                <p id={`${kind}-error-lastName`} className={errorBase}>
                  {traduitErreur(errors.lastName)}
                </p>
              )}
            </div>
          </div>

          {/* Email professionnel — icône enveloppe dans le champ (ref.) */}
          <div>
            <label htmlFor={`${kind}-field-email`} className={labelBase}>
              {t("Email professionnel")} <span className="text-[#2c3345]">*</span>
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-[15px] top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c8c8c]"
                aria-hidden="true"
              />
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
                className={`${inputBase} pl-[42px]`}
                placeholder={t("Email")}
              />
            </div>
            {errors.email && (
              <p id={`${kind}-error-email`} className={errorBase}>
                {traduitErreur(errors.email)}
              </p>
            )}
          </div>

          {/* Téléphone */}
          <div>
            <label htmlFor={`${kind}-field-phone`} className={labelBase}>
              {t("Téléphone")} <span className="text-[#2c3345]">*</span>
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
              placeholder={t("Téléphone")}
            />
            {errors.phone && (
              <p id={`${kind}-error-phone`} className={errorBase}>
                {traduitErreur(errors.phone)}
              </p>
            )}
          </div>

          {/* Consentement SMS (comme la référence) */}
          <label className="sher-choice sher-choice--top">
            <input
              type="checkbox"
              name="smsConsent"
              checked={form.smsConsent}
              onChange={(e) => {
                setForm((f) => ({ ...f, smsConsent: e.target.checked }));
              }}
              className="sher-choice-input"
              aria-label={t("Consentement à recevoir des messages textes de Stevens Akpovi")}
            />
            <span className="sher-choice-dot sher-choice-dot--check" aria-hidden="true" />
            <span className="text-[15px] leading-snug text-[#525252]">
              {t("En cochant cette case, j'accepte de recevoir des messages textes de Stevens Akpovi. Des frais de messages et de données peuvent s'appliquer. Répondez STOP pour vous désinscrire.")}
            </span>
          </label>

          {/* Question 1 — pourquoi maintenant (choix unique) */}
          <fieldset>
            <legend className={`${labelBase} px-0`}>
              {t("Pourquoi voulez-vous refaire votre site web maintenant\u00A0?")}{" "}
              <span className="text-[#2c3345]">*</span>
            </legend>
            <div className="mt-1 flex flex-col">
              {WHY_NOW_OPTIONS.map((option) => (
                <label key={option} className="sher-choice">
                  <input
                    type="radio"
                    name="whyNow"
                    value={option}
                    checked={form.whyNow === option}
                    onChange={set("whyNow")}
                    className="sher-choice-input"
                    aria-invalid={Boolean(errors.whyNow)}
                  />
                  <span className="sher-choice-dot sher-choice-dot--radio" aria-hidden="true" />
                  <span className="text-[15px] text-[#2c3345]">{t(option)}</span>
                </label>
              ))}
            </div>
            {errors.whyNow && (
              <p id={`${kind}-error-whyNow`} className={errorBase} role="alert">
                {traduitErreur(errors.whyNow)}
              </p>
            )}
          </fieldset>

          {/* Question 2 — chiffre d'affaires mensuel (choix unique) */}
          <fieldset>
            <legend className={`${labelBase} px-0`}>
              {t("Quel est votre chiffre d'affaires mensuel approximatif\u00A0?")}{" "}
              <span className="text-[#2c3345]">*</span>
            </legend>
            <div className="mt-1 flex flex-col">
              {REVENUE_OPTIONS.map((option) => (
                <label key={option} className="sher-choice">
                  <input
                    type="radio"
                    name="revenue"
                    value={option}
                    checked={form.revenue === option}
                    onChange={set("revenue")}
                    className="sher-choice-input"
                    aria-invalid={Boolean(errors.revenue)}
                  />
                  <span className="sher-choice-dot sher-choice-dot--radio" aria-hidden="true" />
                  <span className="text-[15px] text-[#2c3345]">{t(option)}</span>
                </label>
              ))}
            </div>
            {errors.revenue && (
              <p id={`${kind}-error-revenue`} className={errorBase} role="alert">
                {traduitErreur(errors.revenue)}
              </p>
            )}
          </fieldset>

          {/* Question 3 — échéance (choix unique, facultatif) */}
          <fieldset>
            <legend className={`${labelBase} px-0`}>
              {t("Quand envisagez-vous de refaire votre site web\u00A0?")}
            </legend>
            <div className="mt-1 flex flex-col">
              {QUOTE_TIMELINES.map((option) => (
                <label key={option} className="sher-choice">
                  <input
                    type="radio"
                    name="quoteTimeline"
                    value={option}
                    checked={form.quoteTimeline === option}
                    onChange={set("quoteTimeline")}
                    className="sher-choice-input"
                  />
                  <span className="sher-choice-dot sher-choice-dot--radio" aria-hidden="true" />
                  <span className="text-[15px] text-[#2c3345]">{t(option)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      ) : isContact ? (
        /* ------- Variante « contact » : Website Contact Form (sher) ------- */
        <div className="flex flex-col gap-7">
          {/* Rangée 1 — Nom complet / Téléphone (deux colonnes) */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor={`${kind}-field-name`} className={labelBase}>
                {t("Nom complet")} <span className="text-white">*</span>
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
                placeholder={t("Votre nom et prénom")}
              />
              {errors.name && (
                <p id={`${kind}-error-name`} className={errorBase}>
                  {traduitErreur(errors.name)}
                </p>
              )}
            </div>
            <div>
              <label htmlFor={`${kind}-field-phone`} className={labelBase}>
                {t("Téléphone")} <span className="text-white">*</span>
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
                placeholder={t("+229 …")}
              />
              {errors.phone && (
                <p id={`${kind}-error-phone`} className={errorBase}>
                  {traduitErreur(errors.phone)}
                </p>
              )}
            </div>
          </div>

          {/* Rangée 2 — Email / Entreprise (deux colonnes) */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor={`${kind}-field-email`} className={labelBase}>
                {t("Email professionnel")} <span className="text-white">*</span>
              </label>
              {/* Icône enveloppe au début du champ — comme le champ
                  email du formulaire de devis (demande de
                  l'éditeur, 15/11/2026). */}
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-[15px] top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c8c8c]"
                  aria-hidden="true"
                />
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
                  style={{ paddingLeft: 42 }}
                  placeholder={t("vous@exemple.com")}
                />
              </div>
              {errors.email && (
                <p id={`${kind}-error-email`} className={errorBase}>
                  {traduitErreur(errors.email)}
                </p>
              )}
            </div>
            <div>
              <label htmlFor={`${kind}-field-company`} className={labelBase}>
                {t("Entreprise")} <span className="text-white">*</span>
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
                placeholder={t("Nom de votre entreprise ou activité")}
              />
              {errors.company && (
                <p id={`${kind}-error-company`} className={errorBase}>
                  {traduitErreur(errors.company)}
                </p>
              )}
            </div>
          </div>

          {/* Liste déroulante — découverte */}
          <div>
            <label htmlFor={`${kind}-field-discovery`} className={labelBase}>
              {t("Comment m'avez-vous découvert\u00A0?")}{" "}
              <span className="text-white">*</span>
            </label>
            <div className="relative">
              <select
                id={`${kind}-field-discovery`}
                name="discovery"
                required
                value={form.discovery}
                onChange={set("discovery")}
                aria-invalid={Boolean(errors.discovery)}
                className={`${inputBase} appearance-none pr-[42px]`}
              >
                <option value="">{t("Sélectionnez…")}</option>
                {DISCOVERY_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {t(s)}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-[15px] top-1/2 h-4 w-4 -translate-y-1/2 text-[#525252]"
                aria-hidden="true"
              />
            </div>
            {errors.discovery && (
              <p id={`${kind}-error-discovery`} className={errorBase}>
                {traduitErreur(errors.discovery)}
              </p>
            )}
          </div>

          {/* Zone de texte — message */}
          <div>
            <label htmlFor={`${kind}-field-message`} className={labelBase}>
              {t("Comment puis-je vous aider\u00A0?")}{" "}
              <span className="text-white">*</span>
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
              className={`${inputBase} min-h-[150px] resize-y`}
              placeholder={t("Décrivez votre demande…")}
            />
            {errors.message && (
              <p id={`${kind}-error-message`} className={errorBase}>
                {traduitErreur(errors.message)}
              </p>
            )}
          </div>
        </div>
      ) : (
        /* ------- Variante « audit » : grille deux colonnes ------- */
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={`${kind}-field-name`} className={labelBase}>
              {t("Nom complet")}{" "}
              <span className="text-[#e4e4e4]">*</span>
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
              placeholder={t("Votre nom et prénom")}
            />
            {errors.name && (
              <p id={`${kind}-error-name`} className={errorBase}>
                {traduitErreur(errors.name)}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${kind}-field-email`} className={labelBase}>
              {t("Email")} <span className="text-[#e4e4e4]">*</span>
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
              placeholder={t("vous@exemple.com")}
            />
            {errors.email && (
              <p id={`${kind}-error-email`} className={errorBase}>
                {traduitErreur(errors.email)}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${kind}-field-phone`} className={labelBase}>
              {t("Téléphone")} <span className="text-[#c8c8c8]/60">{t("(optionnel)")}</span>
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
              placeholder={t("+229 …")}
            />
            {errors.phone && (
              <p id={`${kind}-error-phone`} className={errorBase}>
                {traduitErreur(errors.phone)}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${kind}-field-website`} className={labelBase}>
              {t("URL de votre site actuel")}{" "}
              <span className="text-[#e4e4e4]">*</span>
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
              placeholder={t("https://votre-site.com")}
            />
            {errors.website && (
              <p id={`${kind}-error-website`} className={errorBase}>
                {traduitErreur(errors.website)}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${kind}-field-service`} className={labelBase}>
              {t("Service souhaité")} <span className="text-[#e4e4e4]">*</span>
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
              <option value="">{t("— Choisir —")}</option>
              {SERVICE_TYPES.map((s) => (
                <option key={s} value={s}>
                  {t(s)}
                </option>
              ))}
            </select>
            {errors.serviceType && <p className={errorBase}>{traduitErreur(errors.serviceType)}</p>}
          </div>

          <div>
            <label htmlFor={`${kind}-field-budget`} className={labelBase}>
              {t("Budget envisagé")}{" "}
              <span className="text-[#c8c8c8]/60">{t("(optionnel)")}</span>
            </label>
            <select
              id={`${kind}-field-budget`}
              name="budget"
              value={form.budget}
              onChange={set("budget")}
              className={`${inputBase} appearance-none`}
            >
              <option value="">{t("— Choisir —")}</option>
              {BUDGET_RANGES.map((b) => (
                <option key={b} value={b}>
                  {t(b)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={`${kind}-field-timeline`} className={labelBase}>
              {t("Échéance souhaitée")}{" "}
              <span className="text-[#c8c8c8]/60">{t("(optionnel)")}</span>
            </label>
            <select
              id={`${kind}-field-timeline`}
              name="timeline"
              value={form.timeline}
              onChange={set("timeline")}
              className={`${inputBase} appearance-none`}
            >
              <option value="">{t("— Choisir —")}</option>
              {TIMELINES.map((option) => (
                <option key={option} value={option}>
                  {t(option)}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor={`${kind}-field-message`} className={labelBase}>
              {t("Votre site et vos objectifs")}{" "}
              <span className="text-[#e4e4e4]">*</span>
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
              placeholder={t("Indiquez l'adresse de votre site et ce qui vous préoccupe aujourd'hui…")}
            />
            {errors.message && (
              <p id={`${kind}-error-message`} className={errorBase}>
                {traduitErreur(errors.message)}
              </p>
            )}
          </div>
        </div>
      )}

      {errors.form && (
        <p
          role="alert"
          className={
            /* Accessibilité 1.4.3 (audit du 19/11/2026) : #ffdede est
               conçu pour les fonds sombres (13,6:1) mais devient quasi
               invisible sur la CARTE BLANCHE du devis (1,25:1). Le texte
               suit désormais la variante — mesuré après correctif :
               #c53030 sur la carte ≈ 5,2:1. */
            "mt-5 flex items-start gap-2.5 rounded-lg border border-[#ea384c]/40 bg-[#ea384c]/10 px-4 py-3 text-sm " +
              (isQuote ? "text-[#c53030]" : "text-[#ffdede]")
          }
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {traduitErreur(errors.form)}
        </p>
      )}

      {/* ------- Bouton d'envoi ------- */}
      {isContact ? (
        /* Pilule blanche demi-largeur, rayon 44 px, 17 px — comme
           « Get In Touch » de sheragency.com/contact-us, avec le
           survol à balayage du bouton du header (remplissage
           progressif #e4e4e4, demande de l'éditeur, 15/11/2026). */
        <div className="mt-9">
          <button
            type="submit"
            disabled={submitting}
            className="btn-fill inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-[44px] bg-white px-7 font-display text-[17px] font-medium tracking-[0.01em] text-[#000000] shadow-[0_1px_2px_rgba(0,0,0,0.12)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.25)] focus-visible:outline-2 focus-visible:outline-offset-3 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 [&::before]:bg-[#e4e4e4] sm:w-1/2"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2.5">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {t("Envoi en cours…")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2.5">{t("Envoyer Mon Message")}</span>
            )}
          </button>
        </div>
      ) : isQuote ? (
        /* Bouton vert pleine largeur, coins 8 px — comme « Get A
           Quote » (#039855) de sheragency.com/request-a-quote, avec
           le survol à balayage du bouton du header (remplissage
           progressif vert foncé, demande de l'éditeur, 15/11/2026). */
        <div className="mt-9">
          <button
            type="submit"
            disabled={submitting}
            className="btn-fill inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-[8px] bg-[#026d43] px-7 font-display text-[17px] font-medium tracking-[0.01em] text-white shadow-[0_1px_2px_rgba(0,0,0,0.12)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-3 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 [&::before]:bg-[#024d3a]"
            /* Accessibilité 1.4.3 (audit du 19/11/2026) : blanc 17 px/500
               sur #039855 ne faisait que 3,73:1 (requis AA : 4,5). Le repos
               passe au vert #026d43 — DÉJÀ la couleur de remplissage du
               survol dans cette même bouton (même famille, un cran plus
               profond : 5,88:1) — et le remplissage progressif du survol
               descend d'un cran encore (#024d3a : 9,88:1) : l'effet
               « progressif vert foncé » approuvé le 15/11 est conservé,
               la teinte de repos seulement s'assombrit d'un cran. */
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2.5">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {t("Envoi en cours…")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2.5">{t("Obtenir Un Devis")}</span>
            )}
          </button>
        </div>
      ) : (
        <div className="mt-7 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-xs leading-relaxed text-[#c8c8c8]/80">
            {t("Vos informations servent uniquement à traiter votre demande d'audit et ne sont jamais partagées.")}
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="btn-fill group/btn inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full border border-[#e4e4e4] bg-white px-7 py-4 font-medium tracking-[0.01em] text-[#1c1c1c] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-[#c9baac] focus-visible:outline-2 focus-visible:outline-offset-3 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 [&::before]:bg-[#e4e4e4]"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2.5">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {t("Envoi en cours…")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2.5">{t("Envoyer Ma Demande D'Audit")}</span>
            )}
          </button>
        </div>
      )}
    </form>
  );
}
