"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Lock, LogOut, Download, RefreshCw, ChevronRight, ShieldCheck, Inbox } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LEAD_STATUSES } from "@/lib/validation";

/**
 * ESPACE ADMINISTRATEUR (route non publique : #/admin)
 * Fonctionnalités réellement implémentées et testées :
 *  - authentification par mot de passe (session signée HttpOnly)
 *  - consultation des demandes (devis / audits)
 *  - gestion des statuts des demandes
 *  - export CSV des prospects
 * La génération de devis et de factures fait partie de
 * l'architecture prévue et n'est pas implémentée (aucune
 * fonctionnalité fictive n'est présentée).
 */

interface Lead {
  id: string;
  type: "quote" | "audit";
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
  new: "bg-[#c9baac] text-[#1c1c1c]",
  contacted: "bg-[#2f2f2f] text-white border border-[#e4e4e4]/20",
  qualified: "bg-[#c9baac]/20 text-[#c9baac] border border-[#c9baac]/40",
  won: "bg-[#c9baac] text-[#1c1c1c]",
  lost: "bg-[#2f2f2f] text-[#c8c8c8] border border-[#e4e4e4]/12",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function LoginPanel({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
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
      toast({ title: "Session ouverte", description: "Espace administrateur accessible." });
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
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c9baac] text-[#1c1c1c]">
          <Lock className="h-5.5 w-5.5" aria-hidden="true" />
        </span>
        <h1 className="mt-6 font-display text-2xl font-semibold text-white">
          Espace administrateur
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#c8c8c8]">
          Accès réservé — gestion des demandes reçues via le site web. Cet espace n'est pas
          listé dans la navigation publique.
        </p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="admin-password" className="mb-1.5 block text-sm font-medium text-white">
              Mot de passe
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-[48px] w-full rounded-lg border border-[#e4e4e4]/18 bg-[#1c1c1c] px-4 py-3 text-[15px] text-white placeholder:text-[#c8c8c8]/50 focus:border-[#c9baac] focus:outline-none"
              placeholder="••••••••••••"
            />
          </div>
          {error && (
            <p role="alert" className="rounded-lg border border-[#ea384c]/40 bg-[#ea384c]/10 px-4 py-2.5 text-sm text-[#ffdede]">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-fill flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-full bg-[#c9baac] px-6 py-4 font-medium text-[#1c1c1c] disabled:opacity-60 [&::before]:bg-[#e4e4e4]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Vérification…
              </>
            ) : (
              "Ouvrir la session"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { toast } = useToast();

  const loadLeads = useCallback(async () => {
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
    // Vérifie la session puis charge les demandes
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
      } catch {
        setAuthed(false);
      }
    })();
  }, []);

  async function updateStatus(id: string, status: string) {
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

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setLeads([]);
    toast({ title: "Session fermée" });
  }

  function exportCsv() {
    const rows = filtered.map((l) => [
      l.createdAt,
      l.type === "audit" ? "Audit gratuit" : "Devis",
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

  const filtered = useMemo(
    () =>
      leads.filter(
        (l) =>
          (filter === "all" || l.status === filter) && (typeFilter === "all" || l.type === typeFilter)
      ),
    [leads, filter, typeFilter]
  );

  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#c9baac]" aria-hidden="true" />
      </div>
    );
  }

  if (!authed) return <LoginPanel onSuccess={() => { setAuthed(true); loadLeads(); }} />;

  return (
    <div className="container-site py-32 sm:py-36">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-eyebrow">Espace administrateur</p>
          <h1 className="font-display text-2xl font-semibold text-white sm:text-3xl">
            Demandes reçues
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={loadLeads}
            disabled={loading}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#e4e4e4]/25 px-5 py-2.5 text-sm text-white transition-colors hover:border-[#c9baac] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
            Actualiser
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#c9baac] px-5 py-2.5 text-sm font-medium text-[#1c1c1c] transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Exporter CSV ({filtered.length})
          </button>
          <button
            type="button"
            onClick={logout}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#e4e4e4]/25 px-5 py-2.5 text-sm text-[#c8c8c8] transition-colors hover:border-[#ea384c]/60 hover:text-[#ffdede]"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Fermer la session
          </button>
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
              filter === f.key ? "bg-[#c9baac] text-[#1c1c1c]" : "border border-[#e4e4e4]/20 text-[#c8c8c8] hover:border-[#c9baac]/40"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="mx-2 hidden h-4 w-px bg-[#e4e4e4]/20 sm:block" aria-hidden="true" />
        {[
          { key: "all", label: "Devis + Audits" },
          { key: "quote", label: "Devis" },
          { key: "audit", label: "Audits" },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setTypeFilter(f.key)}
            className={`min-h-[40px] rounded-full px-4 py-2 text-xs font-medium transition-colors ${
              typeFilter === f.key ? "bg-[#c9baac] text-[#1c1c1c]" : "border border-[#e4e4e4]/20 text-[#c8c8c8] hover:border-[#c9baac]/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-[#e4e4e4]/12 bg-[#232323] py-16 text-center">
          <Inbox className="h-8 w-8 text-[#c9baac]" aria-hidden="true" />
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
                      <span className="rounded-full bg-[#c9baac]/12 px-3 py-1 text-xs font-medium text-[#c9baac]">
                        {lead.type === "audit" ? "Audit" : "Devis"}
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
                        onChange={(e) => updateStatus(lead.id, e.target.value)}
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
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}
                        aria-expanded={expanded === lead.id}
                        aria-label={`Détails de la demande de ${lead.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e4e4e4]/20 text-[#c8c8c8] transition-colors hover:border-[#c9baac] hover:text-[#c9baac]"
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

      {/* Note d'architecture honnête */}
      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-[#e4e4e4]/12 bg-[#232323] px-6 py-5">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#c9baac]" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-[#c8c8c8]">
          Espace indépendant, non listé dans la navigation publique. Fonctionnalités
          opérationnelles : consultation des demandes, gestion des statuts et export CSV. La
          génération de devis et de factures ainsi que le suivi détaillé des projets sont
          prévus par l'architecture (modèle de données extensible) et non encore implémentés —
          ils seront annoncés lorsqu'ils seront développés et testés.
        </p>
      </div>
    </div>
  );
}
