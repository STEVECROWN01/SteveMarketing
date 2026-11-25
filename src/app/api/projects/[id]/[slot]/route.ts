import { NextRequest, NextResponse } from "next/server";
import { lireProjet, isStorageConfigured } from "@/lib/portfolio/stockage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/projects/<id>/<desktop|mobile> — IMAGE d'un projet
 * PUBLIÉ (VOLET 19), servie depuis le stockage GitHub privé.
 *
 * Public pour les projets PUBLIÉS uniquement (un brouillon n'est
 * jamais exposé : 404). Cache navigateur/edge long (l'image ne
 * change qu'à la mise à jour du projet — l'URL reste stable).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; slot: string }> },
) {
  const { id, slot } = await params;
  if (slot !== "desktop" && slot !== "mobile") {
    return NextResponse.json({ ok: false, error: "Emplacement inconnu." }, { status: 404 });
  }
  if (!isStorageConfigured()) {
    return NextResponse.json({ ok: false, error: "Non configuré." }, { status: 404 });
  }
  try {
    const projet = await lireProjet(id);
    if (!projet || projet.statut !== "publie") {
      return NextResponse.json({ ok: false, error: "Projet introuvable." }, { status: 404 });
    }
    const image = slot === "desktop" ? projet.desktop : projet.mobile;
    if (!image?.data) {
      return NextResponse.json({ ok: false, error: "Image introuvable." }, { status: 404 });
    }
    const octets = Buffer.from(image.data, "base64");
    return new NextResponse(new Uint8Array(octets), {
      status: 200,
      headers: {
        "Content-Type": image.mime || "image/webp",
        "Content-Length": String(octets.length),
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (e) {
    console.warn("[projects] image impossible :", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "Image indisponible." }, { status: 502 });
  }
}
