"use client";

import React, { useState } from "react";
import { Loader2, Receipt, X } from "lucide-react";
import { BoutonAction, Champ, styleInput } from "./elements";
import type { DocumentRecord } from "@/lib/documents/types";
import { formatCurrency, totalDocument, numeroDevisVersFacture } from "@/lib/documents/format";

/**
 * ESPACE DE GÉNÉRATION DE FACTURE (VOLET 14, restructuré VOLET 15) —
 * un seul composant sert TROIS portes d'entrée :
 *
 *  1. depuis la liste des DEVIS : l'icône « générer la facture » d'un
 *     devis ouvre cet espace pour ce devis ;
 *  2. depuis « Créer une nouvelle facture » (rubrique Factures) : la
 *     sélection d'un devis puis « Continuer » ouvre cet espace pour le
 *     devis choisi ;
 *  3. depuis la liste des FACTURES : l'icône « modifier » d'une
 *     facture rouvre cet espace pré-rempli (statut, date de
 *     règlement) pour la régénérer.
 *
 * La facture reprend exactement les prestations et le total du devis
 * (règle D→F : le préfixe D est remplacé par F, les chiffres restent)
 * et porte son cachet « PAYÉ » lorsque le statut est « Payé ».
 *
 * VOLET 18 — BILINGUE FR/EN : la facture ENREGISTRÉE hérite de la
 * langue du devis d'origine (base.langue) ; au moment de générer,
 * un menu propose la VERSION DU PDF (française / anglaise) — la
 * version choisie (`langueSortie` envoyée à /api/documents/pdf)
 * n'écrase JAMAIS la langue enregistrée de la facture.
 */
export function EspaceFacture({
  document: base,
  onFerme,
  onRafraichir,
  toast,
}: {
  /** Devis à facturer OU facture existante à modifier. */
  document: DocumentRecord;
  /** Fermeture — `succes` à vrai après une génération réussie. */
  onFerme: (succes?: boolean) => void;
  onRafraichir: () => void;
  toast: (t: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}) {
  const estDevis = base.docType === "devis";
  const numeroFacture = estDevis ? numeroDevisVersFacture(base.numero) : base.numero;
  const [statutPaiement, setStatutPaiement] = useState<"Payé" | "En attente">(
    base.docType === "facture" ? (base.statutPaiement ?? "Payé") : "Payé",
  );
  const [datePaiement, setDatePaiement] = useState(
    base.docType === "facture" && base.datePaiement ? base.datePaiement : new Date().toISOString().slice(0, 10),
  );
  const [enCours, setEnCours] = useState(false);
  /* VOLET 18 — menu « version du PDF » ouvert par le bouton de
   * génération. */
  const [choixLangue, setChoixLangue] = useState(false);

  /* VOLET 18 — `langueSortie` : version du PDF téléchargé (et de sa
   * copie email) ; l'enregistrement garde la langue de la facture
   * (celle du devis d'origine). */
  async function genererFacture(langueSortie: "fr" | "en") {
    if (enCours) return;
    setEnCours(true);
    try {
      const facture: DocumentRecord = estDevis
        ? {
            ...base,
            docType: "facture",
            numero: numeroFacture,
            id: `facture-${numeroFacture}`.toLowerCase(),
            devisSource: base.numero,
            /* VOLET 18 — la facture hérite de la langue du devis
             * (donnée persistée, défaut "fr"). */
            langue: base.langue ?? "fr",
            statutPaiement,
            datePaiement: statutPaiement === "Payé" ? datePaiement : undefined,
            phases: undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        : {
            ...base,
            statutPaiement,
            datePaiement: statutPaiement === "Payé" ? datePaiement : undefined,
            updatedAt: new Date().toISOString(),
          };

      const res = await fetch("/api/documents/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: facture, langueSortie, enregistrer: true, envoyerEmail: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Génération impossible.");
      }
      const blob = await res.blob();
      const nom =
        res.headers.get("Content-Disposition")?.match(/filename="?([^";]+)"?/)?.[1] ?? `${numeroFacture}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nom;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({
        title: `Facture ${numeroFacture} ${base.docType === "facture" ? "mise à jour" : "générée"}`,
        description: `Téléchargement lancé (version ${langueSortie === "en" ? "anglaise" : "française"}) — la facture est enregistrée${estDevis ? ` et liée au devis ${base.numero}` : ""}.`,
      });
      onRafraichir();
      onFerme(true);
    } catch (e) {
      toast({
        title: "Génération de facture impossible",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setEnCours(false);
    }
  }

  /* VOLET 18 — choix du menu → génération de la facture. */
  function lancerFacture(langue: "fr" | "en") {
    setChoixLangue(false);
    void genererFacture(langue);
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${estDevis ? `Générer la facture du devis ${base.numero}` : `Modifier la facture ${base.numero}`}`}
      onClick={(e) => e.target === e.currentTarget && onFerme()}
    >
      <div className="w-full max-w-lg rounded-2xl border border-[#e4e4e4]/15 bg-[#232323] p-6 sm:p-8">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-eyebrow">Facture</p>
            <h3 className="mt-1 font-display text-xl font-semibold text-white">
              {estDevis ? `Facturer le devis ${base.numero}` : `Modifier la facture ${base.numero}`}
            </h3>
            <p className="mt-1 text-sm text-[#c8c8c8]">
              {base.client.nom} — {formatCurrency(totalDocument(base.items), base.devise)} ·
              la facture porte le numéro {numeroFacture}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onFerme()}
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
          « PAYÉ » est apposé lorsque le statut est « Payé ». La facture est enregistrée et liée au devis.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <BoutonAction onClick={() => onFerme()}>Annuler</BoutonAction>
          {/* VOLET 18 — le bouton ouvre le menu « version du PDF »
              (française / anglaise) avant de générer. */}
          <BoutonAction variant="principal" onClick={() => setChoixLangue(true)} disabled={enCours}>
            {enCours ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Génération…
              </>
            ) : (
              <>
                <Receipt className="h-4 w-4" aria-hidden="true" />
                {estDevis ? "Générer la facture" : "Régénérer la facture"}
              </>
            )}
          </BoutonAction>
        </div>
      </div>
      </div>

      {/* ---------- VOLET 18 : version du PDF de la facture ---------- */}
      {choixLangue ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Version du PDF de la facture"
          onClick={(e) => e.target === e.currentTarget && setChoixLangue(false)}
        >
          <div className="w-full max-w-sm rounded-2xl border border-[#e4e4e4]/15 bg-[#232323] p-6">
            <p className="text-eyebrow">Facture {numeroFacture}</p>
            <h3 className="mt-1 font-display text-xl font-semibold text-white">Version du PDF</h3>
            <p className="mt-1 text-sm text-[#c8c8c8]">
              {base.client.nom} — la facture enregistrée reste en{" "}
              {(base.langue ?? "fr") === "en" ? "anglais" : "français"} (langue du devis d'origine).
            </p>
            <div className="mt-5 space-y-3">
              <BoutonAction
                className="w-full"
                variant={(base.langue ?? "fr") === "fr" ? "principal" : "secondaire"}
                onClick={() => lancerFacture("fr")}
              >
                Version française
              </BoutonAction>
              <BoutonAction
                className="w-full"
                variant={(base.langue ?? "fr") === "en" ? "principal" : "secondaire"}
                onClick={() => lancerFacture("en")}
              >
                Version anglaise
              </BoutonAction>
            </div>
            <div className="mt-5 flex justify-end">
              <BoutonAction onClick={() => setChoixLangue(false)}>Annuler</BoutonAction>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
