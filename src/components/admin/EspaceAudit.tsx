"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Gauge,
  Globe,
  Loader2,
  MinusCircle,
  Search,
  SearchCheck,
  XCircle,
} from "lucide-react";
import { BoutonAction, Carte, Champ, Pastille, TitreSection, styleInput } from "./elements";
import type { CritereSeo, ReleveDesign, RelevePerformance, ReleveSeo } from "@/lib/audit/types";

/**
 * VOLET 28 (28/11/2026) — ESPACE « AUDIT » DU BACK-OFFICE.
 *
 * Trois outils d'analyse de sites web (entrer l'URL, tout le travail
 * se fait — sans clé d'API, sans abonnement) :
 *  - PERFORMANCE (cloné sur GTmetrix) : note A-F, scores Performance
 *    et Structure, Web Vitals, détails de la page, recommandations et
 *    cascade des requêtes ;
 *  - SEO (cloné sur RankFlow) : audit on-page avec score sur 100,
 *    note A-F, verdict, familles de critères et plan d'action ;
 *  - AUDIT COMPLET : design, structure, copywriting et conversion,
 *    avec capture d'écran de la page analysée.
 */

type TypeToast = (t: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
type Outil = "performance" | "seo" | "design";

const OUTILS: { cle: Outil; libelle: string; description: string; icone: React.ReactNode }[] = [
  {
    cle: "performance",
    libelle: "Performance",
    description:
      "Vitesse de chargement de la page (cloné sur GTmetrix) : note A-F, scores Performance et Structure, Web Vitals (LCP, TBT, CLS), poids et requêtes par type, recommandations et cascade.",
    icone: <Gauge className="h-4 w-4" aria-hidden="true" />,
  },
  {
    cle: "seo",
    libelle: "SEO",
    description:
      "Audit SEO on-page de la page (cloné sur RankFlow) : score sur 100, note et verdict, critères par famille et plan d'action priorisé.",
    icone: <SearchCheck className="h-4 w-4" aria-hidden="true" />,
  },
  {
    cle: "design",
    libelle: "Audit complet",
    description:
      "Le site est-il bien designé, moderne, bien structuré, écrit pour convertir ? Analyse du design, de la structure, du copywriting et de la conversion, avec capture d'écran.",
    icone: <Search className="h-4 w-4" aria-hidden="true" />,
  },
];

/* ------------------------------------------------------------------
 * Affichages partagés
 * ------------------------------------------------------------------ */

function couleurNote(score: number): string {
  if (score >= 90) return "#22c55e";
  if (score >= 70) return "#a3e635";
  if (score >= 50) return "#f5b700";
  if (score >= 40) return "#f97316";
  return "#ea384c";
}

/** Pastille ronde de note (lettre) ou de score (nombre). */
function NoteRonde({ note, score, taille = 92 }: { note: string; score: number; taille?: number }) {
  const couleur = couleurNote(score);
  return (
    <div
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{ width: `${taille}px`, height: `${taille}px` }}
      role="img"
      aria-label={`Note ${note} (${score} sur 100)`}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#2f2f2f" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={couleur}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(Math.max(0, Math.min(100, score)) / 100) * (2 * Math.PI * 42)} ${2 * Math.PI * 42}`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-3xl font-semibold" style={{ color: couleur }}>
          {note}
        </span>
      </span>
    </div>
  );
}

/** Barre de progression notée. */
function BarreScore({ libelle, score, detail }: { libelle: string; score: number; detail?: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <p className="text-xs font-medium text-white">{libelle}</p>
        <p className="font-mono text-xs" style={{ color: couleurNote(score) }}>
          {score}
          {detail ? <span className="text-[#c8c8c8]"> · {detail}</span> : null}
        </p>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#2f2f2f]">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${Math.max(2, Math.min(100, score))}%`, backgroundColor: couleurNote(score) }}
        />
      </div>
    </div>
  );
}

function octets(octets: number): string {
  if (octets >= 1024 * 1024) return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
  if (octets >= 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${octets} o`;
}

function secondes(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms)} ms`;
}

/* ------------------------------------------------------------------
 * RÉSULTAT PERFORMANCE (GTmetrix)
 * ------------------------------------------------------------------ */

function ResultatPerformance({ r }: { r: RelevePerformance }) {
  const [cascadeOuverte, setCascadeOuverte] = useState(false);
  return (
    <div className="space-y-6">
      {/* Note + scores */}
      <Carte className="flex flex-wrap items-center gap-6 p-5 sm:p-6">
        <div className="flex items-center gap-5">
          <NoteRonde note={r.note} score={Math.round(0.6 * r.scorePerformance + 0.4 * r.scoreStructure)} />
          <div>
            <p className="text-eyebrow">Note globale</p>
            <p className="mt-1 text-sm text-[#c8c8c8]">
              Performance {r.scorePerformance} × 60 % + Structure {r.scoreStructure} × 40 %
            </p>
            <p className="mt-2 max-w-[260px] truncate text-xs text-[#c8c8c8]/70">{r.url}</p>
          </div>
        </div>
        <div className="min-w-[220px] flex-1 space-y-4">
          <BarreScore libelle="Score Performance" score={r.scorePerformance} />
          <BarreScore libelle="Score Structure" score={r.scoreStructure} />
        </div>
      </Carte>

      {/* Web Vitals */}
      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {r.vitals.map((v) => (
          <Carte key={v.code} className="p-4">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-[#c8c8c8] uppercase">
              {v.code === "cls" ? v.libelle : v.libelle}
            </p>
            <p className="mt-2 font-display text-2xl font-semibold" style={{ color: couleurNote(v.score) }}>
              {v.valeur.toFixed(v.code === "cls" ? 3 : v.valeur >= 10 ? 1 : 2)}
              {v.unite === "s" ? " s" : ""}
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#2f2f2f]">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(3, v.score)}%`, backgroundColor: couleurNote(v.score) }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-[#c8c8c8]/70">
              {v.score}/100{v.code === "si" ? " (estimation)" : ""}
            </p>
          </Carte>
        ))}
      </div>

      {/* Détails de la page */}
      <Carte className="p-5 sm:p-6">
        <TitreSection>Détails de la page</TitreSection>
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { libelle: "Chargement complet", valeur: secondes(r.chargeComplete) },
            { libelle: "Poids total", valeur: octets(r.poidsTotal) },
            { libelle: "Requêtes", valeur: String(r.nbRequetes) },
            { libelle: "Domaines", valeur: String(r.domaines) },
          ].map((d) => (
            <div key={d.libelle} className="rounded-xl border border-[#e4e4e4]/10 bg-[#1c1c1c] p-4">
              <p className="text-[10px] font-semibold tracking-[0.14em] text-[#c8c8c8] uppercase">{d.libelle}</p>
              <p className="mt-2 font-display text-xl font-semibold text-white">{d.valeur}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 space-y-2.5">
          {r.detailsTypes.map((d) => (
            <div key={d.type}>
              <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                <p className="text-white">
                  {d.type} <span className="text-[#c8c8c8]/70">({d.nb})</span>
                </p>
                <p className="text-[#c8c8c8]">{octets(d.octets)}</p>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#2f2f2f]">
                <div
                  className="h-full rounded-full bg-[#e4e4e4]"
                  style={{ width: `${Math.max(2, (d.octets / Math.max(1, r.poidsTotal)) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Carte>

      {/* Recommandations (Structure) */}
      <Carte className="p-5 sm:p-6">
        <TitreSection note={`${r.audits.length} recommandation${r.audits.length > 1 ? "s" : ""}`}>
          Recommandations
        </TitreSection>
        {r.audits.length === 0 ? (
          <p className="text-sm text-[#c8c8c8]">
            Aucun problème de structure détecté — la page suit les bonnes pratiques de performance.
          </p>
        ) : (
          <div className="space-y-3">
            {r.audits.map((a) => (
              <div key={a.titre} className="rounded-xl border border-[#e4e4e4]/10 bg-[#1c1c1c] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">{a.titre}</p>
                  <Pastille ton={a.impact === "élevé" ? "alerte" : "neutre"}>
                    Impact {a.impact} · −{a.points} pts
                  </Pastille>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#c8c8c8]">{a.detail}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#e4e4e4]">→ {a.conseil}</p>
              </div>
            ))}
          </div>
        )}
      </Carte>

      {/* Cascade (waterfall) */}
      <Carte className="p-5 sm:p-6">
        <button
          type="button"
          onClick={() => setCascadeOuverte((v) => !v)}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <TitreSection note={`${r.cascade.length} requêtes`}>Cascade des requêtes</TitreSection>
          <ChevronRight
            className={`h-5 w-5 shrink-0 text-[#c8c8c8] transition-transform ${cascadeOuverte ? "rotate-90" : ""}`}
            aria-hidden="true"
          />
        </button>
        {cascadeOuverte ? (
          <div className="max-h-[460px] overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#232323]">
                <tr className="border-b border-[#e4e4e4]/10 text-[10px] tracking-widest text-[#c8c8c8] uppercase">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Requête</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Statut</th>
                  <th className="px-3 py-2">Début</th>
                  <th className="px-3 py-2">Durée</th>
                  <th className="px-3 py-2">Poids</th>
                </tr>
              </thead>
              <tbody>
                {r.cascade.map((l) => (
                  <tr key={l.ordre} className="border-b border-[#e4e4e4]/6">
                    <td className="px-3 py-2 text-[#c8c8c8]">{l.ordre}</td>
                    <td className="max-w-[320px] truncate px-3 py-2 text-white">
                      {l.url.replace(/^https?:\/\//, "")}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[#c8c8c8]">{l.type}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          l.statut >= 400
                            ? "text-[#ff8080]"
                            : l.statut >= 300
                              ? "text-[#ffe9a3]"
                              : "text-[#86efac]"
                        }
                      >
                        {l.statut || "—"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[#c8c8c8]">{secondes(l.debut)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-[#c8c8c8]">{secondes(l.duree)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-white">{octets(l.octets)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Carte>
    </div>
  );
}

/* ------------------------------------------------------------------
 * RÉSULTAT SEO (RankFlow)
 * ------------------------------------------------------------------ */

function IcôneCritère({ etat }: { etat: CritereSeo["etat"] }) {
  if (etat === "ok") return <CheckCircle2 className="h-4 w-4 shrink-0 text-[#22c55e]" aria-hidden="true" />;
  if (etat === "moyen") return <AlertTriangle className="h-4 w-4 shrink-0 text-[#f5b700]" aria-hidden="true" />;
  return <XCircle className="h-4 w-4 shrink-0 text-[#ea384c]" aria-hidden="true" />;
}

function ResultatSeo({ r }: { r: ReleveSeo }) {
  return (
    <div className="space-y-6">
      <Carte className="flex flex-wrap items-center gap-6 p-5 sm:p-6">
        <div className="flex items-center gap-5">
          <NoteRonde note={r.note} score={r.score} />
          <div>
            <p className="font-display text-lg font-semibold text-white">
              {r.score}/100 — {r.verdict}
            </p>
            <p className="mt-1 text-sm text-[#c8c8c8]">Audit SEO on-page de la page</p>
            <p className="mt-2 max-w-[260px] truncate text-xs text-[#c8c8c8]/70">{r.url}</p>
          </div>
        </div>
        {/* Aperçu façon résultat Google */}
        <div className="min-w-[260px] flex-1">
          <p className="mb-2 text-[10px] font-semibold tracking-[0.14em] text-[#c8c8c8] uppercase">
            Aperçu dans les résultats
          </p>
          <div className="rounded-xl border border-[#e4e4e4]/10 bg-[#1c1c1c] p-4">
            <p className="truncate text-xs text-[#86efac]/80">{r.apercu.url.replace(/^https?:\/\//, "")}</p>
            <p className="mt-0.5 line-clamp-1 text-sm font-medium text-[#a3c4ff]">{r.apercu.titre}</p>
            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[#c8c8c8]">{r.apercu.description}</p>
          </div>
        </div>
      </Carte>

      {/* Plan d'action */}
      {r.plan.length > 0 ? (
        <Carte className="p-5 sm:p-6">
          <TitreSection note="par points gagnables">Plan d&apos;action</TitreSection>
          <div className="space-y-2.5">
            {r.plan.map((c) => (
              <div key={c.libelle} className="flex items-start gap-3 rounded-xl border border-[#e4e4e4]/10 bg-[#1c1c1c] p-3.5">
                <IcôneCritère etat={c.etat} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">
                    {c.libelle} <span className="text-[#c8c8c8]/70">({c.obtenu}/{c.points})</span>
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#c8c8c8]">{c.detail}</p>
                  {c.conseil ? <p className="mt-1 text-xs leading-relaxed text-[#e4e4e4]">→ {c.conseil}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </Carte>
      ) : null}

      {/* Familles de critères */}
      <div className="grid gap-4 lg:grid-cols-2">
        {r.familles.map((f) => {
          const points = f.criteres.reduce((s, c) => s + c.obtenu, 0);
          const max = f.criteres.reduce((s, c) => s + c.points, 0);
          return (
            <Carte key={f.nom} className="p-5">
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <h4 className="font-display text-sm font-semibold text-white">{f.nom}</h4>
                <p className="text-xs" style={{ color: couleurNote((points / Math.max(1, max)) * 100) }}>
                  {points}/{max}
                </p>
              </div>
              <div className="space-y-2">
                {f.criteres.map((c) => (
                  <div key={c.libelle} className="flex items-start gap-2.5">
                    <IcôneCritère etat={c.etat} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white">{c.libelle}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-[#c8c8c8]">{c.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Carte>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
 * RÉSULTAT AUDIT COMPLET (design / copywriting)
 * ------------------------------------------------------------------ */

function ResultatDesign({ r }: { r: ReleveDesign }) {
  return (
    <div className="space-y-6">
      <Carte className="flex flex-wrap items-center gap-6 p-5 sm:p-6">
        <div className="flex items-center gap-5">
          <NoteRonde note={r.note} score={r.scoreGlobal} />
          <div>
            <p className="font-display text-lg font-semibold text-white">{r.scoreGlobal}/100</p>
            <p className="mt-1 text-sm text-[#c8c8c8]">Design, structure, copywriting et conversion</p>
            <p className="mt-2 max-w-[260px] truncate text-xs text-[#c8c8c8]/70">{r.url}</p>
          </div>
        </div>
        <div className="min-w-[220px] flex-1 space-y-3.5">
          {r.axes.map((a) => (
            <BarreScore key={a.nom} libelle={a.nom} score={a.score} />
          ))}
        </div>
      </Carte>

      {/* Capture d'écran */}
      <Carte className="p-5 sm:p-6">
        <TitreSection note="partie visible de la page (1280 × 800)">Capture de la page</TitreSection>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={r.capture}
          alt={`Capture d'écran de ${r.url}`}
          className="w-full rounded-xl border border-[#e4e4e4]/10"
        />
      </Carte>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Points forts */}
        <Carte className="p-5 sm:p-6">
          <TitreSection>Ce qui fonctionne</TitreSection>
          {r.forces.length === 0 ? (
            <p className="text-sm text-[#c8c8c8]">Aucun point fort majeur détecté.</p>
          ) : (
            <ul className="space-y-2.5">
              {r.forces.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#22c55e]" aria-hidden="true" />
                  <p className="text-sm leading-relaxed text-white">{f}</p>
                </li>
              ))}
            </ul>
          )}
        </Carte>
        {/* À améliorer */}
        <Carte className="p-5 sm:p-6">
          <TitreSection>À améliorer</TitreSection>
          {r.ameliorations.length === 0 ? (
            <p className="text-sm text-[#c8c8c8]">Rien à signaler — la page est solide.</p>
          ) : (
            <ul className="space-y-2.5">
              {r.ameliorations.map((a) => (
                <li key={a.titre} className="flex items-start gap-2.5">
                  <MinusCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#f5b700]" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-white">{a.titre}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#c8c8c8]">{a.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Carte>
      </div>

      {/* Avis par axe */}
      <Carte className="p-5 sm:p-6">
        <TitreSection>Verdict par axe</TitreSection>
        <div className="space-y-3">
          {r.axes.map((a) => (
            <div key={a.nom} className="rounded-xl border border-[#e4e4e4]/10 bg-[#1c1c1c] p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-white">{a.nom}</p>
                <p className="font-mono text-sm" style={{ color: couleurNote(a.score) }}>
                  {a.score}/100
                </p>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[#c8c8c8]">{a.avis}</p>
            </div>
          ))}
        </div>
      </Carte>
    </div>
  );
}

/* ------------------------------------------------------------------
 * L'ESPACE
 * ------------------------------------------------------------------ */

export function EspaceAudit({
  toast,
  sessionExpiree,
}: {
  toast: TypeToast;
  sessionExpiree: () => void;
}) {
  const [outil, setOutil] = useState<Outil>("performance");
  const [url, setUrl] = useState("");
  const [chargement, setChargement] = useState(false);
  const [perf, setPerf] = useState<RelevePerformance | null>(null);
  const [seo, setSeo] = useState<ReleveSeo | null>(null);
  const [design, setDesign] = useState<ReleveDesign | null>(null);

  const outilActif = OUTILS.find((o) => o.cle === outil) ?? OUTILS[0];

  async function analyser() {
    if (chargement) return;
    if (!/^https?:\/\/.+\..+/.test(url.trim())) {
      toast({
        title: "URL incomplète",
        description: "Collez l'adresse complète de la page à analyser (https://…).",
        variant: "destructive",
      });
      return;
    }
    setChargement(true);
    try {
      const res = await fetch(`/api/admin/audit/${outil}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      if (res.status === 401) {
        sessionExpiree();
        return;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        toast({
          title: "Analyse impossible",
          description: data?.error ?? "Réessayez dans un instant.",
          variant: "destructive",
        });
        return;
      }
      if (outil === "performance") setPerf(data as RelevePerformance);
      else if (outil === "seo") setSeo(data as ReleveSeo);
      else setDesign(data as ReleveDesign);
      const titreNote = data.note ? ` — note ${data.note}` : "";
      toast({
        title: `Analyse terminée${titreNote}`,
        description: new URL(url.trim()).hostname,
      });
    } catch {
      toast({
        title: "Analyse indisponible",
        description: "Le serveur n'a pas répondu — réessayez dans un instant.",
        variant: "destructive",
      });
    } finally {
      setChargement(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">Audit</h2>
          <p className="mt-1 max-w-2xl text-sm text-[#c8c8c8]">
            Analysez n&apos;importe quel site web : entrez l&apos;URL, tout le travail se fait — performance
            de chargement, SEO on-page, design et copywriting.
          </p>
        </div>
        <Pastille ton="valide">Analyse</Pastille>
      </div>

      {/* Onglets des trois outils */}
      <div className="mb-6 flex flex-wrap items-center gap-2" role="tablist" aria-label="Outils d'audit">
        {OUTILS.map((o) => (
          <button
            key={o.cle}
            type="button"
            role="tab"
            aria-selected={outil === o.cle}
            onClick={() => setOutil(o.cle)}
            className={`flex min-h-[38px] items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-colors ${
              outil === o.cle
                ? "border-[#e4e4e4] bg-white font-medium text-[#1c1c1c]"
                : "border-[#e4e4e4]/25 text-[#c8c8c8] hover:border-[#e4e4e4]/60 hover:text-white"
            }`}
          >
            {o.icone}
            {o.libelle}
          </button>
        ))}
      </div>

      {/* Formulaire : URL + analyse */}
      <Carte className="mb-6 p-5 sm:p-6">
        <TitreSection note="gratuit — aucune clé d'API">{outilActif.libelle}</TitreSection>
        <p className="mb-4 text-sm leading-relaxed text-[#c8c8c8]">{outilActif.description}</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[260px] flex-1">
            <Champ label="URL de la page" indicatif="https://…">
              <input
                className={styleInput}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void analyser();
                }}
                placeholder="Ex. https://stevensakpovi.vercel.app"
                inputMode="url"
                type="url"
              />
            </Champ>
          </div>
          <BoutonAction variant="principal" onClick={() => void analyser()} disabled={chargement}>
            {chargement ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Analyse…
              </>
            ) : (
              <>
                <Globe className="h-4 w-4" aria-hidden="true" />
                Analyser
              </>
            )}
          </BoutonAction>
        </div>
      </Carte>

      {/* Résultats */}
      {chargement ? (
        <Carte className="flex items-center justify-center gap-3 px-6 py-16">
          <Loader2 className="h-5 w-5 animate-spin text-[#e4e4e4]" aria-hidden="true" />
          <p className="text-sm text-[#c8c8c8]">
            {outil === "performance"
              ? "La page se charge dans un vrai navigateur, chaque requête est mesurée…"
              : outil === "seo"
                ? "La page et ses balises sont analysées…"
                : "La page est chargée et capturée, le design et le texte sont analysés…"}
          </p>
        </Carte>
      ) : outil === "performance" && perf ? (
        <ResultatPerformance r={perf} />
      ) : outil === "seo" && seo ? (
        <ResultatSeo r={seo} />
      ) : outil === "design" && design ? (
        <ResultatDesign r={design} />
      ) : null}
    </div>
  );
}
