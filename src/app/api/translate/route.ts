import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/admin-auth";

export const runtime = "nodejs";

/**
 * VOLET 18 (25/11/2026) — TRADUCTION DES DEMANDES (BACK-OFFICE).
 *
 * L'éditeur reçoit des demandes de clients anglophones : elles sont
 * affichées TELLES QUELLES (langue d'origine) dans le tableau des
 * demandes ; ce service permet de les TRADUIRE pour travailler en
 * français (demande de l'éditeur : « si c'est un client anglophone
 * qui l'a envoyé en anglais, il faut qu'on le reçoive tel quel. Et
 * là, moi je peux par un bouton le traduire en français »).
 *
 * Réservé à la SESSION ADMINISTRATEUR (même garde que /api/documents).
 * Traduction via l'API publique MyMemory (gratuite —
 * limite ~500 caractères par requête) : les textes longs sont
 * découpés PAR PHRASES en morceaux ≤ 450 caractères, traduits en
 * parallèle (16 maximum) puis recollés. Les demandes de devis sont
 * courtes : le découpage ne joue presque jamais.
 * En cas d'indisponibilité du service : message d'erreur explicite,
 * l'affichage d'origine reste intact (aucune perte de données).
 */

function nonAutorise() {
  return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
}

/** Découpe un texte en morceaux ≤ tailleMax, aux frontières de
 *  phrases (ponctuation finale suivie d'une espace), sans couper au
 *  milieu d'une phrase quand c'est évitable. */
function decouperPhrases(texte: string, tailleMax = 450): string[] {
  const morceaux: string[] = [];
  let courant = "";
  const phrases = texte.split(/(?<=[.!?…])\s+/);
  for (const phrase of phrases) {
    if ((courant + " " + phrase).trim().length <= tailleMax) {
      courant = (courant ? courant + " " : "") + phrase;
    } else {
      if (courant) morceaux.push(courant);
      if (phrase.length <= tailleMax) {
        courant = phrase;
      } else {
        /* Phrase anormalement longue : coupe dure par mots. */
        let reste = phrase;
        while (reste.length > tailleMax) {
          let coupe = reste.lastIndexOf(" ", tailleMax);
          if (coupe < tailleMax * 0.5) coupe = tailleMax;
          morceaux.push(reste.slice(0, coupe));
          reste = reste.slice(coupe).trimStart();
        }
        courant = reste;
      }
    }
  }
  if (courant) morceaux.push(courant);
  return morceaux;
}

async function traduireMorceau(texte: string, de: string, vers: string): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(texte)}&langpair=${encodeURIComponent(de)}|${encodeURIComponent(vers)}`;
  const reponse = await fetch(url, {
    signal: AbortSignal.timeout(12000),
    headers: { "User-Agent": "SteveMarketing-Backoffice/1.0" },
  });
  if (!reponse.ok) throw new Error(`Service de traduction indisponible (HTTP ${reponse.status}).`);
  const donnees = (await reponse.json()) as {
    responseData?: { translatedText?: string };
    responseStatus?: number | string;
  };
  const traduction = donnees.responseData?.translatedText;
  if (typeof traduction !== "string" || !traduction) {
    throw new Error("Le service de traduction n'a pas renvoyé de résultat.");
  }
  /* L'API échappe parfois les entités HTML — les décode pour un
   *  affichage texte propre (l'admin est le seul lecteur). */
  return traduction
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export async function POST(req: NextRequest) {
  if (!verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) {
    return nonAutorise();
  }
  const corps = await req.json().catch(() => null) as {
    texte?: string;
    de?: string;
    vers?: string;
  } | null;
  const texte = (corps?.texte ?? "").trim();
  const de = corps?.de === "fr" || corps?.de === "en" ? corps.de : "en";
  const vers = corps?.vers === "fr" || corps?.vers === "en" ? corps.vers : "fr";
  if (!texte) {
    return NextResponse.json({ ok: false, error: "Texte à traduire manquant." }, { status: 422 });
  }
  if (de === vers) {
    return NextResponse.json({ ok: true, traduction: texte });
  }
  if (texte.length > 8000) {
    return NextResponse.json(
      { ok: false, error: "Texte trop long pour la traduction (8000 caractères maximum)." },
      { status: 422 },
    );
  }
  try {
    const morceaux = decouperPhrases(texte);
    const traductions = await Promise.all(
      morceaux.slice(0, 16).map((m) => traduireMorceau(m, de, vers)),
    );
    return NextResponse.json({ ok: true, traduction: traductions.join(" ") });
  } catch (erreur) {
    return NextResponse.json(
      {
        ok: false,
        error:
          erreur instanceof Error
            ? `Traduction impossible : ${erreur.message}`
            : "Traduction impossible.",
      },
      { status: 502 },
    );
  }
}
