"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Download,
  Eye,
  FilePlus2,
  FileSignature,
  Loader2,
  Pencil,
  Receipt,
  Trash2,
  X,
} from "lucide-react";
import { ApercuDocument } from "./ApercuDocument";
import { BoutonAction, Carte, ModaleConfirmation, Pastille } from "./elements";
import type { DocumentRecord, DocType } from "@/lib/documents/types";
import { LABELS_DOC } from "@/lib/documents/types";
import { estPropositionV2, type PropositionRecord } from "@/lib/documents/proposition";
import type { ToutDocument } from "@/lib/documents/github";
import { formatDate, formatCurrency, totalDocument, fmtMontantSimple } from "@/lib/documents/format";

/**
 * LISTE DES DOCUMENTS D'UN TYPE (VOLET 15 → 20) — chaque rubrique du
 * back-office (Propositions commerciales, Devis, Factures) présente
 * SES documents, TOUS visibles d'un coup comme la rubrique Demandes,
 * dans l'ORDRE DE CRÉATION. Le bouton « Créer… » de la rubrique vit
 * dans AdminPage ; chaque ligne porte ses icônes d'action :
 *
 *  - œil : aperçu plein écran — VOLET 20 : le PANNEAU d'aperçu
 *    s'ouvre DIRECTEMENT en plein écran (plus de modale
 *    intermédiaire affichant le nom du client), avec zoom (loupe
 *    − / % / +) à gauche du bouton plein écran ;
 *  - téléchargement : PDF à la demande — VOLET 20 : une facture EN
 *    ATTENTE ne peut PAS être téléchargée (bouton indisponible,
 *    demande de l'éditeur : « je pourrai télécharger la facture
 *    payée. Donc une facture en attente ne peut pas être
 *    téléchargée ») ;
 *  - crayon : modification (générateur pour devis/proposition,
 *    espace de facturation pour facture) ;
 *  - reçue (devis) : génération de la facture correspondante ;
 *  - stylo (devis) : MARQUER SIGNÉ — téléversement du devis signé
 *    (PDF) qui range le devis dans la partie des devis SIGNÉS ;
 *  - corbeille : suppression du stockage — VOLET 20 : modale de
 *    confirmation PERSONNALISÉE (plus de window.confirm), avec
 *    AVERTISSEMENT : supprimer un devis supprime automatiquement
 *    sa facture correspondante.
 *
 * VOLET 20 — FILTRES (demande de l'éditeur) : la rubrique Devis
 * filtre par devis SIGNÉS / NON SIGNÉS (un devis non signé dont la
 * date de validité est dépassée est automatiquement classé parmi
 * les non signés) ; la rubrique Factures filtre par statut PAYÉE /
 * EN ATTENTE.
 *
 * VOLET 20 — PROPOSITIONS : bouton « générer le devis » (icône
 * document +) sur chaque proposition — le formulaire de création
 * de devis s'ouvre pré-rempli depuis la proposition.
 */

/** Statut de signature d'un devis : signé (PDF téléversé) ou non —
 *  un devis non signé dont la validité est dépassée est EXPIRÉ
 *  (automatiquement classé parmi les non signés). */
function statutSignature(d: DocumentRecord): { signe: boolean; expire: boolean } {
  if (d.devisSigne) return { signe: true, expire: false };
  const validite = Number(d.validiteJours) || 15;
  const emission = new Date(`${d.date}T00:00:00`);
  const fin = new Date(emission);
  fin.setDate(fin.getDate() + validite);
  return { signe: false, expire: fin.getTime() < Date.now() };
}

export function ListeDocuments({
  docType,
  documents,
  chargement,
  stockageConfigure,
  onRafraichir,
  toast,
  onModifier,
  onFacturer,
  /** VOLET 20 — devis marqué signé : redirection automatique vers la
   *  génération de facture de ce devis. */
  onSigne,
  /** VOLET 20 — générer un devis depuis cette proposition. */
  onGenererDevis,
}: {
  docType: DocType;
  documents: ToutDocument[];
  chargement: boolean;
  stockageConfigure: boolean;
  onRafraichir: () => void;
  toast: (t: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
  onModifier: (d: ToutDocument) => void;
  onFacturer?: (d: DocumentRecord) => void;
  onSigne?: (d: DocumentRecord) => void;
  onGenererDevis?: (p: PropositionRecord) => void;
}) {
  const [apercu, setApercu] = useState<ToutDocument | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null);
  /* VOLET 18 — document (devis/facture) dont l'utilisateur choisit
   * la version du PDF à télécharger. */
  const [choixLangue, setChoixLangue] = useState<DocumentRecord | null>(null);
  /* VOLET 20 — filtres : devis signés/non signés, factures payées/en
   * attente (demande de l'éditeur). */
  const [filtre, setFiltre] = useState<"tous" | "signes" | "non-signes" | "payees" | "attente">("tous");
  /* VOLET 20 — modales personnalisées : suppression (avec
   * avertissement de cascade devis → facture) et signature. */
  const [suppression, setSuppression] = useState<ToutDocument | null>(null);
  const [signature, setSignature] = useState<DocumentRecord | null>(null);
  const [fichierSignature, setFichierSignature] = useState<File | null>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  /* ORDRE DE CRÉATION : du premier au dernier document créé. */
  const visibles = useMemo(
    () =>
      documents
        .filter((d) => d.docType === docType)
        .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || "")),
    [documents, docType],
  );

  /* VOLET 20 — application du FILTRE de la rubrique. */
  const filtres = useMemo(() => {
    if (docType === "devis") {
      return visibles.filter((d) => {
        const st = statutSignature(d as DocumentRecord);
        if (filtre === "signes") return st.signe;
        if (filtre === "non-signes") return !st.signe;
        return true;
      });
    }
    if (docType === "facture") {
      return visibles.filter((d) => {
        const paye = (d as DocumentRecord).statutPaiement === "Payé";
        if (filtre === "payees") return paye;
        if (filtre === "attente") return !paye;
        return true;
      });
    }
    return visibles;
  }, [visibles, docType, filtre]);

  const factureExistante = (numeroDevis: string) =>
    documents.find((f) => f.docType === "facture" && f.devisSource === numeroDevis);

  async function telecharger(record: ToutDocument, avecEnregistrement = false) {
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

  async function telechargerExistant(record: ToutDocument, langue?: "fr" | "en") {
    try {
      await telecharger(langue ? ({ ...record, langue } as ToutDocument) : record, false);
      toast({
        title: `${record.numero} téléchargé`,
        ...(langue
          ? { description: langue === "en" ? "Version anglaise du PDF." : "Version française du PDF." }
          : {}),
      });
    } catch (e) {
      toast({ title: "Téléchargement impossible", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    }
  }

  /* VOLET 18 — choix du menu → téléchargement dans la version
   * choisie (le menu se ferme immédiatement). */
  function lancerTelechargement(langue: "fr" | "en") {
    const record = choixLangue;
    setChoixLangue(null);
    if (record) void telechargerExistant(record, langue);
  }

  /* VOLET 20 — téléchargement du devis SIGNÉ (PDF téléversé). */
  async function telechargerSigne(record: DocumentRecord) {
    const cle = `${record.numero}-signe`;
    setEnCours(cle);
    try {
      const res = await fetch(`/api/documents/${encodeURIComponent(record.id)}/signature`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Téléchargement impossible.");
      }
      const blob = await res.blob();
      const nom = record.devisSigne?.nomFichier?.replace(/[^\w.\-]+/g, "_") ?? `${record.numero}-signe.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nom;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: `Devis signé téléchargé`, description: `${record.numero} — ${record.devisSigne?.nomFichier ?? ""}` });
    } catch (e) {
      toast({ title: "Téléchargement impossible", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    } finally {
      setEnCours(null);
    }
  }

  /* VOLET 20 — SUPPRESSION : modale de confirmation PERSONNALISÉE
   * (plus de window.confirm). Pour un devis : la modale AVERTIT que
   * sa facture correspondante sera supprimée automatiquement. */
  async function confirmerSuppression() {
    const record = suppression;
    if (!record) return;
    setEnCours(`${record.numero}-suppr`);
    try {
      const res = await fetch(`/api/documents/${encodeURIComponent(record.id)}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Suppression impossible.");
      toast({
        title: `${record.numero} supprimé`,
        ...(data.factureSupprimee
          ? { description: `La facture liée ${data.factureSupprimee} a été supprimée automatiquement.` }
          : {}),
      });
      onRafraichir();
    } catch (e) {
      toast({ title: "Suppression impossible", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    } finally {
      setEnCours(null);
      setSuppression(null);
    }
  }

  /* VOLET 20 — SIGNATURE : téléversement du devis signé (PDF) → le
   * devis est marqué signé, rangé dans la partie des devis signés,
   * et l'éditeur est redirigé vers la GÉNÉRATION DE FACTURE. */
  async function confirmerSignature() {
    const record = signature;
    if (!record) return;
    if (!fichierSignature) {
      toast({
        title: "PDF signé requis",
        description: "Choisissez le fichier PDF du devis signé.",
        variant: "destructive",
      });
      return;
    }
    if (fichierSignature.type && fichierSignature.type !== "application/pdf") {
      toast({
        title: "PDF attendu",
        description: "Le devis signé doit être un fichier PDF.",
        variant: "destructive",
      });
      return;
    }
    const cle = `${record.numero}-signature`;
    setEnCours(cle);
    try {
      const data = await new Promise<string>((resoudre, rejeter) => {
        const lecteur = new FileReader();
        lecteur.onload = () => {
          const contenu = String(lecteur.result ?? "");
          resoudre(contenu.slice(contenu.indexOf(",") + 1));
        };
        lecteur.onerror = () => rejeter(new Error("Lecture du fichier impossible."));
        lecteur.readAsDataURL(fichierSignature);
      });
      const res = await fetch(`/api/documents/${encodeURIComponent(record.id)}/signature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, nomFichier: fichierSignature.name, mime: fichierSignature.type || "application/pdf" }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error ?? "Enregistrement impossible.");
      toast({
        title: `Devis ${record.numero} marqué signé`,
        description: "Le devis signé est enregistré — ouverture de la génération de facture.",
      });
      setSignature(null);
      setFichierSignature(null);
      onRafraichir();
      onSigne?.(record);
    } catch (e) {
      toast({ title: "Signature impossible", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    } finally {
      setEnCours(null);
    }
  }

  if (!stockageConfigure) {
    return (
      <Carte className="flex flex-col items-center gap-4 px-6 py-16 text-center">
        <FilePlus2 className="h-8 w-8 text-[#e4e4e4]" aria-hidden="true" />
        <p className="max-w-xl text-sm leading-relaxed text-[#c8c8c8]">
          Les documents existants sont conservés dans un stockage privé dédié. Pour les lister,
          définissez la variable d&apos;environnement <code className="rounded bg-[#1c1c1c] px-1.5 py-0.5 text-white">GITHUB_DOCS_TOKEN</code> côté
          serveur (jeton d&apos;accès GitHub) — voir DEPLOIEMENT.md. La GÉNÉRATION (PDF, téléchargement,
          email) fonctionne déjà sans cette variable ; seul l&apos;archivage l&apos;attend.
        </p>
      </Carte>
    );
  }

  /* Libellés des filtres par rubrique. */
  const nbSignes = visibles.filter((d) => statutSignature(d as DocumentRecord).signe).length;
  const nbPayees = visibles.filter((d) => (d as DocumentRecord).statutPaiement === "Payé").length;

  return (
    <div>
      {chargement ? (
        <div className="mb-4 flex items-center gap-2 text-sm text-[#c8c8c8]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Chargement…
        </div>
      ) : null}

      {/* VOLET 20 — FILTRES de la rubrique (devis : signés / non
          signés ; factures : payées / en attente), même présentation
          que les filtres de la rubrique Demandes. */}
      {docType === "devis" || docType === "facture" ? (
        <div className="mb-5 flex flex-wrap items-center gap-2.5">
          {(docType === "devis"
            ? [
                { key: "tous" as const, label: `Tous (${visibles.length})` },
                { key: "signes" as const, label: `Signés (${nbSignes})` },
                { key: "non-signes" as const, label: `Non signés (${visibles.length - nbSignes})` },
              ]
            : [
                { key: "tous" as const, label: `Toutes (${visibles.length})` },
                { key: "payees" as const, label: `Payées (${nbPayees})` },
                { key: "attente" as const, label: `En attente (${visibles.length - nbPayees})` },
              ]
          ).map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFiltre(f.key)}
              className={`min-h-[40px] rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                filtre === f.key
                  ? "border border-[#e4e4e4] bg-white text-[#1c1c1c]"
                  : "border border-[#e4e4e4]/20 text-[#c8c8c8] hover:border-[#e4e4e4]/40"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      ) : null}

      {filtres.length === 0 ? (
        <Carte className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <FilePlus2 className="h-8 w-8 text-[#e4e4e4]" aria-hidden="true" />
          <p className="text-sm text-[#c8c8c8]">
            {docType === "facture"
              ? "Aucune facture ne correspond à ce filtre."
              : docType === "devis"
                ? "Aucun devis ne correspond à ce filtre."
                : "Aucune proposition pour l'instant — créez votre première proposition."}
          </p>
        </Carte>
      ) : (
        <Carte className="scroll-slim overflow-x-auto">
          <table
            className={`w-full text-left text-sm ${docType === "devis" ? "min-w-[1040px]" : "min-w-[880px]"}`}
          >
            <thead>
              <tr className="border-b border-[#e4e4e4]/10 text-[11px] tracking-widest text-[#c8c8c8] uppercase">
                <th className="px-5 py-4">Numéro</th>
                <th className="px-5 py-4">{docType === "proposition" ? "Projet" : "Client"}</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4">Statut</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtres.map((d) => {
                const facture = d.docType === "devis" ? factureExistante(d.numero) : undefined;
                /* La proposition (enregistrement v2), ou null pour les
                   autres types. */
                const prop = estPropositionV2(d) ? (d as PropositionRecord) : null;
                const doc = d as DocumentRecord;
                const stSignature = d.docType === "devis" ? statutSignature(doc) : null;
                const payee = d.docType === "facture" && doc.statutPaiement === "Payé";
                return (
                  <tr key={d.id} className="border-b border-[#e4e4e4]/8 transition-colors hover:bg-[#2f2f2f]/40">
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-white">{d.numero}</td>
                    <td className="max-w-[240px] px-5 py-4">
                      {prop ? (
                        <>
                          <p className="truncate font-medium text-white">{prop.projet}</p>
                          <p className="truncate text-xs text-[#c8c8c8]">{prop.titre}</p>
                        </>
                      ) : (
                        <>
                          <p className="truncate font-medium text-white">{doc.client.nom}</p>
                          {doc.client.entreprise ? <p className="truncate text-xs text-[#c8c8c8]">{doc.client.entreprise}</p> : null}
                        </>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-[#c8c8c8]">{formatDate(d.date)}</td>
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-white">
                      {prop
                        ? fmtMontantSimple(prop.montant, prop.devise)
                        : formatCurrency(totalDocument(doc.items), d.devise)}
                    </td>
                    <td className="px-5 py-4">
                      {d.docType === "facture" ? (
                        <Pastille ton={payee ? "valide" : "neutre"}>
                          {doc.statutPaiement ?? "En attente"}
                        </Pastille>
                      ) : d.docType === "devis" ? (
                        <div className="flex flex-col items-start gap-1.5">
                          {stSignature?.signe ? (
                            <Pastille ton="valide">Signé</Pastille>
                          ) : stSignature?.expire ? (
                            <Pastille ton="alerte">Non signé — expiré</Pastille>
                          ) : (
                            <Pastille>Non signé</Pastille>
                          )}
                          {facture ? (
                            <Pastille ton="valide">Facturée ({facture.numero})</Pastille>
                          ) : null}
                        </div>
                      ) : (
                        <Pastille>Envoyée</Pastille>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* VOLET 20 — aperçu : le PANNEAU s'ouvre
                            directement en PLEIN ÉCRAN (plus de modale
                            au nom du client). */}
                        <button
                          type="button"
                          onClick={() => setApercu(d)}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e4e4e4]/20 text-[#c8c8c8] transition-colors hover:border-[#e4e4e4] hover:text-[#e4e4e4]"
                          aria-label={`Aperçu de ${d.numero}`}
                          title="Aperçu plein écran"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {/* VOLET 20 — une facture EN ATTENTE ne peut
                            PAS être téléchargée : bouton
                            INDISPONIBLE jusqu'au statut « Payé ». */}
                        {d.docType === "facture" && !payee ? (
                          <button
                            type="button"
                            disabled
                            title="Facture en attente — téléchargement disponible une fois payée"
                            aria-label="Téléchargement indisponible (facture en attente)"
                            className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full border border-[#e4e4e4]/10 text-[#c8c8c8]/30"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              d.docType === "proposition"
                                ? telechargerExistant(d)
                                : setChoixLangue(doc)
                            }
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
                        )}
                        {/* VOLET 20 — devis SIGNÉ : téléchargement du
                            PDF signé téléversé. */}
                        {d.docType === "devis" && stSignature?.signe ? (
                          <button
                            type="button"
                            onClick={() => void telechargerSigne(doc)}
                            disabled={enCours === `${d.numero}-signe`}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#22c55e]/30 text-[#86efac] transition-colors hover:border-[#22c55e]"
                            aria-label={`Télécharger le devis signé ${d.numero}`}
                            title="Télécharger le devis signé"
                          >
                            {enCours === `${d.numero}-signe` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <FileSignature className="h-4 w-4" />
                            )}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => onModifier(d)}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e4e4e4]/20 text-[#c8c8c8] transition-colors hover:border-[#e4e4e4] hover:text-[#e4e4e4]"
                          aria-label={`Modifier ${d.numero}`}
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {/* VOLET 20 — MARQUER SIGNÉ (devis non signés
                            seulement) : téléverse le devis signé,
                            le range dans les devis signés puis
                            ouvre la génération de facture. */}
                        {d.docType === "devis" && !stSignature?.signe && onSigne ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSignature(doc);
                              setFichierSignature(null);
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e4e4e4]/20 text-[#c8c8c8] transition-colors hover:border-[#e4e4e4] hover:text-[#e4e4e4]"
                            aria-label={`Marquer le devis ${d.numero} signé`}
                            title="Marquer signé (téléverser le devis signé)"
                          >
                            <FileSignature className="h-4 w-4" />
                          </button>
                        ) : null}
                        {/* VOLET 20 — proposition : GÉNÉRER LE DEVIS
                            pré-rempli depuis cette proposition. */}
                        {d.docType === "proposition" && onGenererDevis && prop ? (
                          <button
                            type="button"
                            onClick={() => onGenererDevis(prop)}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e4e4e4]/20 text-[#c8c8c8] transition-colors hover:border-[#e4e4e4] hover:text-[#e4e4e4]"
                            aria-label={`Générer un devis depuis la proposition ${d.numero}`}
                            title="Générer le devis (pré-rempli)"
                          >
                            <FilePlus2 className="h-4 w-4" />
                          </button>
                        ) : null}
                        {d.docType === "devis" && onFacturer ? (
                          <button
                            type="button"
                            onClick={() => onFacturer(doc)}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e4e4e4]/20 text-[#c8c8c8] transition-colors hover:border-[#e4e4e4] hover:text-[#e4e4e4]"
                            aria-label={`Générer la facture du devis ${d.numero}`}
                            title="Générer la facture"
                          >
                            <Receipt className="h-4 w-4" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setSuppression(d)}
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

      {/* ---------- VOLET 18 : version du PDF (devis/factures) ---------- */}
      {choixLangue ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Version du PDF — ${choixLangue.numero}`}
          onClick={(e) => e.target === e.currentTarget && setChoixLangue(null)}
        >
          <div className="w-full max-w-sm rounded-2xl border border-[#e4e4e4]/15 bg-[#232323] p-6">
            <p className="text-eyebrow">Téléchargement du PDF</p>
            <h3 className="mt-1 font-display text-xl font-semibold text-white">Version du document</h3>
            <p className="mt-1 text-sm text-[#c8c8c8]">
              {choixLangue.numero} — {choixLangue.client.nom} · la langue enregistrée reste le{" "}
              {(choixLangue.langue ?? "fr") === "en" ? "anglais" : "français"}.
            </p>
            <div className="mt-5 space-y-3">
              <BoutonAction
                className="w-full"
                variant={(choixLangue.langue ?? "fr") === "fr" ? "principal" : "secondaire"}
                onClick={() => lancerTelechargement("fr")}
              >
                Version française
              </BoutonAction>
              <BoutonAction
                className="w-full"
                variant={(choixLangue.langue ?? "fr") === "en" ? "principal" : "secondaire"}
                onClick={() => lancerTelechargement("en")}
              >
                Version anglaise
              </BoutonAction>
            </div>
            <div className="mt-5 flex justify-end">
              <BoutonAction onClick={() => setChoixLangue(null)}>Annuler</BoutonAction>
            </div>
          </div>
        </div>
      ) : null}

      {/* ---------- VOLET 20 : modale de suppression personnalisée ----------
          Un devis avertit que sa FACTURE LIÉE sera supprimée
          automatiquement avec lui (demande de l'éditeur). */}
      <ModaleConfirmation
        ouvert={Boolean(suppression)}
        titre={`Supprimer ${suppression ? (suppression.docType === "proposition" ? "la proposition" : "le document") : ""} ${suppression?.numero ?? ""} ?`}
        message={
          suppression ? (
            <>
              <p>
                {suppression.docType === "proposition" ? (
                  <>
                    La proposition <strong className="text-white">{suppression.numero}</strong> ({(suppression as PropositionRecord).projet}) sera
                    définitivement retirée du stockage.
                  </>
                ) : (
                  <>
                    {suppression.docType === "facture" ? "La facture" : "Le devis"}{" "}
                    <strong className="text-white">{suppression.numero}</strong> (
                    {(suppression as DocumentRecord).client.nom}) sera définitivement retiré du stockage.
                  </>
                )}
              </p>
              {suppression.docType === "devis" && factureExistante(suppression.numero) ? (
                <p className="mt-3 rounded-lg border border-[#ea384c]/30 bg-[#ea384c]/10 px-3.5 py-2.5 text-[13px] text-[#ffdede]">
                  Attention : la suppression de ce devis entraîne automatiquement celle de la facture
                  correspondante <strong>{factureExistante(suppression.numero)!.numero}</strong>.
                </p>
              ) : null}
              {suppression.docType === "devis" && (suppression as DocumentRecord).devisSigne ? (
                <p className="mt-3 text-[13px] text-[#c8c8c8]">
                  Le devis signé téléversé sera également supprimé.
                </p>
              ) : null}
              <p className="mt-3 text-xs text-[#c8c8c8]/70">Cette action est irréversible.</p>
            </>
          ) : null
        }
        libelleConfirmer="Supprimer définitivement"
        enCours={Boolean(suppression && enCours === `${suppression.numero}-suppr`)}
        onAnnuler={() => setSuppression(null)}
        onConfirmer={() => void confirmerSuppression()}
      />

      {/* ---------- VOLET 20 : modale de signature (devis signé) ---------- */}
      {signature ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Marquer le devis ${signature.numero} signé`}
          onClick={(e) => e.target === e.currentTarget && setSignature(null)}
        >
          <div className="w-full max-w-md rounded-2xl border border-[#e4e4e4]/15 bg-[#232323] p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-eyebrow">Devis signé</p>
                <h3 className="mt-1 font-display text-xl font-semibold text-white">
                  Marquer {signature.numero} signé
                </h3>
                <p className="mt-1 text-sm text-[#c8c8c8]">
                  {signature.client.nom} — {formatCurrency(totalDocument(signature.items), signature.devise)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSignature(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e4e4e4]/20 text-[#c8c8c8] transition-colors hover:border-[#e4e4e4] hover:text-white"
                aria-label="Annuler"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#c8c8c8]">
              Téléversez le PDF du devis signé par le client : il sera enregistré dans la partie des
              devis signés, le devis sera marqué signé, puis la génération de sa facture s&apos;ouvrira.
            </p>
            <input
              ref={signatureInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(e) => setFichierSignature(e.target.files?.[0] ?? null)}
              aria-label="Choisir le PDF du devis signé"
            />
            <button
              type="button"
              onClick={() => signatureInputRef.current?.click()}
              className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl border border-dashed border-[#e4e4e4]/30 bg-[#1c1c1c] px-4 py-5 text-left transition-colors hover:border-[#e4e4e4]/60"
            >
              <FileSignature className="h-6 w-6 shrink-0 text-[#c8c8c8]" aria-hidden="true" />
              <span className="min-w-0">
                {fichierSignature ? (
                  <>
                    <span className="block truncate text-sm font-medium text-white">{fichierSignature.name}</span>
                    <span className="block text-xs text-[#86efac]">
                      {(fichierSignature.size / 1024).toFixed(0)} Ko — prêt à enregistrer
                    </span>
                  </>
                ) : (
                  <>
                    <span className="block text-sm font-medium text-white">Choisir le PDF signé</span>
                    <span className="block text-xs text-[#c8c8c8]">
                      Fichier PDF du devis signé par le client (~6 Mo maximum)
                    </span>
                  </>
                )}
              </span>
            </button>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <BoutonAction onClick={() => setSignature(null)} disabled={enCours === `${signature.numero}-signature`}>
                Annuler
              </BoutonAction>
              <BoutonAction
                variant="principal"
                onClick={() => void confirmerSignature()}
                disabled={enCours === `${signature.numero}-signature`}
              >
                {enCours === `${signature.numero}-signature` ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Enregistrement…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Enregistrer et marquer signé
                  </>
                )}
              </BoutonAction>
            </div>
          </div>
        </div>
      ) : null}

      {/* ---------- VOLET 20 : aperçu — le PANNEAU en PLEIN ÉCRAN,
          directement (plus de modale au nom du client). Fermeture :
          croix ou Échap. ---------- */}
      {apercu ? (
        <ApercuDocument
          document={apercu}
          initialPleinEcran
          onFermer={() => setApercu(null)}
        />
      ) : null}
    </div>
  );
}
