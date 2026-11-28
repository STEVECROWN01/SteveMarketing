import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/admin-auth";
import { getBrowser } from "@/lib/documents/pdf";
import { htmlAuditComplet, htmlAxesAmelioration } from "@/lib/audit/rapport-html";
import type { AuditComplet } from "@/lib/audit/complet";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * VOLET 29 (28/11/2026) — PDF DE L'AUDIT COMPLET.
 *
 * Demande de l'éditeur : le résultat de l'audit est présenté « sous
 * forme de rapport audit directement en PDF… un rapport très bien
 * professionnel qu'on peut télécharger en PDF » — le document dit
 * « AUDIT COMPLET » (pas « rapport »). Les AXES D'AMÉLIORATION sont
 * eux aussi téléchargeables en PDF depuis leur modale.
 *
 * POST { audit, kind: "complet" | "axes" } → PDF (application/pdf).
 */
export async function POST(req: NextRequest) {
  if (!verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const audit = body?.audit as AuditComplet | undefined;
  const kind = body?.kind === "axes" ? "axes" : "complet";
  if (!audit || typeof audit.url !== "string" || !audit.performance || !audit.seo || !audit.design) {
    return NextResponse.json({ ok: false, error: "Audit incomplet." }, { status: 422 });
  }
  try {
    const html = kind === "axes" ? htmlAxesAmelioration(audit) : htmlAuditComplet(audit);
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: "load", timeout: 20000 }).catch(() => undefined);
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "10mm", right: "9mm", bottom: "16mm", left: "9mm" },
        displayHeaderFooter: true,
        headerTemplate: "<span></span>",
        footerTemplate: `<div style="width:100%;font-size:7.5px;color:#9a9a9a;padding:0 9mm;display:flex;justify-content:space-between;">
          <span>Stevens AKPOVI — ${kind === "axes" ? "Audit complet · Axes d'amélioration" : "Audit complet"} · stevensakpovi.vercel.app</span>
          <span>${audit.hote}</span>
          <span class="pageNumber"></span>
        </div>`,
      });
      const nom = kind === "axes" ? `axes-amelioration-${audit.hote}.pdf` : `audit-complet-${audit.hote}.pdf`;
      return new NextResponse(Buffer.from(pdf), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${nom.replace(/["\\]/g, "")}"`,
        },
      });
    } finally {
      await page.close();
    }
  } catch (e) {
    console.error("[admin/audit/pdf] Génération impossible :", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Génération du PDF impossible." },
      { status: 502 },
    );
  }
}
