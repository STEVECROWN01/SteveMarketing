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
import type { PropositionRecord } from "./proposition";
import { buildIdDocument, buildNumero } from "./format";

/** Tout document commercial (gabarit historique OU proposition
 *  commerciale v2 — VOLET 16). */
export type ToutDocument = DocumentRecord | PropositionRecord;

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

/** Configuration de stockage (dépôt, branche, jeton présent) —
 *  partagée avec le stockage du PORTFOLIO (VOLET 19). */
export function getConfigStockage() {
  return { ...getConfig(), configure: isStorageConfigured() };
}

function messageStockageNonConfigure(): string {
  return (
    "Stockage des documents non configuré — définissez GITHUB_DOCS_TOKEN " +
    "(jeton GitHub avec accès au dépôt privé de stockage) dans les variables " +
    "d'environnement. Voir DEPLOIEMENT.md."
  );
}

/** Appel brut à l'API GitHub Contents — VOLET 19 : EXPORTÉ pour le
 *  stockage du PORTFOLIO (mêmes dépôt privé, jeton et branche que
 *  les documents commerciaux). */
export async function gh(chemin: string, init: RequestInit = {}): Promise<Response> {
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
export async function listDocuments(): Promise<ToutDocument[]> {
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
        return JSON.parse(json) as ToutDocument;
      } catch {
        return null;
      }
    }),
  );
  return documents
    .filter((d): d is ToutDocument => Boolean(d))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

/** Enregistre (crée ou met à jour) un document. */
export async function saveDocument(document: ToutDocument): Promise<void> {
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
export async function getDocument(id: string): Promise<ToutDocument | null> {
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
  const nomFichier = id.endsWith(".json") ? id : `${id}.json`;
  await supprimerFichier(`${DOSSIER}/${nomFichier}`, `documents : suppression ${nomFichier}`);
}

/* ------------------------------------------------------------------
 * VOLET 20 (26/11/2026) — FICHIERS AVANCÉS DANS LE DÉPÔT PRIVÉ.
 *
 * Utilisé par le PORTFOLIO (projets), les DEVIS SIGNÉS (PDF
 * téléversés) et les DEMANDES du site (formulaires publics) : un
 * même jeu de primitives dossiers/fichiers sur l'API Contents.
 * `chemin` / `dossier` sont les chemins DANS LE DÉPÔT (ex.
 * « demandes/gh-xxx.json », « devis-signes/devis-d2600001.pdf ») —
 * l'URL complète /repos/<repo>/contents/<chemin> est construite
 * ici.
 * ------------------------------------------------------------------ */

/** Enregistre (crée ou met à jour) un fichier du dépôt privé.
 *  `contenuBase64` SANS préfixe data:. */
export async function enregistrerFichier(
  chemin: string,
  contenuBase64: string,
  message: string,
): Promise<void> {
  if (!isStorageConfigured()) throw new Error(messageStockageNonConfigure());
  const { repo, branch } = getConfig();
  const url = `/repos/${repo}/contents/${chemin}`;

  const existant = await gh(`${url}?ref=${encodeURIComponent(branch)}`);
  const sha = existant.ok ? ((await existant.json()) as { sha?: string }).sha : undefined;

  const res = await gh(url, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: contenuBase64,
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) {
    const texte = await res.text().catch(() => "");
    throw new Error(`GitHub (enregistrement fichier) : ${res.status} ${texte.slice(0, 200)}`);
  }
}

/** Lit un fichier du dépôt privé (binaire ou texte). */
export async function lireFichier(chemin: string): Promise<Buffer | null> {
  if (!isStorageConfigured()) throw new Error(messageStockageNonConfigure());
  const { repo, branch } = getConfig();
  const res = await gh(
    `/repos/${repo}/contents/${chemin}?ref=${encodeURIComponent(branch)}`,
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub (lecture fichier) : ${res.status} ${res.statusText}`);
  const data = (await res.json()) as { content?: string; encoding?: string };
  if (!data.content) return null;
  return Buffer.from(data.content, data.encoding === "base64" ? "base64" : "utf8");
}

/** Supprime un fichier du dépôt privé (silencieux si absent). */
export async function supprimerFichier(chemin: string, message: string): Promise<void> {
  if (!isStorageConfigured()) throw new Error(messageStockageNonConfigure());
  const { repo, branch } = getConfig();
  const url = `/repos/${repo}/contents/${chemin}`;

  const existant = await gh(`${url}?ref=${encodeURIComponent(branch)}`);
  if (existant.status === 404) return;
  if (!existant.ok) throw new Error(`GitHub (lecture pour suppression) : ${existant.status}`);
  const sha = ((await existant.json()) as { sha?: string }).sha;

  const res = await gh(url, {
    method: "DELETE",
    body: JSON.stringify({
      message,
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) {
    throw new Error(`GitHub (suppression fichier) : ${res.status} ${res.statusText}`);
  }
}

/** Liste les entrées d'un dossier du dépôt privé (nom + type, tels
 *  que renvoyés par l'API Contents). */
export async function listerDossier(
  dossier: string,
): Promise<{ name: string; type: string }[]> {
  if (!isStorageConfigured()) throw new Error(messageStockageNonConfigure());
  const { repo, branch } = getConfig();
  const res = await gh(
    `/repos/${repo}/contents/${dossier}?ref=${encodeURIComponent(branch)}&t=${Date.now()}`,
  );
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`GitHub (liste dossier) : ${res.status} ${res.statusText}`);
  return (await res.json()) as { name: string; type: string }[];
}

/** Complète un document partiel en enregistrement complet
 *  (identifiant, numéro, horodatages) — gabarit historique comme
 *  proposition commerciale v2. */
export function completerDocument<
  T extends {
    docType: "proposition" | "devis" | "facture";
    numeroClient: number;
    numero?: string;
    id?: string;
    createdAt?: string;
  },
>(d: T): T & { numero: string; id: string; createdAt: string; updatedAt: string } {
  const maintenant = new Date().toISOString();
  const numero = d.numero || buildNumero(Number(d.numeroClient) || 1, d.docType);
  return {
    ...d,
    numero,
    id: d.id || buildIdDocument(d.docType, numero),
    createdAt: d.createdAt || maintenant,
    updatedAt: maintenant,
  };
}
