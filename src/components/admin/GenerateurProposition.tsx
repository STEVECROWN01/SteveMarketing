"use client";

import React, { useMemo, useState } from "react";
import { Download, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { ApercuDocument } from "./ApercuDocument";
import type { FonctionToast } from "./GenerateurDocument";
import { BoutonAction, Carte, Champ, Pastille, TitreSection, styleInput } from "./elements";
import { DEVISES } from "@/lib/documents/types";
import {
  propositionV2ParDefaut,
  type BlocPerimetre,
  type EcheancePaiement,
  type PropositionRecord,
} from "@/lib/documents/proposition";
import { buildNumero, fmtMontantSimple } from "@/lib/documents/format";

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
}: {
  prochainNumero: number;
  stockageConfigure: boolean;
  onEnregistre: () => void;
  toast: FonctionToast;
  initial?: PropositionRecord | null;
}) {
  const [form, setForm] = useState<Formulaire>(() => etatInitial(prochainNumero, initial));
  const [generation, setGeneration] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);

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

  async function genererPdf() {
    if (generation) return;
    if (!form.titre.trim()) {
      toast({ title: "Titre requis", description: "Renseignez le titre de la proposition.", variant: "destructive" });
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
        title: `Proposition ${numero} ${enEdition ? "mise à jour" : "générée"}`,
        description: [
          "Téléchargement lancé.",
          stockageOk ? "Enregistrée dans le stockage." : "Stockage non effectué (non configuré).",
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
          document: { ...form, docType: "proposition", numero, ...(initial ? { id: initial.id, createdAt: initial.createdAt } : {}) },
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? "Enregistrement impossible.");
      }
      toast({
        title: `${enEdition ? "Mise à jour" : "Enregistrée"} : ${numero}`,
        description: "La proposition est disponible dans la liste.",
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

  const zonesTexte = (v: string) => v;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_470px]">
      {/* ---------------- Formulaire ---------------- */}
      <div className="space-y-6">
        {/* En-tête du document */}
        <Carte className="p-5 sm:p-6">
          <TitreSection note={`Numéro : ${numero}`}>En-tête du document</TitreSection>
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Titre de la proposition *" indicatif="sous « Proposition commerciale »" className="sm:col-span-2">
              <input
                className={styleInput}
                value={form.titre}
                onChange={(e) => maj("titre", e.target.value)}
                placeholder="Conception et développement de votre site web professionnel"
              />
            </Champ>
            <Champ label="Votre projet">
              <input className={styleInput} value={form.projet} onChange={(e) => maj("projet", e.target.value)} placeholder="Site web professionnel, éditorial et évolutif" />
            </Champ>
            <Champ label="Prestataire">
              <input className={styleInput} value={form.prestataire} onChange={(e) => maj("prestataire", e.target.value)} placeholder="Stevens AKPOVI" />
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
            <Champ label="Délai estimé">
              <input className={styleInput} value={form.delai} onChange={(e) => maj("delai", e.target.value)} placeholder="02 à 03 semaines" />
            </Champ>
            <Champ label="Date d'émission">
              <input className={styleInput} type="date" value={form.date} onChange={(e) => maj("date", e.target.value)} />
            </Champ>
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
          </div>
        </Carte>

        {/* 01 Présentation */}
        <Carte className="p-5 sm:p-6">
          <TitreSection note="section 01">Présentation du projet</TitreSection>
          <Champ label="Paragraphes (une ligne = un paragraphe)">
            <textarea
              className={`${styleInput} min-h-[150px] resize-y`}
              value={zonesTexte(form.sections.presentation.join("\n"))}
              onChange={(e) => majSection("presentation", e.target.value.split("\n"))}
            />
          </Champ>
        </Carte>

        {/* 02 Objectifs */}
        <Carte className="p-5 sm:p-6">
          <TitreSection note="section 02">Objectifs</TitreSection>
          <div className="space-y-4">
            <Champ label="Phrase d'introduction">
              <input className={styleInput} value={form.sections.objectifsIntro} onChange={(e) => majSection("objectifsIntro", e.target.value)} placeholder="Votre site aura pour objectifs de :" />
            </Champ>
            <Champ label="Objectifs (une ligne = un objectif, numérotés 01, 02…)">
              <textarea
                className={`${styleInput} min-h-[130px] resize-y`}
                value={zonesTexte(form.sections.objectifs.join("\n"))}
                onChange={(e) => majSection("objectifs", e.target.value.split("\n"))}
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
                  <Champ label="Titre du bloc">
                    <input className={styleInput} value={bloc.titre} onChange={(e) => majPerimetre(bloc.id, { titre: e.target.value })} placeholder="Conception et développement sur mesure" />
                  </Champ>
                  <Champ label="Paragraphe d'introduction">
                    <textarea className={`${styleInput} min-h-[64px] resize-y`} value={bloc.intro} onChange={(e) => majPerimetre(bloc.id, { intro: e.target.value })} placeholder="Création d'un site web professionnel adapté à votre activité…" />
                  </Champ>
                  <Champ label="Phrase d'appel (avant la liste)">
                    <input className={styleInput} value={bloc.lead} onChange={(e) => majPerimetre(bloc.id, { lead: e.target.value })} placeholder="La prestation comprend :" />
                  </Champ>
                  <Champ label="Points (une ligne = un tiret « – »)">
                    <textarea className={`${styleInput} min-h-[96px] resize-y`} value={bloc.points.join("\n")} onChange={(e) => majPerimetre(bloc.id, { points: e.target.value.split("\n") })} placeholder={"La conception et le développement sur mesure.\nL'intégration du design validé."} />
                  </Champ>
                  <Champ label="Paragraphe de clôture (optionnel)">
                    <input className={styleInput} value={bloc.post} onChange={(e) => majPerimetre(bloc.id, { post: e.target.value })} placeholder="Les contenus seront soumis à votre validation…" />
                  </Champ>
                </div>
              </div>
            ))}
            <BoutonAction
              onClick={() => majSection("perimetre", [...form.sections.perimetre, blocVide()])}
              className="w-full"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Ajouter un bloc
            </BoutonAction>
          </div>
        </Carte>

        {/* 04 Investissement */}
        <Carte className="p-5 sm:p-6">
          <TitreSection note={`section 04 — montant : ${fmtMontantSimple(form.montant, form.devise)}`}>Investissement</TitreSection>
          <div className="space-y-4">
            <Champ label="Texte d'accompagnement (à droite du montant)">
              <textarea className={`${styleInput} min-h-[64px] resize-y`} value={form.sections.investissementTexte} onChange={(e) => majSection("investissementTexte", e.target.value)} />
            </Champ>
            <Champ label="Mentions en petits caractères (une ligne = une mention)">
              <textarea className={`${styleInput} min-h-[76px] resize-y`} value={form.sections.investissementNotes.join("\n")} onChange={(e) => majSection("investissementNotes", e.target.value.split("\n"))} />
            </Champ>
          </div>
        </Carte>

        {/* 05 Calendrier */}
        <Carte className="p-5 sm:p-6">
          <TitreSection note={`section 05 — délai : ${form.delai || "—"}`}>Calendrier de réalisation</TitreSection>
          <div className="space-y-4">
            <Champ label="Paragraphe d'introduction">
              <textarea className={`${styleInput} min-h-[64px] resize-y`} value={form.sections.calendrierIntro} onChange={(e) => majSection("calendrierIntro", e.target.value)} />
            </Champ>
            <Champ label="Phrase d'appel des étapes">
              <input className={styleInput} value={form.sections.calendrierEtapesIntro} onChange={(e) => majSection("calendrierEtapesIntro", e.target.value)} placeholder="Les principales étapes seront :" />
            </Champ>
            <Champ label="Étapes (une ligne = une étape, numérotées 1, 2, 3…)">
              <textarea className={`${styleInput} min-h-[120px] resize-y`} value={form.sections.calendrierEtapes.join("\n")} onChange={(e) => majSection("calendrierEtapes", e.target.value.split("\n"))} />
            </Champ>
            <Champ label="Mention en petits caractères (optionnelle)">
              <input className={styleInput} value={form.sections.calendrierNote} onChange={(e) => majSection("calendrierNote", e.target.value)} />
            </Champ>
          </div>
        </Carte>

        {/* 06 Modalités de paiement */}
        <Carte className="p-5 sm:p-6">
          <TitreSection note={sommePourcentages === 100 ? "section 06 — répartition complète" : `section 06 — total ${sommePourcentages} % (visé : 100 %)`}>
            Modalités de paiement
          </TitreSection>
          <div className="space-y-4">
            <Champ label="Phrase d'introduction">
              <input className={styleInput} value={form.sections.paiementsIntro} onChange={(e) => majSection("paiementsIntro", e.target.value)} placeholder="Le règlement sera effectué en deux étapes :" />
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
                    <Champ label="Libellé">
                      <input className={styleInput} value={e.libelle} onChange={(ev) => majEcheance(e.id, { libelle: ev.target.value })} placeholder="Avant le démarrage du projet" />
                    </Champ>
                  </div>
                  <Champ label="Description">
                    <textarea className={`${styleInput} min-h-[64px] resize-y`} value={e.description} onChange={(ev) => majEcheance(e.id, { description: ev.target.value })} />
                  </Champ>
                </div>
              </div>
            ))}
            <BoutonAction
              onClick={() => majSection("paiements", [...form.sections.paiements, echeanceVide()])}
              className="w-full"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Ajouter une échéance
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
          <Champ label="Paragraphes (une ligne = un paragraphe)">
            <textarea className={`${styleInput} min-h-[120px] resize-y`} value={zonesTexte(form.sections.validation.join("\n"))} onChange={(e) => majSection("validation", e.target.value.split("\n"))} />
          </Champ>
        </Carte>

        {/* 08 Conclusion */}
        <Carte className="p-5 sm:p-6">
          <TitreSection note="section 08">Conclusion</TitreSection>
          <Champ label="Paragraphes (une ligne = un paragraphe)">
            <textarea className={`${styleInput} min-h-[140px] resize-y`} value={zonesTexte(form.sections.conclusion.join("\n"))} onChange={(e) => majSection("conclusion", e.target.value.split("\n"))} />
          </Champ>
        </Carte>

        {/* Signature */}
        <Carte className="p-5 sm:p-6">
          <TitreSection note="fin de la conclusion">Signature</TitreSection>
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Nom">
              <input className={styleInput} value={form.signature.nom} onChange={(e) => maj("signature", { ...form.signature, nom: e.target.value })} />
            </Champ>
            <Champ label="Titrage">
              <input className={styleInput} value={form.signature.titre} onChange={(e) => maj("signature", { ...form.signature, titre: e.target.value })} placeholder="Conception et développement web" />
            </Champ>
            <Champ label="Site web (affiché et cliquable)" className="sm:col-span-2">
              <input className={styleInput} value={form.signature.site} onChange={(e) => maj("signature", { ...form.signature, site: e.target.value })} placeholder="stevensakpovi.vercel.app" />
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
          <Pastille ton={stockageConfigure ? "valide" : "alerte"}>
            {stockageConfigure ? "Stockage actif" : "Stockage non configuré"}
          </Pastille>
        </div>
        <p className="text-xs leading-relaxed text-[#c8c8c8]/80">
          « Générer le PDF » télécharge la proposition, l&apos;enregistre dans votre
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
