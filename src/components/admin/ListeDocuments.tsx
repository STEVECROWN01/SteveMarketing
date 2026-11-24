"use client";

import React, { useMemo, useState } from "react";
import { Download, Eye, FileText, Loader2, Receipt, Trash2, X } from "lucide-react";
import { ApercuDocument } from "./ApercuDocument";
import { BoutonAction, Carte, Champ, Pastille, styleInput } from "./elements";
import type { DocumentRecord, DocType } from "@/lib/documents/types";
import { LABELS_DOC } from "@/lib/documents/types";
import { formatDate, formatCurrency, totalDocument, numeroDevisVersFacture } from "@/lib/documents/format";

/**
 * LISTE DES DOCUMENTS EXISTANTS (VOLET 14) — le back-office « sert
 * les documents depuis le stockage » (dépôt GitHub privé dédié) :
 * consulter l'aperçu, télécharger le PDF, supprimer, et pour chaque
 * DEVIS générer LA FACTURE correspondante (demande de l'éditeur :
 * « c'est quand on va finir de générer un devis qu'on pourra sur le
 * devis, chaque devis généré aura une option de génération de
 * facture ») — la facture reprend le devis (règle K.Quotes : D→F,
 * mêmes chiffres) avec son CACHET « PAYÉ » (style MrSteveEnglish).
 */

type Filtre = "tous" | DocType;

export function ListeDocuments({
  documents,
  chargement,
  stockageConfigure,
  onRafraichir,
  toast,
}: {
  documents: DocumentRecord[];
  chargement: boolean;
  stockageConfigure: boolean;
  onRafraichir: () => void;
  toast: (t: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}) {
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [apercu, setApercu] = useState<DocumentRecord | null>(null);
  const [devisAFacturer, setDevisAFacturer] = useState<DocumentRecord | null>(null);
  const [statutPaiement, setStatutPaiement] = useState<"Payé" | "En attente">("Payé");
  const [datePaiement, setDatePaiement] = useState(new Date().toISOString().slice(0, 10));
  const [enCours, setEnCours] = useState<string | null>(null);

  const visibles = useMemo(
    () => (filtre === "tous" ? documents : documents.filter((d) => d.docType === filtre)),
    [documents, filtre],
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

  async function genererFacture() {
    if (!devisAFacturer) return;
    const numeroFacture = numeroDevisVersFacture(devisAFacturer.numero);
    setEnCours("facture");
    try {
      const facture: DocumentRecord = {
        ...devisAFacturer,
        docType: "facture",
        numero: numeroFacture,
        id: `facture-${numeroFacture}`.toLowerCase(),
        devisSource: devisAFacturer.numero,
        statutPaiement,
        datePaiement: statutPaiement === "Payé" ? datePaiement : undefined,
        phases: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const nom = await telecharger(facture, true);
      toast({
        title: `Facture ${numeroFacture} générée`,
        description: `Téléchargée (${nom}) — enregistrée et liée au devis ${devisAFacturer.numero}.`,
      });
      setDevisAFacturer(null);
      onRafraichir();
    } catch (e) {
      toast({ title: "Génération de facture impossible", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    } finally {
      setEnCours(null);
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
          Les documents existants sont conservés dans un dépôt GitHub privé dédié. Pour les lister,
          définissez la variable d&apos;environnement <code className="rounded bg-[#1c1c1c] px-1.5 py-0.5 text-white">GITHUB_DOCS_TOKEN</code> côté
          serveur (jeton d&apos;accès GitHub) — voir DEPLOIEMENT.md. La GÉNÉRATION (PDF, téléchargement,
          email) fonctionne déjà sans cette variable ; seul l&apos;archivage l&apos;attend.
        </p>
      </Carte>
    );
  }

  return (
    <div>
      {/* Filtres */}
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        {(
          [
            ["tous", `Tous (${documents.length})`],
            ["proposition", `Propositions (${documents.filter((d) => d.docType === "proposition").length})`],
            ["devis", `Devis (${documents.filter((d) => d.docType === "devis").length})`],
            ["facture", `Factures (${documents.filter((d) => d.docType === "facture").length})`],
          ] as [Filtre, string][]
        ).map(([cle, libelle]) => (
          <button
            key={cle}
            type="button"
            onClick={() => setFiltre(cle)}
            className={`min-h-[40px] rounded-full px-4 py-2 text-xs font-medium transition-colors ${
              filtre === cle
                ? "border border-[#e4e4e4] bg-white text-[#1c1c1c]"
                : "border border-[#e4e4e4]/20 text-[#c8c8c8] hover:border-[#e4e4e4]/40"
            }`}
          >
            {libelle}
          </button>
        ))}
        {chargement ? <Loader2 className="h-4 w-4 animate-spin text-[#c8c8c8]" aria-hidden="true" /> : null}
      </div>

      {visibles.length === 0 ? (
        <Carte className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <FileText className="h-8 w-8 text-[#e4e4e4]" aria-hidden="true" />
          <p className="text-sm text-[#c8c8c8]">Aucun document dans cette catégorie pour l&apos;instant.</p>
        </Carte>
      ) : (
        <Carte className="scroll-slim overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e4e4e4]/10 text-[11px] tracking-widest text-[#c8c8c8] uppercase">
                <th className="px-5 py-4">Numéro</th>
                <th className="px-5 py-4">Type</th>
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
                    <td className="px-5 py-4 font-medium text-white">{d.numero}</td>
                    <td className="px-5 py-4 text-[#c8c8c8]">{LABELS_DOC[d.docType]}</td>
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
                        {d.docType === "devis" && !facture ? (
                          <BoutonAction onClick={() => setDevisAFacturer(d)} className="min-h-[36px] px-4 text-xs">
                            <Receipt className="h-3.5 w-3.5" aria-hidden="true" />
                            Générer la facture
                          </BoutonAction>
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

      {/* ---------- Génération de facture depuis un devis ---------- */}
      {devisAFacturer ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Générer la facture du devis ${devisAFacturer.numero}`}
          onClick={(e) => e.target === e.currentTarget && setDevisAFacturer(null)}
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#e4e4e4]/15 bg-[#232323] p-6 sm:p-8">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-eyebrow">Facture</p>
                <h3 className="mt-1 font-display text-xl font-semibold text-white">
                  Facturer le devis {devisAFacturer.numero}
                </h3>
                <p className="mt-1 text-sm text-[#c8c8c8]">
                  {devisAFacturer.client.nom} — {formatCurrency(totalDocument(devisAFacturer.items), devisAFacturer.devise)} ·
                  la facture portera le numéro {numeroDevisVersFacture(devisAFacturer.numero)}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDevisAFacturer(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e4e4e4]/20 text-[#c8c8c8] transition-colors hover:border-[#e4e4e4] hover:text-white"
                aria-label="Annuler"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Champ label="Statut du paiement">
                <select
                  className={styleInput}
                  value={statutPaiement}
                  onChange={(e) => setStatutPaiement(e.target.value === "Payé" ? "Payé" : "En attente")}
                >
                  <option value="Payé" className="bg-[#232323]">Payé (cachet « PAYÉ »)</option>
                  <option value="En attente" className="bg-[#232323]">En attente</option>
                </select>
              </Champ>
              <Champ label="Date de règlement">
                <input className={styleInput} type="date" value={datePaiement} onChange={(e) => setDatePaiement(e.target.value)} />
              </Champ>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-[#c8c8c8]/80">
              Le PDF de la facture reprend exactement les prestations et le total du devis ; le cachet
              « PAYÉ » (double cadre vert incliné) est apposé lorsque le statut est « Payé ». La facture
              est enregistrée dans le stockage et liée au devis.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <BoutonAction onClick={() => setDevisAFacturer(null)}>Annuler</BoutonAction>
              <BoutonAction variant="principal" onClick={genererFacture} disabled={enCours === "facture"}>
                {enCours === "facture" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Génération…
                  </>
                ) : (
                  <>
                    <Receipt className="h-4 w-4" aria-hidden="true" />
                    Générer la facture
                  </>
                )}
              </BoutonAction>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
