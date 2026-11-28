import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/admin-auth";
import { enregistrerFichier, lireFichier, listerDossier, isStorageConfigured } from "@/lib/documents/github";
import type { AuditComplet } from "@/lib/audit/complet";
import { resumerAudit, type AuditResume } from "@/lib/audit/complet";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * VOLET 29 (28/11/2026) — HISTORIQUE DES AUDITS COMPLETS.
 *
 * Demande de l'éditeur : les audits sont SAUVEGARDÉS dans le dépôt
 * GitHub privé de stockage du back-office et l'espace Audit garde la
 * liste des AUDITS PRÉCÉDENTS — on peut revenir les voir à tout
 * moment (« une autre fois quand on revient dans le dashboard, on
 * pourra toujours voir ces trucs-là »).
 *
 * GET            → { ok, audits } — les audits, du plus récent au
 *                  plus ancien (aperçus allégés).
 * GET  ?id=…     → { ok, audit } — l'audit complet enregistré.
 * POST { audit } → enregistre l'audit complet (audits/<id>.json).
 */

const DOSSIER = "audits";

function nonAutorise() {
  return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
}

export async function GET(req: NextRequest) {
  if (!verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) return nonAutorise();
  if (!isStorageConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Stockage des audits non configuré (voir DEPLOIEMENT.md)." },
      { status: 503 },
    );
  }
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (id) {
      const tampon = await lireFichier(`${DOSSIER}/${id.endsWith(".json") ? id : `${id}.json`}`);
      if (!tampon) {
        return NextResponse.json({ ok: false, error: "Audit introuvable." }, { status: 404 });
      }
      const audit = JSON.parse(tampon.toString("utf8")) as AuditComplet;
      return NextResponse.json({ ok: true, audit });
    }
    const entrees = await listerDossier(DOSSIER);
    const fichiers = entrees.filter((e) => e.type === "file" && e.name.endsWith(".json"));
    const audits: AuditResume[] = [];
    for (const f of fichiers) {
      const tampon = await lireFichier(`${DOSSIER}/${f.name}`);
      if (!tampon) continue;
      try {
        audits.push(resumerAudit(JSON.parse(tampon.toString("utf8")) as AuditComplet));
      } catch {
        /* fichier illisible : ignoré */
      }
    }
    audits.sort((a, b) => b.date.localeCompare(a.date));
    return NextResponse.json({ ok: true, audits });
  } catch (e) {
    console.error("[admin/audits] Liste impossible :", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Lecture impossible." },
      { status: 502 },
    );
  }
}

export async function POST(req: NextRequest) {
  if (!verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) return nonAutorise();
  if (!isStorageConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Stockage des audits non configuré (voir DEPLOIEMENT.md)." },
      { status: 503 },
    );
  }
  const body = await req.json().catch(() => null);
  const audit = body?.audit as AuditComplet | undefined;
  if (
    !audit ||
    typeof audit.url !== "string" ||
    !audit.performance ||
    !audit.seo ||
    !audit.design
  ) {
    return NextResponse.json({ ok: false, error: "Audit incomplet." }, { status: 422 });
  }
  try {
    const nomFichier = audit.id.endsWith(".json") ? audit.id : `${audit.id}.json`;
    await enregistrerFichier(
      `${DOSSIER}/${nomFichier}`,
      Buffer.from(JSON.stringify(audit), "utf8").toString("base64"),
      `audits : audit complet de ${audit.hote} (note ${audit.note}, ${audit.scoreGlobal}/100)`,
    );
    return NextResponse.json({ ok: true, id: audit.id });
  } catch (e) {
    console.error("[admin/audits] Enregistrement impossible :", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Enregistrement impossible." },
      { status: 502 },
    );
  }
}
