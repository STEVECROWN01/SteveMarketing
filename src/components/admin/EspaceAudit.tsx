"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  Gauge,
  Globe,
  History,
  Loader2,
  MinusCircle,
  Save,
  Search,
  SearchCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { BoutonAction, Carte, Champ, ModaleContenu, Pastille, TitreSection, styleInput } from "./elements";
import type { CritereSeo, ReleveDesign, RelevePerformance, ReleveSeo } from "@/lib/audit/types";
import type { AuditComplet, AxeAmelioration, AuditResume } from "@/lib/audit/complet";
import { compilerAxes, construireAudit, scorePerformanceComposite } from "@/lib/audit/complet";

/**
 * VOLET 28 (28/11/2026) — ESPACE « AUDIT » DU BACK-OFFICE.
 * VOLET 29 (28/11/2026 soir) — UN SEUL OUTIL, comme demandé par
 * l'éditeur : plus les trois boutons performance / SEO / audit
 * complet — on colle l'URL, le bouton analyser fait TOUT à la fois
 * (vitesse de chargement, SEO on-page, structure / design /
 * copywriting / conversion) et le RAPPORT COMPLET s'affiche à
 * l'écran PAR BLOCS : rapport performance, rapport SEO, rapport
 * structure & design. Le rapport se télécharge en PDF (« AUDIT
 * COMPLET »), ses AXES D'AMÉLIORATION s'ouvrent dans une modale
 * (eux aussi en PDF), et l'audit peut être SAUVEGARDÉ dans le dépôt
 * GitHub de stockage — l'historique des audits précédents reste
 * consultable à tout moment.
 */

type TypeToast = (t: { title: string; description?: string; variant?: "default" | "destructive" }) => void;

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
          cx="50" cy="50" r="42" fill="none" stroke={couleur} strokeWidth="8" strokeLinecap="round"
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

/** Le titre d'un bloc du rapport complet. */
function TitreBloc({ libelle, note }: { libelle: string; note: string }) {
  return (
    <div className="mb-4 mt-10 flex items-center gap-3 border-t border-[#e4e4e4]/12 pt-6 first:mt-0">
      <span className="h-2.5 w-2.5 rounded-full bg-[#e4e4e4]" aria-hidden="true" />
      <h3 className="font-display text-lg font-semibold text-white sm:text-xl">{libelle}</h3>
      <span className="ml-1 rounded-full border border-[#e4e4e4]/25 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-[#c8c8c8]">
        {note}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------
 * RAPPORT PERFORMANCE
 * ------------------------------------------------------------------ */

function ResultatPerformance({ r }: { r: RelevePerformance }) {
  const [cascadeOuverte, setCascadeOuverte] = useState(false);
  return (
    <div className="space-y-6">
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
            <p className="text-[10px] font-semibold tracking-[0.14em] text-[#c8c8c8] uppercase">{v.libelle}</p>
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

      {/* Recommandations */}
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
          className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
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
 * RAPPORT SEO
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
 * RAPPORT STRUCTURE / DESIGN / COPYWRITING / CONVERSION
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
 * L'ESPACE AUDIT — un seul outil
 * ------------------------------------------------------------------ */

export function EspaceAudit({
  toast,
  sessionExpiree,
  urlPreRemplie,
}: {
  toast: TypeToast;
  sessionExpiree: () => void;
  /** URL transmise par l'espace Prospects (bouton Analyser) :
   *  préremplie et auditée dès l'arrivée. */
  urlPreRemplie?: string;
}) {
  const [url, setUrl] = useState("");
  const [audit, setAudit] = useState<AuditComplet | null>(null);
  const [chargement, setChargement] = useState(false);
  const [etape, setEtape] = useState<string | null>(null);
  const [historique, setHistorique] = useState<AuditResume[]>([]);
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);
  const [dejaSauvegarde, setDejaSauvegarde] = useState(false);
  const [axesOuverts, setAxesOuverts] = useState(false);
  const [pdfEnCours, setPdfEnCours] = useState(false);

  const chargerHistorique = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/audits", { cache: "no-store" });
      if (res.status === 401) {
        sessionExpiree();
        return;
      }
      const data = (await res.json().catch(() => null)) as { ok?: boolean; audits?: AuditResume[] } | null;
      if (res.ok && data?.ok) setHistorique(data.audits ?? []);
    } catch {
      /* l'historique n'est pas bloquant */
    }
  }, [sessionExpiree]);

  useEffect(() => {
    void chargerHistorique();
  }, [chargerHistorique]);

  /* L'audit complet : les trois analyses en parallèle, le rapport
   * complet assemblé bloc par bloc. */
  const analyser = useCallback(
    async (urlAnalysee?: string) => {
      const cible = (urlAnalysee ?? url).trim();
      if (chargement) return;
      if (!/^https?:\/\/.+\..+/.test(cible)) {
        toast({
          title: "URL incomplète",
          description: "Collez l'adresse complète de la page à analyser (https://…).",
          variant: "destructive",
        });
        return;
      }
      setChargement(true);
      setAudit(null);
      setDejaSauvegarde(false);
      setEtape("Analyse de la performance…");
      try {
        const appeler = async (outil: "performance" | "seo" | "design") => {
          const res = await fetch(`/api/admin/audit/${outil}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: cible }),
          });
          if (res.status === 401) throw new Error("session");
          const data = await res.json();
          if (!res.ok || !data?.ok) throw new Error(data?.error ?? `Analyse ${outil} impossible.`);
          return data;
        };
        /* La performance est la plus longue (vrai navigateur) : on
         * la lance, on présente le SEO pendant qu'elle tourne, puis
         * le design (capture d'écran). */
        const promessePerformance = appeler("performance").finally(() =>
          setEtape((e) => (e ? "Analyse du design et du copywriting…" : e)),
        );
        setEtape("Analyse du SEO on-page…");
        const [performance, seo] = await Promise.all([
          promessePerformance,
          appeler("seo").finally(() => setEtape("Analyse du design et du copywriting…")),
        ]);
        const design = await appeler("design");
        const complet = construireAudit(cible, performance as RelevePerformance, seo as ReleveSeo, design as ReleveDesign);
        setAudit(complet);
        toast({
          title: `Audit complet terminé — note ${complet.note} (${complet.scoreGlobal}/100)`,
          description: cible.replace(/^https?:\/\//, ""),
        });
      } catch (e) {
        if (e instanceof Error && e.message === "session") {
          sessionExpiree();
          return;
        }
        toast({
          title: "Analyse impossible",
          description: e instanceof Error ? e.message : "Réessayez dans un instant.",
          variant: "destructive",
        });
      } finally {
        setEtape(null);
        setChargement(false);
      }
    },
    [chargement, sessionExpiree, toast, url],
  );

  /* L'URL préremplie depuis l'espace Prospects (bouton Analyser) :
   * le champ est rempli et l'audit démarre directement. */
  useEffect(() => {
    if (urlPreRemplie) {
      setUrl(urlPreRemplie);
      void analyser(urlPreRemplie);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlPreRemplie]);

  /** Télécharge le PDF de l'audit complet ou des axes d'amélioration. */
  async function telechargerPdf(kind: "complet" | "axes") {
    if (!audit || pdfEnCours) return;
    setPdfEnCours(true);
    try {
      const res = await fetch("/api/admin/audit/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audit, kind }),
      });
      if (res.status === 401) {
        sessionExpiree();
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        toast({
          title: "PDF impossible",
          description: data?.error ?? "Réessayez dans un instant.",
          variant: "destructive",
        });
        return;
      }
      const blob = await res.blob();
      const lien = document.createElement("a");
      lien.href = URL.createObjectURL(blob);
      lien.download = kind === "axes" ? `axes-amelioration-${audit.hote}.pdf` : `audit-complet-${audit.hote}.pdf`;
      document.body.appendChild(lien);
      lien.click();
      lien.remove();
      URL.revokeObjectURL(lien.href);
      toast({
        title: kind === "axes" ? "Axes d'amélioration téléchargés" : "Audit complet téléchargé",
        description: kind === "axes" ? `Priorités de ${audit.hote} en PDF.` : `Audit complet de ${audit.hote} en PDF.`,
      });
    } catch {
      toast({
        title: "PDF indisponible",
        description: "Le serveur n'a pas répondu — réessayez dans un instant.",
        variant: "destructive",
      });
    } finally {
      setPdfEnCours(false);
    }
  }

  /** Sauvegarde l'audit dans le dépôt GitHub de stockage. */
  async function sauvegarder() {
    if (!audit || sauvegardeEnCours || dejaSauvegarde) return;
    setSauvegardeEnCours(true);
    try {
      const res = await fetch("/api/admin/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audit }),
      });
      if (res.status === 401) {
        sessionExpiree();
        return;
      }
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !data?.ok) {
        toast({
          title: "Sauvegarde impossible",
          description: data?.error ?? "Réessayez dans un instant.",
          variant: "destructive",
        });
        return;
      }
      setDejaSauvegarde(true);
      toast({ title: "Audit sauvegardé", description: "Retrouvé à tout moment dans les audits précédents." });
      void chargerHistorique();
    } catch {
      toast({
        title: "Sauvegarde indisponible",
        description: "Le serveur n'a pas répondu — réessayez dans un instant.",
        variant: "destructive",
      });
    } finally {
      setSauvegardeEnCours(false);
    }
  }

  /** Recharge un audit précédent dans la vue du rapport complet. */
  async function voirAuditPrecedent(id: string) {
    try {
      const res = await fetch(`/api/admin/audits?id=${encodeURIComponent(id)}`, { cache: "no-store" });
      if (res.status === 401) {
        sessionExpiree();
        return;
      }
      const data = (await res.json().catch(() => null)) as { ok?: boolean; audit?: AuditComplet } | null;
      if (!res.ok || !data?.ok || !data.audit) {
        toast({ title: "Audit introuvable", variant: "destructive" });
        return;
      }
      setAudit(data.audit);
      setUrl(data.audit.url);
      setDejaSauvegarde(true);
      setAxesOuverts(false);
    } catch {
      toast({ title: "Lecture impossible", variant: "destructive" });
    }
  }

  const axes = audit ? compilerAxes(audit) : [];

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

      {/* L'outil unique : URL + Analyser */}
      <Carte className="mb-6 p-5 sm:p-6">
        <TitreSection note="performance · SEO · structure & design">Audit complet</TitreSection>
        <p className="mb-4 text-sm leading-relaxed text-[#c8c8c8]">
          La vitesse de chargement de la page : note A-F, scores Performance et Structure, Web Vitals
          (LCP, TBT, CLS), poids et requêtes par type, recommandations et cascade. L&apos;audit SEO
          on-page : score sur 100, note et verdict, critères par famille et plan d&apos;action priorisé.
          La structure, le design, le copywriting et la conversion : ce qui fonctionne, ce qui doit
          être amélioré, avec capture de la page.
        </p>
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

      {/* Le rapport complet, présenté par blocs */}
      {audit ? (
        <div className="mb-4 flex flex-wrap items-center gap-6 rounded-2xl border border-[#e4e4e4]/12 bg-[#232323] p-5 sm:p-6">
          <div className="flex items-center gap-5">
            <NoteRonde note={audit.note} score={audit.scoreGlobal} />
            <div>
              <p className="text-eyebrow">Note globale de l&apos;audit complet</p>
              <p className="mt-1 font-display text-lg font-semibold text-white">{audit.scoreGlobal}/100</p>
              <p className="mt-1 max-w-[260px] truncate text-xs text-[#c8c8c8]/70">{audit.url}</p>
              <p className="mt-0.5 text-[11px] text-[#c8c8c8]/60">
                {new Date(audit.date).toLocaleString("fr-FR")}
              </p>
            </div>
          </div>
          <div className="min-w-[230px] flex-1 space-y-3">
            <BarreScore libelle="Performance" score={scorePerformanceComposite(audit.performance)} />
            <BarreScore libelle="SEO" score={audit.seo.score} />
            <BarreScore libelle="Structure / Design" score={audit.design.scoreGlobal} />
          </div>
          <div className="flex w-full flex-wrap gap-3 sm:w-auto sm:flex-col">
            <BoutonAction variant="principal" onClick={() => void telechargerPdf("complet")} disabled={pdfEnCours}>
              {pdfEnCours ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
              Audit complet en PDF
            </BoutonAction>
            <BoutonAction onClick={() => setAxesOuverts(true)}>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Voir les axes d&apos;amélioration
            </BoutonAction>
            <BoutonAction onClick={() => void sauvegarder()} disabled={sauvegardeEnCours || dejaSauvegarde}>
              {sauvegardeEnCours ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              {dejaSauvegarde ? "Sauvegardé" : "Sauvegarder"}
            </BoutonAction>
          </div>
        </div>
      ) : null}

      {chargement ? (
        <Carte className="flex flex-col items-center justify-center gap-4 px-6 py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#e4e4e4]" aria-hidden="true" />
          <div className="flex flex-col items-center gap-1.5 text-center">
            <p className="text-sm font-medium text-white">Audit complet en cours</p>
            <p className="text-sm text-[#c8c8c8]">{etape}</p>
            <p className="text-xs text-[#c8c8c8]/60">La page se charge dans un vrai navigateur — patientez un instant.</p>
          </div>
        </Carte>
      ) : audit ? (
        <div>
          <TitreBloc libelle="Rapport performance" note={`${scorePerformanceComposite(audit.performance)}/100`} />
          <ResultatPerformance r={audit.performance} />
          <TitreBloc libelle="Rapport SEO" note={`${audit.seo.score}/100`} />
          <ResultatSeo r={audit.seo} />
          <TitreBloc libelle="Rapport structure / design / copywriting / conversion" note={`${audit.design.scoreGlobal}/100`} />
          <ResultatDesign r={audit.design} />
        </div>
      ) : null}

      {/* LES AUDITS PRÉCÉDENTS — l'historique enregistré */}
      {historique.length > 0 ? (
        <div className="mt-10">
          <div className="mb-4 flex items-center gap-2">
            <History className="h-4 w-4 text-[#c8c8c8]" aria-hidden="true" />
            <h3 className="font-display text-base font-semibold text-white sm:text-lg">Audits précédents</h3>
            <span className="text-sm text-[#c8c8c8]">({historique.length})</span>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {historique.map((h) => (
              <Carte key={h.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-[190px] flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">{h.hote}</p>
                    <span
                      className="font-mono text-sm font-semibold"
                      style={{ color: couleurNote(h.scoreGlobal) }}
                    >
                      {h.note} · {h.scoreGlobal}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#c8c8c8]">
                    {new Date(h.date).toLocaleString("fr-FR")} · {h.nbAxes} axe{h.nbAxes > 1 ? "s" : ""} d&apos;amélioration
                  </p>
                  <p className="mt-1 text-[11px] text-[#c8c8c8]/70">
                    Perf {h.scores.performance} · SEO {h.scores.seo} · Design {h.scores.design}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <BoutonAction onClick={() => void voirAuditPrecedent(h.id)}>
                    <Search className="h-4 w-4" aria-hidden="true" />
                    Voir l&apos;audit
                  </BoutonAction>
                  <BoutonAction
                    onClick={() => {
                      void voirAuditPrecedent(h.id).then(() => {
                        /* ouvre ensuite les axes du rapport chargé */
                        setAxesOuverts(true);
                      });
                    }}
                  >
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    Axes d&apos;amélioration
                  </BoutonAction>
                </div>
              </Carte>
            ))}
          </div>
        </div>
      ) : null}

      {/* LA MODALE DES AXES D'AMÉLIORATION — tout ce qu'il faut
          corriger, par bloc et par priorité, téléchargeable en PDF. */}
      <ModaleContenu
        ouvert={axesOuverts && audit !== null}
        titre="Axes d'amélioration"
        sousTitre={audit ? `${audit.hote} — ${axes.length} axe${axes.length > 1 ? "s" : ""} priorisé${axes.length > 1 ? "s" : ""} pour amener le site à 100 %` : ""}
        onClose={() => setAxesOuverts(false)}
        large="max-w-3xl"
        pied={
          <BoutonAction variant="principal" onClick={() => void telechargerPdf("axes")} disabled={pdfEnCours || !audit}>
            {pdfEnCours ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
            Télécharger les axes d&apos;amélioration (PDF)
          </BoutonAction>
        }
      >
        {audit && axes.length === 0 ? (
          <p className="text-sm text-[#c8c8c8]">Aucun axe d&apos;amélioration : le site est déjà en très bonne forme.</p>
        ) : null}
        {(["Performance", "SEO", "Structure / Design"] as const).map((bloc) => {
          const axesBloc = axes.filter((a) => a.bloc === bloc);
          if (axesBloc.length === 0) return null;
          return (
            <div key={bloc} className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                {bloc === "Performance" ? (
                  <Gauge className="h-4 w-4 text-[#c8c8c8]" aria-hidden="true" />
                ) : bloc === "SEO" ? (
                  <SearchCheck className="h-4 w-4 text-[#c8c8c8]" aria-hidden="true" />
                ) : (
                  <Sparkles className="h-4 w-4 text-[#c8c8c8]" aria-hidden="true" />
                )}
                <h4 className="font-display text-sm font-semibold text-white">{bloc}</h4>
              </div>
              <div className="space-y-2.5">
                {axesBloc.map((a: AxeAmelioration, i) => (
                  <div key={`${a.titre}-${i}`} className="rounded-xl border border-[#e4e4e4]/10 bg-[#1c1c1c] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{a.titre}</p>
                      <Pastille ton={a.priorite === "élevée" ? "alerte" : a.priorite === "faible" ? "valide" : "neutre"}>
                        Priorité {a.priorite}
                      </Pastille>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#c8c8c8]">{a.detail}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[#e4e4e4]">→ {a.conseil}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </ModaleContenu>
    </div>
  );
}
