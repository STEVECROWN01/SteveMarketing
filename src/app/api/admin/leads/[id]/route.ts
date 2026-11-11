import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leadStatusSchema } from "@/lib/validation";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/admin-auth";

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

  try {
    const lead = await db.lead.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    return NextResponse.json({ ok: true, lead });
  } catch {
    return NextResponse.json({ ok: false, error: "Demande introuvable." }, { status: 404 });
  }
}
