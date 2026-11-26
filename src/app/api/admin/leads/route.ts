import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/admin-auth";
/* VOLET 20 (26/11/2026) — STOCKAGE GITHUB DES DEMANDES : la rubrique
   « Demandes » du back-office liste la FUSION base de données +
   dossier privé `demandes/` du dépôt GitHub (dédupliquée par
   identifiant, la plus récente en tête). Sans base configurée, les
   demandes du site restent ainsi intégralement visibles. */
import { listerDemandes, type DemandeStockee } from "@/lib/documents/demandes-stockage";

export const runtime = "nodejs";

/** Liste des demandes — réservé à l'espace administrateur authentifié. */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
  }

  /* VOLET 20 — demandes du dossier privé GitHub (tolérant : liste
   * vide si le stockage n'est pas configuré). */
  const demandesGithub = await listerDemandes();

  /* Base de données (voie historique) — indisponible sur les
   * environnements sans base : la fusion GitHub prend seule. */
  let demandesBase: DemandeStockee[] = [];
  try {
    demandesBase = (await db.lead.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        status: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        website: true,
        activity: true,
        serviceType: true,
        budget: true,
        timeline: true,
        message: true,
        emailSent: true,
        source: true,
        createdAt: true,
      },
    })) as unknown as DemandeStockee[];
  } catch (error) {
    console.info("[admin/leads] Base de données indisponible — liste GitHub seule :", error instanceof Error ? error.message : error);
  }

  /* Fusion dédupliquée par identifiant : la version BASE (statut
   * maintenu) l'emporte, la version GitHub comble les absents. */
  const parId = new Map<string, DemandeStockee>();
  for (const d of demandesGithub) parId.set(d.id, d);
  for (const d of demandesBase) parId.set(d.id, { ...parId.get(d.id), ...d });

  const leads = Array.from(parId.values()).sort((a, b) =>
    (b.createdAt || "").localeCompare(a.createdAt || ""),
  );

  return NextResponse.json({ ok: true, leads });
}
