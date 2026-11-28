import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/admin-auth";
import { enregistrerFichier, lireFichier, isStorageConfigured } from "@/lib/documents/github";
import { genererXlsx } from "@/lib/xlsx/minimal";
import type { EntrepriseScraped } from "@/lib/scraping/types";
import type { ClasseurProspects, LotProspects, ProspectEnregistre, StatutProspect } from "@/lib/prospects/types";
import { statutLibelle } from "@/lib/prospects/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * VOLET 29 (28/11/2026) — L'ESPACE « PROSPECTS » : les résultats de
 * scraping sélectionnés sont importés ici (un LOT par import) et
 * sauvegardés dans le dépôt GitHub privé de stockage du back-office :
 *  - prospects/prospects.json — la source de vérité de l'espace ;
 *  - prospects/prospects.xlsx — le classeur Excel MIS À JOUR à chaque
 *    import (jamais un nouveau fichier), avec la date d'import de
 *    chaque ensemble et son séparateur en gras.
 *
 * GET  → { ok, lots } (les lots, du plus récent au plus ancien).
 * POST { action: "importer", prospects, intitule? } → importe un lot.
 * POST { action: "statut", id, statut } → met à jour le suivi d'un
 *      prospect (contacté, RDV accepté, RDV tenu, converti…).
 */

const CHEMIN_JSON = "prospects/prospects.json";
const CHEMIN_XLSX = "prospects/prospects.xlsx";

const STATUTS_VALIDES: StatutProspect[] = [
  "non-contacte",
  "contacte",
  "rdv-accepte",
  "rdv-tenu",
  "converti",
  "perdu",
];

/** Lit le classeur enregistré (vide si aucun). */
async function lireClasseur(): Promise<ClasseurProspects> {
  const tampon = await lireFichier(CHEMIN_JSON).catch(() => null);
  if (!tampon) return { lots: [] };
  try {
    const classeur = JSON.parse(tampon.toString("utf8")) as ClasseurProspects;
    return { lots: Array.isArray(classeur.lots) ? classeur.lots : [] };
  } catch {
    return { lots: [] };
  }
}

/** Date et heure française lisibles : « 28/11/2026 à 15:42 ». */
function dateFr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Construit le classeur Excel complet (tous les lots). */
function construireXlsx(classeur: ClasseurProspects): Buffer {
  const enTete = [
    "Entreprise",
    "Dirigeant",
    "Email",
    "Téléphone",
    "Adresse",
    "Ville",
    "Pays",
    "Site web",
    "Niche",
    "Statut",
    "Horaires",
    "Employés",
    "Ancienneté",
    "Importé le",
  ];
  const lignes: (string | number | { v: string | number; gras?: boolean; fond?: boolean })[][] = [enTete];
  /* Du lot le plus RÉCENT au plus ancien : le classeur s'ouvre sur
   * les dernières données importées, chaque lot commence par sa
   * ligne-séparatrice en gras (la fin de l'ensemble précédent). */
  for (const lot of [...classeur.lots].sort((a, b) => b.importeLe.localeCompare(a.importeLe))) {
    lignes.push([
      {
        v: `IMPORT DU ${dateFr(lot.importeLe)} — ${lot.prospects.length} prospect${lot.prospects.length > 1 ? "s" : ""}${lot.intitule ? ` — ${lot.intitule}` : ""}`,
        gras: true,
      },
    ]);
    for (const p of lot.prospects) {
      lignes.push([
        p.nom,
        p.dirigeant ?? "Non trouvé",
        p.email ?? "Non trouvé",
        p.telephone ?? "Non trouvé",
        p.adresse ?? p.localisation ?? "",
        p.localisation ?? "",
        p.pays ?? "",
        p.siteWeb ?? "Sans site web",
        p.niche ?? "",
        statutLibelle(p.statut),
        p.horaires ?? "",
        p.employes ?? "Non trouvé",
        p.anciennete ?? "Non trouvé",
        dateFr(p.importeLe),
      ]);
    }
  }
  return genererXlsx([
    {
      nom: "Prospects",
      lignes,
      largeurs: [28, 22, 28, 18, 34, 18, 14, 30, 24, 16, 28, 12, 16, 18],
    },
  ]);
}

/** Sauvegarde le classeur : le JSON (source de vérité) puis le XLSX,
 *  les deux mis à jour — jamais un nouveau fichier. */
async function sauvegarderClasseur(classeur: ClasseurProspects): Promise<void> {
  const nb = classeur.lots.reduce((s, l) => s + l.prospects.length, 0);
  await enregistrerFichier(
    CHEMIN_JSON,
    Buffer.from(JSON.stringify(classeur, null, 2), "utf8").toString("base64"),
    `prospects : mise à jour (${nb} prospects, ${classeur.lots.length} lots)`,
  );
  await enregistrerFichier(
    CHEMIN_XLSX,
    construireXlsx(classeur).toString("base64"),
    `prospects : classeur Excel mis à jour (${nb} prospects)`,
  );
}

/** Construit le prospect enregistré : toutes les données scrapées
 *  (le MESSAGE EMAIL, lui, est proposé au niveau de l'AUDIT du site
 *  du prospect — plus dans le tableau). */
function versProspectEnregistre(e: EntrepriseScraped, importeLe: string, id: string): ProspectEnregistre {
  return {
    id,
    nom: e.nom,
    niche: e.niche,
    nicheProspection: e.nicheProspection,
    dirigeant: e.dirigeant,
    email: e.email,
    telephone: e.telephone,
    adresse: e.adresse ?? e.localisation,
    localisation: e.localisation,
    pays: e.pays,
    siteWeb: e.siteWeb,
    horaires: e.horaires,
    anciennete: e.anciennete,
    employes: e.employes,
    bio: e.bio,
    statut: "non-contacte",
    source: e.source,
    urlSource: e.urlSource,
    importeLe,
  };
}

export async function GET(req: NextRequest) {
  if (!verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
  }
  if (!isStorageConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Le stockage du back-office n'est pas encore configuré — activez-le pour enregistrer les prospects (jeton GitHub du stockage)." },
      { status: 503 },
    );
  }
  try {
    const classeur = await lireClasseur();
    const lots = [...classeur.lots].sort((a, b) => b.importeLe.localeCompare(a.importeLe));
    return NextResponse.json({ ok: true, lots });
  } catch (e) {
    console.error("[admin/prospects] Liste impossible :", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Lecture impossible." },
      { status: 502 },
    );
  }
}

export async function POST(req: NextRequest) {
  if (!verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
  }
  if (!isStorageConfigured()) {
    return NextResponse.json({ ok: false, error: "Stockage des prospects non configuré (voir DEPLOIEMENT.md)." }, { status: 503 });
  }
  const body = await req.json().catch(() => null);
  const action = typeof body?.action === "string" ? body.action : "";

  try {
    /* --- Import d'un lot de prospects sélectionnés --- */
    if (action === "importer") {
      const brutes = Array.isArray(body?.prospects) ? (body.prospects as EntrepriseScraped[]) : [];
      const valides = brutes.filter((e) => e && typeof e.nom === "string" && e.nom.trim());
      if (valides.length === 0) {
        return NextResponse.json({ ok: false, error: "Aucun prospect sélectionné." }, { status: 422 });
      }
      const classeur = await lireClasseur();
      const maintenant = new Date().toISOString();
      const identifiant = `lot-${maintenant.replace(/[-:TZ.]/g, "").slice(0, 14)}`;
      const intitule = typeof body?.intitule === "string" ? body.intitule.trim().slice(0, 120) : "";
      const lot: LotProspects = {
        id: identifiant,
        importeLe: maintenant,
        intitule,
        prospects: valides.map((e, i) =>
          versProspectEnregistre(
            { ...e, nom: e.nom.trim() },
            maintenant,
            `${identifiant}-${String(i + 1).padStart(3, "0")}`,
          ),
        ),
      };
      classeur.lots.push(lot);
      await sauvegarderClasseur(classeur);
      return NextResponse.json({ ok: true, lot, total: classeur.lots.reduce((s, l) => s + l.prospects.length, 0) });
    }

    /* --- Mise à jour du suivi d'un prospect --- */
    if (action === "statut") {
      const id = typeof body?.id === "string" ? body.id : "";
      const statut = typeof body?.statut === "string" ? (body.statut as StatutProspect) : "" as StatutProspect;
      if (!id || !STATUTS_VALIDES.includes(statut)) {
        return NextResponse.json({ ok: false, error: "Statut inconnu." }, { status: 422 });
      }
      const classeur = await lireClasseur();
      let trouve = false;
      for (const lot of classeur.lots) {
        const p = lot.prospects.find((x) => x.id === id);
        if (p) {
          p.statut = statut;
          trouve = true;
          break;
        }
      }
      if (!trouve) {
        return NextResponse.json({ ok: false, error: "Prospect introuvable." }, { status: 404 });
      }
      await sauvegarderClasseur(classeur);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Action inconnue." }, { status: 422 });
  } catch (e) {
    console.error("[admin/prospects] Erreur :", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Enregistrement impossible." },
      { status: 502 },
    );
  }
}
