import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/admin-auth";
import { enregistrerProjet, isStorageConfigured } from "@/lib/portfolio/stockage";
import { PROJECTS } from "@/lib/site";
import type { ImageProjet, ProjetAdmin } from "@/lib/portfolio/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * VOLET 22 (27/11/2026) — PILOTER UNE RÉALISATION STATIQUE DU SITE.
 *
 * Demande de l'éditeur (faite à deux reprises) : « dans l'espace
 * portfolio, TOUS les projets affichés — même ceux déjà en ligne
 * (les projets du site) — doivent être MODIFIABLES, SUPPRIMABLES et
 * DÉPUBLIABLES. Dépublier = l'enlever du site ; le projet reste dans
 * l'espace. »
 *
 * Ce point d'entrée convertit une réalisation STATIQUE du code
 * (PROJECTS de src/lib/site.ts) en projet ADMINISTRÉ, MÊME
 * IDENTIFIANT, `origine: "site"` :
 *  - statut « brouillon » → DÉPUBLIÉ : il quitte le site public mais
 *    reste dans l'espace (modifiable, re-publiable, supprimable) ;
 *  - statut « publie » → re-publié tel quel ;
 *  - une fois converti, ses textes et ses captures deviennent
 *    éditables depuis le formulaire du portfolio (POST
 *    /api/admin/projects), et le site affiche la version administrée
 *    à la position de l'original (hook useTousLesProjets).
 *
 * POST { id, statut } → { ok, projet }
 * Réservé à l'espace administrateur authentifié.
 */

/** Forme d'une réalisation STATIQUE du site (PROJECTS de site.ts,
 *  `as const`) — vue locale tolérante pour la conversion. */
type ProjetStatique = {
  id: string;
  name: string;
  category: string;
  description: string;
  cta: string;
  url: string;
  desktop: string;
  mobile?: string;
};

/** Charge une image publique du site en ImageProjet (base64 + dimensions). */
async function chargerImageStatique(url: string): Promise<ImageProjet | null> {
  if (!url || !url.startsWith("/")) return null;
  try {
    const fichier = path.join(process.cwd(), "public", url.split("?")[0]);
    const octets = await fs.readFile(fichier);
    const extension = path.extname(fichier).toLowerCase();
    const mimes: Record<string, string> = {
      ".webp": "image/webp",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
    };
    const mime = mimes[extension] ?? "image/webp";
    let largeur = 0;
    let hauteur = 0;
    try {
      const sharp = (await import("sharp")).default;
      const meta = await sharp(octets).metadata();
      largeur = meta.width ?? 0;
      hauteur = meta.height ?? 0;
    } catch {
      /* dimensions inconnues : 0 (réserve de place ignorée) */
    }
    return {
      data: octets.toString("base64"),
      mime,
      largeur,
      hauteur,
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
  }
  if (!isStorageConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Stockage GitHub non configuré (GITHUB_DOCS_TOKEN)." },
      { status: 503 },
    );
  }
  const body = await req.json().catch(() => null);
  const id: string = typeof body?.id === "string" ? body.id.trim() : "";
  const statut: "brouillon" | "publie" = body?.statut === "publie" ? "publie" : "brouillon";
  if (!id) {
    return NextResponse.json({ ok: false, error: "Identifiant manquant." }, { status: 422 });
  }
  const statique = (PROJECTS as readonly unknown[] as readonly ProjetStatique[]).find(
    (p) => p.id === id,
  );
  if (!statique) {
    return NextResponse.json(
      { ok: false, error: "Réalisation du site introuvable." },
      { status: 404 },
    );
  }

  try {
    const maintenant = new Date().toISOString();
    const projet: ProjetAdmin = {
      id: statique.id,
      nom: statique.name,
      categorie: statique.category,
      description: statique.description,
      cta: statique.cta,
      url: statique.url,
      statut,
      desktop: await chargerImageStatique(statique.desktop),
      mobile: statique.mobile ? await chargerImageStatique(statique.mobile) : null,
      traductions: null,
      origine: "site",
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    if (statut === "publie" && !projet.desktop) {
      return NextResponse.json(
        { ok: false, error: "Impossible de lire les captures du projet du site." },
        { status: 502 },
      );
    }
    await enregistrerProjet(projet);
    return NextResponse.json({ ok: true, projet });
  } catch (e) {
    console.error("[admin/projects/site] Conversion impossible :", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Conversion impossible." },
      { status: 502 },
    );
  }
}
