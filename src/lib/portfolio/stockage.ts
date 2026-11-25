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
