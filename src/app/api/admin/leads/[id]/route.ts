import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leadStatusSchema } from "@/lib/validation";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/admin-auth";
/* VOLET 20 — le statut suit AUSSI la copie GitHub de la demande
   (le back-office liste la fusion base + dossier privé). */
import { majStatutDemande } from "@/lib/documents/demandes-stockage";

export const runtime = "nodejs";

/** Mise à jour du statut d'une demande — espace administrateur. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = leadStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Statut invalide." }, { status: 422 });
  }

  /* VOLET 20 — la demande peut vivre SEULEMENT dans le stockage
   * GitHub (environnements sans base) : le statut y est posé
   * d'office, silencieusement si elle n'y vit pas. */
  await majStatutDemande(id, parsed.data.status);

  try {
    const lead = await db.lead.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    return NextResponse.json({ ok: true, lead });
  } catch {
    /* Absente de la base : la mise à jour GitHub suffit (la
       rubrique Demandes liste la fusion des deux stockages). */
    return NextResponse.json({ ok: true });
  }
}
