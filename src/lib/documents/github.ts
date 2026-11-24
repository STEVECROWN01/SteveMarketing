/**
 * Stockage des documents — VOLET 14 (24/11/2026).
 *
 * RÉPONSE À LA QUESTION DE L'ÉDITEUR : « puisque le PostgreSQL de
 * Railway est payant, j'aimerais savoir s'il est possible de
 * stocker les documents dans GitHub » — OUI, et c'est ce qui est
 * implémenté ici : chaque document généré est enregistré en JSON
 * dans le dossier `documents/` d'un DÉPÔT PRIVÉ DÉDIÉ
 * (STEVECROWN01/SteveMarketing-Documents), via l'API GitHub
 * Contents. Le back-office liste, ouvre et télécharge les documents
 * existants à partir de CE dépôt — aucune base de données payante
 * (Railway, Supabase ou autre) n'est nécessaire.
 *
 * Pourquoi un dépôt SÉPARÉ et PRIVÉ : le dépôt du site est PUBLIC —
 * y stocker les documents exposerait les noms, coordonnées et
 * tarifs des clients de l'éditeur. Le dépôt dédié évite aussi de
 * redéployer le site à chaque document enregistré.
 *
 * Variables d'environnement serveur (voir DEPLOIEMENT.md) :
 *   GITHUB_DOCS_TOKEN   — jeton d'accès GitHub (portée « repo »)
 *   GITHUB_DOCS_REPO    — dépôt de stockage
 *                         (défaut : STEVECROWN01/SteveMarketing-Documents)
 *   GITHUB_DOCS_BRANCH  — branche (défaut : main)
 */

import type { DocumentRecord } from "./types";
import { buildIdDocument, buildNumero } from "./format";

const API = "https://api.github.com";
const DOSSIER = "documents";

function getConfig() {
  return {
    token: process.env.GITHUB_DOCS_TOKEN?.trim() || "",
    repo: process.env.GITHUB_DOCS_REPO?.trim() || "STEVECROWN01/SteveMarketing-Documents",
    branch: process.env.GITHUB_DOCS_BRANCH?.trim() || "main",
  };
}

export function isStorageConfigured(): boolean {
  return Boolean(getConfig().token);
}

function messageStockageNonConfigure(): string {
  return (
    "Stockage des documents non configuré — définissez GITHUB_DOCS_TOKEN " +
    "(jeton GitHub avec accès au dépôt privé de stockage) dans les variables " +
    "d'environnement. Voir DEPLOIEMENT.md."
  );
}

async function gh(chemin: string, init: RequestInit = {}): Promise<Response> {
  const { token } = getConfig();
  const res = await fetch(`${API}${chemin}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  return res;
}

/** Liste tous les documents enregistrés (plus récents d'abord). */
export async function listDocuments(): Promise<DocumentRecord[]> {
  if (!isStorageConfigured()) throw new Error(messageStockageNonConfigure());
  const { repo, branch } = getConfig();

  const res = await gh(`/repos/${repo}/contents/${DOSSIER}?ref=${encodeURIComponent(branch)}&t=${Date.now()}`);
  if (res.status === 404) return []; // dossier pas encore créé : aucun document
  if (!res.ok) {
    throw new Error(`GitHub (liste) : ${res.status} ${res.statusText}`);
  }
  const entrees = (await res.json()) as { name: string; type: string }[];
  const fichiers = entrees.filter((e) => e.type === "file" && e.name.endsWith(".json"));

  const documents = await Promise.all(
    fichiers.map(async (f) => {
      const r = await gh(
        `/repos/${repo}/contents/${DOSSIER}/${f.name}?ref=${encodeURIComponent(branch)}`,
      );
      if (!r.ok) return null;
      const data = (await r.json()) as { content?: string; encoding?: string };
      if (!data.content) return null;
      const json = Buffer.from(data.content, data.encoding === "base64" ? "base64" : "utf8").toString("utf8");
      try {
        return JSON.parse(json) as DocumentRecord;
      } catch {
        return null;
      }
    }),
  );
  return documents
    .filter((d): d is DocumentRecord => Boolean(d))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

/** Enregistre (crée ou met à jour) un document. */
export async function saveDocument(document: DocumentRecord): Promise<void> {
  if (!isStorageConfigured()) throw new Error(messageStockageNonConfigure());
  const { repo, branch } = getConfig();
  const chemin = `/repos/${repo}/contents/${DOSSIER}/${document.id}.json`;

  // SHA du fichier existant (mise à jour) — 404 = création.
  const existant = await gh(`${chemin}?ref=${encodeURIComponent(branch)}`);
  const sha = existant.ok ? ((await existant.json()) as { sha?: string }).sha : undefined;

  const contenu = Buffer.from(JSON.stringify(document, null, 2), "utf8").toString("base64");
  const res = await gh(chemin, {
    method: "PUT",
    body: JSON.stringify({
      message: `documents : ${document.docType} ${document.numero}${sha ? " (mise à jour)" : ""}`,
      content: contenu,
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) {
    const texte = await res.text().catch(() => "");
    throw new Error(`GitHub (enregistrement) : ${res.status} ${texte.slice(0, 200)}`);
  }
}

/** Récupère un document par son identifiant de fichier. */
export async function getDocument(id: string): Promise<DocumentRecord | null> {
  if (!isStorageConfigured()) throw new Error(messageStockageNonConfigure());
  const { repo, branch } = getConfig();
  const nomFichier = id.endsWith(".json") ? id : `${id}.json`;
  const res = await gh(`/repos/${repo}/contents/${DOSSIER}/${nomFichier}?ref=${encodeURIComponent(branch)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub (lecture) : ${res.status} ${res.statusText}`);
  const data = (await res.json()) as { content?: string; encoding?: string };
  if (!data.content) return null;
  const json = Buffer.from(data.content, data.encoding === "base64" ? "base64" : "utf8").toString("utf8");
  return JSON.parse(json) as DocumentRecord;
}

/** Supprime un document enregistré. */
export async function deleteDocument(id: string): Promise<void> {
  if (!isStorageConfigured()) throw new Error(messageStockageNonConfigure());
  const { repo, branch } = getConfig();
  const nomFichier = id.endsWith(".json") ? id : `${id}.json`;
  const chemin = `/repos/${repo}/contents/${DOSSIER}/${nomFichier}`;

  const existant = await gh(`${chemin}?ref=${encodeURIComponent(branch)}`);
  if (existant.status === 404) return;
  if (!existant.ok) throw new Error(`GitHub (lecture pour suppression) : ${existant.status}`);
  const sha = ((await existant.json()) as { sha?: string }).sha;

  const res = await gh(chemin, {
    method: "DELETE",
    body: JSON.stringify({
      message: `documents : suppression ${nomFichier}`,
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) {
    throw new Error(`GitHub (suppression) : ${res.status} ${res.statusText}`);
  }
}

/** Complète un document partiel en enregistrement complet
 *  (identifiant, numéro, horodatages). */
export function completerDocument(
  d: Partial<DocumentRecord> & Pick<DocumentRecord, "docType" | "numeroClient">,
): DocumentRecord {
  const maintenant = new Date().toISOString();
  const numero = d.numero || buildNumero(Number(d.numeroClient) || 1, d.docType);
  return {
    ...(d as DocumentRecord),
    numero,
    id: d.id || buildIdDocument(d.docType, numero),
    createdAt: d.createdAt || maintenant,
    updatedAt: maintenant,
  };
}
