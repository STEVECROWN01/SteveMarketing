import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/admin-auth";
import {
  listerProjetsAdmin,
  enregistrerProjet,
  supprimerProjet,
  lireProjet,
  isStorageConfigured,
} from "@/lib/portfolio/stockage";
import { manquesPublication, slugifier, TAILLE_IMAGE_MAX, type ProjetAdmin } from "@/lib/portfolio/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * API ADMIN DU PORTFOLIO (VOLET 19, 26/11/2026) — protégée par le
 * cookie de session de l'espace administrateur.
 *
 *  GET                      → tous les projets (brouillons compris) ;
 *  POST  { projet, statut } → crée OU met à jour (id présent =
 *                             mise à jour) avec statut « brouillon »
 *                             ou « publie » (demande de l'éditeur :
 *                             « enregistrer comme brouillon ou
 *                             enregistrer et publier directement ») ;
 *  DELETE { id }            → supprime le projet.
 *
 * La PUBLICATION vérifie les champs obligatoires (nom, catégorie,
 * description, CTA, URL, capture d'ordinateur) ; le brouillon
 * accepte un contenu partiel.
 */
export async function GET(req: NextRequest) {
  if (!verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
  }
  if (!isStorageConfigured()) {
    return NextResponse.json({
      ok: true,
      projets: [],
      stockageConfigure: false,
      erreur: "Stockage GitHub non configuré (GITHUB_DOCS_TOKEN) — voir DEPLOIEMENT.md.",
    });
  }
  try {
    return NextResponse.json({ ok: true, projets: await listerProjetsAdmin(), stockageConfigure: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Lecture impossible." },
      { status: 502 },
    );
  }
}

function imageValide(img: unknown): boolean {
  if (img === null || img === undefined) return true; // optionnelle
  if (typeof img !== "object") return false;
  const i = img as { data?: unknown; mime?: unknown };
  return typeof i.data === "string" && i.data.length > 0 && typeof i.mime === "string";
}

export async function POST(req: NextRequest) {
  if (!verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
  }
  if (!isStorageConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Stockage GitHub non configuré (GITHUB_DOCS_TOKEN) — voir DEPLOIEMENT.md." },
      { status: 503 },
    );
  }
  const body = await req.json().catch(() => null);
  const brut = body?.projet ?? body;
  const statut = body?.statut === "publie" ? "publie" : "brouillon";
  if (!brut || typeof brut !== "object") {
    return NextResponse.json({ ok: false, error: "Projet invalide." }, { status: 422 });
  }

  /* Fusion : un champ ABSENT (non transmis) conserve la valeur
     enregistrée (permet les actions rapides — publier/dépublier —
     sans re-soudoyer le formulaire entier) ; un champ PRÉSENT
     (même vide) prend le dessus (soumission du formulaire). */
  const idFourni = typeof brut.id === "string" && brut.id.trim() ? brut.id.trim() : "";
  const existant = idFourni ? await lire(idFourni) : null;
  const garde = (v: unknown, ancien: string): string =>
    typeof v === "string" ? v : ancien;

  const nom = garde(brut.nom, existant?.nom ?? "").trim();
  const url = garde(brut.url, existant?.url ?? "").trim().replace(/^["']+|["']+$/g, "");
  const urlNormalisee = url && !/^https?:\/\//i.test(url) ? `https://${url}` : url;

  const projetPartiel = {
    nom,
    categorie: garde(brut.categorie, existant?.categorie ?? "").trim(),
    description: garde(brut.description, existant?.description ?? "").trim(),
    cta: garde(brut.cta, existant?.cta ?? "").trim() || "Voir Le Site",
    url: urlNormalisee,
    desktop: (brut.desktop ?? existant?.desktop ?? null) as ProjetAdmin["desktop"],
  };

  /* Publication : champs obligatoires (brouillon : contenu partiel
     accepté, les champs manquants restent vides). */
  if (statut === "publie") {
    const manques = manquesPublication(projetPartiel);
    if (manques.length) {
      return NextResponse.json(
        {
          ok: false,
          error: `Publication impossible — il manque : ${manques.join(", ")}.`,
          manques,
        },
        { status: 422 },
      );
    }
  }
  if (!imageValide(brut.desktop) || !imageValide(brut.mobile)) {
    return NextResponse.json({ ok: false, error: "Image invalide." }, { status: 422 });
  }
  for (const img of [brut.desktop, brut.mobile]) {
    if (img && typeof img.data === "string" && img.data.length > TAILLE_IMAGE_MAX) {
      return NextResponse.json(
        { ok: false, error: "Capture trop lourde après compression — choisissez un fichier plus léger." },
        { status: 422 },
      );
    }
  }

  try {
    const maintenant = new Date().toISOString();
    const projet: ProjetAdmin = {
      id: existant?.id || idFourni || `${slugifier(nom || "projet")}-${maintenant.slice(0, 10)}`,
      nom: projetPartiel.nom,
      categorie: projetPartiel.categorie,
      description: projetPartiel.description,
      cta: projetPartiel.cta,
      url: projetPartiel.url,
      statut,
      desktop: projetPartiel.desktop,
      mobile: (brut.mobile ?? existant?.mobile ?? null) as ProjetAdmin["mobile"],
      traductions: (brut.traductions ?? existant?.traductions ?? null) as ProjetAdmin["traductions"],
      createdAt: existant?.createdAt ?? maintenant,
      updatedAt: maintenant,
    };
    await enregistrerProjet(projet);
    return NextResponse.json({ ok: true, projet });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Enregistrement impossible." },
      { status: 502 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
  }
  if (!isStorageConfigured()) {
    return NextResponse.json({ ok: false, error: "Stockage non configuré." }, { status: 503 });
  }
  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id.trim() : "";
  if (!id || !/^[\w-]+$/.test(id)) {
    return NextResponse.json({ ok: false, error: "Identifiant invalide." }, { status: 422 });
  }
  try {
    await supprimerProjet(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Suppression impossible." },
      { status: 502 },
    );
  }
}

/* Assistant local : lecture tolérante (un identifiant inconnu
   revient à une CRÉATION, jamais à une erreur bloquante). */
async function lire(id: string): Promise<ProjetAdmin | null> {
  try {
    return await lireProjet(id);
  } catch {
    return null;
  }
}
