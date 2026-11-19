import { NextRequest, NextResponse } from "next/server";
import { adminLoginSchema } from "@/lib/validation";
import { createSessionToken, isAuthConfigured, SESSION_COOKIE, SESSION_MAX_AGE, verifyPassword } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  /* Fail-closed (audit du 19/11) : sans configuration complète, la
     connexion est refusée AVANT toute vérification — message générique,
     volontairement sans préciser QUELLE variable manque (cette
     information appartient au propriétaire, via DEPLOIEMENT.md ; un
     attaquant distant n'apprend que « pas configuré », rien d'exploitable). */
  if (!isAuthConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Espace administrateur non configuré sur cet environnement — définissez les variables d'environnement listées dans DEPLOIEMENT.md.",
      },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Mot de passe requis." }, { status: 422 });
  }

  if (!verifyPassword(parsed.data.password)) {
    return NextResponse.json(
      { ok: false, error: "Mot de passe incorrect." },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
