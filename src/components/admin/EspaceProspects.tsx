"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Globe, Loader2, RefreshCw, Users } from "lucide-react";
import { BoutonAction, Carte, Pastille } from "./elements";
import type { LotProspects, ProspectEnregistre, StatutProspect } from "@/lib/prospects/types";
import { STATUTS_PROSPECT, statutCouleur } from "@/lib/prospects/types";

/**
 * VOLET 29 (28/11/2026) — ESPACE « PROSPECTS » DU BACK-OFFICE.
 * Précision du 28/11 (nuit) : l'option d'email N'EST PLUS une colonne
 * du tableau — l'email personnalisé est désormais PROPOSÉ AU NIVEAU
 * DE L'AUDIT du site du prospect (bouton « Proposer l'email », à
 * côté du rapport d'audit et du rapport d'amélioration).
 *
 * Le tableau présente donc : entreprise, dirigeant, email,
 * téléphone, adresse, site web, le SUIVI (non contacté → contacté →
 * RDV accepté → RDV tenu → converti) et le bouton ANALYSER qui
 * ouvre l'audit complet du site du prospect, URL préremplie — et
 * l'email personnalisé y est proposé à partir du rapport.
 *
 * Les données sont enregistrées dans le dépôt GitHub privé de
 * stockage du back-office : prospects/prospects.json (source de
 * vérité) et prospects/prospects.xlsx, MIS À JOUR à chaque
 * import — on ne les perd jamais.
 */

type TypeToast = (t: { title: string; description?: string; variant?: "default" | "destructive" }) => void;

/** Le prospect passé à l'audit (pour l'email personnalisé). */
export type ProspectAmorce = {
  url: string;
  nom: string;
  dirigeant?: string;
  email?: string;
  nicheProspection?: string;
  niche?: string;
};

/** La date du lot, en écriture VERTICALE. */
function dateLotFr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const date = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const heure = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${date} ${heure}`;
}

function texteOu(texte?: string, replique = "Non trouvé"): string {
  return texte && texte.trim() ? texte : replique;
}

export function EspaceProspects({
  toast,
  sessionExpiree,
  onAnalyser,
  rafraichir,
}: {
  stockageConfigure: boolean;
  toast: TypeToast;
  sessionExpiree: () => void;
  /** Ouvre l'audit du site du prospect — l'URL est PRÉREMPLIE et
   *  l'email personnalisé y sera proposé à partir du rapport. */
  onAnalyser: (prospect: ProspectAmorce) => void;
  /** Clé changée par l'appelant pour forcer le rechargement. */
  rafraichir: number;
}) {
  const [lots, setLots] = useState<LotProspects[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await fetch("/api/admin/prospects", { cache: "no-store" });
      if (res.status === 401) {
        sessionExpiree();
        return;
      }
      const data = (await res.json().catch(() => null)) as { ok?: boolean; lots?: LotProspects[]; error?: string } | null;
      if (!res.ok || !data?.ok) {
        setErreur(data?.error ?? "Lecture impossible.");
        return;
      }
      setLots(data.lots ?? []);
    } catch {
      setErreur("Le serveur n'a pas répondu — réessayez dans un instant.");
    } finally {
      setChargement(false);
    }
  }, [sessionExpiree]);

  useEffect(() => {
    void charger();
  }, [charger, rafraichir]);

  const tous = useMemo(() => lots.flatMap((l) => l.prospects), [lots]);
  const compteurs = useMemo(
    () => ({
      contactes: tous.filter((p) => p.statut !== "non-contacte" && p.statut !== "perdu").length,
      rdv: tous.filter((p) => p.statut === "rdv-accepte" || p.statut === "rdv-tenu" || p.statut === "converti").length,
      convertis: tous.filter((p) => p.statut === "converti").length,
    }),
    [tous],
  );

  /** Changement du suivi d'un prospect : enregistré dans le dépôt. */
  async function changerStatut(p: ProspectEnregistre, statut: StatutProspect) {
    const lotsAvant = lots;
    setLots((l) => l.map((lot) => ({ ...lot, prospects: lot.prospects.map((x) => (x.id === p.id ? { ...x, statut } : x)) })));
    try {
      const res = await fetch("/api/admin/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "statut", id: p.id, statut }),
      });
      if (res.status === 401) {
        sessionExpiree();
        return;
      }
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !data?.ok) {
        setLots(lotsAvant);
        toast({
          title: "Suivi non enregistré",
          description: data?.error ?? "Réessayez dans un instant.",
          variant: "destructive",
        });
      }
    } catch {
      setLots(lotsAvant);
      toast({
        title: "Suivi non enregistré",
        description: "Le serveur n'a pas répondu — réessayez dans un instant.",
        variant: "destructive",
      });
    }
  }

  /** Copie le message personnalisé dans le presse-papiers. — retiré :
   *  l'email est désormais proposé au niveau de l'AUDIT. */

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">
            Prospects
            <span className="ml-2 align-middle text-sm font-normal text-[#c8c8c8]">({tous.length})</span>
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-[#c8c8c8]">
            Tous les prospects importés depuis le scraping, par lots d&apos;import : coordonnées,
            message email personnalisé, suivi des rendez-vous et des conversions — enregistrés en
            toute sécurité, jamais perdus.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BoutonAction onClick={() => void charger()} disabled={chargement}>
            <RefreshCw className={`h-4 w-4 ${chargement ? "animate-spin" : ""}`} aria-hidden="true" />
            Actualiser
          </BoutonAction>
        </div>
      </div>

      {chargement ? (
        <Carte className="flex items-center justify-center gap-3 px-6 py-16">
          <Loader2 className="h-5 w-5 animate-spin text-[#e4e4e4]" aria-hidden="true" />
          <p className="text-sm text-[#c8c8c8]">Lecture des prospects enregistrés…</p>
        </Carte>
      ) : erreur ? (
        <Carte className="p-8 text-center">
          <p className="text-sm text-[#ffdede]">{erreur}</p>
          <div className="mt-4">
            <BoutonAction onClick={() => void charger()}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Réessayer
            </BoutonAction>
          </div>
        </Carte>
      ) : lots.length === 0 ? (
        <Carte className="p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-[#c8c8c8]/50" aria-hidden="true" />
          <p className="mt-3 text-sm text-[#c8c8c8]">
            Aucun prospect pour l&apos;heure — scrapez des entreprises dans l&apos;espace Scraping,
            sélectionnez-les puis importez-les ici.
          </p>
        </Carte>
      ) : (
        <>
          {/* Compteurs de suivi */}
          <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-[#c8c8c8]">
            <Pastille ton="neutre">{tous.length} prospects</Pastille>
            <Pastille ton="valide">{compteurs.contactes} contactés</Pastille>
            <Pastille ton="neutre">{compteurs.rdv} en rendez-vous</Pastille>
            <Pastille ton="valide">{compteurs.convertis} convertis</Pastille>
          </div>

          {/* Le tableau des prospects — façon Excel : chaque lot
              d'import commence par sa ligne-séparatrice en gras plus
              claire, et sa date/heure d'importation en VERTICAL. */}
          <Carte className="overflow-hidden">
            <div className="scroll-slim overflow-x-auto">
              <table className="w-full min-w-[1180px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#e4e4e4]/15 bg-[#1c1c1c] text-[10px] font-semibold uppercase tracking-[0.14em] text-[#c8c8c8]">
                    <th className="w-9 px-1 py-3" aria-label="Date d'import du lot" />
                    <th className="px-4 py-3">Entreprise</th>
                    <th className="px-3 py-3">Dirigeant</th>
                    <th className="px-3 py-3">Email</th>
                    <th className="px-3 py-3">Téléphone</th>
                    <th className="px-3 py-3">Adresse</th>
                    <th className="px-3 py-3">Site web</th>
                    <th className="px-3 py-3">Suivi</th>
                    <th className="px-3 py-3 text-right">Audit</th>
                  </tr>
                </thead>
                {lots.map((lot) => (
                  <tbody key={lot.id}>
                    {/* La ligne-séparatrice : plus claire et en gras
                        que les autres — la limite du lot précédent. */}
                    <tr>
                      {/* La date et l'heure d'importation du lot,
                          en écriture VERTICALE, au début du bloc. */}
                      <td
                        rowSpan={lot.prospects.length + 1}
                        className="border-t-[3px] border-t-[#e4e4e4] px-0.5 py-2 align-middle"
                        style={{
                          background: "rgba(228,228,228,0.07)",
                          writingMode: "vertical-rl",
                          transform: "rotate(180deg)",
                          whiteSpace: "nowrap",
                          fontSize: "9.5px",
                          letterSpacing: "0.06em",
                          color: "#e4e4e4",
                          fontWeight: 600,
                          textAlign: "center",
                          width: "36px",
                        }}
                      >
                        {dateLotFr(lot.importeLe)}
                      </td>
                      <td
                        colSpan={8}
                        className="border-t-[3px] border-t-[#e4e4e4] px-4 py-2.5 text-[11px] font-semibold tracking-[0.08em] text-[#e4e4e4]"
                        style={{ background: "rgba(228,228,228,0.07)" }}
                      >
                        IMPORT DU {dateLotFr(lot.importeLe)}
                        {lot.intitule ? ` · ${lot.intitule}` : ""} · {lot.prospects.length} prospect
                        {lot.prospects.length > 1 ? "s" : ""}
                      </td>
                    </tr>
                    {lot.prospects.map((p) => (
                      <tr key={p.id} className="group border-b border-[#e4e4e4]/8 align-top hover:bg-[#e4e4e4]/4">
                        {/* Entreprise */}
                        <td className="max-w-[210px] px-4 py-3">
                          <p className="text-sm font-medium leading-snug text-white">{p.nom}</p>
                          <p className="mt-0.5 text-[11px] text-[#c8c8c8]/70">{p.niche}</p>
                        </td>
                        {/* Dirigeant */}
                        <td className="max-w-[150px] px-3 py-3 text-xs">
                          {p.dirigeant ? (
                            <span className="leading-snug text-white">{p.dirigeant}</span>
                          ) : (
                            <span className="italic text-[#c8c8c8]/50">Non trouvé</span>
                          )}
                        </td>
                        {/* Email */}
                        <td className="max-w-[190px] px-3 py-3 text-xs">
                          {p.email ? (
                            <a
                              href={`mailto:${p.email}`}
                              className="break-words text-[#e4e4e4] underline decoration-[#e4e4e4]/40 underline-offset-2 hover:decoration-[#e4e4e4]"
                            >
                              {p.email}
                            </a>
                          ) : (
                            <span className="italic text-[#c8c8c8]/50">Non trouvé</span>
                          )}
                        </td>
                        {/* Téléphone */}
                        <td className="whitespace-nowrap px-3 py-3 text-xs">
                          {p.telephone ? (
                            <a
                              href={`tel:${p.telephone.replace(/\s+/g, "")}`}
                              className="text-[#e4e4e4] underline decoration-[#e4e4e4]/40 underline-offset-2 hover:decoration-[#e4e4e4]"
                            >
                              {p.telephone}
                            </a>
                          ) : (
                            <span className="italic text-[#c8c8c8]/50">Non trouvé</span>
                          )}
                        </td>
                        {/* Adresse */}
                        <td className="max-w-[200px] px-3 py-3 text-xs leading-snug text-[#c8c8c8]">
                          {texteOu(p.adresse, "—")}
                        </td>
                        {/* Site web */}
                        <td className="max-w-[160px] px-3 py-3 text-xs">
                          {p.siteWeb ? (
                            <a
                              href={p.siteWeb}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 break-all text-[#e4e4e4] underline decoration-[#e4e4e4]/40 underline-offset-2 hover:decoration-[#e4e4e4]"
                            >
                              {p.siteWeb.replace(/^https?:\/\//, "").replace(/\/$/, "").slice(0, 30)}
                            </a>
                          ) : (
                            <span className="text-[#c8c8c8]/50">Sans site web</span>
                          )}
                        </td>
                        {/* Suivi (contacté, RDV, converti…) */}
                        <td className="whitespace-nowrap px-3 py-3">
                          <div className="inline-flex items-center gap-2">
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: statutCouleur(p.statut) }}
                              aria-hidden="true"
                            />
                            <select
                              className="cursor-pointer rounded-lg border border-[#e4e4e4]/18 bg-[#1c1c1c] px-2.5 py-1.5 text-xs text-white focus:border-[#e4e4e4] focus:outline-none"
                              value={p.statut}
                              onChange={(e) => void changerStatut(p, e.target.value as StatutProspect)}
                              aria-label={`Suivi de ${p.nom}`}
                            >
                              {STATUTS_PROSPECT.map((s) => (
                                <option key={s.cle} value={s.cle} className="bg-[#232323]">
                                  {s.libelle}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        {/* Audit du site web du prospect — l'audit
                            complet s'ouvre, URL préremplie, et
                            l'EMAIL PERSONNALISÉ y est proposé à
                            partir du rapport et de ses axes
                            d'amélioration. */}
                        <td className="px-3 py-3 text-right">
                          {p.siteWeb ? (
                            <BoutonAction
                              variant="principal"
                              onClick={() =>
                                onAnalyser({
                                  url: p.siteWeb as string,
                                  nom: p.nom,
                                  dirigeant: p.dirigeant,
                                  email: p.email,
                                  nicheProspection: p.nicheProspection,
                                  niche: p.niche,
                                })
                              }
                              titre={`Analyser le site de ${p.nom} (audit complet)`}
                            >
                              <Globe className="h-4 w-4" aria-hidden="true" />
                              Analyser
                            </BoutonAction>
                          ) : (
                            <span className="text-[11px] text-[#c8c8c8]/40">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
            </div>
          </Carte>
        </>
      )}
    </div>
  );
}
