import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/admin-auth";

export const runtime = "nodejs";

/** Liste des demandes — réservé à l'espace administrateur authentifié. */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
  }

  try {
    const leads = await db.lead.findMany({
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
    });

    return NextResponse.json({ ok: true, leads });
  } catch (error) {
    console.error("[admin/leads] Base de données indisponible :", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          "La base de données est indisponible sur cet environnement. Voir DEPLOIEMENT.md — persistance des demandes (base managée).",
      },
      { status: 503 }
    );
  }
}
