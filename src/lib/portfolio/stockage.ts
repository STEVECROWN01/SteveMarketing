/**
 * PORTFOLIO ÉVOLUTIF — STOCKAGE GITHUB (VOLET 19, 26/11/2026).
 *
 * Même mécanique que les documents commerciaux (lib/documents/
 * github.ts) : chaque projet est un fichier JSON du dossier
 * `portfolio/` du DÉPÔT PRIVÉ (GITHUB_DOCS_REPO), écrit via l'API
 * GitHub Contents. Les images sont EMBARQUÉES dans le JSON (base64,
 * comprimées côté navigateur) : aucun stockage d'objets payant.
 */

import { gh, isStorageConfigured, getConfigStockage } from "@/lib/documents/github";
import type { ProjetAdmin, ProjetPublic } from "./types";

const DOSSIER = "portfolio";

function messageStockageNonConfigure(): string {
  return (
    "Stockage du portfolio non configuré — définissez GITHUB_DOCS_TOKEN " +
    "(jeton GitHub avec accès au dépôt privé de stockage) dans les variables " +
    "d'environnement. Voir DEPLOIEMENT.md."
  );
}

export { isStorageConfigured, DOSSIER as DOSSIER_PORTFOLIO };

/** Liste TOUS les projets (brouillons compris — espace admin). */
export async function listerProjetsAdmin(): Promise<ProjetAdmin[]> {
  if (!isStorageConfigured()) throw new Error(messageStockageNonConfigure());
  const { repo, branch } = getConfigStockage();
  const res = await gh(
    `/repos/${repo}/contents/${DOSSIER}?ref=${encodeURIComponent(branch)}&t=${Date.now()}`,
  );
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`GitHub (liste portfolio) : ${res.status} ${res.statusText}`);
  const entrees = (await res.json()) as { name: string; type: string }[];
  const fichiers = entrees.filter((e) => e.type === "file" && e.name.endsWith(".json"));
  const projets = await Promise.all(
    fichiers.map(async (f) => {
      const r = await gh(
        `/repos/${repo}/contents/${DOSSIER}/${f.name}?ref=${encodeURIComponent(branch)}`,
      );
      if (!r.ok) return null;
      const data = (await r.json()) as { content?: string; encoding?: string };
      if (!data.content) return null;
      const json = Buffer.from(
        data.content,
        data.encoding === "base64" ? "base64" : "utf8",
      ).toString("utf8");
      try {
        return JSON.parse(json) as ProjetAdmin;
      } catch {
        return null;
      }
    }),
  );
  return projets
    .filter((p): p is ProjetAdmin => Boolean(p && p.id))
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
}

/** Lit UN projet par identifiant de fichier (brouillons compris). */
export async function lireProjet(id: string): Promise<ProjetAdmin | null> {
  if (!isStorageConfigured()) throw new Error(messageStockageNonConfigure());
  const { repo, branch } = getConfigStockage();
  const nom = id.endsWith(".json") ? id : `${id}.json`;
  const res = await gh(
    `/repos/${repo}/contents/${DOSSIER}/${nom}?ref=${encodeURIComponent(branch)}`,
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub (lecture portfolio) : ${res.status} ${res.statusText}`);
  const data = (await res.json()) as { content?: string; encoding?: string };
  if (!data.content) return null;
  const json = Buffer.from(
    data.content,
    data.encoding === "base64" ? "base64" : "utf8",
  ).toString("utf8");
  return JSON.parse(json) as ProjetAdmin;
}

/** Enregistre (crée ou met à jour) un projet. */
export async function enregistrerProjet(projet: ProjetAdmin): Promise<void> {
  if (!isStorageConfigured()) throw new Error(messageStockageNonConfigure());
  const { repo, branch } = getConfigStockage();
  const chemin = `/repos/${repo}/contents/${DOSSIER}/${projet.id}.json`;
  const existant = await gh(`${chemin}?ref=${encodeURIComponent(branch)}`);
  const sha = existant.ok ? ((await existant.json()) as { sha?: string }).sha : undefined;
  const contenu = Buffer.from(JSON.stringify(projet, null, 2), "utf8").toString("base64");
  const res = await gh(chemin, {
    method: "PUT",
    body: JSON.stringify({
      message: `portfolio : ${projet.statut === "publie" ? "publication" : "brouillon"} ${projet.nom}${sha ? " (mise à jour)" : ""}`,
      content: contenu,
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) {
    const texte = await res.text().catch(() => "");
    throw new Error(`GitHub (enregistrement portfolio) : ${res.status} ${texte.slice(0, 200)}`);
  }
}

/** Supprime un projet. */
export async function supprimerProjet(id: string): Promise<void> {
  if (!isStorageConfigured()) throw new Error(messageStockageNonConfigure());
  const { repo, branch } = getConfigStockage();
  const nom = id.endsWith(".json") ? id : `${id}.json`;
  const chemin = `/repos/${repo}/contents/${DOSSIER}/${nom}`;
  const existant = await gh(`${chemin}?ref=${encodeURIComponent(branch)}`);
  if (existant.status === 404) return;
  if (!existant.ok) throw new Error(`GitHub (lecture pour suppression) : ${existant.status}`);
  const sha = ((await existant.json()) as { sha?: string }).sha;
  const res = await gh(chemin, {
    method: "DELETE",
    body: JSON.stringify({
      message: `portfolio : suppression ${nom}`,
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) throw new Error(`GitHub (suppression) : ${res.status} ${res.statusText}`);
}

/* ------------------------------------------------------------------
 * VOLET 22 (27/11/2026) — SUPPRESSION DÉFINITIVE DES PROJETS
 * STATIQUES DU SITE (les réalisations du code, demandée deux fois
 * par l'éditeur : « TOUS les projets affichés dans l'espace doivent
 * être modifiables, supprimables et dépubliables — peu importe le
 * projet, même ceux déjà en ligne »).
 *
 * Un projet statique vit dans le CODE du site : on ne peut pas le
 * retirer du dépôt du site d'ici. Sa suppression est donc ENREGISTRÉE
 * dans un petit fichier du stockage privé (portfolio-site/
 * supprimes.json) : le site public MASQUE les identifiants listés
 * (ils disparaissent du site ET de l'espace — suppression complète),
 * et l'espace admin ne les affiche plus. La DÉPUBLICATION d'un projet
 * statique passe par sa CONVERSION en projet admin « brouillon »
 * (même identifiant, origine "site") : il reste dans l'espace mais
 * quitte le site — voir /api/admin/projects/site.
 * ------------------------------------------------------------------ */

const DOSSIER_SITE = "portfolio-site";

/** Identifiants des projets STATIQUES supprimés définitivement. */
export async function lireSupprimesSite(): Promise<string[]> {
  if (!isStorageConfigured()) return [];
  const { repo, branch } = getConfigStockage();
  const res = await gh(
    `/repos/${repo}/contents/${DOSSIER_SITE}/supprimes.json?ref=${encodeURIComponent(branch)}&t=${Date.now()}`,
  );
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`GitHub (liste projets du site supprimés) : ${res.status}`);
  const data = (await res.json()) as { content?: string; encoding?: string };
  if (!data.content) return [];
  try {
    const json = JSON.parse(
      Buffer.from(data.content, data.encoding === "base64" ? "base64" : "utf8").toString("utf8"),
    ) as { ids?: string[] };
    return Array.isArray(json.ids) ? json.ids.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Ajoute des identifiants aux projets statiques supprimés (idempotent). */
export async function ajouterSupprimesSite(ids: string[]): Promise<void> {
  if (!isStorageConfigured()) throw new Error(messageStockageNonConfigure());
  if (!ids.length) return;
  const { repo, branch } = getConfigStockage();
  const chemin = `/repos/${repo}/contents/${DOSSIER_SITE}/supprimes.json`;
  const existants = await lireSupprimesSite();
  const fusion = Array.from(new Set([...existants, ...ids])).sort();
  if (fusion.length === existants.length) return; // rien à ajouter
  const fichier = await gh(`${chemin}?ref=${encodeURIComponent(branch)}`);
  const sha = fichier.ok ? ((await fichier.json()) as { sha?: string }).sha : undefined;
  const contenu = Buffer.from(JSON.stringify({ ids: fusion }, null, 2), "utf8").toString("base64");
  const res = await gh(chemin, {
    method: "PUT",
    body: JSON.stringify({
      message: `portfolio-site : suppression définitive ${ids.join(", ")}`,
      content: contenu,
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) throw new Error(`GitHub (enregistrement suppressions site) : ${res.status}`);
}

/** Projet admin → forme PUBLIQUE (URLs d'images servies par l'API,
 *  sans les octets). Utilisé par GET /api/projects. */
export function versPublic(p: ProjetAdmin): ProjetPublic {
  const traduction =
    p.traductions && Object.values(p.traductions).some((v) => (v ?? "").trim())
      ? p.traductions
      : null;
  return {
    id: p.id,
    nom: p.nom,
    categorie: p.categorie,
    description: p.description,
    cta: p.cta,
    url: p.url,
    desktop: `/api/projects/${p.id}/desktop`,
    mobile: p.mobile ? `/api/projects/${p.id}/mobile` : null,
    largeurDesktop: p.desktop?.largeur ?? 1440,
    hauteurDesktop: p.desktop?.hauteur ?? 900,
    largeurMobile: p.mobile?.largeur ?? null,
    hauteurMobile: p.mobile?.hauteur ?? null,
    en: traduction,
    ajouteLe: p.createdAt,
  };
}
