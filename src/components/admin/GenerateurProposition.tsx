"use client";

import React, { useMemo, useState } from "react";
import { FileCheck2, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { ApercuDocument } from "./ApercuDocument";
import type { FonctionToast } from "./GenerateurDocument";
import { BoutonAction, Carte, Champ, Pastille, TitreSection, styleInput, styleInputDate } from "./elements";
import { DEVISES } from "@/lib/documents/types";
import {
  propositionV2ParDefaut,
  type BlocPerimetre,
  type EcheancePaiement,
  type PropositionRecord,
} from "@/lib/documents/proposition";
import { buildNumero, fmtMontantSimple } from "@/lib/documents/format";
/* VOLET 24 — BUDGETS DE CARACTÈRES (demande de l'éditeur : « il faut
 * calculer le nombre de caractères que chaque espace réservé du
 * gabarit supporte et le MENTIONNER au niveau des champs, pour que
 * le contenu ne dépasse jamais — même quantité de texte que le
 * modèle, même nombre de pages, sections à leur place ») : chaque
 * champ affiche son maximum et la saisie s'y arrête. */
import {
  BUDGETS_PROPOSITION,
  bornerLignes,
  bornerPresentation,
  lignesEstimeesPresentation,
  sommeLignes,
} from "@/lib/documents/budgets-proposition";

/**
 * GÉNÉRATEUR DE PROPOSITION COMMERCIALE — VOLET 16 (25/11/2026).
 *
 * Template personnel de l'éditeur (PDF fourni en exemple) : le
 * formulaire suit EXACTEMENT la structure du document — un champ
 * (ou une liste) par niveau : titre, votre projet, prestataire,
 * montant, délai estimé, puis les huit sections numérotées
 * (présentation, objectifs, périmètre A/B/C…, investissement,
 * calendrier, modalités de paiement, validation, conclusion) et la
 * signature. L'aperçu à droite reproduit le rendu final, paginé.
 *
 * Le composant sait aussi MODIFIER une proposition existante
 * (prop `initial`) — formulaire pré-rempli, numéro conservé.
 */

type Formulaire = Omit<
  PropositionRecord,
  "id" | "numero" | "createdAt" | "updatedAt" | "docType"
>;

const LETTRES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function blocVide(): BlocPerimetre {
  return {
    id: Math.random().toString(36).slice(2, 10),
    titre: "",
    intro: "",
    lead: "",
    points: [],
    post: "",
  };
}

function echeanceVide(): EcheancePaiement {
  return {
    id: Math.random().toString(36).slice(2, 10),
    pourcentage: 50,
    libelle: "",
    description: "",
  };
}

function etatInitial(
  prochainNumero: number,
  initial: PropositionRecord | null,
): Formulaire {
  if (initial) {
    const { id: _id, numero: _n, createdAt: _c, updatedAt: _u, docType: _d, ...rest } = initial;
    return rest as unknown as Formulaire;
  }
  return {
    ...propositionV2ParDefaut(),
    numeroClient: prochainNumero,
    date: new Date().toISOString().slice(0, 10),
  };
}

export function GenerateurProposition({
  prochainNumero,
  stockageConfigure,
  onEnregistre,
  toast,
  initial = null,
  /* VOLET 23 — ANTI-DOUBLON : numéros des propositions déjà
   *  générées — générer une seconde fois le même numéro est REFUSÉ
   *  par un toast (l'édition d'une proposition existante reste
   *  libre). */
  numerosExistants = [],
  /* CORRECTIF 28/11 — session expirée : retour propre à l'écran de
   *  connexion (plus jamais un toast rouge « Non autorisé »). */
  sessionExpiree,
}: {
  prochainNumero: number;
  stockageConfigure: boolean;
  onEnregistre: () => void;
  toast: FonctionToast;
  initial?: PropositionRecord | null;
  numerosExistants?: string[];
  sessionExpiree?: () => void;
}) {
  const [form, setForm] = useState<Formulaire>(() => etatInitial(prochainNumero, initial));
  const [generation, setGeneration] = useState(false);

  const enEdition = Boolean(initial);
  const numero = initial?.numero ?? buildNumero(Number(form.numeroClient) || 1, "proposition");

  const pourApercu: PropositionRecord = useMemo(
    () => ({ ...form, docType: "proposition", numero, id: "", createdAt: "", updatedAt: "" }),
    [form, numero],
  );

  const maj = <K extends keyof Formulaire>(cle: K, valeur: Formulaire[K]) =>
    setForm((f) => ({ ...f, [cle]: valeur }));

  const majSection = <K extends keyof Formulaire["sections"]>(
    cle: K,
    valeur: Formulaire["sections"][K],
  ) => setForm((f) => ({ ...f, sections: { ...f.sections, [cle]: valeur } }));

  const majPerimetre = (id: string, patch: Partial<BlocPerimetre>) =>
    setForm((f) => ({
      ...f,
      sections: {
        ...f.sections,
        perimetre: f.sections.perimetre.map((b) => (b.id === id ? { ...b, ...patch } : b)),
      },
    }));

  const majEcheance = (id: string, patch: Partial<EcheancePaiement>) =>
    setForm((f) => ({
      ...f,
      sections: {
        ...f.sections,
        paiements: f.sections.paiements.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      },
    }));

  const sommePourcentages = form.sections.paiements.reduce(
    (s, e) => s + (Number(e.pourcentage) || 0),
    0,
  );

  /* VOLET 20 — GÉNÉRATION SANS TÉLÉCHARGEMENT AUTOMATIQUE (demande de
   * l'éditeur) : la génération ENREGISTRE la proposition (stockage
   * privé + copie email) — le téléchargement passe UNIQUEMENT par le
   * bouton dédié de la liste.
   * VOLET 23 — ANTI-DOUBLON (demande de l'éditeur : « une fois que
   * c'est enregistré, si on clique encore sur générer, ça doit
   * REFUSER par un toast et dire que le document existe déjà ») : le
   * numéro de la proposition est comparé aux numéros DÉJÀ générés
   * AVANT tout envoi. */
  async function genererProposition() {
    if (generation) return;
    if (!form.titre.trim()) {
      toast({ title: "Titre requis", description: "Renseignez le titre de la proposition.", variant: "destructive" });
      return;
    }
    if (!enEdition && numerosExistants.includes(numero)) {
      toast({
        title: "Proposition déjà générée",
        description: `La proposition ${numero} existe déjà — elle est disponible dans la liste (ouvrez-la ou modifiez-la depuis la liste).`,
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
          document: { ...form, docType: "proposition", numero, ...(initial ? { id: initial.id, createdAt: initial.createdAt } : {}) },
          enregistrer: true,
          envoyerEmail: true,
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
      /* Le PDF renvoyé est simplement consommé (copie email) — aucun
       * téléchargement automatique sur l'appareil. */
      await res.blob();
      const emailOk = res.headers.get("X-Email-Sent") === "1";
      const stockageOk = res.headers.get("X-Stockage-Ok") === "1";
      toast({
        title: `Proposition ${numero} ${enEdition ? "mise à jour" : "générée"}`,
        description: [
          stockageOk ? "Enregistrée dans le stockage et disponible dans la liste." : "Stockage non effectué (non configuré).",
          emailOk ? "Copie envoyée par email." : "Copie email non envoyée (Resend non configuré).",
          "Téléchargez-la depuis la liste (bouton dédié).",
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

  /* VOLET 23 — CHARGER LE MODÈLE PAR DÉFAUT (demande de l'éditeur :
   * « remplace le bouton “enregistrer seulement” par le bouton
   * “charger le modèle par défaut” comme sur les devis ») : le
   * gabarit personnel complet de la proposition revient dans le
   * formulaire — le numéro client et la date sont conservés, tout
   * reste modifiable. */
  function chargerModeleParDefaut() {
    setForm((f) => ({
      ...propositionV2ParDefaut(),
      numeroClient: f.numeroClient,
      date: f.date,
    }));
    toast({
      title: "Modèle par défaut chargé",
      description: "Le gabarit de votre proposition commerciale est de retour dans le formulaire — tout reste modifiable.",
    });
  }

  const zonesTexte = (v: string) => v;

  /* VOLET 24 — budgets + compteurs : « x/N car. » au niveau de chaque
   * champ (capacité de son espace réservé, calée sur le modèle par
   * défaut) ; les listes montrent aussi leurs lignes ; la
   * présentation (page 1) montre ses paragraphes ET ses lignes. */
  const B = BUDGETS_PROPOSITION;
  const compteur = (v: number, max: number) => `${v}/${max} car.`;
  const compteurListe = (lignes: string[], budget: { maxLignes: number; maxParLigne: number }) =>
    `${sommeLignes(lignes)}/${budget.maxLignes * budget.maxParLigne} car. · ${lignes.length}/${budget.maxLignes} lignes`;
  const compteurPresentation = (lignes: string[]) =>
    `${sommeLignes(lignes)}/${B.presentation.maxTotal} car. · ${lignes.length}/${B.presentation.maxLignes} paragraphes · ${lignesEstimeesPresentation(lignes)}/10 lignes`;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_470px]">
      {/* ---------------- Formulaire ---------------- */}
      <div className="space-y-6">
        {/* VOLET 24 — note des budgets : chaque champ porte son maximum. */}
        <p className="rounded-xl border border-[#e4e4e4]/10 bg-[#1c1c1c] px-4 py-3 text-xs leading-relaxed text-[#c8c8c8]/85">
          Chaque champ affiche son maximum de caractères — la capacité de son espace
          réservé dans le document, calée sur le modèle par défaut. La saisie s'arrête au
          maximum&nbsp;: la présentation reste sur la première page et le document garde la
          mise en page du modèle (même nombre de pages, sections à leur place).
        </p>
        {/* En-tête du document */}
        <Carte className="p-5 sm:p-6">
          <TitreSection note={`Numéro : ${numero}`}>En-tête du document</TitreSection>
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Titre de la proposition *" indicatif={compteur(form.titre.length, B.titre)} className="sm:col-span-2">
              <input
                className={styleInput}
                value={form.titre}
                maxLength={B.titre}
                onChange={(e) => maj("titre", e.target.value)}
                placeholder="Conception et développement de votre site web professionnel"
              />
            </Champ>
            <Champ label="Votre projet" indicatif={compteur(form.projet.length, B.projet)}>
              <input className={styleInput} value={form.projet} maxLength={B.projet} onChange={(e) => maj("projet", e.target.value)} placeholder="Site web professionnel, éditorial et évolutif" />
            </Champ>
            {/* VOLET 21 (27/11/2026) — DISPOSITION demandée par
                l'éditeur : le « Numéro client » prend la place de
                l'ancien champ « Prestataire » (à droite de « Votre
                projet »), et le « Nom complet du destinataire »
                partage SA ligne avec le « Prestataire ». */}
            <Champ label="Numéro client" indicatif={enEdition ? "conservé en édition" : "relie les documents du client"}>
              <input
                className={styleInput}
                type="number"
                min={1}
                value={form.numeroClient}
                readOnly={enEdition}
                onChange={(e) => maj("numeroClient", Number(e.target.value) || 1)}
              />
            </Champ>
            {/* VOLET 20 — DESTINATAIRE (demande de l'éditeur) : « sur la
                première page, dans le bloc où il y a le budget, mon
                nom, délai estimé… ajouter le nom complet de celui à
                qui on adresse la proposition. S'il y a un champ nom
                complet, nom d'entreprise : si c'est à une entreprise,
                on remplit le champ nom d'entreprise ; si c'est un
                professionnel, seulement le champ nom complet. Et le
                nom sera utilisé pour le devis. » */}
            <Champ
              label="Nom complet du destinataire"
              indicatif={compteur((form.destinataire?.nomComplet ?? "").length, B.destinataireNom)}
            >
              <input
                className={styleInput}
                value={form.destinataire?.nomComplet ?? ""}
                maxLength={B.destinataireNom}
                onChange={(e) => maj("destinataire", { ...form.destinataire, nomComplet: e.target.value })}
                placeholder="Ex. Aïcha Dossou"
              />
            </Champ>
            <Champ label="Prestataire" indicatif={compteur(form.prestataire.length, B.prestataire)}>
              <input className={styleInput} value={form.prestataire} maxLength={B.prestataire} onChange={(e) => maj("prestataire", e.target.value)} placeholder="Stevens AKPOVI" />
            </Champ>
            <Champ
              label="Nom d'entreprise du destinataire"
              indicatif={compteur((form.destinataire?.entreprise ?? "").length, B.destinataireEntreprise)}
              className="sm:col-span-2"
            >
              <input
                className={styleInput}
                value={form.destinataire?.entreprise ?? ""}
                maxLength={B.destinataireEntreprise}
                onChange={(e) => maj("destinataire", { ...form.destinataire, entreprise: e.target.value })}
                placeholder="Ex. Cabinet Essentiel & Stratégie (laisser vide pour un professionnel indépendant)"
              />
            </Champ>
            <Champ label="Montant total" indicatif={fmtMontantSimple(form.montant, form.devise)}>
              <input className={styleInput} type="number" min={0} step="any" value={form.montant} onChange={(e) => maj("montant", Number(e.target.value) || 0)} />
            </Champ>
            <Champ label="Devise">
              <select className={styleInput} value={form.devise} onChange={(e) => maj("devise", e.target.value)}>
                {DEVISES.map((dv) => (
                  <option key={dv.code} value={dv.code} className="bg-[#232323]">{dv.label}</option>
                ))}
              </select>
            </Champ>
            <Champ label="Délai estimé" indicatif={compteur(form.delai.length, B.delai)}>
              <input className={styleInput} value={form.delai} maxLength={B.delai} onChange={(e) => maj("delai", e.target.value)} placeholder="02 à 03 semaines" />
            </Champ>
            <Champ label="Date d'émission">
              {/* VOLET 20 — pictogramme calendrier natif BLANC
                  ([color-scheme:dark]). */}
              <input className={styleInputDate} type="date" value={form.date} onChange={(e) => maj("date", e.target.value)} />
            </Champ>
          </div>
        </Carte>

        {/* 01 Présentation */}
        <Carte className="p-5 sm:p-6">
          <TitreSection note="section 01 — première page">Présentation du projet</TitreSection>
          <Champ
            label="Paragraphes (une ligne = un paragraphe)"
            indicatif={compteurPresentation(form.sections.presentation)}
          >
            <textarea
              className={`${styleInput} min-h-[150px] resize-y`}
              value={zonesTexte(form.sections.presentation.join("\n"))}
              onChange={(e) => majSection("presentation", bornerPresentation(e.target.value.split("\n")))}
            />
          </Champ>
          {/* VOLET 24 — la présentation ne DÉPASSE JAMAIS la première
              page (budget mesuré) : 4 paragraphes, 215 car./paragraphe,
              750 au total, 10 lignes. */}
          <p className="mt-3 text-xs leading-relaxed text-[#c8c8c8]/80">
            La présentation peut remplir la première page jusqu'au pied — sans jamais la
            dépasser&nbsp;: la saisie s'arrête au maximum affiché (4 paragraphes, 750
            caractères, 10 lignes — la quantité du modèle par défaut).
          </p>
        </Carte>

        {/* 02 Objectifs */}
        <Carte className="p-5 sm:p-6">
          <TitreSection note="section 02">Objectifs</TitreSection>
          <div className="space-y-4">
            <Champ label="Phrase d'introduction" indicatif={compteur(form.sections.objectifsIntro.length, B.objectifsIntro)}>
              <input className={styleInput} value={form.sections.objectifsIntro} maxLength={B.objectifsIntro} onChange={(e) => majSection("objectifsIntro", e.target.value)} placeholder="Votre site aura pour objectifs de :" />
            </Champ>
            <Champ label="Objectifs (une ligne = un objectif, numérotés 01, 02…)" indicatif={compteurListe(form.sections.objectifs, B.objectifs)}>
              <textarea
                className={`${styleInput} min-h-[130px] resize-y`}
                value={zonesTexte(form.sections.objectifs.join("\n"))}
                onChange={(e) => majSection("objectifs", bornerLignes(e.target.value.split("\n"), B.objectifs))}
              />
            </Champ>
          </div>
        </Carte>

        {/* 03 Périmètre */}
        <Carte className="p-5 sm:p-6">
          <TitreSection note="section 03 — lettres automatiques A, B, C…">Périmètre de la prestation</TitreSection>
          <div className="space-y-4">
            {form.sections.perimetre.map((bloc, i) => (
              <div key={bloc.id} className="rounded-xl border border-[#e4e4e4]/10 bg-[#1c1c1c] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="flex h-8 w-8 items-center justify-center bg-[#e4e4e4] text-sm font-semibold text-[#1c1c1c]" aria-hidden="true">
                    {LETTRES[i % 26]}
                  </span>
                  <span className="text-xs font-semibold tracking-wider text-[#c8c8c8] uppercase">Bloc {LETTRES[i % 26]}</span>
                  <button
                    type="button"
                    onClick={() => majSection("perimetre", form.sections.perimetre.filter((b) => b.id !== bloc.id))}
                    className="ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-[#ea384c]/30 text-[#ffdede] transition-colors hover:border-[#ea384c]"
                    aria-label={`Supprimer le bloc ${LETTRES[i % 26]}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3">
                  <Champ label="Titre du bloc" indicatif={compteur(bloc.titre.length, B.perimetre.titre)}>
                    <input className={styleInput} value={bloc.titre} maxLength={B.perimetre.titre} onChange={(e) => majPerimetre(bloc.id, { titre: e.target.value })} placeholder="Conception et développement sur mesure" />
                  </Champ>
                  <Champ label="Paragraphe d'introduction" indicatif={compteur(bloc.intro.length, B.perimetre.intro)}>
                    <textarea className={`${styleInput} min-h-[64px] resize-y`} value={bloc.intro} maxLength={B.perimetre.intro} onChange={(e) => majPerimetre(bloc.id, { intro: e.target.value })} placeholder="Création d'un site web professionnel adapté à votre activité…" />
                  </Champ>
                  <Champ label="Phrase d'appel (avant la liste)" indicatif={compteur(bloc.lead.length, B.perimetre.lead)}>
                    <input className={styleInput} value={bloc.lead} maxLength={B.perimetre.lead} onChange={(e) => majPerimetre(bloc.id, { lead: e.target.value })} placeholder="La prestation comprend :" />
                  </Champ>
                  <Champ label="Points (une ligne = un tiret « – »)" indicatif={compteurListe(bloc.points, B.perimetre.points)}>
                    <textarea className={`${styleInput} min-h-[96px] resize-y`} value={bloc.points.join("\n")} onChange={(e) => majPerimetre(bloc.id, { points: bornerLignes(e.target.value.split("\n"), B.perimetre.points) })} placeholder={"La conception et le développement sur mesure.\nL'intégration du design validé."} />
                  </Champ>
                  <Champ label="Paragraphe de clôture (optionnel)" indicatif={compteur(bloc.post.length, B.perimetre.post)}>
                    <input className={styleInput} value={bloc.post} maxLength={B.perimetre.post} onChange={(e) => majPerimetre(bloc.id, { post: e.target.value })} placeholder="Les contenus seront soumis à votre validation…" />
                  </Champ>
                </div>
              </div>
            ))}
            <BoutonAction
              onClick={() => majSection("perimetre", [...form.sections.perimetre, blocVide()])}
              disabled={form.sections.perimetre.length >= B.perimetre.maxBlocs}
              titre={
                form.sections.perimetre.length >= B.perimetre.maxBlocs
                  ? `Maximum atteint — ${B.perimetre.maxBlocs} blocs (la quantité du modèle, pour que le document garde son nombre de pages)`
                  : undefined
              }
              className="w-full"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Ajouter un bloc{form.sections.perimetre.length >= B.perimetre.maxBlocs ? ` (max. ${B.perimetre.maxBlocs})` : ""}
            </BoutonAction>
          </div>
        </Carte>

        {/* 04 Investissement */}
        <Carte className="p-5 sm:p-6">
          <TitreSection note={`section 04 — montant : ${fmtMontantSimple(form.montant, form.devise)}`}>Investissement</TitreSection>
          <div className="space-y-4">
            <Champ label="Texte d'accompagnement (à droite du montant)" indicatif={compteur(form.sections.investissementTexte.length, B.investissementTexte)}>
              <textarea className={`${styleInput} min-h-[64px] resize-y`} value={form.sections.investissementTexte} maxLength={B.investissementTexte} onChange={(e) => majSection("investissementTexte", e.target.value)} />
            </Champ>
            <Champ label="Mentions en petits caractères (une ligne = une mention)" indicatif={compteurListe(form.sections.investissementNotes, B.investissementNotes)}>
              <textarea className={`${styleInput} min-h-[76px] resize-y`} value={form.sections.investissementNotes.join("\n")} onChange={(e) => majSection("investissementNotes", bornerLignes(e.target.value.split("\n"), B.investissementNotes))} />
            </Champ>
          </div>
        </Carte>

        {/* 05 Calendrier */}
        <Carte className="p-5 sm:p-6">
          <TitreSection note={`section 05 — délai : ${form.delai || "—"}`}>Calendrier de réalisation</TitreSection>
          <div className="space-y-4">
            <Champ label="Paragraphe d'introduction" indicatif={compteur(form.sections.calendrierIntro.length, B.calendrierIntro)}>
              <textarea className={`${styleInput} min-h-[64px] resize-y`} value={form.sections.calendrierIntro} maxLength={B.calendrierIntro} onChange={(e) => majSection("calendrierIntro", e.target.value)} />
            </Champ>
            <Champ label="Phrase d'appel des étapes" indicatif={compteur(form.sections.calendrierEtapesIntro.length, B.calendrierEtapesIntro)}>
              <input className={styleInput} value={form.sections.calendrierEtapesIntro} maxLength={B.calendrierEtapesIntro} onChange={(e) => majSection("calendrierEtapesIntro", e.target.value)} placeholder="Les principales étapes seront :" />
            </Champ>
            <Champ label="Étapes (une ligne = une étape, numérotées 1, 2, 3…)" indicatif={compteurListe(form.sections.calendrierEtapes, B.calendrierEtapes)}>
              <textarea className={`${styleInput} min-h-[120px] resize-y`} value={form.sections.calendrierEtapes.join("\n")} onChange={(e) => majSection("calendrierEtapes", bornerLignes(e.target.value.split("\n"), B.calendrierEtapes))} />
            </Champ>
            <Champ label="Mention en petits caractères (optionnelle)" indicatif={compteur(form.sections.calendrierNote.length, B.calendrierNote)}>
              <input className={styleInput} value={form.sections.calendrierNote} maxLength={B.calendrierNote} onChange={(e) => majSection("calendrierNote", e.target.value)} />
            </Champ>
          </div>
        </Carte>

        {/* 06 Modalités de paiement */}
        <Carte className="p-5 sm:p-6">
          <TitreSection note={sommePourcentages === 100 ? "section 06 — répartition complète" : `section 06 — total ${sommePourcentages} % (visé : 100 %)`}>
            Modalités de paiement
          </TitreSection>
          <div className="space-y-4">
            <Champ label="Phrase d'introduction" indicatif={compteur(form.sections.paiementsIntro.length, B.paiementsIntro)}>
              <input className={styleInput} value={form.sections.paiementsIntro} maxLength={B.paiementsIntro} onChange={(e) => majSection("paiementsIntro", e.target.value)} placeholder="Le règlement sera effectué en deux étapes :" />
            </Champ>
            {form.sections.paiements.map((e) => (
              <div key={e.id} className="rounded-xl border border-[#e4e4e4]/10 bg-[#1c1c1c] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold tracking-wider text-[#c8c8c8] uppercase">
                    Échéance — {fmtMontantSimple((form.montant * (Number(e.pourcentage) || 0)) / 100, form.devise)}
                  </span>
                  <button
                    type="button"
                    onClick={() => majSection("paiements", form.sections.paiements.filter((x) => x.id !== e.id))}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ea384c]/30 text-[#ffdede] transition-colors hover:border-[#ea384c]"
                    aria-label="Supprimer l'échéance"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-[110px_minmax(0,1fr)]">
                    <Champ label="Pourcentage (%)">
                      <input className={styleInput} type="number" min={0} max={100} value={e.pourcentage} onChange={(ev) => majEcheance(e.id, { pourcentage: Number(ev.target.value) || 0 })} />
                    </Champ>
                    <Champ label="Libellé" indicatif={compteur(e.libelle.length, B.echeance.libelle)}>
                      <input className={styleInput} value={e.libelle} maxLength={B.echeance.libelle} onChange={(ev) => majEcheance(e.id, { libelle: ev.target.value })} placeholder="Avant le démarrage du projet" />
                    </Champ>
                  </div>
                  <Champ label="Description" indicatif={compteur(e.description.length, B.echeance.description)}>
                    <textarea className={`${styleInput} min-h-[64px] resize-y`} value={e.description} maxLength={B.echeance.description} onChange={(ev) => majEcheance(e.id, { description: ev.target.value })} />
                  </Champ>
                </div>
              </div>
            ))}
            <BoutonAction
              onClick={() => majSection("paiements", [...form.sections.paiements, echeanceVide()])}
              disabled={form.sections.paiements.length >= B.echeance.max}
              titre={
                form.sections.paiements.length >= B.echeance.max
                  ? `Maximum atteint — ${B.echeance.max} échéances (le gabarit les dispose par rangées de 2 ou 3)`
                  : undefined
              }
              className="w-full"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Ajouter une échéance{form.sections.paiements.length >= B.echeance.max ? ` (max. ${B.echeance.max})` : ""}
            </BoutonAction>
            <p className="text-xs leading-relaxed text-[#c8c8c8]/80">
              Conseil&nbsp;: structurez le règlement en échéances cohérentes avec
              l&apos;avancement du projet (ex.&nbsp;: 50&nbsp;% au démarrage, 50&nbsp;% à la
              livraison) — la somme des pourcentages doit totaliser 100&nbsp;%.
            </p>
          </div>
        </Carte>

        {/* 07 Validation */}
        <Carte className="p-5 sm:p-6">
          <TitreSection note="section 07">Validation et démarrage</TitreSection>
          <Champ label="Paragraphes (une ligne = un paragraphe)" indicatif={compteurListe(form.sections.validation, B.validation)}>
            <textarea className={`${styleInput} min-h-[120px] resize-y`} value={zonesTexte(form.sections.validation.join("\n"))} onChange={(e) => majSection("validation", bornerLignes(e.target.value.split("\n"), B.validation))} />
          </Champ>
        </Carte>

        {/* 08 Conclusion */}
        <Carte className="p-5 sm:p-6">
          <TitreSection note="section 08">Conclusion</TitreSection>
          <Champ label="Paragraphes (une ligne = un paragraphe)" indicatif={compteurListe(form.sections.conclusion, B.conclusion)}>
            <textarea className={`${styleInput} min-h-[140px] resize-y`} value={zonesTexte(form.sections.conclusion.join("\n"))} onChange={(e) => majSection("conclusion", bornerLignes(e.target.value.split("\n"), B.conclusion))} />
          </Champ>
        </Carte>

        {/* Signature */}
        <Carte className="p-5 sm:p-6">
          <TitreSection note="fin de la conclusion">Signature</TitreSection>
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Nom" indicatif={compteur(form.signature.nom.length, B.signature.nom)}>
              <input className={styleInput} value={form.signature.nom} maxLength={B.signature.nom} onChange={(e) => maj("signature", { ...form.signature, nom: e.target.value })} />
            </Champ>
            <Champ label="Titrage" indicatif={compteur(form.signature.titre.length, B.signature.titre)}>
              <input className={styleInput} value={form.signature.titre} maxLength={B.signature.titre} onChange={(e) => maj("signature", { ...form.signature, titre: e.target.value })} placeholder="Conception et développement web" />
            </Champ>
            <Champ label="Site web (affiché et cliquable)" indicatif={compteur(form.signature.site.length, B.signature.site)} className="sm:col-span-2">
              <input className={styleInput} value={form.signature.site} maxLength={B.signature.site} onChange={(e) => maj("signature", { ...form.signature, site: e.target.value })} placeholder="stevensakpovi.vercel.app" />
            </Champ>
          </div>
        </Carte>

        {/* Actions — VOLET 20 : génération = enregistrement + copie
            email, SANS téléchargement automatique (le téléchargement
            vit dans la liste, bouton dédié). */}
        <div className="flex flex-wrap items-center gap-3">
          <BoutonAction variant="principal" onClick={() => void genererProposition()} disabled={generation}>
            {generation ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Génération…
              </>
            ) : (
              <>
                <FileCheck2 className="h-4 w-4" aria-hidden="true" />
                Générer la proposition
              </>
            )}
          </BoutonAction>
          <BoutonAction onClick={chargerModeleParDefaut}>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Charger le modèle par défaut
          </BoutonAction>
          <Pastille ton={stockageConfigure ? "valide" : "alerte"}>
            {stockageConfigure ? "Stockage actif" : "Stockage non configuré"}
          </Pastille>
        </div>
        <p className="text-xs leading-relaxed text-[#c8c8c8]/80">
          « Générer la proposition » l&apos;enregistre dans votre back-office et vous en
          envoie une copie par email — le téléchargement se fait depuis la liste
          (bouton dédié).
        </p>
      </div>

      {/* ---------------- Aperçu ---------------- */}
      <div className="xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)]">
        <ApercuDocument document={pourApercu} />
      </div>
    </div>
  );
}
