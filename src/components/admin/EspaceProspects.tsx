"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Send,
  Users,
} from "lucide-react";
import { BoutonAction, Carte, ModaleContenu, Pastille } from "./elements";
import type { LotProspects, ProspectEnregistre, StatutProspect } from "@/lib/prospects/types";
import { STATUTS_PROSPECT, statutCouleur, statutLibelle } from "@/lib/prospects/types";

/**
 * VOLET 29 (28/11/2026) — ESPACE « PROSPECTS » DU BACK-OFFICE.
 *
 * Demande de l'éditeur : quand le scraping a fini, les prospects
 * sélectionnés sont IMPORTÉS dans CET espace, présenté comme un
 * tableau façon Excel. Chaque ensemble importé en un clic forme un
 * LOT : la dernière ligne du lot précédent est un SÉPARATEUR en gras,
 * plus clair que les autres lignes, et la DATE et l'HEURE
 * d'importation du lot s'affichent VERTICALEMENT à son début.
 *
 * Colonnes : entreprise, dirigeant (le nom du propriétaire — « Non
 * trouvé » quand le scraping ne l'a pas trouvé), email, téléphone,
 * adresse, site web, MESSAGE (l'email personnalisé adapté à la
 * niche — un clic l'affiche en entier dans une modale), le SUIVI
 * (non contacté → contacté → RDV accepté → RDV tenu → converti) et
 * le bouton ANALYSER qui ouvre l'outil d'audit du site du prospect
 * avec l'URL déjà préremplie.
 *
 * Les données sont enregistrées dans le dépôt GitHub privé de
 * stockage (prospects/prospects.json + prospects/prospects.xlsx mis
 * à jour) : on ne les perd jamais.
 */

type TypeToast = (t: { title: string; description?: string; variant?: "default" | "destructive" }) => void;

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
  /** Ouvre l'outil d'audit du back-office avec l'URL préremplie. */
  onAnalyser: (url: string) => void;
  /** Clé changée par l'appelant pour forcer le rechargement. */
  rafraichir: number;
}) {
  const [lots, setLots] = useState<LotProspects[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [prospectMessage, setProspectMessage] = useState<ProspectEnregistre | null>(null);

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

  /** Copie le message personnalisé dans le presse-papiers. */
  async function copierMessage(p: ProspectEnregistre) {
    const texte = `Objet : ${p.objetMessage}\n\n${p.message}`;
    try {
      await navigator.clipboard.writeText(texte);
      toast({ title: "Message copié", description: "Collez-le dans votre email." });
    } catch {
      toast({ title: "Copie impossible", description: "Sélectionnez le texte dans la modale.", variant: "destructive" });
    }
  }

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
                    <th className="px-3 py-3">Message</th>
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
                        {/* Message : la colonne montre le début du
                            message ; un clic l'affiche ENTIÈREMENT. */}
                        <td className="max-w-[220px] px-3 py-3">
                          <button
                            type="button"
                            onClick={() => setProspectMessage(p)}
                            className="cursor-pointer text-left text-xs leading-relaxed text-[#c8c8c8] hover:text-white"
                          >
                            {p.objetMessage.slice(0, 64)}
                            {p.objetMessage.length > 64 ? "…" : ""}
                          </button>
                          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-[#c8c8c8]/60">{p.message}</p>
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
                        {/* Audit du site web du prospect */}
                        <td className="px-3 py-3 text-right">
                          {p.siteWeb ? (
                            <BoutonAction
                              variant="principal"
                              onClick={() => onAnalyser(p.siteWeb as string)}
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

      {/* LE MESSAGE EN ENTIÈRETÉ — la modale du prospect : l'email
          personnalisé complet, à copier ou à envoyer tel quel. */}
      <ModaleContenu
        ouvert={prospectMessage !== null}
        titre={prospectMessage ? `Message pour ${prospectMessage.nom}` : ""}
        sousTitre={prospectMessage?.objetMessage}
        onClose={() => setProspectMessage(null)}
        large="max-w-2xl"
        pied={
          prospectMessage ? (
            <>
              <BoutonAction onClick={() => void copierMessage(prospectMessage)}>
                <Copy className="h-4 w-4" aria-hidden="true" />
                Copier le message
              </BoutonAction>
              {prospectMessage.email ? (
                <BoutonAction
                  variant="principal"
                  onClick={() => {
                    const p = prospectMessage;
                    window.location.href = `mailto:${p.email}?subject=${encodeURIComponent(p.objetMessage)}&body=${encodeURIComponent(p.message)}`;
                  }}
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Envoyer par email
                </BoutonAction>
              ) : null}
            </>
          ) : null
        }
      >
        {prospectMessage ? (
          <div>
            <div className="mb-4 space-y-1 rounded-xl border border-[#e4e4e4]/10 bg-[#1c1c1c] px-4 py-3 text-xs text-[#c8c8c8]">
              <p className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                {prospectMessage.nom} · {prospectMessage.niche}
              </p>
              <p className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                Dirigeant : {texteOu(prospectMessage.dirigeant)}
              </p>
              {prospectMessage.email ? (
                <p className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                  {prospectMessage.email}
                </p>
              ) : null}
              {prospectMessage.telephone ? (
                <p className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                  {prospectMessage.telephone}
                </p>
              ) : null}
              {prospectMessage.localisation || prospectMessage.pays ? (
                <p className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {[prospectMessage.localisation, prospectMessage.pays].filter(Boolean).join(", ")}
                </p>
              ) : null}
              {prospectMessage.siteWeb ? (
                <p className="flex items-center gap-2">
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  {prospectMessage.siteWeb}
                </p>
              ) : null}
            </div>
            <p className="text-sm font-semibold text-white">Objet : {prospectMessage.objetMessage}</p>
            <div className="mt-3 whitespace-pre-line rounded-xl border border-[#e4e4e4]/10 bg-[#1c1c1c] px-5 py-4 text-sm leading-relaxed text-[#e4e4e4]">
              {prospectMessage.message}
            </div>
            <p className="mt-3 text-[11px] text-[#c8c8c8]/60">
              Message suggéré, adapté à la niche — relisez et personnalisez-le avant l&apos;envoi.
            </p>
          </div>
        ) : null}
      </ModaleContenu>
    </div>
  );
}
