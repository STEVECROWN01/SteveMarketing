"use client";

import React, { useMemo, useState } from "react";
import { Download, Eye, FileText, Loader2, Pencil, Receipt, Trash2, X } from "lucide-react";
import { ApercuDocument } from "./ApercuDocument";
import { Carte, Pastille } from "./elements";
import type { DocumentRecord, DocType } from "@/lib/documents/types";
import { LABELS_DOC } from "@/lib/documents/types";
import { formatDate, formatCurrency, totalDocument } from "@/lib/documents/format";

/**
 * LISTE DES DOCUMENTS D'UN TYPE (VOLET 15) — chaque rubrique du
 * back-office (Propositions commerciales, Devis, Factures) présente
 * SES documents, TOUS visibles d'un coup comme la rubrique Demandes,
 * dans l'ORDRE DE CRÉATION. Le bouton « Créer… » de la rubrique vit
 * dans AdminPage ; chaque ligne porte ses icônes d'action :
 *
 *  - œil : aperçu plein écran ;
 *  - téléchargement : PDF à la demande ;
 *  - crayon : modification (générateur pour devis/proposition,
 *    espace de facturation pour facture) ;
 *  - reçue (devis) : génération de la facture correspondante ;
 *  - corbeille : suppression du stockage.
 */

export function ListeDocuments({
  docType,
  documents,
  chargement,
  stockageConfigure,
  onRafraichir,
  toast,
  onModifier,
  onFacturer,
}: {
  docType: DocType;
  documents: DocumentRecord[];
  chargement: boolean;
  stockageConfigure: boolean;
  onRafraichir: () => void;
  toast: (t: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
  onModifier: (d: DocumentRecord) => void;
  onFacturer?: (d: DocumentRecord) => void;
}) {
  const [apercu, setApercu] = useState<DocumentRecord | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null);

  /* ORDRE DE CRÉATION : du premier au dernier document créé. */
  const visibles = useMemo(
    () =>
      documents
        .filter((d) => d.docType === docType)
        .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || "")),
    [documents, docType],
  );

  const factureExistante = (numeroDevis: string) =>
    documents.find((f) => f.docType === "facture" && f.devisSource === numeroDevis);

  async function telecharger(record: DocumentRecord, avecEnregistrement = false) {
    const cle = `${record.numero}-pdf`;
    setEnCours(cle);
    try {
      const res = await fetch("/api/documents/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document: record,
          enregistrer: avecEnregistrement,
          envoyerEmail: avecEnregistrement,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Génération impossible.");
      }
      const blob = await res.blob();
      const nom =
        res.headers.get("Content-Disposition")?.match(/filename="?([^";]+)"?/)?.[1] ?? `${record.numero}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nom;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return nom;
    } finally {
      setEnCours(null);
    }
  }

  async function telechargerExistant(record: DocumentRecord) {
    try {
      await telecharger(record, false);
      toast({ title: `${record.numero} téléchargé` });
    } catch (e) {
      toast({ title: "Téléchargement impossible", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    }
  }

  async function supprimer(record: DocumentRecord) {
    if (!window.confirm(`Supprimer définitivement ${record.numero} (${record.client.nom}) du stockage ?`)) return;
    setEnCours(`${record.numero}-suppr`);
    try {
      const res = await fetch(`/api/documents/${encodeURIComponent(record.id)}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Suppression impossible.");
      toast({ title: `${record.numero} supprimé` });
      onRafraichir();
    } catch (e) {
      toast({ title: "Suppression impossible", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    } finally {
      setEnCours(null);
    }
  }

  if (!stockageConfigure) {
    return (
      <Carte className="flex flex-col items-center gap-4 px-6 py-16 text-center">
        <FileText className="h-8 w-8 text-[#e4e4e4]" aria-hidden="true" />
        <p className="max-w-xl text-sm leading-relaxed text-[#c8c8c8]">
          Les documents existants sont conservés dans un stockage privé dédié. Pour les lister,
          définissez la variable d&apos;environnement <code className="rounded bg-[#1c1c1c] px-1.5 py-0.5 text-white">GITHUB_DOCS_TOKEN</code> côté
          serveur (jeton d&apos;accès GitHub) — voir DEPLOIEMENT.md. La GÉNÉRATION (PDF, téléchargement,
          email) fonctionne déjà sans cette variable ; seul l&apos;archivage l&apos;attend.
        </p>
      </Carte>
    );
  }

  return (
    <div>
      {chargement ? (
        <div className="mb-4 flex items-center gap-2 text-sm text-[#c8c8c8]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Chargement…
        </div>
      ) : null}

      {visibles.length === 0 ? (
        <Carte className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <FileText className="h-8 w-8 text-[#e4e4e4]" aria-hidden="true" />
          <p className="text-sm text-[#c8c8c8]">
            {docType === "facture"
              ? "Aucune facture pour l'instant — créez-en une à partir d'un devis."
              : docType === "devis"
                ? "Aucun devis pour l'instant — créez votre premier devis."
                : "Aucune proposition pour l'instant — créez votre première proposition."}
          </p>
        </Carte>
      ) : (
        <Carte className="scroll-slim overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e4e4e4]/10 text-[11px] tracking-widest text-[#c8c8c8] uppercase">
                <th className="px-5 py-4">Numéro</th>
                <th className="px-5 py-4">Client</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4">Statut</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((d) => {
                const facture = d.docType === "devis" ? factureExistante(d.numero) : undefined;
                return (
                  <tr key={d.id} className="border-b border-[#e4e4e4]/8 transition-colors hover:bg-[#2f2f2f]/40">
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-white">{d.numero}</td>
                    <td className="max-w-[220px] px-5 py-4">
                      <p className="truncate font-medium text-white">{d.client.nom}</p>
                      {d.client.entreprise ? <p className="truncate text-xs text-[#c8c8c8]">{d.client.entreprise}</p> : null}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-[#c8c8c8]">{formatDate(d.date)}</td>
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-white">
                      {formatCurrency(totalDocument(d.items), d.devise)}
                    </td>
                    <td className="px-5 py-4">
                      {d.docType === "facture" ? (
                        <Pastille ton={d.statutPaiement === "Payé" ? "valide" : "neutre"}>
                          {d.statutPaiement ?? "En attente"}
                        </Pastille>
                      ) : d.docType === "devis" ? (
                        facture ? (
                          <Pastille ton="valide">Facturée ({facture.numero})</Pastille>
                        ) : (
                          <Pastille>À facturer</Pastille>
                        )
                      ) : (
                        <Pastille>Envoyée</Pastille>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setApercu(d)}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e4e4e4]/20 text-[#c8c8c8] transition-colors hover:border-[#e4e4e4] hover:text-[#e4e4e4]"
                          aria-label={`Aperçu de ${d.numero}`}
                          title="Aperçu"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => telechargerExistant(d)}
                          disabled={enCours === `${d.numero}-pdf`}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e4e4e4]/20 text-[#c8c8c8] transition-colors hover:border-[#e4e4e4] hover:text-[#e4e4e4] disabled:opacity-50"
                          aria-label={`Télécharger ${d.numero}`}
                          title="Télécharger le PDF"
                        >
                          {enCours === `${d.numero}-pdf` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onModifier(d)}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e4e4e4]/20 text-[#c8c8c8] transition-colors hover:border-[#e4e4e4] hover:text-[#e4e4e4]"
                          aria-label={`Modifier ${d.numero}`}
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {d.docType === "devis" && onFacturer ? (
                          <button
                            type="button"
                            onClick={() => onFacturer(d)}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e4e4e4]/20 text-[#c8c8c8] transition-colors hover:border-[#e4e4e4] hover:text-[#e4e4e4]"
                            aria-label={`Générer la facture du devis ${d.numero}`}
                            title="Générer la facture"
                          >
                            <Receipt className="h-4 w-4" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => supprimer(d)}
                          disabled={enCours === `${d.numero}-suppr`}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ea384c]/30 text-[#ffdede] transition-colors hover:border-[#ea384c] disabled:opacity-50"
                          aria-label={`Supprimer ${d.numero}`}
                          title="Supprimer du stockage"
                        >
                          {enCours === `${d.numero}-suppr` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Carte>
      )}

      {/* ---------- Aperçu plein écran ---------- */}
      {apercu ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Aperçu de ${apercu.numero}`}
          onClick={(e) => e.target === e.currentTarget && setApercu(null)}
        >
          <div className="flex h-full max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#e4e4e4]/15 bg-[#141414]">
            <div className="flex items-center justify-between border-b border-[#e4e4e4]/10 px-5 py-3">
              <p className="font-display text-sm font-semibold text-white">
                {LABELS_DOC[apercu.docType]} {apercu.numero} — {apercu.client.nom}
              </p>
              <button
                type="button"
                onClick={() => setApercu(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e4e4e4]/20 text-[#c8c8c8] transition-colors hover:border-[#e4e4e4] hover:text-white"
                aria-label="Fermer l'aperçu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-[#141414] p-4">
              <ApercuDocument document={apercu} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
