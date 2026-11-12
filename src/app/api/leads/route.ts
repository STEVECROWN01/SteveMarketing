import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { leadSchema } from "@/lib/validation";
import { notifyOwner, sendReceipt, isEmailServiceConfigured } from "@/lib/email";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";

/** Limitation de débit en mémoire — protection anti-spam simple. */
const WINDOW_MS = 60 * 60 * 1000; // 1 heure
const MAX_PER_IP = 6;
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear(); // garde-fou mémoire
  return list.length > MAX_PER_IP;
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  try {
    if (isRateLimited(clientIp(req))) {
      return NextResponse.json(
        { ok: false, error: "Trop de demandes envoyées. Merci de réessayer plus tard." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ ok: false, error: "Requête invalide." }, { status: 400 });
    }

    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      return NextResponse.json(
        { ok: false, error: "Certains champs sont invalides.", fieldErrors },
        { status: 422 }
      );
    }

    const data = parsed.data;

    // Piège anti-robots rempli → refus silencieux
    if (data.honeypot && data.honeypot.length > 0) {
      return NextResponse.json({ ok: true, id: "ignored" }, { status: 201 });
    }

    // Enregistrement en base de données — tolérant aux environnements sans
    // base persistante (ex. serverless sans base configurée) : la notification
    // email au propriétaire fait alors foi d'enregistrement fiable.
    let lead: {
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
    };
    let dbPersisted = true;
    try {
      lead = await db.lead.create({
        data: {
          type: data.type,
          status: "new",
          name: data.name,
          email: data.email,
          phone: data.phone ?? null,
          company: data.company ?? null,
          website: data.website ?? null,
          activity: data.activity ?? null,
          serviceType: data.serviceType ?? null,
          budget: data.budget ?? null,
          timeline: data.timeline ?? null,
          message: data.message,
          source: "site web",
        },
      });
    } catch (dbError) {
      dbPersisted = false;
      console.warn(
        "[leads] Base de données indisponible — enregistrement relayé par email :",
        dbError instanceof Error ? dbError.message : dbError
      );
      lead = {
        id: `email-${crypto.randomUUID().slice(0, 8)}`,
        type: data.type,
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        company: data.company ?? null,
        website: data.website ?? null,
        activity: data.activity ?? null,
        serviceType: data.serviceType ?? null,
        budget: data.budget ?? null,
        timeline: data.timeline ?? null,
        message: data.message,
      };
    }

    // Notification + accusé de réception (service serveur, si configuré)
    let notified = false;
    if (isEmailServiceConfigured()) {
      const [ownerSent, receiptSent] = await Promise.all([notifyOwner(lead), sendReceipt(lead)]);
      notified = ownerSent;
      if (dbPersisted && (ownerSent || receiptSent)) {
        try {
          await db.lead.update({
            where: { id: lead.id },
            data: { emailSent: ownerSent },
          });
        } catch {
          // la mise à jour du marqueur est non bloquante
        }
      }
    } else if (dbPersisted) {
      console.info(
        `[leads] Demande ${lead.id} (${lead.type}) enregistrée — destinataire ${SITE.email} — service email non configuré (RESEND_API_KEY absente)`
      );
    }

    // Sans base persistante ET sans notification email partie, la demande
    // ne serait fiablement conservée nulle part : refus honnête vers le visiteur.
    if (!dbPersisted && !notified) {
      console.error(
        "[leads] Rejet : ni base de données ni service email disponibles pour conserver la demande."
      );
      return NextResponse.json(
        {
          ok: false,
          error: `L'enregistrement n'a pas pu être finalisé. Merci de réessayer dans quelques instants, de réserver un appel via Calendly, ou de m'écrire directement à ${SITE.email}.`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        id: lead.id,
        emailNotified: notified,
        message: "Votre demande a bien été enregistrée.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[leads] Erreur d'enregistrement :", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          "Une erreur est survenue pendant l'enregistrement. Merci de réessayer ou de m'écrire directement par email.",
      },
      { status: 500 }
    );
  }
}
