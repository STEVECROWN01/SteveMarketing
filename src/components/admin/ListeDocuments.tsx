"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Download,
  Eye,
  FilePlus2,
  FileSignature,
  Loader2,
  Pencil,
  Receipt,
  Send,
  Trash2,
  Undo2,
  X,
  XCircle,
} from "lucide-react";
import { ApercuDocument } from "./ApercuDocument";
import { ApercuDevisSigne } from "./ApercuDevisSigne";
import { AnneauProgression, BoutonAction, BoutonIcone, Carte, ModaleConfirmation, Pastille } from "./elements";
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
  /** VOLET 23 — document (facture) à OUVRIR EN APERÇU dès l'arrivée
   *  dans la rubrique (clic sur le statut « Facturée (n°) » d'un
   *  devis déjà facturé — la facture s'ouvre dans SON espace, en
   *  plein écran, sans modale de modification). */
  apercuAutomatique,
  onApercuOuvert,
  /* CORRECTIF 28/11 — session expirée : retour propre à l'écran de
   *  connexion (plus jamais un toast rouge « Non autorisé »). */
  sessionExpiree,
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
  apercuAutomatique?: ToutDocument | null;
  onApercuOuvert?: () => void;
  sessionExpiree?: () => void;
}) {
  const [apercu, setApercu] = useState<ToutDocument | null>(null);
  /* VOLET 21 — visionneuse du PDF SIGNÉ d'un devis (téléversé). */
  const [apercuSigne, setApercuSigne] = useState<DocumentRecord | null>(null);
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
  /* VOLET 22 — ANALYSE DU PDF SIGNÉ À L'UPLOAD : « attente » (aucun
   * fichier) → « encours » (anneau circulaire vert 0 → 100 %) →
   * « valide » (coche verte) | « invalide » (croix rouge + raisons).
   * Le bouton d'enregistrement reste GRISÉ tant que l'analyse n'a
   * pas confirmé que le document correspond bien au devis. */
  const [analyseSigne, setAnalyseSigne] = useState<{
    phase: "attente" | "encours" | "valide" | "invalide";
    manques: string[];
  }>({ phase: "attente", manques: [] });
  const [progressionAnalyse, setProgressionAnalyse] = useState(0);

  /* VOLET 23 — APERÇU AUTOMATIQUE : le document reçu (une facture
   *  depuis le statut « Facturée (n°) » de la sélection de devis)
   *  s'ouvre EN PLEIN ÉCRAN dès son arrivée dans la rubrique. */
  useEffect(() => {
    if (apercuAutomatique) {
      setApercu(apercuAutomatique);
      onApercuOuvert?.();
    }
  }, [apercuAutomatique, onApercuOuvert]);

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
    if (analyseSigne.phase !== "valide") {
      toast({
        title: "Document non vérifié",
        description: "Téléversez le PDF du devis signé — l'analyse doit d'abord confirmer qu'il correspond à ce devis.",
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
      setAnalyseSigne({ phase: "attente", manques: [] });
      setProgressionAnalyse(0);
      onRafraichir();
      onSigne?.(record);
    } catch (e) {
      toast({ title: "Signature impossible", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    } finally {
      setEnCours(null);
    }
  }

  /* VOLET 22 (27/11/2026) — ANALYSE STRICTE DU PDF SIGNÉ À L'UPLOAD
   * (demande de l'éditeur : « c'est lors de l'upload que le système
   * doit vérifier strictement le document — numéro du devis, nom,
   * signatures, date d'émission, tableau de détails. Pendant
   * l'analyse, un chargement circulaire vert monte de 0 à 100 % ;
   * si le document ne correspond pas, ça le mentionne en rouge ;
   * si ça correspond, une coche verte. Le bouton d'enregistrement
   * est grisé tant que le document ne correspond pas »). L'anneau
   * monte par impulsions jusqu'à ~95 % pendant l'analyse côté
   * serveur, atteint 100 % à la réponse, puis le verdict s'affiche. */
  async function analyserSignature(fichier: File, record: DocumentRecord) {
    setAnalyseSigne({ phase: "encours", manques: [] });
    setProgressionAnalyse(0);
    const minuteur = window.setInterval(() => {
      setProgressionAnalyse((p) => (p < 95 ? p + Math.max(0.7, (95 - p) / 16) : 95));
    }, 110);
    try {
      const data = await new Promise<string>((resoudre, rejeter) => {
        const lecteur = new FileReader();
        lecteur.onload = () => {
          const contenu = String(lecteur.result ?? "");
          resoudre(contenu.slice(contenu.indexOf(",") + 1));
        };
        lecteur.onerror = () => rejeter(new Error("Lecture du fichier impossible."));
        lecteur.readAsDataURL(fichier);
      });
      const res = await fetch(`/api/documents/${encodeURIComponent(record.id)}/verifier-signature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error ?? "Analyse impossible.");
      setProgressionAnalyse(100);
      /* petit temps d'arrêt : l'anneau termine son tour avant le verdict */
      await new Promise((r) => setTimeout(r, 320));
      if (json.valide) {
        setAnalyseSigne({ phase: "valide", manques: [] });
      } else {
        setAnalyseSigne({
          phase: "invalide",
          manques: (json.manques as string[] | undefined)?.length
            ? (json.manques as string[])
            : [`Ce document ne correspond pas au devis ${record.numero}.`],
        });
      }
    } catch (e) {
      setProgressionAnalyse(100);
      setAnalyseSigne({
        phase: "invalide",
        manques: [e instanceof Error ? e.message : "Analyse impossible."],
      });
    } finally {
      window.clearInterval(minuteur);
    }
  }

  if (!stockageConfigure) {
    return (
      <Carte className="flex flex-col items-center gap-4 px-6 py-16 text-center">
        <FilePlus2 className="h-8 w-8 text-[#e4e4e4]" aria-hidden="true" />
        <p className="max-w-xl text-sm leading-relaxed text-[#c8c8c8]">
          Les documents existants sont conservés dans un stockage privé dédié. Pour les lister,
          définissez la variable d&apos;environnement <code className="rounded bg-[#1c1c1c] px-1.5 py-0.5 text-white">GITHUB_DOCS_TOKEN</code> côté
          serveur (jeton d&apos;accès GitHub) — voir DEPLOIEMENT.md. La GÉNÉRATION (PDF, téléchargement)
          fonctionne déjà sans cette variable ; seul l&apos;archivage l&apos;attend.
        </p>
      </Carte>
    );
  }

  /* Libellés des filtres par rubrique. */
  const nbSignes = visibles.filter((d) => statutSignature(d as DocumentRecord).signe).length;
  const nbPayees = visibles.filter((d) => (d as DocumentRecord).statutPaiement === "Payé").length;

  /* ---------- VOLET 31 — RENDU PARTAGÉ TABLEAU (≥ lg) / CARTES (< lg) ----------
     Statut et Actions sont factorisés : la table desktop et les
     cartes mobiles/tablettes portent EXACTEMENT les mêmes contrôles
     (aucune fonctionnalité retirée sur petit écran). */
  const identiteDoc = (d: ToutDocument) => {
    const prop = estPropositionV2(d) ? (d as PropositionRecord) : null;
    const doc = d as DocumentRecord;
    return prop ? (
      <>
        <p className="truncate font-medium text-white" title={prop.projet}>{prop.projet}</p>
        <p className="truncate text-xs text-[#c8c8c8]" title={prop.titre}>{prop.titre}</p>
      </>
    ) : (
      <>
        <p className="truncate font-medium text-white" title={doc.client.nom}>{doc.client.nom}</p>
        {doc.client.entreprise ? (
          <p className="truncate text-xs text-[#c8c8c8]" title={doc.client.entreprise}>{doc.client.entreprise}</p>
        ) : null}
      </>
    );
  };

  const statutDoc = (d: ToutDocument) => {
    const facture = d.docType === "devis" ? factureExistante(d.numero) : undefined;
    const doc = d as DocumentRecord;
    const stSignature = d.docType === "devis" ? statutSignature(doc) : null;
    const payee = d.docType === "facture" && doc.statutPaiement === "Payé";
    if (d.docType === "facture") {
      return <Pastille ton={payee ? "valide" : "neutre"}>{doc.statutPaiement ?? "En attente"}</Pastille>;
    }
    if (d.docType === "devis") {
      /* VOLET 21 — les DEUX statuts du devis, empilés (demande de
         l'éditeur) : signature en haut, facturation en bas ;
         « Facturé » s'affiche SEUL et « Non facturé » revient dès
         que la facture est supprimée. */
      return (
        <div className="flex flex-col items-start gap-1.5">
          {stSignature?.signe ? (
            <Pastille ton="valide">Signé</Pastille>
          ) : stSignature?.expire ? (
            <Pastille ton="alerte">Non signé — expiré</Pastille>
          ) : (
            <Pastille>Non signé</Pastille>
          )}
          {facture ? <Pastille ton="valide">Facturé</Pastille> : <Pastille>Non facturé</Pastille>}
        </div>
      );
    }
    return <MenuStatutProposition doc={d} onRafraichir={onRafraichir} toast={toast} sessionExpiree={sessionExpiree} />;
  };

  const actionsDoc = (d: ToutDocument, alignement: string) => {
    const facture = d.docType === "devis" ? factureExistante(d.numero) : undefined;
    const prop = estPropositionV2(d) ? (d as PropositionRecord) : null;
    const doc = d as DocumentRecord;
    const stSignature = d.docType === "devis" ? statutSignature(doc) : null;
    const payee = d.docType === "facture" && doc.statutPaiement === "Payé";
    return (
      /* VOLET 23 — les boutons d'action passent à la ligne si
         nécessaire : aucune colonne ne force le tableau au-delà de
         sa carte. */
      <div className={`flex flex-wrap items-center gap-2 ${alignement}`}>
        {/* VOLET 21 — TOUS les boutons d'action portent une
            INFO-BULLE au survol (demande de l'éditeur). */}
        {/* VOLET 20 — aperçu : le PANNEAU s'ouvre directement en
            PLEIN ÉCRAN (plus de modale au nom du client). */}
        <BoutonIcone titre="Aperçu plein écran" onClick={() => setApercu(d)}>
          <Eye className="h-4 w-4" />
        </BoutonIcone>
        {/* VOLET 20 — une facture EN ATTENTE ne peut PAS être
            téléchargée : bouton INDISPONIBLE jusqu'au statut
            « Payé ». */}
        {d.docType === "facture" && !payee ? (
          <BoutonIcone titre="Facture en attente — téléchargement disponible une fois payée" disabled>
            <Download className="h-4 w-4" />
          </BoutonIcone>
        ) : (
          <BoutonIcone
            titre="Télécharger le PDF"
            onClick={() => (d.docType === "proposition" ? telechargerExistant(d) : setChoixLangue(doc))}
            disabled={enCours === `${d.numero}-pdf`}
          >
            {enCours === `${d.numero}-pdf` ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </BoutonIcone>
        )}
        {/* VOLET 21 — devis SIGNÉ : le bouton ne TÉLÉCHARGE plus,
            il OUVRE la VISIONNEUSE plein écran du PDF signé (le
            téléchargement vit DANS l'aperçu). */}
        {d.docType === "devis" && stSignature?.signe ? (
          <BoutonIcone titre="Voir le devis signé" ton="valide" onClick={() => setApercuSigne(doc)}>
            <FileSignature className="h-4 w-4" />
          </BoutonIcone>
        ) : null}
        <BoutonIcone titre="Modifier" onClick={() => onModifier(d)}>
          <Pencil className="h-4 w-4" />
        </BoutonIcone>
        {/* VOLET 20 — MARQUER SIGNÉ (devis non signés seulement) :
            téléverse le devis signé, le range dans les devis signés
            puis ouvre la génération de facture. */}
        {d.docType === "devis" && !stSignature?.signe && onSigne ? (
          <BoutonIcone
            titre="Marquer signé (téléverser le devis signé)"
            onClick={() => {
              setSignature(doc);
              setFichierSignature(null);
              setAnalyseSigne({ phase: "attente", manques: [] });
              setProgressionAnalyse(0);
            }}
          >
            <FileSignature className="h-4 w-4" />
          </BoutonIcone>
        ) : null}
        {/* VOLET 20 — proposition : GÉNÉRER LE DEVIS pré-rempli
            depuis cette proposition. */}
        {d.docType === "proposition" && onGenererDevis && prop ? (
          <BoutonIcone titre="Générer le devis (pré-rempli)" onClick={() => onGenererDevis(prop)}>
            <FilePlus2 className="h-4 w-4" />
          </BoutonIcone>
        ) : null}
        {/* VOLET 21 — le bouton « générer la facture » n'apparaît
            que si le devis N'EST PAS déjà facturé (demande de
            l'éditeur) ; il REVIENT dès que la facture est
            supprimée. */}
        {d.docType === "devis" && onFacturer && !facture ? (
          <BoutonIcone titre="Générer la facture" onClick={() => onFacturer(doc)}>
            <Receipt className="h-4 w-4" />
          </BoutonIcone>
        ) : null}
        <BoutonIcone
          titre="Supprimer du stockage"
          ton="danger"
          onClick={() => setSuppression(d)}
          disabled={enCours === `${d.numero}-suppr`}
        >
          {enCours === `${d.numero}-suppr` ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </BoutonIcone>
      </div>
    );
  };

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
        <>
          {/* ---------- TABLEAU DESKTOP (≥ lg) ----------
              VOLET 23 — PLUS DE DÉFILEMENT HORIZONTAL : le tableau
              s'arrête sur la colonne Action (demande de l'éditeur).
              VOLET 31 — le tableau ne vit plus QUE sur grand écran :
              en dessous, chaque document devient une CARTE complète
              (mêmes statuts, mêmes actions). */}
          <Carte className="hidden overflow-x-clip lg:block">
            <table className="w-full text-left text-sm">
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
                  const prop = estPropositionV2(d) ? (d as PropositionRecord) : null;
                  const doc = d as DocumentRecord;
                  return (
                    <tr key={d.id} className="border-b border-[#e4e4e4]/8 transition-colors hover:bg-[#2f2f2f]/40">
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-white">{d.numero}</td>
                      <td className="max-w-[240px] px-5 py-4">{identiteDoc(d)}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-[#c8c8c8]">{formatDate(d.date)}</td>
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-white">
                        {prop
                          ? fmtMontantSimple(prop.montant, prop.devise)
                          : formatCurrency(totalDocument(doc.items), d.devise)}
                      </td>
                      <td className="px-5 py-4">{statutDoc(d)}</td>
                      <td className="px-5 py-4">{actionsDoc(d, "justify-end")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Carte>

          {/* ---------- CARTES MOBILE / TABLETTE (< lg) — VOLET 31 ----------
              Mêmes informations, mêmes statuts, mêmes actions que la
              table : chaque document tient sur une carte empilée,
              AUCUN défilement horizontal, boutons à hauteur de
              pouce. */}
          <div className="space-y-3 lg:hidden">
            {filtres.map((d) => {
              const prop = estPropositionV2(d) ? (d as PropositionRecord) : null;
              const doc = d as DocumentRecord;
              return (
                <Carte key={d.id} className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold tracking-[0.22em] text-[#c8c8c8] uppercase">{d.numero}</p>
                      <div className="mt-1">{identiteDoc(d)}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="whitespace-nowrap font-medium text-white">
                        {prop
                          ? fmtMontantSimple(prop.montant, prop.devise)
                          : formatCurrency(totalDocument(doc.items), d.devise)}
                      </p>
                      <p className="mt-0.5 whitespace-nowrap text-xs text-[#c8c8c8]">{formatDate(d.date)}</p>
                    </div>
                  </div>
                  <div className="mt-3">{statutDoc(d)}</div>
                  <div className="mt-3 border-t border-[#e4e4e4]/10 pt-3">{actionsDoc(d, "justify-start")}</div>
                </Carte>
              );
            })}
          </div>
        </>
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
            {/* VOLET 23 — le texte explicatif demandé SUPPRIMÉ (demande
                de l'éditeur : « supprime le texte "Téléversez le PDF…" »)
                — la zone d'upload et l'analyse parlent d'elles-mêmes. */}
            <input
              ref={signatureInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFichierSignature(f);
                if (f) void analyserSignature(f, signature);
              }}
              aria-label="Choisir le PDF du devis signé"
            />
            {/* ---------- Zone d'upload + ANALYSE (VOLET 22) ---------- */}
            {!fichierSignature ? (
              <button
                type="button"
                onClick={() => signatureInputRef.current?.click()}
                className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl border border-dashed border-[#e4e4e4]/30 bg-[#1c1c1c] px-4 py-5 text-left transition-colors hover:border-[#e4e4e4]/60"
              >
                <FileSignature className="h-6 w-6 shrink-0 text-[#c8c8c8]" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-white">Choisir le PDF signé</span>
                  <span className="block text-xs text-[#c8c8c8]">
                    Fichier PDF du devis signé par le client (~6 Mo maximum)
                  </span>
                </span>
              </button>
            ) : (
              <div className="mt-4 rounded-xl border border-[#e4e4e4]/15 bg-[#1c1c1c] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <FileSignature className="h-5 w-5 shrink-0 text-[#c8c8c8]" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-white">{fichierSignature.name}</span>
                      <span className="block text-xs text-[#c8c8c8]">
                        {(fichierSignature.size / 1024).toFixed(0)} Ko
                      </span>
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => signatureInputRef.current?.click()}
                    className="shrink-0 rounded-full border border-[#e4e4e4]/25 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:border-[#e4e4e4]"
                  >
                    Changer de fichier
                  </button>
                </div>
                {/* Analyse : anneau circulaire vert 0 → 100 %, puis verdict */}
                <div className="mt-4 flex flex-col items-center gap-3 border-t border-[#e4e4e4]/10 pt-4">
                  {analyseSigne.phase === "encours" ? (
                    <>
                      <AnneauProgression pourcentage={progressionAnalyse} />
                      <p className="text-sm text-[#c8c8c8]">Analyse du document…</p>
                    </>
                  ) : analyseSigne.phase === "valide" ? (
                    <>
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#22c55e]/15">
                        <CheckCircle2 className="h-8 w-8 text-[#22c55e]" aria-hidden="true" />
                      </span>
                      <p className="text-center text-sm font-medium text-[#86efac]">
                        Le document correspond bien au devis {signature.numero} — prêt à enregistrer.
                      </p>
                    </>
                  ) : analyseSigne.phase === "invalide" ? (
                    <>
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ea384c]/15">
                        <XCircle className="h-8 w-8 text-[#ea384c]" aria-hidden="true" />
                      </span>
                      <div className="w-full text-center">
                        <p className="text-sm font-medium text-[#ff8080]">
                          Ce document ne correspond pas au devis {signature.numero}.
                        </p>
                        <ul className="mx-auto mt-2 max-w-sm space-y-1 text-left">
                          {analyseSigne.manques.map((m) => (
                            <li key={m} className="flex items-start gap-2 text-[13px] text-[#ffdede]">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ea384c]" aria-hidden="true" />
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            )}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <BoutonAction onClick={() => setSignature(null)} disabled={enCours === `${signature.numero}-signature`}>
                Annuler
              </BoutonAction>
              {/* VOLET 22 — bouton GRISÉ tant que l'analyse n'a pas validé
                  le document ; dégrisé dès la coche verte. */}
              <BoutonAction
                variant="principal"
                onClick={() => void confirmerSignature()}
                disabled={enCours === `${signature.numero}-signature` || analyseSigne.phase !== "valide"}
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

      {/* ---------- VOLET 21 : VISIONNEUSE du devis SIGNÉ (PDF
          téléversé) — plein écran, téléchargement DANS l'aperçu. ---------- */}
      {apercuSigne ? (
        <ApercuDevisSigne document={apercuSigne} onFermer={() => setApercuSigne(null)} />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------
 * VOLET 22 (27/11/2026) — STATUT D'ENVOI D'UNE PROPOSITION
 * COMMERCIALE, CLIQUABLE : MODAL PERSONNALISÉE.
 *
 * Demande de l'éditeur (volet 21) : « le statut est cliquable : non
 * envoyée par défaut, on peut la marquer envoyée » ; puis (volet 22)
 * : « le dropdown et l'option à choisir se cachent à l'intérieur de
 * la bande, on ne voit même pas l'option — corrige, OU carrément
 * affiche un MODAL personnalisé à l'écran pour choisir ». Le petit
 * menu déroulant (clippé par la bande de la liste) est donc remplacé
 * par une MODALE CENTRÉE : le statut actuel, les deux options, et
 * Annuler. Le choix est ENREGISTRÉ avec la proposition (champ
 * `envoyee`, stockage privé) et la liste se rafraîchit.
 * ------------------------------------------------------------------ */
function MenuStatutProposition({
  doc,
  onRafraichir,
  toast,
  sessionExpiree,
}: {
  doc: ToutDocument;
  onRafraichir: () => void;
  toast: (t: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
  sessionExpiree?: () => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const envoyee = Boolean((doc as { envoyee?: boolean }).envoyee);

  async function basculer(nouvelle: boolean) {
    if (enCours || nouvelle === envoyee) {
      setOuvert(false);
      return;
    }
    setOuvert(false);
    setEnCours(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: { ...doc, envoyee: nouvelle } }),
      });
      if (res.status === 401) {
        sessionExpiree?.();
        return;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Enregistrement impossible.");
      toast({
        title: `Proposition ${doc.numero} ${nouvelle ? "marquée envoyée" : "remise en non envoyée"}`,
        description: nouvelle
          ? "Le statut est passé à « Envoyée »."
          : "Le statut est revenu à « Non envoyée ».",
      });
      onRafraichir();
    } catch (e) {
      toast({
        title: "Changement de statut impossible",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOuvert(true)}
        disabled={enCours}
        title="Cliquer pour changer le statut d'envoi"
        className="cursor-pointer rounded-full transition-transform hover:scale-[1.03] focus:outline-none"
      >
        {enCours ? (
          <Pastille>
            <Loader2 className="mr-1.5 h-3 w-3 animate-spin" aria-hidden="true" />
            Mise à jour…
          </Pastille>
        ) : envoyee ? (
          <Pastille ton="valide">Envoyée</Pastille>
        ) : (
          <Pastille>Non envoyée</Pastille>
        )}
      </button>
      {/* VOLET 22 — MODAL PERSONNALISÉE centrée à l'écran (le dropdown
          se cachait dans la bande de la liste). */}
      {ouvert ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Statut d'envoi — ${doc.numero}`}
          onClick={(e) => e.target === e.currentTarget && setOuvert(false)}
        >
          <div className="w-full max-w-sm rounded-2xl border border-[#e4e4e4]/15 bg-[#232323] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-eyebrow">Proposition commerciale</p>
                <h3 className="mt-1 font-display text-xl font-semibold text-white">
                  Statut d&apos;envoi — {doc.numero}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOuvert(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e4e4e4]/20 text-[#c8c8c8] transition-colors hover:border-[#e4e4e4] hover:text-white"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-[#c8c8c8]">
              Statut actuel :{" "}
              <span className="font-medium text-white">
                {envoyee ? "Envoyée" : "Non envoyée"}
              </span>
              . Choisissez le nouveau statut de la proposition :
            </p>
            <div className="mt-5 space-y-3">
              <BoutonAction
                className="w-full"
                variant={envoyee ? "secondaire" : "principal"}
                onClick={() => void basculer(true)}
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                Marquer comme envoyée
              </BoutonAction>
              <BoutonAction
                className="w-full"
                variant={!envoyee ? "secondaire" : "principal"}
                onClick={() => void basculer(false)}
              >
                <Undo2 className="h-4 w-4" aria-hidden="true" />
                Marquer comme non envoyée
              </BoutonAction>
            </div>
            <div className="mt-5 flex justify-end">
              <BoutonAction onClick={() => setOuvert(false)}>Annuler</BoutonAction>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
