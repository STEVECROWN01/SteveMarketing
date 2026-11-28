"use client";

import React, { useMemo, useState } from "react";
import { FileCheck2, Inbox, Languages, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { ApercuDocument } from "./ApercuDocument";
import { EditeurTexteRiche } from "./EditeurTexteRiche";
import { BoutonAction, Carte, Champ, Pastille, TitreSection, styleInput, styleInputDate } from "./elements";
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
  TEXTES_DEFAUT,
  type CleTexteDefaut,
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
 *
 * VOLET 18 — BILINGUE FR/EN (DEVIS uniquement) : un petit bouton
 * FR/EN en tête du formulaire bascule la langue du document
 * (donnée persistée avec l'enregistrement) ET traduit les champs
 * qui contiennent encore le texte PAR DÉFAUT ; « Générer le PDF »
 * propose ensuite le choix de la version téléchargée (française /
 * anglaise) sans jamais écraser la langue enregistrée. Les
 * PROPOSITIONS restent en français : ni bouton, ni menu.
 */

type Formulaire = Omit<DocumentRecord, "id" | "numero" | "createdAt" | "updatedAt" | "docType">;

/** Toast avec icône (VOLET 17). */
export type FonctionToast = (t: {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  icon?: React.ReactNode;
}) => void;

/** Pré-remplissage depuis une DEMANDE reçue (VOLET 16) ou depuis
 *  une PROPOSITION COMMERCIALE (VOLET 20).
 *
 *  VOLET 20 — `champs` : valeurs COMPLÈTES du formulaire pré-remplies
 *  depuis une proposition commerciale (items rédigés par l'expert,
 *  délai, montant, devise…) — voir AdminPage.creerDevisDepuisProposition. */
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
    titre?: string;
    nom: string;
    email?: string;
    telephone?: string | null;
    entreprise?: string | null;
    date: string;
    message: string;
  };
  /** VOLET 20 — champs du document pré-remplis (proposition). */
  champs?: Partial<Omit<Formulaire, "client" | "numeroClient" | "date">>;
  /** VOLET 20 — numéro CLIENT imposé (depuis une proposition : les
   *  documents d'un même client restent reliés). */
  numeroClient?: number;
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
  const avecClient = preRemplissage?.client
    ? { client: { ...(base as unknown as Formulaire).client, ...preRemplissage.client } }
    : {};
  /* VOLET 20 — champs COMPLETS pré-remplis (génération d'un devis
   * depuis une proposition commerciale) : items, délai, montant…
   * Le numéro CLIENT d'une proposition est réutilisé quand fourni. */
  return {
    ...(base as unknown as Formulaire),
    ...avecClient,
    ...(preRemplissage?.champs ?? {}),
    numeroClient: preRemplissage?.numeroClient ?? prochainNumero,
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
  /* VOLET 23 — ANTI-DOUBLON : numéros des devis déjà générés —
   *  générer une seconde fois le même numéro est REFUSÉ par un
   *  toast (l'édition d'un devis existant reste libre). */
  numerosExistants = [],
  /* CORRECTIF 28/11 — session expirée : retour propre à l'écran de
   *  connexion (plus jamais un toast rouge « Non autorisé »). */
  sessionExpiree,
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
  numerosExistants?: string[];
  sessionExpiree?: () => void;
}) {
  const [form, setForm] = useState<Formulaire>(() =>
    etatInitial(docType, prochainNumero, initial, preRemplissage),
  );
  const [generation, setGeneration] = useState(false);

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

  /* VOLET 18 — BASCULE FR/EN DU DEVIS : la langue change ET chaque
   * champ texte qui contient EXACTEMENT le texte PAR DÉFAUT de
   * l'ancienne langue est remplacé par celui de la nouvelle — un
   * texte PERSONNALISÉ n'est jamais écrasé. Le mode de paiement ne
   * bouge pas : le sélecteur garde ses valeurs canoniques (le
   * gabarit traduit « Virement bancaire » → « Bank transfer » à
   * l'impression). */
  const basculerLangue = () => {
    setForm((f) => {
      const ancienne = f.langue ?? "fr";
      const nouvelle: "fr" | "en" = ancienne === "fr" ? "en" : "fr";
      const traduire = (valeur: string | undefined, cle: CleTexteDefaut): string | undefined => {
        const defaut = TEXTES_DEFAUT[ancienne][cle];
        if (valeur === undefined || valeur.trim() !== defaut.trim()) return valeur;
        return TEXTES_DEFAUT[nouvelle][cle];
      };
      return {
        ...f,
        langue: nouvelle,
        intro: traduire(f.intro, "intro") ?? "",
        conditionsReglement: traduire(f.conditionsReglement, "conditionsReglement") ?? f.conditionsReglement,
        notes: traduire(f.notes, "notes") ?? "",
        delaiEstime: traduire(f.delaiEstime, "delaiEstime"),
        items: f.items.map((it) => ({
          ...it,
          designation: traduire(it.designation, "designationLigne") ?? it.designation,
          description: traduire(it.description, "descriptionLigne"),
        })),
      };
    });
  };

  /* La condition de règlement est TOUJOURS automatique — VOLET 18 :
   * « À réception » en français, « Upon receipt » en anglais. */
  const corpsDocument = () => ({
    ...form,
    conditionsReglement: TEXTES_DEFAUT[form.langue ?? "fr"].conditionsReglement,
    docType,
    numero,
    ...(initial ? { id: initial.id, createdAt: initial.createdAt } : {}),
  });

  /* VOLET 20 — GÉNÉRATION SANS TÉLÉCHARGEMENT AUTOMATIQUE (demande
   * de l'éditeur : le document généré est ENREGISTRÉ dans le
   * stockage privé ; VOLET 30 — plus de copie email : tout est
   * archivé dans GitHub, la boîte mail reste libre) ; le
   * téléchargement sur l'appareil passe UNIQUEMENT par le bouton
   * dédié de la liste — avec choix FR/EN pour les devis. La langue
   * du document reste celle du formulaire (bouton FR/EN) : plus de
   * menu de version au moment de la génération. */
  async function genererDocument() {
    if (generation) return;
    if (!form.client.nom.trim()) {
      toast({ title: "Nom du client requis", description: "Renseignez au moins le nom du client.", variant: "destructive" });
      return;
    }
    /* VOLET 23 — ANTI-DOUBLON (demande de l'éditeur : « pareil pour
     * la génération de devis — générer deux fois le même document
     * doit être refusé par un toast : le document existe déjà »). */
    if (!enEdition && numerosExistants.includes(numero)) {
      toast({
        title: `${libelle} déjà généré`,
        description: `Le devis ${numero} existe déjà — il est disponible dans la liste (ouvrez-le ou modifiez-le depuis la liste).`,
        variant: "destructive",
      });
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
        }),
      });
      if (res.status === 401) {
        sessionExpiree?.();
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Génération impossible.");
      }
      /* Le PDF renvoyé est simplement consommé — aucun
       * téléchargement automatique sur l'appareil. */
      await res.blob();
      const stockageOk = res.headers.get("X-Stockage-Ok") === "1";
      toast({
        title: `${libelle} ${numero} ${enEdition ? "mis à jour" : "généré"}`,
        description: [
          stockageOk ? "Enregistré dans le stockage et disponible dans la liste." : "Stockage non effectué (non configuré).",
          "Téléchargez-le depuis la liste (bouton dédié).",
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
        {/* Demande / proposition à l'origine (VOLET 16 — jamais imprimée).
            VOLET 20 : titre paramétrable (proposition commerciale à
            l'origine du devis). */}
        {preRemplissage?.origine ? (
          <Carte className="border-[#e4e4e4]/25 bg-[#1c1c1c] p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <Inbox className="h-4 w-4 text-[#e4e4e4]" aria-hidden="true" />
              <h3 className="font-display text-base font-semibold text-white">
                {preRemplissage.origine.titre ?? "Demande à l'origine de ce devis"}
              </h3>
            </div>
            <p className="text-xs text-[#c8c8c8]">
              {preRemplissage.origine.nom}
              {preRemplissage.origine.email ? ` — ${preRemplissage.origine.email}` : ""}
              {preRemplissage.origine.entreprise ? ` — ${preRemplissage.origine.entreprise}` : ""}
              {` · ${preRemplissage.origine.date}`}
            </p>
            <p className="mt-2 max-h-32 overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-[#d9d9d9]">
              {preRemplissage.origine.message}
            </p>
            <p className="mt-3 text-[11px] text-[#c8c8c8]/70">
              {preRemplissage.origine.titre
                ? "Les informations utiles de la proposition sont déjà reportées dans le formulaire ci-dessous."
                : "Les coordonnées du demandeur sont déjà reportées ci-dessous dans la fiche client."}
            </p>
          </Carte>
        ) : null}

        {/* 1 — Entête du document : client, date, introduction, délai */}
        <Carte className="p-5 sm:p-6">
          {/* VOLET 18 — en-tête du formulaire : numéro + bouton de
              bascule de langue du document (FR/EN, DEVIS uniquement —
              les propositions commerciales restent en français). */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-base font-semibold text-white sm:text-lg">Entête du document</h3>
            <div className="flex items-center gap-2.5">
              <p className="text-xs text-[#c8c8c8]">Numéro : {numero}</p>
              {docType === "devis" ? (
                <button
                  type="button"
                  onClick={basculerLangue}
                  className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-[#e4e4e4]/25 px-3 py-1 text-xs font-medium text-white transition-colors hover:border-[#e4e4e4]"
                  title="Basculer la langue du document (libellés et textes par défaut)"
                  aria-label={`Basculer la langue du document — actuellement ${form.langue === "en" ? "anglais" : "français"}`}
                  aria-pressed={form.langue === "en"}
                >
                  <Languages className="h-3.5 w-3.5" aria-hidden="true" />
                  {form.langue === "en" ? "EN" : "FR"}
                </button>
              ) : null}
            </div>
          </div>
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
              {/* VOLET 20 — [color-scheme:dark] : pictogramme calendrier
                  natif BLANC sur fond sombre. */}
              <input className={styleInputDate} type="date" value={form.date} onChange={(e) => maj("date", e.target.value)} />
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
                    supérieure, listes). VOLET 21 — `blocLibre` : le
                    conteneur n'est PAS un <label> : un label
                    transmet le clic au premier bouton de la barre
                    d'outils et volait le curseur de la zone de
                    rédaction — le clic positionne désormais le
                    curseur et la barre d'outils ne s'active plus
                    qu'en la cliquant directement. */}
                <div className="mt-3">
                  <Champ label="Description (texte riche)" indicatif="imprimée sous la désignation" blocLibre>
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

        {/* 3 — Paiement (IBAN, BIC, titulaire) —
            VOLET 21 : la carte passe AVANT « Validité & notes » (le
            formulaire suit l'ordre du document imprimé : validité et
            notes suivent désormais les coordonnées bancaires).
            VOLET 24 : le bloc s'appelle désormais « PAIEMENT » sur le
            document imprimé — la carte du formulaire suit le même nom
            (demande de l'éditeur). */}
        <Carte className="p-5 sm:p-6">
          <TitreSection note="règlement toujours à réception">Paiement</TitreSection>
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

        {/* 4 — Validité & notes (APRÈS les coordonnées bancaires,
            comme sur le document imprimé — VOLET 21) */}
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

        {/* Actions — CORRECTIF 28/11 (retour de l'éditeur) : UN SEUL
            bouton d'action. « Générer le devis » fait TOUT le travail :
            il génère le document, l'enregistre dans le dossier du
            stockage (GitHub), envoie une copie par email et l'ajoute à
            l'espace admin. Le bouton « Enregistrer seulement » est
            SUPPRIMÉ ; reste aussi « Charger l'exemple-modèle ». */}
        <div className="flex flex-wrap items-center gap-3">
          <BoutonAction
            variant="principal"
            onClick={() => void genererDocument()}
            disabled={generation}
          >
            {generation ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Génération…
              </>
            ) : (
              <>
                <FileCheck2 className="h-4 w-4" aria-hidden="true" />
                {docType === "devis" ? "Générer le devis" : `Générer la ${libelle.toLowerCase()}`}
              </>
            )}
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
          « Générer le devis » fait tout le travail : il génère le document, l&apos;enregistre
          dans le dossier du stockage, vous en envoie une copie par email et l&apos;ajoute à
          votre espace admin — le téléchargement se fait depuis la liste (bouton dédié,
          avec choix de la version pour les devis).
        </p>
      </div>

      {/* ---------------- Aperçu ---------------- */}
      <div className="xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)]">
        <ApercuDocument document={pourApercu} />
      </div>
    </div>
  );
}
