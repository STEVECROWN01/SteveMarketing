"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  FilePlus2,
  FileText,
  Gauge,
  Handshake,
  Inbox,
  Languages,
  Loader2,
  LogOut,
  Plus,
  Radar,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LEAD_STATUSES } from "@/lib/validation";
import { ASSETS, PROJECTS as PROJETS_SITE } from "@/lib/site";
import { GenerateurDocument, type PreRemplissage } from "@/components/admin/GenerateurDocument";
import { GenerateurProposition } from "@/components/admin/GenerateurProposition";
import { ListeDocuments } from "@/components/admin/ListeDocuments";
import { ApercuDocument } from "@/components/admin/ApercuDocument";
import { EspaceFacture } from "@/components/admin/EspaceFacture";
import { GestionPortfolio } from "@/components/admin/GestionPortfolio";
import { EspaceScraping } from "@/components/admin/EspaceScraping";
import { EspaceProspects, type ProspectAmorce } from "@/components/admin/EspaceProspects";
import { EspaceAudit } from "@/components/admin/EspaceAudit";
import type { ProspectAudit } from "@/lib/audit/complet";
import { BoutonAction, Carte, Pastille } from "@/components/admin/elements";
import type { DocumentRecord } from "@/lib/documents/types";
import { estPropositionV2, type PropositionRecord } from "@/lib/documents/proposition";
import type { ToutDocument } from "@/lib/documents/github";
import { formatCurrency, totalDocument, formatDate } from "@/lib/documents/format";
/* VOLET 20 — pré-remplissage expert d'un devis depuis une
   proposition commerciale (bouton « générer le devis »). */
import { preRemplissageDevisDepuisProposition } from "@/lib/documents/devis-depuis-proposition";

/**
 * ESPACE ADMINISTRATEUR — BACK-OFFICE (VOLET 14, restructuré VOLET 15
 * du 25/11/2026).
 *
 * Le back-office conserve le design du site (fonds #070707/#232323,
 * bordures #e4e4e4, Sora) avec la structure demandée par l'éditeur :
 *
 *  - BARRE SUPÉRIEURE : logo du site (version blanche) + mention
 *    « BACK-OFFICE » à droite du logo (volet 15 — remplace le titre
 *    « Stevens Akpovi — Espace administrateur » et l'ancien
 *    sur-titre) ;
 *  - TABLEAU DE BORD : compteurs (demandes, propositions, devis,
 *    factures), état du stockage et de l'email, raccourcis ;
 *  - DEMANDES : l'existant (demandes devis/audit/messages reçues,
 *    statuts, export CSV) ;
 *  - PROPOSITIONS COMMERCIALES / DEVIS / FACTURES (volet 15) : chaque
 *    rubrique liste TOUS ses documents dans l'ordre de création (comme
 *    la rubrique Demandes), avec un bouton « Créer… » en haut à
 *    droite qui ouvre l'espace de création. Chaque document porte ses
 *    icônes d'action : modifier, générer la facture (devis),
 *    supprimer, plus aperçu et téléchargement. « Créer une nouvelle
 *    facture » ouvre d'abord la SÉLECTION DU DEVIS à facturer, puis
 *    l'espace de génération de facture pour le devis choisi ;
 *  - l'ancienne rubrique « Factures & documents » disparaît (plus
 *    d'utilité : chaque type vit dans sa rubrique).
 *
 * CONNEXION (volet 14) : icône ŒIL noire sur pastille claire pour
 * révéler le mot de passe (volet 15 : l'icône est NOIRE et reste
 * visible au survol) ; bouton « Ouvrir L'Espace ».
 */

type Section = "tableau" | "demandes" | "propositions" | "devis" | "factures" | "portfolio" | "scraping" | "prospects" | "audit";
/** Vue courante des rubriques documents : liste / création / édition. */
type VueDocs = "liste" | "creation" | "edition";
/** Vue courante de la rubrique factures : liste / sélection du devis. */
type VueFactures = "liste" | "selection";

interface Lead {
  id: string;
  type: "quote" | "audit" | "contact";
  status: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  website: string | null;
  activity: string | null;
  serviceType: string | null;
  budget: string | null;
  timeline: string | null;
  message: string;
  emailSent: boolean;
  source: string | null;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  new: "Nouvelle",
  contacted: "Contacté",
  qualified: "Qualifiée",
  /* VOLET 16 : « Gagnée / Perdue » laissaient croire à un jeu —
     termes commerciaux appropriés (demande de l'éditeur). */
  won: "Signée",
  lost: "Non retenue",
};

const STATUS_STYLES: Record<string, string> = {
  new: "bg-[#e4e4e4] text-[#1c1c1c]",
  contacted: "bg-[#2f2f2f] text-white border border-[#e4e4e4]/20",
  qualified: "bg-[#e4e4e4]/20 text-[#e4e4e4] border border-[#e4e4e4]/40",
  won: "bg-[#e4e4e4] text-[#1c1c1c]",
  lost: "bg-[#2f2f2f] text-[#c8c8c8] border border-[#e4e4e4]/12",
};

function formatDateHeure(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/* ------------------------------------------------------------------
 * CONNEXION — message de bienvenue personnalisé (Stevens), icône
 * œil À L'INTÉRIEUR du champ (volet 14), bouton « Ouvrir L'Espace ».
 * VOLET 15 : l'icône œil est NOIRE sur une pastille claire — elle
 * reste parfaitement visible au survol (l'éditeur soulignait que la
 * couleur de survol gommait l'icône).
 * ------------------------------------------------------------------ */
function LoginPanel({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [voirMotDePasse, setVoirMotDePasse] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Mot de passe incorrect.");
      /* VOLET 17 : icône verte sur le toast de connexion. */
      toast({
        title: "Espace ouvert",
        description: "Back-office accessible.",
        icon: <CheckCircle2 className="h-5 w-5 text-[#22c55e]" aria-hidden="true" />,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  /* VOLET 19 (26/11/2026) — BLOC DE CONNEXION ENTIÈREMENT VISIBLE
   * SANS DÉFILEMENT, sur TOUTES les tailles d'écran (mobile,
   * tablette, bureau — demande de l'éditeur : « il faut que ce bloc
   * de connexion soit entièrement visible […] sans scroll au top »).
   * Passé : py-32 (256 px de marge verticale) + logo h-32 + grands
   * espacements → le bloc dépassait l'écran courant sur mobile.
   * Désormais : conteneur en unités svh (barre d'adresse mobile
   * comprise), marges et respiration REDUITES PROGRESSIVEMENT vers
   * les petits écrans (clamp), carte plafonnée à la hauteur du
   * viewport — au pire cas irréductible (téléphone en paysage), un
   * défilement INTERNE à la carte prend le relais sans jamais
   * cacher le haut du bloc. Le contenu éventuellement SOUS la
   * section (pied de page de l'espace) se découvre au scroll. */
  return (
    <div className="zone-admin container-site flex min-h-svh items-center justify-center p-4 sm:p-6">
      <div className="flex max-h-[calc(100svh-2rem)] w-full max-w-md flex-col overflow-y-auto rounded-2xl border border-[#e4e4e4]/12 bg-[#232323] p-6 text-center sm:max-h-[calc(100svh-3rem)] sm:p-8 lg:p-10">
        {/* VOLET 17 : logo DOUBLÉ en taille, espace logo→titre
            réduit. VOLET 19 : hauteur fluide — grande sur bureau,
            réduite sur les écrans courts (le bloc doit tenir SANS
            défilement, voir ci-dessus). */}
        <span className="flex shrink-0 justify-center">
          <img
            src={ASSETS.logoLight}
            alt="Stevens Akpovi"
            width={600}
            height={480}
            className="h-[clamp(4.5rem,13svh,8rem)] w-auto"
          />
        </span>
        <h1 className="mt-[clamp(0.5rem,1.5svh,0.75rem)] font-display text-[clamp(1.25rem,3.5svh,1.5rem)] font-semibold text-white">
          Bienvenue, Stevens !
        </h1>
        <p className="mx-auto mt-[clamp(0.375rem,1.2svh,0.5rem)] max-w-sm text-[13px] leading-relaxed text-[#c8c8c8] sm:text-sm">
          Votre back-office vous attend : retrouvez les demandes de vos
          clients, générez vos propositions, devis et factures en quelques
          clics, et pilotez chaque projet de la première prise de contact
          au règlement. Tout est réuni ici, en privé, à l&apos;écart de la
          navigation publique — bonne session.
        </p>
        <form onSubmit={submit} className="mt-[clamp(1rem,3svh,2rem)] space-y-[clamp(0.75rem,2svh,1rem)] text-left">
          <div>
            <label htmlFor="admin-password" className="mb-1.5 block text-sm font-medium text-white">
              Mot de passe
            </label>
          {/* Icône œil à l'intérieur du champ (volet 14). VOLET 15 :
              pastille CLAIRE + icône NOIRE — le contraste reste
              entier au repos comme au survol (hover : la pastille
              s'éclaircit, l'icône demeure noire). */}
            <div className="relative">
              <input
                id="admin-password"
                type={voirMotDePasse ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-h-[48px] w-full rounded-lg border border-[#e4e4e4]/18 bg-[#1c1c1c] py-3 pl-4 pr-14 text-[15px] text-white placeholder:text-[#c8c8c8]/50 focus:border-[#e4e4e4] focus:outline-none"
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setVoirMotDePasse((v) => !v)}
                aria-label={voirMotDePasse ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                aria-pressed={voirMotDePasse}
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#e4e4e4] text-black transition-colors hover:bg-white"
              >
                {voirMotDePasse ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </div>
          {error && (
            <p role="alert" className="rounded-lg border border-[#ea384c]/40 bg-[#ea384c]/10 px-4 py-2.5 text-sm text-[#ffdede]">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-fill flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-full border border-[#e4e4e4] bg-white px-6 py-4 font-medium text-[#1c1c1c] hover:border-[#c9baac] disabled:opacity-60 [&::before]:bg-[#e4e4e4]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Vérification…
              </>
            ) : (
              "Ouvrir L'Espace"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
 * PANNEAU DEMANDES — l'existant (volets précédents), intégré au
 * back-office sans changement fonctionnel.
 * ------------------------------------------------------------------ */
function PanneauDemandes({
  leads,
  loading,
  onActualiser,
  onMajStatut,
  onCreerDevis,
}: {
  leads: Lead[];
  loading: boolean;
  onActualiser: () => void;
  onMajStatut: (id: string, status: string) => void;
  /** VOLET 16 : création d'un devis directement depuis une demande. */
  onCreerDevis: (lead: Lead, messageTraduit?: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  /* VOLET 18 — TRADUCTION DES DEMANDES (back-office) : les demandes
     sont affichées TELLES QUELLES (langue d'origine) ; quand un
     message semble ANGLAIS, un bouton « Traduire en français »
     apparaît dans le détail — la traduction s'affiche SOUS
     l'original (jamais à la place) et pré-remplit le devis le cas
     échéant. Le service passe par /api/translate (session admin
     requise, MyMemory). */
  const [traductions, setTraductions] = useState<Record<string, string>>({});
  const [traductionEnCours, setTraductionEnCours] = useState<string | null>(null);
  const [erreurTraduction, setErreurTraduction] = useState<string | null>(null);

  /** Heuristique de langue : mots-outils discriminants FR vs EN
   *  (le message est comparé en minuscules, mots entiers). Suffisant
   *  pour proposer le bouton — la traduction reste toujours
   *  accessible manuellement si l'heuristique se trompe (bouton
   *  affiché aussi en français, cible alors l'anglais). */
  function messageSembleAnglais(message: string): boolean {
    const m = " " + message.toLowerCase().replace(/[\n\r]+/g, " ") + " ";
    const motsEn = [" the ", " and ", " i ", " my ", " me ", " you ", " your ", " is ", " are ", " for ", " with ", " hello ", " hi ", " please ", " website ", " need ", " would ", " could ", " business "];
    const motsFr = [" le ", " la ", " les ", " des ", " je ", " vous ", " votre ", " vos ", " et ", " pour ", " avec ", " bonjour ", " merci ", " site ", " besoin ", " entreprise ", " suis ", " avoir "];
    const en = motsEn.reduce((n, w) => n + (m.includes(w) ? 1 : 0), 0);
    const fr = motsFr.reduce((n, w) => n + (m.includes(w) ? 1 : 0), 0);
    return en > fr;
  }

  async function traduireDemande(lead: Lead) {
    setTraductionEnCours(lead.id);
    setErreurTraduction(null);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texte: lead.message,
          de: messageSembleAnglais(lead.message) ? "en" : "fr",
          vers: "fr",
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? "Traduction impossible.");
      }
      setTraductions((prec) => ({ ...prec, [lead.id]: data.traduction as string }));
    } catch (e) {
      setErreurTraduction(e instanceof Error ? e.message : "Traduction impossible.");
    } finally {
      setTraductionEnCours(null);
    }
  }

  const filtered = useMemo(
    () =>
      leads.filter(
        (l) =>
          (filter === "all" || l.status === filter) && (typeFilter === "all" || l.type === typeFilter),
      ),
    [leads, filter, typeFilter],
  );

  function exportCsv() {
    const rows = filtered.map((l) => [
      l.createdAt,
      l.type === "audit" ? "Audit gratuit" : l.type === "contact" ? "Message de contact" : "Devis",
      STATUS_LABELS[l.status] ?? l.status,
      l.name,
      l.email,
      l.phone ?? "",
      l.company ?? "",
      l.website ?? "",
      l.activity ?? "",
      l.serviceType ?? "",
      l.budget ?? "",
      l.timeline ?? "",
      l.message.replace(/\r?\n/g, " "),
    ]);
    const header = ["Date", "Type", "Statut", "Nom", "Email", "Téléphone", "Entreprise", "Site", "Activité", "Service", "Budget", "Échéance", "Message"];
    const csv = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `demandes-stevens-akpovi-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">
          Demandes reçues
          <span className="ml-2 align-middle text-sm font-normal text-[#c8c8c8]">({leads.length})</span>
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <BoutonAction onClick={onActualiser} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
            Actualiser
          </BoutonAction>
          <BoutonAction variant="principal" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="h-4 w-4" aria-hidden="true" />
            Exporter CSV ({filtered.length})
          </BoutonAction>
        </div>
      </div>

      {/* Filtres */}
      <div className="mt-6 flex flex-wrap items-center gap-2.5">
        {[
          { key: "all", label: `Toutes (${leads.length})` },
          ...LEAD_STATUSES.map((s) => ({
            key: s,
            label: `${STATUS_LABELS[s]} (${leads.filter((l) => l.status === s).length})`,
          })),
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`min-h-[40px] rounded-full px-4 py-2 text-xs font-medium transition-colors ${
              filter === f.key ? "border border-[#e4e4e4] bg-white text-[#1c1c1c]" : "border border-[#e4e4e4]/20 text-[#c8c8c8] hover:border-[#e4e4e4]/40"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="mx-2 hidden h-4 w-px bg-[#e4e4e4]/20 sm:block" aria-hidden="true" />
        {/* VOLET 16 : les filtres spécifiques d'abord, l'option
            combinée « Devis + Audits + Messages » en DERNIÈRE
            position (demande de l'éditeur). */}
        {[
          { key: "quote", label: "Devis" },
          { key: "audit", label: "Audits" },
          { key: "contact", label: "Messages" },
          { key: "all", label: "Devis + Audits + Messages" },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setTypeFilter(f.key)}
            className={`min-h-[40px] rounded-full px-4 py-2 text-xs font-medium transition-colors ${
              typeFilter === f.key ? "border border-[#e4e4e4] bg-white text-[#1c1c1c]" : "border border-[#e4e4e4]/20 text-[#c8c8c8] hover:border-[#e4e4e4]/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-[#e4e4e4]/12 bg-[#232323] py-16 text-center">
          <Inbox className="h-8 w-8 text-[#e4e4e4]" aria-hidden="true" />
          <p className="text-sm text-[#c8c8c8]">Aucune demande ne correspond à ces filtres.</p>
        </div>
      ) : (
        <div className="scroll-slim mt-8 overflow-x-auto rounded-2xl border border-[#e4e4e4]/12 bg-[#232323]">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e4e4e4]/10 text-[11px] tracking-widest text-[#c8c8c8] uppercase">
                <th className="px-5 py-4">Demande</th>
                <th className="px-5 py-4">Type</th>
                <th className="px-5 py-4">Contact</th>
                <th className="px-5 py-4">Statut</th>
                <th className="px-5 py-4">Reçue le</th>
                <th className="px-5 py-4" aria-label="Détails" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <React.Fragment key={lead.id}>
                  <tr className="border-b border-[#e4e4e4]/8 transition-colors hover:bg-[#2f2f2f]/40">
                    <td className="max-w-[240px] px-5 py-4">
                      <p className="font-medium text-white">{lead.name}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-[#c8c8c8]">
                        {lead.serviceType ?? lead.website ?? lead.message.slice(0, 60) + "…"}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-[#e4e4e4]/12 px-3 py-1 text-xs font-medium text-[#e4e4e4]">
                        {lead.type === "audit" ? "Audit" : lead.type === "contact" ? "Message" : "Devis"}
                      </span>
                    </td>
                    <td className="max-w-[220px] px-5 py-4 text-[#c8c8c8]">
                      <p className="break-all">{lead.email}</p>
                      {lead.phone && <p className="mt-0.5 text-xs">{lead.phone}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <label className="sr-only" htmlFor={`status-${lead.id}`}>
                        Statut de la demande de {lead.name}
                      </label>
                      <select
                        id={`status-${lead.id}`}
                        value={lead.status}
                        onChange={(e) => onMajStatut(lead.id, e.target.value)}
                        className={`min-h-[36px] rounded-full px-3 py-1.5 text-xs font-medium focus:outline-none ${STATUS_STYLES[lead.status] ?? ""}`}
                      >
                        {LEAD_STATUSES.map((s) => (
                          <option key={s} value={s} className="bg-[#232323] text-white">
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-[#c8c8c8]">
                      {formatDateHeure(lead.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* VOLET 16 : créer un devis directement depuis
                            une demande de devis reçue (formulaire
                            pré-rempli avec les coordonnées du
                            demandeur). */}
                        {lead.type === "quote" ? (
                          <button
                            type="button"
                            onClick={() => onCreerDevis(lead, traductions[lead.id])}
                            className="flex min-h-[36px] items-center gap-1.5 rounded-full border border-[#e4e4e4]/25 px-3.5 text-xs font-medium text-white transition-colors hover:border-[#e4e4e4]"
                            aria-label={`Créer un devis pour la demande de ${lead.name}`}
                            title={traductions[lead.id] ? "Créer un devis (formulaire pré-rempli, message traduit)" : "Créer un devis (formulaire pré-rempli)"}
                          >
                            <FilePlus2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Créer un devis
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}
                          aria-expanded={expanded === lead.id}
                          aria-label={`Détails de la demande de ${lead.name}`}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e4e4e4]/20 text-[#c8c8c8] transition-colors hover:border-[#e4e4e4] hover:text-[#e4e4e4]"
                        >
                          <ChevronRight
                            className={`h-4 w-4 transition-transform ${expanded === lead.id ? "rotate-90" : ""}`}
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded === lead.id && (
                    <tr className="border-b border-[#e4e4e4]/8 bg-[#1c1c1c]">
                      <td colSpan={6} className="px-5 py-6">
                        <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                          {[
                            ["Email", lead.email],
                            ["Téléphone", lead.phone ?? "—"],
                            ["Entreprise", lead.company ?? "—"],
                            ["Site concerné", lead.website ?? "—"],
                            ["Activité", lead.activity ?? "—"],
                            ["Service souhaité", lead.serviceType ?? "—"],
                            ["Budget", lead.budget ?? "—"],
                            ["Échéance", lead.timeline ?? "—"],
                            ["Source", lead.source ?? "—"],
                            ["Notification email", lead.emailSent ? "Envoyée" : "Non envoyée"],
                          ].map(([label, value]) => (
                            <div key={label}>
                              <dt className="text-[11px] tracking-widest text-[#c8c8c8] uppercase">{label}</dt>
                              <dd className="mt-1 break-words text-white">{value}</dd>
                            </div>
                          ))}
                          <div className="sm:col-span-2 lg:col-span-3">
                            <dt className="text-[11px] tracking-widest text-[#c8c8c8] uppercase">Message</dt>
                            <dd className="mt-1 whitespace-pre-line leading-relaxed text-[#d9d9d9]">{lead.message}</dd>
                            {/* VOLET 18 — bloc de traduction : affiché SOUS
                                l'original, jamais à sa place ; le bouton
                                apparaît quand le message semble anglais
                                (mais reste accessible pour tout message). */}
                            <div className="mt-3">
                              {!traductions[lead.id] ? (
                                <button
                                  type="button"
                                  onClick={() => traduireDemande(lead)}
                                  disabled={traductionEnCours === lead.id}
                                  className="flex min-h-[36px] items-center gap-1.5 rounded-full border border-[#e4e4e4]/25 px-3.5 text-xs font-medium text-white transition-colors hover:border-[#e4e4e4] disabled:opacity-50"
                                >
                                  {traductionEnCours === lead.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                                  ) : (
                                    <Languages className="h-3.5 w-3.5" aria-hidden="true" />
                                  )}
                                  {messageSembleAnglais(lead.message)
                                    ? "Traduire en français"
                                    : "Traduire en français (message français détecté — traduction de contrôle)"}
                                </button>
                              ) : (
                                <div className="rounded-xl border border-[#e4e4e4]/12 bg-[#232323] p-4">
                                  <p className="flex items-center gap-2 text-[11px] font-medium tracking-widest text-[#c8c8c8] uppercase">
                                    <Languages className="h-3.5 w-3.5" aria-hidden="true" />
                                    Traduction française (automatique)
                                  </p>
                                  <p className="mt-2 whitespace-pre-line leading-relaxed text-white">{traductions[lead.id]}</p>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setTraductions((prec) => {
                                        const copie = { ...prec };
                                        delete copie[lead.id];
                                        return copie;
                                      })
                                    }
                                    className="mt-3 text-xs text-[#c8c8c8] underline underline-offset-4 transition-colors hover:text-white"
                                  >
                                    Masquer la traduction
                                  </button>
                                </div>
                              )}
                              {erreurTraduction && traductionEnCours === null && (
                                <p className="mt-2 text-xs text-[#ff8080]" role="alert">{erreurTraduction}</p>
                              )}
                            </div>
                          </div>
                        </dl>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
 * SÉLECTION DU DEVIS À FACTURER (VOLET 15) — « Créer une nouvelle
 * facture » présente TOUS les devis existants (ordre de création) ;
 * l'éditeur en sélectionne un, soumet, et l'espace de génération de
 * facture s'ouvre pour ce devis.
 * ------------------------------------------------------------------ */
function SelectionDevis({
  documents,
  onChoisir,
  onCreerDevis,
  /* VOLET 24 — clic sur le statut « Facturée (n°) » d'un devis déjà
     facturé : la facture s'ouvre en APERÇU PLEIN ÉCRAN SUR PLACE —
     fermé, on RETROUVE la page de sélection des devis (plus de
     bascule vers la liste des factures — demande de l'éditeur : «
     quand on ferme l'aperçu, on devrait se retrouver sur la page où
     on était, c'est-à-dire la page de sélection des devis »). */
  onVoirFacture,
}: {
  documents: ToutDocument[];
  onChoisir: (devis: DocumentRecord) => void;
  /** VOLET 16 : depuis l'état « aucun devis », un bouton « Créer un
      devis » ouvre directement l'espace de création de devis. */
  onCreerDevis: () => void;
  onVoirFacture: (facture: DocumentRecord) => void;
}) {
  const devis = useMemo(
    () =>
      documents
        .filter((d): d is DocumentRecord => d.docType === "devis")
        .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || "")),
    [documents],
  );
  const [choisi, setChoisi] = useState<string | null>(null);

  if (devis.length === 0) {
    return (
      <Carte className="flex flex-col items-center gap-4 px-6 py-16 text-center">
        <FileText className="h-8 w-8 text-[#e4e4e4]" aria-hidden="true" />
        <p className="max-w-md text-sm leading-relaxed text-[#c8c8c8]">
          Aucun devis n&apos;est créé pour le moment. Pour pouvoir facturer et
          créer une facture, commencez par créer un devis — la facture
          reprend toujours les prestations et le total d&apos;un devis.
        </p>
        <BoutonAction variant="principal" onClick={onCreerDevis}>
          <FilePlus2 className="h-4 w-4" aria-hidden="true" />
          Créer un devis
        </BoutonAction>
      </Carte>
    );
  }

  return (
    <Carte>
      {/* VOLET 23 — PLUS DE DÉFILEMENT HORIZONTAL ni de largeur
          minimale : le tableau s'arrête sur sa dernière colonne,
          comme les listes de documents. */}
      <div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#e4e4e4]/10 text-[11px] tracking-widest text-[#c8c8c8] uppercase">
              <th className="w-12 px-5 py-4" aria-label="Sélection" />
              <th className="px-5 py-4">Numéro</th>
              <th className="px-5 py-4">Client</th>
              <th className="px-5 py-4">Date</th>
              <th className="px-5 py-4">Total</th>
              <th className="px-5 py-4">Statut</th>
            </tr>
          </thead>
          <tbody>
            {devis.map((d) => {
              const facture = documents.find((f) => f.docType === "facture" && f.devisSource === d.numero);
              const selectionne = choisi === d.id;
              /* VOLET 22 — un devis DÉJÀ FACTURÉ ne peut pas être
                 sélectionné (grisé) : sa facture existe déjà
                 (demande de l'éditeur) — mais son statut « Facturée
                 (n°) » reste CLIQUABLE et amène à la facture.
                 VOLET 23 — SEUL le statut reste AU CLAIR : la rangée
                 grise chaque cellule SAUF le statut (demande de
                 l'éditeur : « le statut ne doit pas être grisé — le
                 statut seul doit être dégrisé pour faire savoir que
                 c'est cliquable »).
                 CORRECTIF 28/11/2026 (M22) — retour de l'éditeur : «
                 lorsqu'on sélectionne un devis, il devait être
                 possible de le DÉSÉLECTIONNER dans le cas où on a
                 fait l'erreur de sélectionner le devis. On devra
                 pouvoir le sélectionner comme le désélectionner » :
                 cliquer un devis DÉJÀ SÉLECTIONNÉ le désélectionne
                 (rangée comme radio) — le bouton « Continuer » se
                 regrise en conséquence. */
              const dejaFacture = Boolean(facture);
              return (
                <tr
                  key={d.id}
                  onClick={() => {
                    if (dejaFacture) return;
                    setChoisi(selectionne ? null : d.id);
                  }}
                  aria-disabled={dejaFacture || undefined}
                  className={`border-b border-[#e4e4e4]/8 transition-colors ${
                    dejaFacture
                      ? "cursor-not-allowed"
                      : "cursor-pointer hover:bg-[#2f2f2f]/40"
                  } ${selectionne ? "bg-[#2f2f2f]" : ""}`}
                >
                  <td className={`px-5 py-4 ${dejaFacture ? "opacity-45" : ""}`}>
                    <input
                      type="radio"
                      name="devis-a-facturer"
                      checked={selectionne}
                      onChange={() => setChoisi(selectionne ? null : d.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (dejaFacture) e.preventDefault();
                      }}
                      disabled={dejaFacture}
                      aria-label={
                        dejaFacture
                          ? `Devis ${d.numero} déjà facturé (${facture!.numero}) — non sélectionnable`
                          : selectionne
                            ? `Désélectionner le devis ${d.numero} de ${d.client.nom}`
                            : `Sélectionner le devis ${d.numero} de ${d.client.nom}`
                      }
                      className="h-4 w-4 accent-[#e4e4e4]"
                    />
                  </td>
                  <td className={`whitespace-nowrap px-5 py-4 font-medium text-white ${dejaFacture ? "opacity-45" : ""}`}>{d.numero}</td>
                  <td className={`max-w-[220px] px-5 py-4 ${dejaFacture ? "opacity-45" : ""}`}>
                    <p className="truncate font-medium text-white">{d.client.nom}</p>
                    {d.client.entreprise ? <p className="truncate text-xs text-[#c8c8c8]">{d.client.entreprise}</p> : null}
                  </td>
                  <td className={`whitespace-nowrap px-5 py-4 text-[#c8c8c8] ${dejaFacture ? "opacity-45" : ""}`}>{formatDate(d.date)}</td>
                  <td className={`whitespace-nowrap px-5 py-4 font-medium text-white ${dejaFacture ? "opacity-45" : ""}`}>
                    {formatCurrency(totalDocument(d.items), d.devise)}
                  </td>
                  <td className="px-5 py-4">
                    {facture ? (
                      /* VOLET 22 — statut CLIQUABLE : la facture
                         s'ouvre en APERÇU plein écran (VOLET 24 : sur
                         place, sans quitter la sélection). */
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onVoirFacture(facture as DocumentRecord);
                        }}
                        title={`Voir la facture ${facture.numero}`}
                        className="cursor-pointer rounded-full transition-transform hover:scale-[1.03] focus:outline-none"
                      >
                        <Pastille ton="valide">Facturée ({facture.numero})</Pastille>
                      </button>
                    ) : (
                      <Pastille>À facturer</Pastille>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e4e4e4]/10 px-5 py-4">
        <p className="text-xs text-[#c8c8c8]">
          {choisi
            ? "Cliquez de nouveau sur le devis sélectionné pour le désélectionner."
            : "Cliquez sur un devis pour le sélectionner — la facture reprendra exactement ses prestations et son total."}
        </p>
        <BoutonAction
          variant="principal"
          disabled={!choisi}
          onClick={() => {
            const d = devis.find((x) => x.id === choisi);
            if (d) onChoisir(d);
          }}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          Continuer
        </BoutonAction>
      </div>
    </Carte>
  );
}

/* ------------------------------------------------------------------
 * PAGE ADMIN — coquille back-office
 * ------------------------------------------------------------------ */
export function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [section, setSection] = useState<Section>("tableau");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<ToutDocument[]>([]);
  const [docsChargement, setDocsChargement] = useState(false);
  const [stockageConfigure, setStockageConfigure] = useState(false);
  const [emailConfigure, setEmailConfigure] = useState(false);
  /* VOLET 24 — PROJETS DU PORTFOLIO (pour le COMPTEUR de l'option
   *  « Portfolio du site » du tableau de bord — demande de
   *  l'éditeur : « à droite du nom de l'option, le nombre total de
   *  projets réalisés présentés sur le site, comme les rubriques
   *  de documents affichent leur nombre »). */
  const [projetsPortfolio, setProjetsPortfolio] = useState<{ id: string; statut: string }[]>([]);
  const [portfolioSiteSupprimes, setPortfolioSiteSupprimes] = useState<string[]>([]);
  const { toast } = useToast();

  /* VOLET 15 — vues des rubriques documents. */
  const [vueDocs, setVueDocs] = useState<VueDocs>("liste");
  const [docEnEdition, setDocEnEdition] = useState<ToutDocument | null>(null);
  const [vueFactures, setVueFactures] = useState<VueFactures>("liste");
  const [factureCible, setFactureCible] = useState<DocumentRecord | null>(null);
  /* VOLET 24 — facture ouverte en APERÇU PLEIN ÉCRAN depuis le statut
   *  « Facturée (n°) » de la SÉLECTION de devis : l'aperçu vit SUR
   *  PLACE dans la vue de sélection — fermé (croix ou Échap), on
   *  RETROUVE la sélection des devis (plus de bascule vers la liste
   *  des factures — demande de l'éditeur). */
  const [apercuFacture, setApercuFacture] = useState<DocumentRecord | null>(null);
  /* VOLET 16 — pré-remplissage d'un nouveau devis depuis une demande. */
  const [preRemplissage, setPreRemplissage] = useState<PreRemplissage | null>(null);
  /* VOLET 29 — AMORCE DE L'AUDIT depuis l'espace Prospects (bouton
   *  « Analyser » d'un prospect) : l'URL est PRÉREMPLIE dans
   *  l'outil d'audit complet, l'analyse démarre directement, et le
   *  PROSPECT est retenu pour personnaliser l'email proposé à
   *  partir du rapport. */
  const [auditAmorce, setAuditAmorce] = useState<{
    url: string;
    cle: number;
    prospect?: ProspectAudit;
  } | null>(null);
  /* VOLET 29 — chaque arrivée dans l'espace Prospects recharge le
   *  tableau (notamment après un import depuis le scraping). */
  const [prospectsRafraichir, setProspectsRafraichir] = useState(0);

  /* CORRECTIF 28/11/2026 — SESSION EXPIRÉE (retour de l'éditeur : « une
   *  toast me dit portfolio non autorisé en rouge… corrige-moi ça une
   *  fois pour toutes et plus jamais ce genre d'erreur ne passe »).
   *
   * Quand un appel API de l'espace admin répond 401 (session fermée
   * depuis trop longtemps — l'onglet est resté ouvert), l'espace ne
   * montre PLUS un toast rouge « Non autorisé » incompréhensible ni
   * des compteurs figés : il revient à l'ÉCRAN DE CONNEXION avec un
   * message clair. La session vit désormais 30 jours (admin-auth),
   * et ce filet de sécurité garantit qu'aucune réponse 401 ne
   * s'affiche plus jamais telle quelle. */
  const sessionExpiree = useCallback(() => {
    setAuthed(false);
    setSection("tableau");
    setVueDocs("liste");
    toast({
      title: "Session expirée",
      description:
        "Par sécurité, la session de l'espace admin s'est fermée après une longue période — reconnectez-vous, tout est en ordre.",
      variant: "destructive",
    });
  }, [toast]);

  const chargerDocuments = useCallback(async () => {
    setDocsChargement(true);
    try {
      const res = await fetch("/api/documents", { cache: "no-store" });
      /* 401 = session expirée : retour PROPRE à l'écran de connexion
       * (plus jamais de données silencieusement figées — correctif du
       * 28/11 : le compteur portfolio restait à son ancienne valeur
       * sans qu'on comprenne pourquoi). */
      if (res.status === 401) {
        sessionExpiree();
        return;
      }
      const data = await res.json();
      if (data?.ok) {
        setDocuments((data.documents ?? []) as ToutDocument[]);
        setStockageConfigure(Boolean(data.stockageConfigure));
        setEmailConfigure(Boolean(data.emailConfigure));
      }
    } catch {
      /* silencieux : le bandeau du tableau de bord informe */
    } finally {
      setDocsChargement(false);
    }
  }, [sessionExpiree]);

  /* VOLET 24 — PROJETS DU PORTFOLIO : projets administrés (avec leur
   *  statut) + identifiants des réalisations du site supprimées —
   *  sert au COMPTEUR de l'option « Portfolio du site ». */
  const chargerProjets = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/projects", { cache: "no-store" });
      if (res.status === 401) {
        sessionExpiree();
        return;
      }
      const data = await res.json();
      if (data?.ok) {
        setProjetsPortfolio(
          (data.projets ?? []).map((p: { id?: string; statut?: string }) => ({
            id: String(p.id ?? ""),
            statut: String(p.statut ?? "brouillon"),
          })),
        );
        setPortfolioSiteSupprimes(Array.isArray(data.siteSupprimes) ? (data.siteSupprimes as string[]) : []);
      }
    } catch {
      /* silencieux : le compteur reste à sa dernière valeur */
    }
  }, [sessionExpiree]);

  /* CORRECTIF M26 (28/11/2026) — COMPTEUR TOUJOURS JUSTE, À L'INSTANT :
   *  la relecture du stockage GitHub juste après une écriture peut
   *  être PÉRIMÉE (lecture-après-écriture non garantie — mesuré :
   *  jusqu'à ~4 s) : le compteur restait figé après une publication
   *  puis sautait tard. Chaque action du portfolio met donc à jour
   *  l'état D'APRÈS LA RÉPONSE du serveur (le projet complet
   *  enregistré) — le compteur bouge AU MÊME INSTANT que l'action. */
  const majProjetPortfolio = useCallback((projet: { id: string; statut: string }) => {
    setProjetsPortfolio((anciens) => [
      ...anciens.filter((p) => p.id !== projet.id),
      { id: projet.id, statut: projet.statut },
    ]);
  }, []);

  const supprimerProjetPortfolio = useCallback((id: string, site?: boolean) => {
    setProjetsPortfolio((anciens) => anciens.filter((p) => p.id !== id));
    if (site) {
      setPortfolioSiteSupprimes((anciens) => (anciens.includes(id) ? anciens : [...anciens, id]));
    }
  }, []);

  const chargerDemandes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/leads", { cache: "no-store" });
      if (res.status === 401) {
        sessionExpiree();
        return;
      }
      const data = await res.json();
      if (data?.ok) setLeads(data.leads as Lead[]);
    } catch {
      toast({ title: "Chargement impossible", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, sessionExpiree]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/leads", { cache: "no-store" });
        if (res.status === 401) {
          setAuthed(false);
          return;
        }
        const data = await res.json();
        setAuthed(true);
        if (data?.ok) setLeads(data.leads as Lead[]);
        chargerDocuments();
        chargerProjets();
      } catch {
        setAuthed(false);
      }
    })();
  }, [chargerDocuments, chargerProjets]);

  async function majStatut(id: string, status: string) {
    const prev = leads;
    setLeads((list) => list.map((l) => (l.id === id ? { ...l, status } : l)));
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.status === 401) {
        sessionExpiree();
        return;
      }
      if (!res.ok) throw new Error();
    } catch {
      setLeads(prev);
      toast({ title: "Mise à jour impossible", variant: "destructive" });
    }
  }

  async function deconnexion() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setLeads([]);
    setDocuments([]);
    setVueDocs("liste");
    setDocEnEdition(null);
    setVueFactures("liste");
    setFactureCible(null);
    setApercuFacture(null);
    setPreRemplissage(null);
    /* VOLET 17 : icône verte sur le toast de déconnexion. */
    toast({
      title: "Espace fermé",
      description: "À bientôt dans votre back-office.",
      icon: <LogOut className="h-5 w-5 text-[#22c55e]" aria-hidden="true" />,
    });
  }

  /** Changement de rubrique : les listes reprennent la main. */
  function allerA(s: Section) {
    setSection(s);
    setVueDocs("liste");
    setDocEnEdition(null);
    setVueFactures("liste");
    /* VOLET 29 — arrivée dans Prospects : le tableau se RECHARGE
     *  (il reflète immédiatement le dernier import du scraping) ;
     *  arrivée dans Audit par la NAVIGATION (pas par le bouton
     *  « Analyser », qui passe par amenerVersAudit) : l'amorce est
     *  oubliée — le champ URL repart vide. */
    if (s === "prospects") setProspectsRafraichir((n) => n + 1);
    if (s === "audit") setAuditAmorce(null);
  }

  /** VOLET 29 — depuis le bouton « Analyser » d'un prospect de
   *  l'espace Prospects : ouvre l'outil d'AUDIT COMPLET avec l'URL du
   *  site du prospect PRÉREMPLIE — l'analyse démarre directement, et
   *  le prospect est retenu pour personnaliser l'email proposé. */
  function amenerVersAudit(prospect: ProspectAmorce) {
    setAuditAmorce({
      url: prospect.url,
      cle: Date.now(),
      prospect: {
        nom: prospect.nom,
        email: prospect.email,
        dirigeant: prospect.dirigeant,
        nicheProspection: prospect.nicheProspection,
        niche: prospect.niche,
      },
    });
    setSection("audit");
    setVueDocs("liste");
    setVueFactures("liste");
  }

  /** Raccourci « Créer… » : ouvre directement l'espace de création. */
  function ouvrirCreation(s: "propositions" | "devis") {
    setSection(s);
    setVueDocs("creation");
    setDocEnEdition(null);
    setVueFactures("liste");
    if (s === "devis") setPreRemplissage(null);
  }

  /** VOLET 16 — créer un devis DEPUIS UNE DEMANDE reçue : l'espace
      de création s'ouvre avec les coordonnées du demandeur
      pré-remplies et un récapitulatif de sa demande. VOLET 18 : si la
      demande a été TRADUITE (client anglophone), le récapitulatif
      affiche le message TRADUIT en français — la version d'origine
      reste lisible dans le tableau des demandes. */
  function creerDevisDepuisDemande(lead: Lead, messageTraduit?: string) {
    setSection("devis");
    setVueDocs("creation");
    setDocEnEdition(null);
    setVueFactures("liste");
    setPreRemplissage({
      client: {
        nom: lead.name || "",
        email: lead.email || "",
        telephone: lead.phone || "",
        entreprise: lead.company || "",
      },
      origine: {
        nom: lead.name,
        email: lead.email,
        telephone: lead.phone,
        entreprise: lead.company,
        date: formatDateHeure(lead.createdAt),
        message: messageTraduit ?? lead.message,
      },
    });
  }

  /** Raccourci « Nouvelle facture » : ouvre la sélection du devis. */
  function ouvrirSelectionFacture() {
    setSection("factures");
    setVueDocs("liste");
    setDocEnEdition(null);
    setVueFactures("selection");
  }

  /** VOLET 20 — générer un DEVIS depuis une proposition commerciale
   *  (bouton « générer le devis » de la liste des propositions) :
   *  l'espace de création s'ouvre PRÉ-REMPLI — nom du destinataire,
   *  numéro client, montant, périmètre rédigé en texte riche mis en
   *  forme, délai, calendrier, modalités en notes (rédaction experte
   *  de devis). */
  function creerDevisDepuisProposition(prop: PropositionRecord) {
    setSection("devis");
    setVueDocs("creation");
    setDocEnEdition(null);
    setVueFactures("liste");
    setPreRemplissage(preRemplissageDevisDepuisProposition(prop));
  }

  /** VOLET 20 — devis MARQUÉ SIGNÉ (PDF téléversé) : redirection
   *  automatique vers la GÉNÉRATION DE FACTURE de ce devis (demande
   *  de l'éditeur : « lorsqu'on marque un devis signé,
   *  automatiquement on est redirigé vers la génération de facture
   *  de ce devis »). */
  function devisSigne(devis: DocumentRecord) {
    setFactureCible(devis);
  }

  /** Icône « modifier » d'un document de la liste. */
  function modifierDocument(d: ToutDocument) {
    setDocEnEdition(d);
    setVueDocs("edition");
  }

  const nb = {
    demandes: leads.length,
    nouvelles: leads.filter((l) => l.status === "new").length,
    devis: documents.filter((d) => d.docType === "devis").length,
    factures: documents.filter((d) => d.docType === "facture").length,
    propositions: documents.filter((d) => d.docType === "proposition").length,
    /* CORRECTIF 28/11 — le compteur de l'option « Portfolio » est le
     *  TOTAL des projets CONTENUS DANS L'ESPACE (publiés ET
     *  brouillons — demande de l'éditeur) : projets administrés
     *  (tous statuts) + réalisations du site encore en place. */
    portfolio:
      projetsPortfolio.length +
      (PROJETS_SITE as readonly { id: string }[]).filter(
        (p) =>
          !projetsPortfolio.some((x) => x.id === p.id) &&
          !portfolioSiteSupprimes.includes(p.id),
      ).length,
  };

  const prochainNumero = useMemo(
    () => documents.reduce((max, d) => Math.max(max, Number(d.numeroClient) || 0), 0) + 1,
    [documents],
  );

  /* VOLET 23 — ANTI-DOUBLON (demande de l'éditeur : « une fois que
   *  c'est enregistré, si on clique encore sur générer, ça doit
   *  REFUSER par un toast et dire que le document existe déjà —
   *  pareil pour la génération de devis, etc. ») : numéros déjà
   *  générés par type, transmis aux générateurs. */
  const numerosPropositions = useMemo(
    () => documents.filter((d) => d.docType === "proposition").map((d) => d.numero),
    [documents],
  );
  const numerosDevis = useMemo(
    () => documents.filter((d) => d.docType === "devis").map((d) => d.numero),
    [documents],
  );

  const totalFacture = useMemo(
    () =>
      documents
        .filter((d): d is DocumentRecord => d.docType === "facture")
        .reduce((somme, d) => somme + totalDocument(d.items), 0),
    [documents],
  );

  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#e4e4e4]" aria-hidden="true" />
      </div>
    );
  }

  if (!authed) {
    return (
      <LoginPanel
        onSuccess={() => {
          setAuthed(true);
          chargerDemandes();
          chargerDocuments();
          /* VOLET 24 — le compteur de l'option « Portfolio du site » se
           *  remplit dès la connexion (comme les documents). */
          chargerProjets();
        }}
      />
    );
  }

  /* VOLET 15 — les Propositions commerciales précèdent les Devis ;
   * « Factures & documents » disparaît au profit de « Factures ».
   * VOLET 19 — rubrique PORTFOLIO : projets ajoutés au site depuis
   * l'espace admin (brouillon / publication), demande de
   * l'éditeur du 26/11/2026. */
  const NAV: { key: Section; label: string; icone: React.ReactNode; compteur?: number }[] = [
    /* CORRECTIF 28/11 (soir) — le bouton « Tableau de bord » est
     * RETIRÉ de la navigation : le LOGO du header joue désormais ce
     * rôle (demande de l'éditeur). L'option « propositions » porte
     * le libellé court « Propositions » (l'éditeur) — le contenu et
     * les titres de l'espace restent inchangés. VOLET 28 — nouvelle
     * rubrique « Audit » : analyse de sites web (performance, SEO,
     * design & copywriting). */
    { key: "demandes", label: "Demandes", icone: <Inbox className="h-4 w-4" aria-hidden="true" />, compteur: nb.demandes },
    { key: "propositions", label: "Propositions", icone: <Handshake className="h-4 w-4" aria-hidden="true" />, compteur: nb.propositions },
    { key: "devis", label: "Devis", icone: <FileText className="h-4 w-4" aria-hidden="true" />, compteur: nb.devis },
    { key: "factures", label: "Factures", icone: <Receipt className="h-4 w-4" aria-hidden="true" />, compteur: nb.factures },
    /* CORRECTIF 28/11 — l'option s'appelle « Portfolio » (demande de
     *  l'éditeur) ; son compteur est le TOTAL des projets de l'espace
     *  (publiés + brouillons). VOLET 27 — nouvelle rubrique
     *  « Scraping » : prospection d'entreprises (Google Maps,
     *  Instagram, LinkedIn). */
    { key: "portfolio", label: "Portfolio", icone: <Briefcase className="h-4 w-4" aria-hidden="true" />, compteur: nb.portfolio },
    { key: "scraping", label: "Scraping", icone: <Radar className="h-4 w-4" aria-hidden="true" /> },
    /* VOLET 29 — nouvelle rubrique « Prospects » : le tableau de tous
     *  les prospects importés du scraping (par lots, avec leur
     *  message personnalisé et leur suivi RDV / converti). */
    { key: "prospects", label: "Prospects", icone: <Users className="h-4 w-4" aria-hidden="true" /> },
    { key: "audit", label: "Audit", icone: <Gauge className="h-4 w-4" aria-hidden="true" /> },
  ];

  /* En-tête commun des rubriques de liste (titre + bouton créer). */
  function EnteteListe({
    titre,
    compteur,
    libelleBouton,
    onCreer,
  }: {
    titre: string;
    compteur: number;
    libelleBouton: string;
    onCreer: () => void;
  }) {
    return (
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">
          {titre}
          <span className="ml-2 align-middle text-sm font-normal text-[#c8c8c8]">({compteur})</span>
        </h2>
        <BoutonAction variant="principal" onClick={onCreer}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {libelleBouton}
        </BoutonAction>
      </div>
    );
  }

  /* En-tête des espaces création / édition / sélection (retour). */
  function EnteteDocument({
    titre,
    description,
    onRetour,
    libelleRetour,
  }: {
    titre: string;
    description: string;
    onRetour: () => void;
    libelleRetour: string;
  }) {
    return (
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">{titre}</h2>
          <p className="mt-1 text-sm text-[#c8c8c8]">{description}</p>
        </div>
        <BoutonAction onClick={onRetour}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {libelleRetour}
        </BoutonAction>
      </div>
    );
  }

  return (
    <div className="section-deep min-h-screen">
      {/* Barre supérieure — VOLET 20 (26/11/2026) : logo AGRANDI
          pour que sa HAUTEUR VISUELLE s'aligne sur celle des deux
          boutons de droite (Actualiser / Fermer L'Espace, 44 px —
          le glyphe du logo n'occupe que ~58 % de la hauteur du
          fichier, il faut donc ~75 px de boîte pour 44 px de
          contenu) ; la mention « BACK-OFFICE » est désormais
          CENTRÉE VERTICALEMENT par rapport au logo (demande de
          l'éditeur), plus calée vers le bas. */}
      <div className="border-b border-[#e4e4e4]/10 bg-[#070707]">
        {/* VOLET 22 — ESPACES INTERNES du header RÉDUITS DE MOITIÉ
            (py-4 → py-2) : le header du back-office était trop haut
            verticalement (demande de l'éditeur). */}
        <div className="container-site flex flex-wrap items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-4">
            {/* CORRECTIF 28/11 (soir) — le LOGO joue le rôle du bouton
                « Tableau de bord » : un clic ramène au tableau de bord
                (demande de l'éditeur). */}
            <button
              type="button"
              onClick={() => allerA("tableau")}
              aria-label="Tableau de bord"
              title="Tableau de bord"
              className="group/logo flex shrink-0 items-center rounded-xl outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-[#e4e4e4]/60"
            >
              <img
                src={ASSETS.logoLight}
                alt="Stevens Akpovi"
                width={55}
                height={44}
                className="h-[75px] w-auto self-center transition-opacity group-hover/logo:opacity-85"
              />
            </button>
            <h1 className="self-center text-[13px] font-semibold tracking-[0.24em] text-[#c8c8c8] uppercase">
              Back-office
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <BoutonAction
              onClick={() => {
                chargerDemandes();
                chargerDocuments();
                chargerProjets();
              }}
              disabled={loading || docsChargement}
              titre="Tout actualiser"
            >
              <RefreshCw className={`h-4 w-4 ${loading || docsChargement ? "animate-spin" : ""}`} aria-hidden="true" />
              Actualiser
            </BoutonAction>
            <BoutonAction onClick={deconnexion}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Fermer L&apos;Espace
            </BoutonAction>
          </div>
        </div>
      </div>

      {/* Navigation (onglets horizontaux) + contenu */}
      <div className="container-site py-8">
        <nav aria-label="Sections du back-office" className="scroll-slim -mx-1 mb-8 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {/* VOLET 29 — onglets COMPACTS : huit rubriques désormais
              (Prospects s'ajoute), elles tiennent en une seule ligne
              sans coupe au bord droit. */}
          {NAV.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => allerA(item.key)}
              aria-current={section === item.key ? "page" : undefined}
              className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] transition-colors ${
                section === item.key
                  ? "border-[#e4e4e4] bg-white text-[#1c1c1c] font-medium"
                  : "border-[#e4e4e4]/20 text-[#c8c8c8] hover:border-[#e4e4e4]/50 hover:text-white"
              }`}
            >
              {item.icone}
              {item.label}
              {typeof item.compteur === "number" ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    section === item.key ? "bg-[#1c1c1c] text-white" : "bg-[#e4e4e4]/12 text-[#e4e4e4]"
                  }`}
                >
                  {item.compteur}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        {/* ---------------- TABLEAU DE BORD ---------------- */}
        {section === "tableau" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Demandes reçues", valeur: nb.demandes, note: `${nb.nouvelles} nouvelle${nb.nouvelles > 1 ? "s" : ""}`, section: "demandes" as Section },
                { label: "Propositions commerciales", valeur: nb.propositions, note: "offres prêtes à générer", section: "propositions" as Section },
                { label: "Devis", valeur: nb.devis, note: `prochain n° client : ${prochainNumero}`, section: "devis" as Section },
                { label: "Factures", valeur: nb.factures, note: totalFacture ? `total facturé : ${formatCurrency(totalFacture, documents.find((d) => d.docType === "facture")?.devise ?? "XOF")}` : "aucune pour l'heure", section: "factures" as Section },
              ].map((carte) => (
                <button
                  key={carte.label}
                  type="button"
                  onClick={() => allerA(carte.section)}
                  className="rounded-2xl border border-[#e4e4e4]/12 bg-[#232323] p-5 text-left transition-colors hover:border-[#e4e4e4]/40"
                >
                  <p className="text-xs font-semibold tracking-[0.18em] text-[#c8c8c8] uppercase">{carte.label}</p>
                  <p className="mt-3 font-display text-4xl font-semibold text-white">{carte.valeur}</p>
                  <p className="mt-1 text-xs text-[#c8c8c8]">{carte.note}</p>
                </button>
              ))}
            </div>

            {/* État du système */}
            <Carte className="p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-[#e4e4e4]" aria-hidden="true" />
                <h3 className="font-display text-base font-semibold text-white">État du système</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-[#e4e4e4]/10 bg-[#1c1c1c] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">Stockage des documents</p>
                    <Pastille ton={stockageConfigure ? "valide" : "alerte"}>
                      {stockageConfigure ? "Actif" : "Non configuré"}
                    </Pastille>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[#c8c8c8]">
                    {stockageConfigure
                      ? "Les documents générés sont archivés dans le dépôt GitHub privé dédié et servis ici (liste, aperçu, téléchargement)."
                      : "Définissez GITHUB_DOCS_TOKEN (jeton GitHub avec accès au dépôt privé SteveMarketing-Documents) dans les variables d'environnement du serveur — voir DEPLOIEMENT.md. La génération fonctionne déjà ; seul l'archivage attend cette variable."}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e4e4e4]/10 bg-[#1c1c1c] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">Emails du site (visiteurs)</p>
                    <Pastille ton={emailConfigure ? "valide" : "alerte"}>
                      {emailConfigure ? "Actifs" : "Non configurés"}
                    </Pastille>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[#c8c8c8]">
                    {emailConfigure
                      ? "Seules les demandes des visiteurs du site (devis, audit, contact) partent par email. Les documents, prospects et audits du back-office ne sont plus envoyés par email : tout est archivé dans le dépôt GitHub privé."
                      : "Définissez RESEND_API_KEY pour recevoir par email les demandes des visiteurs du site (devis, audit, contact) — voir DEPLOIEMENT.md. Les documents du back-office ne sont jamais envoyés par email : ils sont archivés dans GitHub."}
                  </p>
                </div>
              </div>
            </Carte>

            {/* Raccourcis */}
            <div className="flex flex-wrap gap-3">
              <BoutonAction variant="principal" onClick={() => ouvrirCreation("propositions")}>
                <Handshake className="h-4 w-4" aria-hidden="true" />
                Nouvelle proposition
              </BoutonAction>
              <BoutonAction onClick={() => ouvrirCreation("devis")}>
                <FileText className="h-4 w-4" aria-hidden="true" />
                Nouveau devis
              </BoutonAction>
              <BoutonAction onClick={ouvrirSelectionFacture}>
                <Receipt className="h-4 w-4" aria-hidden="true" />
                Nouvelle facture
              </BoutonAction>
              {/* VOLET 19 — raccourci vers la gestion du portfolio. */}
              <BoutonAction onClick={() => allerA("portfolio")}>
                <Briefcase className="h-4 w-4" aria-hidden="true" />
                Ajouter un projet au portfolio
              </BoutonAction>
            </div>
          </div>
        )}

        {/* ---------------- DEMANDES ---------------- */}
        {section === "demandes" && (
          <PanneauDemandes
            leads={leads}
            loading={loading}
            onActualiser={chargerDemandes}
            onMajStatut={majStatut}
            onCreerDevis={creerDevisDepuisDemande}
          />
        )}

        {/* ---------------- PROPOSITIONS COMMERCIALES ----------------
            VOLET 16 : gabarit personnel de l'éditeur (PDF fourni en
            exemple) — formulaire structuré par sections. */}
        {section === "propositions" && vueDocs === "creation" && (
          <>
            <EnteteDocument
              titre="Nouvelle proposition commerciale"
              description="Rédigez chaque section de votre proposition : le document suit exactement votre gabarit, paginé automatiquement."
              onRetour={() => allerA("propositions")}
              libelleRetour="Retour aux propositions"
            />
            <GenerateurProposition
              key={`proposition-${prochainNumero}`}
              prochainNumero={prochainNumero}
              stockageConfigure={stockageConfigure}
              onEnregistre={chargerDocuments}
              toast={toast}
              sessionExpiree={sessionExpiree}
              /* VOLET 23 — anti-doublon : numéros de propositions déjà
                  générées. */
              numerosExistants={numerosPropositions}
            />
          </>
        )}
        {section === "propositions" && vueDocs === "edition" && docEnEdition && estPropositionV2(docEnEdition) && (
          <>
            <EnteteDocument
              titre={`Modifier la proposition ${docEnEdition.numero}`}
              description="Ajustez la proposition, puis régénérez le PDF mis à jour."
              onRetour={() => allerA("propositions")}
              libelleRetour="Retour aux propositions"
            />
            <GenerateurProposition
              key={`edition-${docEnEdition.id}`}
              prochainNumero={prochainNumero}
              stockageConfigure={stockageConfigure}
              onEnregistre={chargerDocuments}
              toast={toast}
              sessionExpiree={sessionExpiree}
              initial={docEnEdition}
              numerosExistants={numerosPropositions}
            />
          </>
        )}
        {section === "propositions" && vueDocs === "edition" && docEnEdition && !estPropositionV2(docEnEdition) && (
          <>
            <EnteteDocument
              titre={`Modifier la proposition ${docEnEdition.numero}`}
              description="Proposition créée avec l'ancien gabarit — elle reste modifiable ici."
              onRetour={() => allerA("propositions")}
              libelleRetour="Retour aux propositions"
            />
            <GenerateurDocument
              key={`edition-${docEnEdition.id}`}
              docType="proposition"
              initial={docEnEdition}
              prochainNumero={prochainNumero}
              stockageConfigure={stockageConfigure}
              onEnregistre={chargerDocuments}
              toast={toast}
              sessionExpiree={sessionExpiree}
            />
          </>
        )}
        {/* VOLET 17 : la vue liste n'apparaît PLUS sous la page de
            création — uniquement sur la page de présentation. */}
        {section === "propositions" && (vueDocs === "liste" || (vueDocs === "edition" && !docEnEdition)) && (
          <>
            <EnteteListe
              titre="Propositions commerciales"
              compteur={nb.propositions}
              libelleBouton="Créer une nouvelle proposition"
              onCreer={() => ouvrirCreation("propositions")}
            />
            <ListeDocuments
              docType="proposition"
              documents={documents}
              chargement={docsChargement}
              stockageConfigure={stockageConfigure}
              onRafraichir={chargerDocuments}
              toast={toast}
              sessionExpiree={sessionExpiree}
              onModifier={modifierDocument}
              /* VOLET 20 — générer un devis pré-rempli depuis la
                  proposition (rédaction experte). */
              onGenererDevis={creerDevisDepuisProposition}
            />
          </>
        )}

        {/* ---------------- DEVIS ---------------- */}
        {section === "devis" && vueDocs === "creation" && (
          <>
            <EnteteDocument
              titre="Nouveau devis"
              description="Renseignez le client et sa prestation, puis générez un devis professionnel prêt à envoyer."
              onRetour={() => allerA("devis")}
              libelleRetour="Retour aux devis"
            />
            <GenerateurDocument
              key={`devis-${prochainNumero}${preRemplissage?.origine?.nom ?? ""}`}
              docType="devis"
              prochainNumero={prochainNumero}
              stockageConfigure={stockageConfigure}
              onEnregistre={chargerDocuments}
              toast={toast}
              sessionExpiree={sessionExpiree}
              preRemplissage={preRemplissage}
              /* VOLET 23 — anti-doublon : numéros de devis déjà
                  générés. */
              numerosExistants={numerosDevis}
            />
          </>
        )}
        {section === "devis" && vueDocs === "edition" && docEnEdition && (
          <>
            <EnteteDocument
              titre={`Modifier le devis ${docEnEdition.numero}`}
              description="Ajustez le devis, puis régénérez le PDF mis à jour."
              onRetour={() => allerA("devis")}
              libelleRetour="Retour aux devis"
            />
            <GenerateurDocument
              key={`edition-${docEnEdition.id}`}
              docType="devis"
              initial={docEnEdition as DocumentRecord}
              prochainNumero={prochainNumero}
              stockageConfigure={stockageConfigure}
              onEnregistre={chargerDocuments}
              toast={toast}
              sessionExpiree={sessionExpiree}
            />
          </>
        )}
        {section === "devis" && (vueDocs === "liste" || (vueDocs === "edition" && !docEnEdition)) && (
          <>
            <EnteteListe
              titre="Devis"
              compteur={nb.devis}
              libelleBouton="Créer un nouveau devis"
              onCreer={() => ouvrirCreation("devis")}
            />
            <ListeDocuments
              docType="devis"
              documents={documents}
              chargement={docsChargement}
              stockageConfigure={stockageConfigure}
              onRafraichir={chargerDocuments}
              toast={toast}
              sessionExpiree={sessionExpiree}
              onModifier={modifierDocument}
              onFacturer={(d) => setFactureCible(d as DocumentRecord)}
              /* VOLET 20 — devis marqué signé : redirection automatique
                   vers la génération de facture. */
              onSigne={devisSigne}
            />
          </>
        )}

        {/* ---------------- FACTURES ---------------- */}
        {section === "factures" && vueFactures === "selection" && (
          <>
            <EnteteDocument
              titre="Créer une nouvelle facture"
              description="Sélectionnez le devis à facturer : la facture reprendra exactement ses prestations et son total."
              onRetour={() => setVueFactures("liste")}
              libelleRetour="Retour aux factures"
            />
            <SelectionDevis
              documents={documents}
              onChoisir={(d) => setFactureCible(d)}
              onCreerDevis={() => ouvrirCreation("devis")}
              /* VOLET 24 — clic sur le statut « Facturée (n°) » : la
                  facture s'ouvre en APERÇU SUR PLACE — la vue de
                  sélection ne bouge PAS ; fermé, on la retrouve. */
              onVoirFacture={(f) => setApercuFacture(f)}
            />
            {/* VOLET 24 — APERÇU PLEIN ÉCRAN de la facture, OUVERT SUR
                PLACE dans la vue de sélection des devis : fermé (croix
                ou Échap), on RETROUVE la sélection des devis. */}
            {apercuFacture ? (
              <ApercuDocument
                document={apercuFacture}
                initialPleinEcran
                onFermer={() => setApercuFacture(null)}
              />
            ) : null}
          </>
        )}
        {section === "factures" && vueFactures === "liste" && (
          <>
            <EnteteListe
              titre="Factures"
              compteur={nb.factures}
              libelleBouton="Créer une nouvelle facture"
              onCreer={() => setVueFactures("selection")}
            />
            <ListeDocuments
              docType="facture"
              documents={documents}
              chargement={docsChargement}
              stockageConfigure={stockageConfigure}
              onRafraichir={chargerDocuments}
              toast={toast}
              sessionExpiree={sessionExpiree}
              onModifier={(f) => setFactureCible(f as DocumentRecord)}
            />
          </>
        )}

        {/* ---------------- PORTFOLIO DU SITE (VOLET 19) ----------------
            Projets ajoutés au site public depuis l'espace admin :
            brouillon ou publication directe, images compressées,
            traduction anglaise optionnelle. */}
        {section === "portfolio" && (
          <GestionPortfolio
            stockageConfigure={stockageConfigure}
            toast={toast}
            sessionExpiree={sessionExpiree}
            /* CORRECTIF M26 (28/11/2026) — le COMPTEUR de l'option
               « Portfolio du site » se met à jour IMMÉDIATEMENT après
               chaque action de l'espace (publication, dépublication,
               suppression, enregistrement), d'après la RÉPONSE du
               serveur — et à chaque chargement de la liste (retour de
               l'éditeur : « quand on publie ou qu'on supprime, le
               chiffre doit se mettre à jour — il doit correspondre au
               nombre réel de projets »). */
            onProjetsChangent={chargerProjets}
            onMajProjet={majProjetPortfolio}
            onSupprimeProjet={supprimerProjetPortfolio}
          />
        )}

        {/* ---------------- SCRAPING (VOLET 27) ----------------
            Prospection d'entreprises pour le service de web design :
            trois outils de scraping (fiches d'entreprises par lieu et
            niche « Google Maps », pages d'entreprises Instagram,
            pages d'entreprises LinkedIn) avec les coordonnées
            (email, téléphone, site web, localisation, employés…) et
            les filtres avec / sans site web. */}
        {section === "scraping" && (
          <EspaceScraping
            stockageConfigure={stockageConfigure}
            toast={toast}
            sessionExpiree={sessionExpiree}
            ouvrirProspects={() => allerA("prospects")}
          />
        )}

        {/* ---------------- PROSPECTS (VOLET 29) ----------------
            Le tableau de tous les prospects importés du scraping,
            par lots d'import (séparés par une ligne en gras plus
            claire, date et heure d'importation en vertical) :
            entreprise, dirigeant, email, téléphone, adresse, site
            web, message email personnalisé, suivi (contacté, RDV
            accepté, RDV tenu, converti) et bouton Analyser qui
            ouvre l'audit du site du prospect, URL préremplie. */}
        {section === "prospects" && (
          <EspaceProspects
            stockageConfigure={stockageConfigure}
            toast={toast}
            sessionExpiree={sessionExpiree}
            onAnalyser={(url) => amenerVersAudit(url)}
            rafraichir={prospectsRafraichir}
          />
        )}

        {/* ---------------- AUDIT (VOLET 28) ----------------
            Analyse de sites web pour qualifier les prospects et les
            chantiers : VOLET 29 — UN SEUL OUTIL d'audit complet
            (performance, SEO on-page, structure / design /
            copywriting / conversion), rapport par blocs, PDF « audit
            complet », axes d'amélioration en modale et historique
            des audits précédents. */}
        {section === "audit" && (
          <EspaceAudit
            key={auditAmorce?.cle ?? "audit"}
            toast={toast}
            sessionExpiree={sessionExpiree}
            amorce={
              auditAmorce
                ? { url: auditAmorce.url, prospect: auditAmorce.prospect }
                : undefined
            }
          />
        )}

        {/* Note de bas d'espace — VOLET 15 : message court et
            professionnel, sans référence technique. */}
        <div className="mt-10 flex items-start gap-3 rounded-2xl border border-[#e4e4e4]/12 bg-[#232323] px-6 py-5">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#e4e4e4]" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-[#c8c8c8]">
            Espace privé de pilotage : demandes clients, documents commerciaux et suivi des
            projets — à l&apos;écart de la navigation publique.
          </p>
        </div>
      </div>

      {/* ---------- Espace de génération de facture (commun) ----------
          Après une génération réussie depuis la vue « sélection du
          devis », la rubrique Factures revient à sa liste (la nouvelle
          facture y apparaît). */}
      {factureCible ? (
        <EspaceFacture
          document={factureCible}
          onFerme={(succes) => {
            setFactureCible(null);
            if (succes && section === "factures") setVueFactures("liste");
          }}
          onRafraichir={chargerDocuments}
          toast={toast}
          sessionExpiree={sessionExpiree}
        />
      ) : null}
    </div>
  );
}
