import { z } from "zod";

/**
 * Schémas de validation — partagés entre le frontend (UX) et
 * l'API (sécurité). Validation backend systématique.
 */

export const LEAD_TYPES = ["quote", "audit", "contact"] as const;
export const SERVICE_TYPES = [
  "Site vitrine professionnel",
  "Site web multipages",
  "Landing page",
  "Page de vente",
  "Refonte de site web",
  "Système d'acquisition client",
  "Autre / je ne sais pas encore",
] as const;
/** Comment le visiteur a découvert Stevens Akpovi (formulaire de
 *  contact, style sheragency) — canaux réels de l'éditeur. */
export const DISCOVERY_SOURCES = [
  "TikTok",
  "Instagram",
  "LinkedIn",
  "YouTube",
  "Google",
  "WhatsApp",
  "Bouche à oreille",
  "Autre",
] as const;
export const BUDGET_RANGES = [
  "À définir ensemble",
  "Moins de 150 000 FCFA",
  "150 000 – 400 000 FCFA",
  "400 000 – 900 000 FCFA",
  "Plus de 900 000 FCFA",
] as const;
export const TIMELINES = [
  "Dès que possible",
  "Dans le mois",
  "Dans 2 à 3 mois",
  "Plus tard, je m'informe",
] as const;
export const LEAD_STATUSES = ["new", "contacted", "qualified", "won", "lost"] as const;

const trimmed = (min: number, max = 200) =>
  z.string().trim().min(min, { message: `Minimum ${min} caractères` }).max(max);

export const leadSchema = z
  .object({
    type: z.enum(LEAD_TYPES),
    name: trimmed(2, 120),
    email: z.string().trim().email({ message: "Adresse email invalide" }).max(200),
    phone: z
      .string()
      .trim()
      .max(40)
      .optional()
      .or(z.literal(""))
      .transform((v) => (v && v.length > 0 ? v : null)),
    company: z
      .string()
      .trim()
      .max(140)
      .optional()
      .or(z.literal(""))
      .transform((v) => (v && v.length > 0 ? v : null)),
    website: z
      .string()
      .trim()
      .max(300)
      .optional()
      .or(z.literal(""))
      .transform((v) => (v && v.length > 0 ? v : null)),
    activity: z
      .string()
      .trim()
      .max(140)
      .optional()
      .or(z.literal(""))
      .transform((v) => (v && v.length > 0 ? v : null)),
    discovery: z
      .string()
      .trim()
      .max(80)
      .optional()
      .or(z.literal(""))
      .transform((v) => (v && v.length > 0 ? v : null)),
    serviceType: z
      .string()
      .trim()
      .max(120)
      .optional()
      .or(z.literal(""))
      .transform((v) => (v && v.length > 0 ? v : null)),
    budget: z
      .string()
      .trim()
      .max(80)
      .optional()
      .or(z.literal(""))
      .transform((v) => (v && v.length > 0 ? v : null)),
    timeline: z
      .string()
      .trim()
      .max(80)
      .optional()
      .or(z.literal(""))
      .transform((v) => (v && v.length > 0 ? v : null)),
    message: trimmed(10, 4000),
    // Anti-spam : champ leurre invisible pour les robots
    honeypot: z.string().max(0, { message: "Requête refusée" }).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.type === "audit" && (!data.website || data.website.length < 4)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["website"],
        message: "L'URL de votre site actuel est nécessaire pour l'audit",
      });
    }
    // Message de contact (style sheragency) : téléphone, entreprise et
    // canal de découverte sont requis, comme sur la page de référence.
    if (data.type === "contact") {
      if (!data.phone || data.phone.replace(/\D/g, "").length < 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phone"],
          message: "Indiquez votre numéro de téléphone.",
        });
      }
      if (!data.company || data.company.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["company"],
          message: "Indiquez le nom de votre entreprise ou activité.",
        });
      }
      if (!data.discovery || data.discovery.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["discovery"],
          message: "Indiquez comment vous m'avez découvert.",
        });
      }
    }
  });

export type LeadInput = z.infer<typeof leadSchema>;

export const adminLoginSchema = z.object({
  password: z.string().min(1, "Mot de passe requis").max(200),
});

export const leadStatusSchema = z.object({
  status: z.enum(LEAD_STATUSES),
});
