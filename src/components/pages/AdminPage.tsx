"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  FileText,
  Handshake,
  Inbox,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  Receipt,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LEAD_STATUSES } from "@/lib/validation";
import { GenerateurDocument } from "@/components/admin/GenerateurDocument";
import { ListeDocuments } from "@/components/admin/ListeDocuments";
import { BoutonAction, Carte, Pastille } from "@/components/admin/elements";
import type { DocumentRecord } from "@/lib/documents/types";
import { formatCurrency, totalDocument } from "@/lib/documents/format";

/**
 * ESPACE ADMINISTRATEUR — BACK-OFFICE (VOLET 14, 24/11/2026).
 *
 * L'espace #/admin devient un VRAI BACK-OFFICE (demande de
 * l'éditeur : « je veux que tu implémentes l'espace admin, je veux
 * que tu le présentes comme un back-office »), en conservant le
 * design du site (fonds #070707/#232323, bordures #e4e4e4, Sora)
 * avec un rendu plus professionnel et élégant :
 *
 *  - TABLEAU DE BORD : compteurs (demandes, devis, factures,
 *    propositions), état du stockage et de l'email, raccourcis ;
 *  - DEMANDES : l'existant (demandes devis/audit/messages reçues,
 *    statuts, export CSV) ;
 *  - DEVIS & PROPOSITIONS : générateurs (template K.Quotes) avec
 *    aperçu A4 en direct, exemple-modèle, enregistrement, PDF
 *    téléchargé automatiquement + copie email ;
 *  - FACTURES & DOCUMENTS : chaque DEVIS enregistré porte son
 *    option « Générer la facture » (cachet PAYÉ MrSteveEnglish) ;
 *    liste, aperçu, téléchargement et suppression des documents
 *    existants, servis depuis le stockage GitHub privé.
 *
 * CONNEXION (volet 14) : icône ŒIL pour révéler le mot de passe
 * (demande de l'éditeur) ; le bouton « Ouvrir La Session » devient
 * « Ouvrir L'Espace » (demande de l'éditeur).
 */

type Section = "tableau" | "demandes" | "devis" | "propositions" | "factures";

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
  won: "Gagnée",
  lost: "Perdue",
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
 * CONNEXION — icône œil (volet 14) + bouton « Ouvrir L'Espace »
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
      toast({ title: "Espace ouvert", description: "Back-office accessible." });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-site flex min-h-screen items-center justify-center py-32">
      <div className="w-full max-w-md rounded-2xl border border-[#e4e4e4]/12 bg-[#232323] p-8 sm:p-10">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e4e4e4] text-[#1c1c1c]">
          <Lock className="h-5.5 w-5.5" aria-hidden="true" />
        </span>
        <h1 className="mt-6 font-display text-2xl font-semibold text-white">
          Espace administrateur
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#c8c8c8]">
          Accès réservé — back-office : demandes reçues, génération des documents
          commerciaux (propositions, devis, factures). Cet espace n&apos;est pas listé
          dans la navigation publique.
        </p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="admin-password" className="mb-1.5 flex items-center justify-between text-sm font-medium text-white">
              Mot de passe
              {/* VOLET 14 — icône œil : révéler / masquer le mot de passe
                  (demande de l'éditeur : « ajoute une icône d'œil sur
                  lequel on peut cliquer pour afficher le mot de passe »). */}
              <button
                type="button"
                onClick={() => setVoirMotDePasse((v) => !v)}
                aria-label={voirMotDePasse ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                aria-pressed={voirMotDePasse}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e4e4e4]/20 text-[#c8c8c8] transition-colors hover:border-[#e4e4e4] hover:text-white"
              >
                {voirMotDePasse ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </label>
            <input
              id="admin-password"
              type={voirMotDePasse ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-[48px] w-full rounded-lg border border-[#e4e4e4]/18 bg-[#1c1c1c] px-4 py-3 text-[15px] text-white placeholder:text-[#c8c8c8]/50 focus:border-[#e4e4e4] focus:outline-none"
              placeholder="••••••••••••"
            />
          </div>
          {error && (
            <p role="alert" className="rounded-lg border border-[#ea384c]/40 bg-[#ea384c]/10 px-4 py-2.5 text-sm text-[#ffdede]">
              {error}
            </p>
          )}
          {/* VOLET 14 — « Ouvrir La Session » devient « Ouvrir L'Espace »
              (demande de l'éditeur : « change le nom du bouton Ouvrir la
              session en un nom Ouvrir l'espace »). */}
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
}: {
  leads: Lead[];
  loading: boolean;
  onActualiser: () => void;
  onMajStatut: (id: string, status: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

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
        {[
          { key: "all", label: "Devis + Audits + Messages" },
          { key: "quote", label: "Devis" },
          { key: "audit", label: "Audits" },
          { key: "contact", label: "Messages" },
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
 * PAGE ADMIN — coquille back-office
 * ------------------------------------------------------------------ */
export function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [section, setSection] = useState<Section>("tableau");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [docsChargement, setDocsChargement] = useState(false);
  const [stockageConfigure, setStockageConfigure] = useState(false);
  const [emailConfigure, setEmailConfigure] = useState(false);
  const { toast } = useToast();

  const chargerDocuments = useCallback(async () => {
    setDocsChargement(true);
    try {
      const res = await fetch("/api/documents", { cache: "no-store" });
      if (res.status === 401) return;
      const data = await res.json();
      if (data?.ok) {
        setDocuments(data.documents ?? []);
        setStockageConfigure(Boolean(data.stockageConfigure));
        setEmailConfigure(Boolean(data.emailConfigure));
      }
    } catch {
      /* silencieux : le bandeau du tableau de bord informe */
    } finally {
      setDocsChargement(false);
    }
  }, []);

  const chargerDemandes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/leads", { cache: "no-store" });
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      const data = await res.json();
      if (data?.ok) setLeads(data.leads as Lead[]);
    } catch {
      toast({ title: "Chargement impossible", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

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
      } catch {
        setAuthed(false);
      }
    })();
  }, [chargerDocuments]);

  async function majStatut(id: string, status: string) {
    const prev = leads;
    setLeads((list) => list.map((l) => (l.id === id ? { ...l, status } : l)));
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
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
    toast({ title: "Espace fermé" });
  }

  const nb = {
    demandes: leads.length,
    nouvelles: leads.filter((l) => l.status === "new").length,
    devis: documents.filter((d) => d.docType === "devis").length,
    factures: documents.filter((d) => d.docType === "facture").length,
    propositions: documents.filter((d) => d.docType === "proposition").length,
  };

  const prochainNumero = useMemo(
    () => documents.reduce((max, d) => Math.max(max, Number(d.numeroClient) || 0), 0) + 1,
    [documents],
  );

  const totalFacture = useMemo(
    () =>
      documents
        .filter((d) => d.docType === "facture")
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
        }}
      />
    );
  }

  const NAV: { key: Section; label: string; icone: React.ReactNode; compteur?: number }[] = [
    { key: "tableau", label: "Tableau de bord", icone: <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> },
    { key: "demandes", label: "Demandes", icone: <Inbox className="h-4 w-4" aria-hidden="true" />, compteur: nb.demandes },
    { key: "devis", label: "Devis", icone: <FileText className="h-4 w-4" aria-hidden="true" />, compteur: nb.devis },
    { key: "propositions", label: "Propositions", icone: <Handshake className="h-4 w-4" aria-hidden="true" />, compteur: nb.propositions },
    { key: "factures", label: "Factures & Documents", icone: <Receipt className="h-4 w-4" aria-hidden="true" />, compteur: documents.length },
  ];

  return (
    <div className="section-deep min-h-screen">
      {/* Barre supérieure */}
      <div className="border-b border-[#e4e4e4]/10 bg-[#070707]">
        <div className="container-site flex flex-wrap items-center justify-between gap-4 py-5">
          <div>
            <p className="text-eyebrow">Back-office</p>
            <h1 className="mt-1 font-display text-xl font-semibold text-white sm:text-2xl">
              Stevens Akpovi — Espace administrateur
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <BoutonAction
              onClick={() => {
                chargerDemandes();
                chargerDocuments();
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
        <nav aria-label="Sections du back-office" className="scroll-slim -mx-1 mb-8 flex gap-2 overflow-x-auto px-1 pb-1">
          {NAV.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSection(item.key)}
              aria-current={section === item.key ? "page" : undefined}
              className={`flex min-h-[44px] shrink-0 items-center gap-2.5 rounded-full border px-5 py-2.5 text-sm transition-colors ${
                section === item.key
                  ? "border-[#e4e4e4] bg-white text-[#1c1c1c] font-medium"
                  : "border-[#e4e4e4]/20 text-[#c8c8c8] hover:border-[#e4e4e4]/50 hover:text-white"
              }`}
            >
              {item.icone}
              {item.label}
              {typeof item.compteur === "number" ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
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
                { label: "Devis", valeur: nb.devis, note: `prochain n° client : ${prochainNumero}`, section: "devis" as Section },
                { label: "Factures", valeur: nb.factures, note: totalFacture ? `total facturé : ${formatCurrency(totalFacture, documents.find((d) => d.docType === "facture")?.devise ?? "XOF")}` : "aucune pour l'heure", section: "factures" as Section },
                { label: "Propositions", valeur: nb.propositions, note: "modèle prêt à générer", section: "propositions" as Section },
              ].map((carte) => (
                <button
                  key={carte.label}
                  type="button"
                  onClick={() => setSection(carte.section)}
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
                    <p className="text-sm font-medium text-white">Copie email des documents</p>
                    <Pastille ton={emailConfigure ? "valide" : "alerte"}>
                      {emailConfigure ? "Active" : "Non configurée"}
                    </Pastille>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[#c8c8c8]">
                    {emailConfigure
                      ? "Chaque document généré est envoyé en pièce jointe à stevensakpovi@gmail.com (Resend)."
                      : "Définissez RESEND_API_KEY pour recevoir une copie de chaque document par email (pièce jointe PDF) — voir DEPLOIEMENT.md."}
                  </p>
                </div>
              </div>
            </Carte>

            {/* Raccourcis */}
            <div className="flex flex-wrap gap-3">
              <BoutonAction variant="principal" onClick={() => setSection("devis")}>
                <FileText className="h-4 w-4" aria-hidden="true" />
                Nouveau devis
              </BoutonAction>
              <BoutonAction onClick={() => setSection("propositions")}>
                <Handshake className="h-4 w-4" aria-hidden="true" />
                Nouvelle proposition
              </BoutonAction>
              <BoutonAction onClick={() => setSection("factures")}>
                <Receipt className="h-4 w-4" aria-hidden="true" />
                Factures & documents
              </BoutonAction>
            </div>
          </div>
        )}

        {/* ---------------- DEMANDES ---------------- */}
        {section === "demandes" && (
          <PanneauDemandes leads={leads} loading={loading} onActualiser={chargerDemandes} onMajStatut={majStatut} />
        )}

        {/* ---------------- DEVIS ---------------- */}
        {section === "devis" && (
          <>
            <div className="mb-6">
              <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">Nouveau devis</h2>
              <p className="mt-1 text-sm text-[#c8c8c8]">
                Template du projet K.Quotes — chaque devis enregistré ouvre ensuite son option
                « Générer la facture » dans la liste des documents.
              </p>
            </div>
            <GenerateurDocument
              key={`devis-${prochainNumero}`}
              docType="devis"
              prochainNumero={prochainNumero}
              stockageConfigure={stockageConfigure}
              onEnregistre={chargerDocuments}
              toast={toast}
            />
          </>
        )}

        {/* ---------------- PROPOSITIONS ---------------- */}
        {section === "propositions" && (
          <>
            <div className="mb-6">
              <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">Nouvelle proposition commerciale</h2>
              <p className="mt-1 text-sm text-[#c8c8c8]">
                Document haut de gamme : présentation, prestations détaillées, déroulé du projet,
                conditions et bon pour accord. Chargez l&apos;exemple-modèle pour découvrir le rendu.
              </p>
            </div>
            <GenerateurDocument
              key={`proposition-${prochainNumero}`}
              docType="proposition"
              prochainNumero={prochainNumero}
              stockageConfigure={stockageConfigure}
              onEnregistre={chargerDocuments}
              toast={toast}
            />
          </>
        )}

        {/* ---------------- FACTURES & DOCUMENTS ---------------- */}
        {section === "factures" && (
          <>
            <div className="mb-6">
              <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">Factures & documents existants</h2>
              <p className="mt-1 text-sm text-[#c8c8c8]">
                Toutes les factures sont générées depuis un devis (option « Générer la facture »,
                avec cachet « PAYÉ »). Les documents sont conservés dans le dépôt GitHub privé
                dédié et téléchargeables à tout moment.
              </p>
            </div>
            <ListeDocuments
              documents={documents}
              chargement={docsChargement}
              stockageConfigure={stockageConfigure}
              onRafraichir={chargerDocuments}
              toast={toast}
            />
          </>
        )}

        {/* Note d'architecture */}
        <div className="mt-10 flex items-start gap-3 rounded-2xl border border-[#e4e4e4]/12 bg-[#232323] px-6 py-5">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#e4e4e4]" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-[#c8c8c8]">
            Espace indépendant, non listé dans la navigation publique. Génération de documents
            (propositions commerciales, devis, factures avec cachet « PAYÉ ») sur le template du
            projet K.Quotes, stockage dans le dépôt GitHub privé dédié, copie email à
            stevensakpovi@gmail.com — et consultation des demandes reçues via le site.
          </p>
        </div>
      </div>
    </div>
  );
}
