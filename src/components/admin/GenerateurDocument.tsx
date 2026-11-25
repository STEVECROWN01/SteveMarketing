"use client";

import React, { useMemo, useState } from "react";
import { Download, Inbox, Loader2, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { ApercuDocument } from "./ApercuDocument";
import { EditeurTexteRiche } from "./EditeurTexteRiche";
import { BoutonAction, Carte, Champ, Pastille, TitreSection, styleInput } from "./elements";
import {
  DEVISES,
  MODES_PAIEMENT,
  type DocType,
  type DocumentRecord,
  type LigneDocument,
} from "@/lib/documents/types";
import { buildNumero, totalDocument, formatCurrency } from "@/lib/documents/format";
import {
  devisParDefaut,
  propositionParDefaut,
  exempleModele,
} from "@/lib/documents/defaults";

/**
 * GÉNÉRATEUR DE DOCUMENTS COMMERCIAUX — DEVIS (VOLET 17).
 *
 * Le formulaire suit EXACTEMENT la structure du document imprimé,
 * dans l'ordre : entête (client, date, introduction, délai estimé),
 * tableau des prestations (désignation + description RÉDIGÉE en
 * texte riche, quantité, prix), conditions (validité, notes) puis
 * coordonnées bancaires (IBAN, BIC, titulaire — plus de champ
 * « Banque »). La FACTURE reste générée depuis un devis existant
 * (EspaceFacture) ; les PROPOSITIONS de l'ancien gabarit passent
 * toujours ici en édition.
 *
 * VOLET 17 : plus de champ « Type » (toujours « Service », posé
 * automatiquement dans le tableau) ; la condition de règlement
 * reste « À réception » automatiquement.
 */

type Formulaire = Omit<DocumentRecord, "id" | "numero" | "createdAt" | "updatedAt" | "docType">;

/** Toast avec icône (VOLET 17). */
export type FonctionToast = (t: {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  icon?: React.ReactNode;
}) => void;

/** Pré-remplissage depuis une DEMANDE reçue (VOLET 16). */
export type PreRemplissage = {
  client?: Partial<{
    nom: string;
    entreprise: string;
    ville: string;
    pays: string;
    telephone: string;
    email: string;
  }>;
  origine?: {
    nom: string;
    email?: string;
    telephone?: string | null;
    entreprise?: string | null;
    date: string;
    message: string;
  };
};

function nouvelleLigneVide(): LigneDocument {
  return {
    id: Math.random().toString(36).slice(2, 10),
    type: "Service",
    designation: "",
    description: "",
    prixUnitaire: 0,
    quantite: 1,
  };
}

function etatInitial(
  docType: DocType,
  prochainNumero: number,
  initial: DocumentRecord | null,
  preRemplissage: PreRemplissage | null,
): Formulaire {
  if (initial) {
    const { id: _id, numero: _numero, createdAt: _c, updatedAt: _u, docType: _d, ...rest } = initial;
    return rest as unknown as Formulaire;
  }
  const base =
    docType === "proposition" ? propositionParDefaut() : devisParDefaut();
  return {
    ...(base as unknown as Formulaire),
    ...(preRemplissage?.client
      ? { client: { ...(base as unknown as Formulaire).client, ...preRemplissage.client } }
      : {}),
    numeroClient: prochainNumero,
    date: new Date().toISOString().slice(0, 10),
  };
}

export function GenerateurDocument({
  docType,
  prochainNumero,
  stockageConfigure,
  onEnregistre,
  toast,
  initial = null,
  preRemplissage = null,
}: {
  docType: "devis" | "proposition";
  prochainNumero: number;
  stockageConfigure: boolean;
  onEnregistre: () => void;
  toast: FonctionToast;
  /** VOLET 15 : document existant à MODIFIER (null = création). */
  initial?: DocumentRecord | null;
  /** VOLET 16 : pré-remplissage depuis une demande reçue. */
  preRemplissage?: PreRemplissage | null;
}) {
  const [form, setForm] = useState<Formulaire>(() =>
    etatInitial(docType, prochainNumero, initial, preRemplissage),
  );
  const [generation, setGeneration] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);

  const enEdition = Boolean(initial);
  const libelle = docType === "proposition" ? "Proposition" : "Devis";
  const numero = initial?.numero ?? buildNumero(Number(form.numeroClient) || 1, docType);
  const total = totalDocument(form.items);

  const pourApercu: DocumentRecord = useMemo(
    () => ({
      ...form,
      docType,
      numero,
      id: "",
      createdAt: "",
      updatedAt: "",
    }),
    [form, docType, numero],
  );

  const maj = <K extends keyof Formulaire>(cle: K, valeur: Formulaire[K]) =>
    setForm((f) => ({ ...f, [cle]: valeur }));

  const majClient = (cle: keyof Formulaire["client"], valeur: string) =>
    setForm((f) => ({ ...f, client: { ...f.client, [cle]: valeur } }));

  const majItem = (id: string, patch: Partial<LigneDocument>) =>
    setForm((f) => ({ ...f, items: f.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) }));

  /* La condition de règlement est TOUJOURS « À réception ». */
  const corpsDocument = () => ({
    ...form,
    conditionsReglement: "À réception",
    docType,
    numero,
    ...(initial ? { id: initial.id, createdAt: initial.createdAt } : {}),
  });

  async function genererPdf() {
    if (generation) return;
    if (!form.client.nom.trim()) {
      toast({ title: "Nom du client requis", description: "Renseignez au moins le nom du client.", variant: "destructive" });
      return;
    }
    setGeneration(true);
    try {
      const res = await fetch("/api/documents/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document: corpsDocument(),
          enregistrer: true,
          envoyerEmail: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Génération impossible.");
      }
      const blob = await res.blob();
      const nom =
        res.headers.get("Content-Disposition")?.match(/filename="?([^";]+)"?/)?.[1] ?? `${numero}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nom;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      const emailOk = res.headers.get("X-Email-Sent") === "1";
      const stockageOk = res.headers.get("X-Stockage-Ok") === "1";
      toast({
        title: `${libelle} ${numero} ${enEdition ? "mis à jour" : "généré"}`,
        description: [
          "Téléchargement lancé.",
          stockageOk ? "Enregistré dans le stockage." : "Stockage non effectué (non configuré).",
          emailOk ? "Copie envoyée par email." : "Copie email non envoyée (Resend non configuré).",
        ].join(" "),
      });
      onEnregistre();
    } catch (e) {
      toast({
        title: "Génération impossible",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setGeneration(false);
    }
  }

  async function enregistrerSeul() {
    if (enregistrement) return;
    setEnregistrement(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document: corpsDocument(),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? "Enregistrement impossible.");
      }
      toast({
        title: `${enEdition ? "Mis à jour" : "Enregistré"} : ${numero}`,
        description: "Le document est disponible dans les listes.",
      });
      onEnregistre();
    } catch (e) {
      toast({
        title: "Enregistrement impossible",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setEnregistrement(false);
    }
  }

  function chargerExemple() {
    const ex = exempleModele();
    setForm((f) => ({
      ...f,
      ...ex,
      client: ex.client ?? f.client,
      objet: ex.objet ?? f.objet,
      intro: ex.intro ?? f.intro,
      items: ex.items ?? f.items,
      delaiEstime: ex.delaiEstime ?? f.delaiEstime,
    }));
    toast({
      title: "Exemple-modèle chargé",
      description: "Client fictif complet — générez pour voir le rendu final, puis adaptez.",
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_470px]">
      {/* ---------------- Formulaire (ordre du document) ---------------- */}
      <div className="space-y-6">
        {/* Demande à l'origine (VOLET 16 — jamais imprimée) */}
        {preRemplissage?.origine ? (
          <Carte className="border-[#e4e4e4]/25 bg-[#1c1c1c] p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <Inbox className="h-4 w-4 text-[#e4e4e4]" aria-hidden="true" />
              <h3 className="font-display text-base font-semibold text-white">
                Demande à l&apos;origine de ce devis
              </h3>
            </div>
            <p className="text-xs text-[#c8c8c8]">
              {preRemplissage.origine.nom}
              {preRemplissage.origine.email ? ` — ${preRemplissage.origine.email}` : ""}
              {preRemplissage.origine.entreprise ? ` — ${preRemplissage.origine.entreprise}` : ""}
              {` · reçue le ${preRemplissage.origine.date}`}
            </p>
            <p className="mt-2 max-h-32 overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-[#d9d9d9]">
              {preRemplissage.origine.message}
            </p>
            <p className="mt-3 text-[11px] text-[#c8c8c8]/70">
              Les coordonnées du demandeur sont déjà reportées ci-dessous dans la fiche client.
            </p>
          </Carte>
        ) : null}

        {/* 1 — Entête du document : client, date, introduction, délai */}
        <Carte className="p-5 sm:p-6">
          <TitreSection note={`Numéro : ${numero}`}>Entête du document</TitreSection>
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Nom complet *" indicatif="imprimé en gras">
              <input
                className={styleInput}
                value={form.client.nom}
                onChange={(e) => majClient("nom", e.target.value)}
                placeholder="Ex. Aïcha Dossou"
              />
            </Champ>
            <Champ label="Entreprise">
              <input
                className={styleInput}
                value={form.client.entreprise ?? ""}
                onChange={(e) => majClient("entreprise", e.target.value)}
                placeholder="Ex. Cabinet Essentiel & Stratégie"
              />
            </Champ>
            <Champ label="Ville">
              <input className={styleInput} value={form.client.ville ?? ""} onChange={(e) => majClient("ville", e.target.value)} placeholder="Ex. Cotonou" />
            </Champ>
            <Champ label="Pays">
              <input className={styleInput} value={form.client.pays ?? ""} onChange={(e) => majClient("pays", e.target.value)} placeholder="Ex. Bénin" />
            </Champ>
            <Champ label="Téléphone">
              <input className={styleInput} value={form.client.telephone ?? ""} onChange={(e) => majClient("telephone", e.target.value)} placeholder="+229 …" />
            </Champ>
            <Champ label="Email">
              <input className={styleInput} type="email" value={form.client.email ?? ""} onChange={(e) => majClient("email", e.target.value)} placeholder="client@exemple.com" />
            </Champ>
            <Champ label="Numéro client" indicatif={enEdition ? "conservé en édition" : " relie devis et facture"}>
              <input
                className={styleInput}
                type="number"
                min={1}
                value={form.numeroClient}
                readOnly={enEdition}
                onChange={(e) => maj("numeroClient", Number(e.target.value) || 1)}
              />
            </Champ>
            <Champ label="Date d'émission">
              <input className={styleInput} type="date" value={form.date} onChange={(e) => maj("date", e.target.value)} />
            </Champ>
            <Champ label="Introduction (après « Merci pour votre confiance. »)" className="sm:col-span-2">
              <textarea
                className={`${styleInput} min-h-[92px] resize-y`}
                value={form.intro}
                onChange={(e) => maj("intro", e.target.value)}
              />
            </Champ>
            <Champ label="Délai estimé" indicatif="affiché à la suite des CGV" className="sm:col-span-2">
              <input
                className={styleInput}
                value={form.delaiEstime ?? ""}
                onChange={(e) => maj("delaiEstime", e.target.value)}
                placeholder="02 à 03 semaines"
              />
            </Champ>
          </div>
        </Carte>

        {/* 2 — Tableau « Détail » : désignation + description rédigée */}
        <Carte className="p-5 sm:p-6">
          <TitreSection note={`Total : ${formatCurrency(total, form.devise)}`}>
            Détail des prestations
          </TitreSection>
          <div className="space-y-4">
            {form.items.map((item, index) => (
              <div key={item.id} className="rounded-xl border border-[#e4e4e4]/10 bg-[#1c1c1c] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold tracking-wider text-[#c8c8c8] uppercase">
                    Ligne {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, items: f.items.filter((it) => it.id !== item.id) }))}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ea384c]/30 text-[#ffdede] transition-colors hover:border-[#ea384c]"
                    aria-label={`Supprimer la ligne ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {/* Désignation — pleine largeur */}
                <Champ label="Désignation">
                  <input className={styleInput} value={item.designation} onChange={(e) => majItem(item.id, { designation: e.target.value })} placeholder="Site Web Professionnel — …" />
                </Champ>
                {/* Description rédigée — ÉDITEUR RICHE, seule sur sa
                    ligne pour rédiger à l'aise (gras, italique, taille
                    supérieure, listes). */}
                <div className="mt-3">
                  <Champ label="Description (texte riche)" indicatif="imprimée sous la désignation">
                    <EditeurTexteRiche
                      valeur={item.description ?? ""}
                      onChange={(html) => majItem(item.id, { description: html })}
                      placeholder="Rédigez la description de la prestation — gras, italique, taille supérieure, listes…"
                      minHeight={200}
                    />
                  </Champ>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Champ label="Quantité">
                    <input className={styleInput} type="number" min={1} value={item.quantite} onChange={(e) => majItem(item.id, { quantite: Number(e.target.value) || 0 })} />
                  </Champ>
                  <Champ label="Prix unitaire">
                    <input className={styleInput} type="number" min={0} step="any" value={item.prixUnitaire} onChange={(e) => majItem(item.id, { prixUnitaire: Number(e.target.value) || 0 })} />
                  </Champ>
                </div>
              </div>
            ))}
            <BoutonAction
              onClick={() => setForm((f) => ({ ...f, items: [...f.items, nouvelleLigneVide()] }))}
              className="w-full"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Ajouter une prestation
            </BoutonAction>
          </div>
        </Carte>

        {/* 3 — Validité & notes (avant les CGV imprimées) */}
        <Carte className="p-5 sm:p-6">
          <TitreSection note="conditions générales imprimées automatiquement">Validité & notes</TitreSection>
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Validité (jours)">
              <input className={styleInput} type="number" min={1} value={form.validiteJours} onChange={(e) => maj("validiteJours", Number(e.target.value) || 15)} />
            </Champ>
            <Champ label="Notes" className="sm:col-span-2">
              <textarea className={`${styleInput} min-h-[72px] resize-y`} value={form.notes} onChange={(e) => maj("notes", e.target.value)} />
            </Champ>
          </div>
        </Carte>

        {/* 4 — Règlement & coordonnées bancaires (IBAN, BIC, titulaire) */}
        <Carte className="p-5 sm:p-6">
          <TitreSection note="règlement toujours à réception">Règlement & coordonnées bancaires</TitreSection>
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Devise">
              <select className={styleInput} value={form.devise} onChange={(e) => maj("devise", e.target.value)}>
                {DEVISES.map((dv) => (
                  <option key={dv.code} value={dv.code} className="bg-[#232323]">
                    {dv.label}
                  </option>
                ))}
              </select>
            </Champ>
            <Champ label="Mode de paiement">
              <select className={styleInput} value={form.modePaiement} onChange={(e) => maj("modePaiement", e.target.value)}>
                {MODES_PAIEMENT.map((m) => (
                  <option key={m} value={m} className="bg-[#232323]">{m}</option>
                ))}
              </select>
            </Champ>
            <Champ label="IBAN" className="sm:col-span-2">
              <input className={styleInput} value={form.banque.iban} onChange={(e) => maj("banque", { ...form.banque, iban: e.target.value })} />
            </Champ>
            <Champ label="BIC" className="sm:col-span-2">
              <input className={styleInput} value={form.banque.bic} onChange={(e) => maj("banque", { ...form.banque, bic: e.target.value })} />
            </Champ>
            <Champ label="Titulaire du compte" className="sm:col-span-2">
              <input className={styleInput} value={form.banque.titulaire} onChange={(e) => maj("banque", { ...form.banque, titulaire: e.target.value })} />
            </Champ>
            <Champ label="Lien de paiement en ligne (optionnel)" className="sm:col-span-2">
              <input className={styleInput} value={form.lienPaiement ?? ""} onChange={(e) => maj("lienPaiement", e.target.value)} placeholder="https://…" />
            </Champ>
          </div>
        </Carte>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <BoutonAction variant="principal" onClick={genererPdf} disabled={generation}>
            {generation ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Génération…
              </>
            ) : (
              <>
                <Download className="h-4 w-4" aria-hidden="true" />
                Générer le PDF
              </>
            )}
          </BoutonAction>
          <BoutonAction onClick={enregistrerSeul} disabled={enregistrement || !stockageConfigure} titre={stockageConfigure ? undefined : "Stockage non configuré (GITHUB_DOCS_TOKEN)"}>
            {enregistrement ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            Enregistrer seulement
          </BoutonAction>
          <BoutonAction onClick={chargerExemple}>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Charger l&apos;exemple-modèle
          </BoutonAction>
          <Pastille ton={stockageConfigure ? "valide" : "alerte"}>
            {stockageConfigure ? "Stockage actif" : "Stockage non configuré"}
          </Pastille>
        </div>
        <p className="text-xs leading-relaxed text-[#c8c8c8]/80">
          « Générer le PDF » télécharge le document, l&apos;enregistre dans votre
          back-office et vous en envoie une copie par email — chaque étape est
          confirmée à l&apos;écran.
        </p>
      </div>

      {/* ---------------- Aperçu ---------------- */}
      <div className="xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)]">
        <ApercuDocument document={pourApercu} />
      </div>
    </div>
  );
}
