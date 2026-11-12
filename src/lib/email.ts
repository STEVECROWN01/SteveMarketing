import { ASSETS, SITE } from "@/lib/site";

/**
 * Service d'envoi d'emails côté serveur (API Resend, REST via fetch).
 * Aucune dépendance frontend, aucun secret exposé au client.
 *
 * Activation : définir RESEND_API_KEY dans les variables
 * d'environnement du serveur (voir README de déploiement).
 * Tant que la clé n'est pas configurée, les demandes restent
 * enregistrées de manière fiable en base de données et le
 * module journalise l'email non envoyé (emailSent = false).
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const FROM_LABEL = "Site Stevens Akpovi <onboarding@resend.dev>";

export interface LeadPayload {
  id: string;
  type: "quote" | "audit";
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  website?: string | null;
  activity?: string | null;
  serviceType?: string | null;
  budget?: string | null;
  timeline?: string | null;
  message: string;
}

export function isEmailServiceConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_LABEL, to: [to], subject, html }),
    });
    return res.ok;
  } catch {
    console.error("[email] Échec d'envoi via Resend");
    return false;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fieldRow(label: string, value?: string | null): string {
  if (!value) return "";
  return `<tr><td style="padding:8px 14px;color:#525252;font-family:Arial,sans-serif;font-size:13px;white-space:nowrap;text-align:right">${label}</td><td style="padding:8px 14px;color:#1c1c1c;font-family:Arial,sans-serif;font-size:14px"><strong>${escapeHtml(value)}</strong></td></tr>`;
}

/** Notification interne : la demande est transmise à stevensakpovi@gmail.com */
export async function notifyOwner(lead: LeadPayload): Promise<boolean> {
  const typeLabel = lead.type === "audit" ? "Audit gratuit" : "Demande de devis";
  const subject = `[Site web] ${typeLabel} — ${lead.name}`;
  const html = `
  <div style="background:#f5f5f5;padding:32px 0">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e4">
      <div style="background:#1c1c1c;padding:20px 28px">
        <span style="color:#c9baac;font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase">Nouvelle demande</span>
        <h1 style="color:#ffffff;font-family:Arial,sans-serif;font-size:20px;margin:8px 0 0">${escapeHtml(typeLabel)} — ${escapeHtml(lead.name)}</h1>
      </div>
      <table style="width:100%;border-collapse:collapse;padding:12px 0">
        ${fieldRow("Nom", lead.name)}
        ${fieldRow("Email", lead.email)}
        ${fieldRow("Téléphone", lead.phone)}
        ${fieldRow("Entreprise", lead.company)}
        ${fieldRow("Site actuel", lead.website)}
        ${fieldRow("Activité", lead.activity)}
        ${fieldRow("Service", lead.serviceType)}
        ${fieldRow("Budget", lead.budget)}
        ${fieldRow("Échéance", lead.timeline)}
      </table>
      <div style="padding:0 28px 12px">
        <p style="color:#525252;font-family:Arial,sans-serif;font-size:13px;margin:0 0 6px">Message :</p>
        <p style="color:#1c1c1c;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;white-space:pre-line">${escapeHtml(lead.message)}</p>
      </div>
      <div style="padding:16px 28px;background:#f5f5f5;border-top:1px solid #e4e4e4;color:#525252;font-family:Arial,sans-serif;font-size:12px">
        Demande enregistrée le ${new Date().toLocaleString("fr-FR")} — référence ${lead.id}
      </div>
    </div>
  </div>`;
  return sendEmail(SITE.email, subject, html);
}

/** Accusé de réception au visiteur. */
export async function sendReceipt(lead: LeadPayload): Promise<boolean> {
  const subject =
    lead.type === "audit"
      ? "Votre demande d'audit gratuit — Stevens Akpovi"
      : "Votre demande de devis — Stevens Akpovi";
  const intro =
    lead.type === "audit"
      ? "Votre demande d'audit gratuit a bien été enregistrée. Je reviens vers vous très rapidement avec mes premières observations sur votre site actuel."
      : "Votre demande de devis personnalisé a bien été enregistrée. Je reviens vers vous très rapidement pour en discuter.";
  const html = `
  <div style="background:#f5f5f5;padding:32px 0">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e4">
      <div style="background:#1c1c1c;padding:24px 28px">
        <img src="${SITE.url}${ASSETS.logoLight}" alt="Stevens Akpovi" width="110" height="88" style="display:block;margin-bottom:12px">
        <span style="color:#c9baac;font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase">Confirmation de réception</span>
        <h1 style="color:#ffffff;font-family:Arial,sans-serif;font-size:22px;margin:8px 0 0">Bonjour ${escapeHtml(lead.name)},</h1>
      </div>
      <div style="padding:28px">
        <p style="color:#1c1c1c;font-family:Arial,sans-serif;font-size:15px;line-height:1.7">${intro}</p>
        <p style="color:#525252;font-family:Arial,sans-serif;font-size:14px;line-height:1.7">Vous préférez avancer plus vite ? Réservez un appel de 30 minutes, gratuit et sans engagement, directement en ligne :<br><a href="${SITE.calendly}" style="color:#1c1c1c">${SITE.calendly}</a></p>
        <p style="color:#525252;font-family:Arial,sans-serif;font-size:13px;line-height:1.7">Référence de votre demande : ${lead.id}</p>
        <hr style="border:none;border-top:1px solid #e4e4e4;margin:24px 0">
        <p style="color:#525252;font-family:Arial,sans-serif;font-size:13px">Stevens Akpovi — ${escapeHtml(SITE.positioning)}<br><a href="mailto:${SITE.email}" style="color:#1c1c1c">${SITE.email}</a></p>
      </div>
    </div>
  </div>`;
  return sendEmail(lead.email, subject, html);
}
