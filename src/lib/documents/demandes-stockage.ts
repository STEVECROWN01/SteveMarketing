/**
 * STOCKAGE DES DEMANDES DU SITE DANS LE DÉPÔT PRIVÉ — VOLET 20
 * (26/11/2026).
 *
 * Demande de l'éditeur : « bien vrai c'est envoyé par mail, mais il
 * faut que ce soit directement transmis dans mon espace admin, dans
 * mon back-office pour que tout soit stocké là et je puisse voir. Et
 * puisque nous n'avons pas de base de données pour toujours
 * conserver cela, il faut que cela soit stocké dans le projet
 * GitHub, dans un dossier dédié aux demandes et aux messages. »
 *
 * Chaque demande (devis, audit, message de contact) est enregistrée
 * en JSON dans le dossier `demandes/` du DÉPÔT PRIVÉ déjà utilisé
 * par les documents commerciaux (GITHUB_DOCS_TOKEN) — la rubrique
 * « Demandes » du back-office liste la FUSION base de données +
 * stockage GitHub (dédupliquée par identifiant). Le statut suit la
 * demande dans les DEUX stockages (PATCH).
 *
 * Tolérance : stockage non configuré ou GitHub indisponible → les
 * voies historiques (base + email) restent seules, rien ne casse.
 */

import { enregistrerFichier, lireFichier, listerDossier, isStorageConfigured } from "./github";

const DOSSIER_DEMANDES = "demandes";

/** Une demande stockée (base de données OU GitHub). */
export type DemandeStockee = {
  id: string;
  type: "quote" | "audit" | "contact";
  status: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  website?: string | null;
  activity?: string | null;
  /** Champ découverte du formulaire de contact (dossier GitHub). */
  discovery?: string | null;
  serviceType?: string | null;
  budget?: string | null;
  timeline?: string | null;
  message: string;
  emailSent?: boolean;
  source?: string | null;
  createdAt: string;
};

/** Nom de fichier stable et sûr pour une demande. */
function nomFichier(id: string): string {
  const sur = id.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80);
  return `${sur || "demande"}.json`;
}

/** Enregistre une demande dans le dossier privé (non bloquant :
 *  les erreurs sont loggées, jamais propagées — l'email et la base
 *  restent les voies critiques). */
export async function stockerDemande(demande: DemandeStockee): Promise<boolean> {
  if (!isStorageConfigured()) return false;
  try {
    await enregistrerFichier(
      `${DOSSIER_DEMANDES}/${nomFichier(demande.id)}`,
      Buffer.from(JSON.stringify(demande, null, 2), "utf8").toString("base64"),
      `demandes : ${demande.type} — ${demande.name} (${demande.id})`,
    );
    return true;
  } catch (e) {
    console.warn("[demandes] Stockage GitHub non effectué :", e instanceof Error ? e.message : e);
    return false;
  }
}

/** Toutes les demandes du dossier privé (liste vide si absent ou non
 *  configuré). */
export async function listerDemandes(): Promise<DemandeStockee[]> {
  if (!isStorageConfigured()) return [];
  try {
    const entrees = await listerDossier(DOSSIER_DEMANDES);
    const fichiers = entrees.filter((e) => e.type === "file" && e.name.endsWith(".json"));
    const demandes = await Promise.all(
      fichiers.map(async (f) => {
        try {
          const brut = await lireFichier(`${DOSSIER_DEMANDES}/${f.name}`);
          if (!brut) return null;
          const d = JSON.parse(brut.toString("utf8")) as DemandeStockee;
          return d && d.id && d.createdAt ? d : null;
        } catch {
          return null;
        }
      }),
    );
    return demandes
      .filter((d): d is DemandeStockee => Boolean(d))
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  } catch {
    return [];
  }
}

/** Met à jour le statut d'une demande stockée dans le dossier privé
 *  (silencieux si absente). */
export async function majStatutDemande(id: string, status: string): Promise<void> {
  if (!isStorageConfigured()) return;
  try {
    const brut = await lireFichier(`${DOSSIER_DEMANDES}/${nomFichier(id)}`);
    if (!brut) return;
    const demande = JSON.parse(brut.toString("utf8")) as DemandeStockee;
    demande.status = status;
    await enregistrerFichier(
      `${DOSSIER_DEMANDES}/${nomFichier(id)}`,
      Buffer.from(JSON.stringify(demande, null, 2), "utf8").toString("base64"),
      `demandes : statut « ${status} » — ${demande.name} (${demande.id})`,
    );
  } catch {
    /* la demande vit peut-être seulement en base : silencieux */
  }
}
