"use client";

import React, { useState } from "react";
import { Download, ExternalLink, Globe, Loader2, Mail, MapPin, Phone, Radar, Search, Users } from "lucide-react";
import { BoutonAction, Carte, Champ, Pastille, TitreSection, styleInput } from "./elements";
import type { EntrepriseScraped } from "@/lib/scraping/types";

/**
 * VOLET 27 (28/11/2026) — ESPACE « SCRAPING » DU BACK-OFFICE.
 *
 * Trois outils de prospection d'entreprises pour le service de web
 * design, clonés gratuitement sur les outils du marché (aucune clé
 * d'API, aucun abonnement) :
 *
 *  - GOOGLE MAPS : fiches d'entreprises par LIEU et par NICHE — nom,
 *    catégorie, adresse, ville, pays, téléphone, email, site web ;
 *  - INSTAGRAM : pages d'entreprises — nom, bio, catégorie, email,
 *    téléphone, site web, localisation, abonnés ;
 *  - LINKEDIN : pages d'entreprises — nom, description, industrie,
 *    siège, nombre d'employés, site web, type.
 *
 * Chaque outil porte le FILTRE « avec site web / sans site web »
 * (c'est en fonction de ce filtre qu'il scrape — les entreprises
 * SANS site web sont les prospects du service de création de sites)
 * et l'export CSV de la liste affichée.
 */

type TypeToast = (t: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
type FiltreSite = "tous" | "avec" | "sans";
type Outil = "google-maps" | "instagram" | "linkedin";

type ReponseScraping = {
  ok: boolean;
  entreprises: EntrepriseScraped[];
  totalTrouvees: number;
  sansSiteWeb: number;
  avertissement?: string;
  error?: string;
};

const OUTILS: { cle: Outil; libelle: string; description: string }[] = [
  {
    cle: "google-maps",
    libelle: "Google Maps",
    description:
      "Fiches d'entreprises par lieu et par niche : nom, catégorie, adresse, ville, pays, téléphone, email et site web des entreprises.",
  },
  {
    cle: "instagram",
    libelle: "Instagram",
    description:
      "Pages d'entreprises Instagram : nom, bio (ce qu'elles font), catégorie, localisation, email, téléphone, site web et abonnés.",
  },
  {
    cle: "linkedin",
    libelle: "LinkedIn",
    description:
      "Pages d'entreprises LinkedIn : nom, description, industrie (niche), siège (localisation), nombre d'employés, site web et type.",
  },
];

/** Bouton du filtre « site web ». */
function BoutonFiltreSite({
  filtre,
  setFiltre,
}: {
  filtre: FiltreSite;
  setFiltre: (f: FiltreSite) => void;
}) {
  const options: { cle: FiltreSite; libelle: string }[] = [
    { cle: "tous", libelle: "Tous" },
    { cle: "sans", libelle: "Sans site web" },
    { cle: "avec", libelle: "Avec site web" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrer par site web">
      {options.map((o) => (
        <button
          key={o.cle}
          type="button"
          aria-pressed={filtre === o.cle}
          onClick={() => setFiltre(o.cle)}
          className={`min-h-[32px] rounded-full border px-3 py-1 text-xs transition-colors ${
            filtre === o.cle
              ? "border-[#e4e4e4] bg-white font-medium text-[#1c1c1c]"
              : "border-[#e4e4e4]/25 text-[#c8c8c8] hover:border-[#e4e4e4]/60 hover:text-white"
          }`}
        >
          {o.libelle}
        </button>
      ))}
    </div>
  );
}

/** Une entreprise prospectée. */
function CarteEntreprise({ entreprise }: { entreprise: EntrepriseScraped }) {
  return (
    <Carte className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
      <div className="min-w-[220px] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-white">{entreprise.nom}</p>
          {entreprise.siteWebPresent ? (
            <Pastille ton="valide">Site web</Pastille>
          ) : (
            <Pastille ton="alerte">Sans site web</Pastille>
          )}
        </div>
        <p className="mt-1 text-xs text-[#c8c8c8]">{entreprise.niche}</p>
        {entreprise.localisation ? (
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-[#c8c8c8]">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {entreprise.localisation}
            {entreprise.pays && !entreprise.localisation.includes(entreprise.pays) ? ` · ${entreprise.pays}` : ""}
          </p>
        ) : entreprise.pays ? (
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-[#c8c8c8]">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {entreprise.pays}
          </p>
        ) : null}
        {entreprise.employes ? (
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-[#c8c8c8]">
            <Users className="h-3 w-3" aria-hidden="true" />
            {entreprise.employes}
          </p>
        ) : null}
        {entreprise.bio ? (
          <p className="mt-2 line-clamp-2 max-w-xl text-xs leading-relaxed text-[#c8c8c8]/80">
            {entreprise.bio}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col items-end gap-1.5 text-xs">
        {entreprise.email ? (
          <a
            href={`mailto:${entreprise.email}`}
            className="inline-flex items-center gap-1.5 text-[#e4e4e4] underline decoration-[#e4e4e4]/40 underline-offset-2 hover:decoration-[#e4e4e4]"
          >
            <Mail className="h-3 w-3" aria-hidden="true" />
            {entreprise.email}
          </a>
        ) : null}
        {entreprise.telephone ? (
          <a
            href={`tel:${entreprise.telephone.replace(/\s+/g, "")}`}
            className="inline-flex items-center gap-1.5 text-[#e4e4e4] underline decoration-[#e4e4e4]/40 underline-offset-2 hover:decoration-[#e4e4e4]"
          >
            <Phone className="h-3 w-3" aria-hidden="true" />
            {entreprise.telephone}
          </a>
        ) : null}
        {entreprise.siteWeb ? (
          <a
            href={entreprise.siteWeb}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[#e4e4e4] underline decoration-[#e4e4e4]/40 underline-offset-2 hover:decoration-[#e4e4e4]"
          >
            <Globe className="h-3 w-3" aria-hidden="true" />
            {entreprise.siteWeb.replace(/^https?:\/\//, "").slice(0, 42)}
          </a>
        ) : null}
        {entreprise.urlSource ? (
          <a
            href={entreprise.urlSource}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[#c8c8c8] underline decoration-[#c8c8c8]/40 underline-offset-2 hover:decoration-[#c8c8c8]"
          >
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
            fiche publique
          </a>
        ) : null}
        {!entreprise.email && !entreprise.telephone && !entreprise.siteWeb ? (
          <span className="text-[#c8c8c8]/60">coordonnées non publiées sur la fiche</span>
        ) : null}
      </div>
    </Carte>
  );
}

/** Exporte les entreprises affichées en CSV. */
function exporterCsv(nomOutil: string, entreprises: EntrepriseScraped[]) {
  const colonnes: [string, (e: EntrepriseScraped) => string][] = [
    ["Nom", (e) => e.nom],
    ["Niche", (e) => e.niche],
    ["Localisation", (e) => e.localisation ?? ""],
    ["Pays", (e) => e.pays ?? ""],
    ["Telephone", (e) => e.telephone ?? ""],
    ["Email", (e) => e.email ?? ""],
    ["Site web", (e) => e.siteWeb ?? ""],
    ["Site web present", (e) => (e.siteWebPresent ? "oui" : "non")],
    ["Employes", (e) => e.employes ?? ""],
    ["Compte", (e) => e.contact ?? ""],
    ["Bio", (e) => e.bio ?? ""],
    ["Fiche", (e) => e.urlSource ?? ""],
  ];
  const echapper = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lignes = [
    colonnes.map((c) => echapper(c[0])).join(";"),
    ...entreprises.map((e) => colonnes.map((c) => echapper(c[1](e))).join(";")),
  ];
  const blob = new Blob(["\uFEFF" + lignes.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `scraping-${nomOutil}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function EspaceScraping({
  toast,
  sessionExpiree,
}: {
  stockageConfigure: boolean;
  toast: TypeToast;
  sessionExpiree: () => void;
}) {
  const [outil, setOutil] = useState<Outil>("google-maps");
  const [chargement, setChargement] = useState(false);
  const [resultats, setResultats] = useState<ReponseScraping | null>(null);

  /* champs des trois outils */
  const [niche, setNiche] = useState("");
  const [lieu, setLieu] = useState("");
  const [rechercheIg, setRechercheIg] = useState("");
  const [rechercheLi, setRechercheLi] = useState("");
  const [filtreSite, setFiltreSite] = useState<FiltreSite>("tous");
  const [minEmployes, setMinEmployes] = useState(0);

  const outilActif = OUTILS.find((o) => o.cle === outil) ?? OUTILS[0];

  async function scraper() {
    if (chargement) return;
    const cible = outil;
    let corps: Record<string, unknown>;
    if (cible === "google-maps") {
      if (!niche.trim() || !lieu.trim()) {
        toast({
          title: "Recherche incomplète",
          description: "Indiquez la niche (ex. « salon de coiffure ») et le lieu (ex. « Cotonou, Bénin »).",
          variant: "destructive",
        });
        return;
      }
      corps = { niche: niche.trim(), lieu: lieu.trim(), filtreSite };
    } else if (cible === "instagram") {
      if (!rechercheIg.trim()) {
        toast({
          title: "Recherche vide",
          description: "Indiquez des mots-clés (ex. « restaurant Cotonou ») ou collez des comptes @entreprise.",
          variant: "destructive",
        });
        return;
      }
      corps = { recherche: rechercheIg.trim(), filtreSite };
    } else {
      if (!rechercheLi.trim()) {
        toast({
          title: "Recherche vide",
          description: "Indiquez des mots-clés (ex. « clinique Bénin »), un nom d'entreprise ou une URL LinkedIn.",
          variant: "destructive",
        });
        return;
      }
      corps = { recherche: rechercheLi.trim(), filtreSite, minEmployes };
    }
    setChargement(true);
    try {
      const res = await fetch(`/api/admin/scraping/${cible}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      if (res.status === 401) {
        sessionExpiree();
        return;
      }
      const data = (await res.json().catch(() => null)) as ReponseScraping | null;
      if (!res.ok || !data?.ok) {
        toast({
          title: "Scraping impossible",
          description: data?.error ?? "Réessayez dans un instant.",
          variant: "destructive",
        });
        return;
      }
      setResultats(data);
      const nb = data.entreprises.length;
      toast({
        title: nb > 0 ? `${nb} entreprise${nb > 1 ? "s" : ""} trouvée${nb > 1 ? "s" : ""}` : "Aucune entreprise",
        description:
          nb > 0
            ? `${data.sansSiteWeb} sans site web — exportez la liste en CSV ou ouvrez les fiches.`
            : data.avertissement ?? "Essayez d'autres mots-clés ou un autre lieu.",
      });
    } catch {
      toast({
        title: "Scraping indisponible",
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
          <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">Scraping</h2>
          <p className="mt-1 max-w-2xl text-sm text-[#c8c8c8]">
            Prospection d&apos;entreprises pour vos services de web design : coordonnées
            (nom, niche, localisation, email, téléphone, site web, employés) et filtre
            « avec / sans site web » — les entreprises sans site web sont vos prospects.
          </p>
        </div>
        <Pastille ton="valide">Aucune clé d&apos;API</Pastille>
      </div>

      {/* Onglets des trois outils */}
      <div className="mb-6 flex flex-wrap items-center gap-2" role="tablist" aria-label="Outils de scraping">
        {OUTILS.map((o) => (
          <button
            key={o.cle}
            type="button"
            role="tab"
            aria-selected={outil === o.cle}
            onClick={() => {
              setOutil(o.cle);
              setResultats(null);
            }}
            className={`min-h-[38px] rounded-full border px-4 py-1.5 text-sm transition-colors ${
              outil === o.cle
                ? "border-[#e4e4e4] bg-white font-medium text-[#1c1c1c]"
                : "border-[#e4e4e4]/25 text-[#c8c8c8] hover:border-[#e4e4e4]/60 hover:text-white"
            }`}
          >
            {o.libelle}
          </button>
        ))}
      </div>

      {/* Formulaire de l'outil actif */}
      <Carte className="mb-6 p-5 sm:p-6">
        <TitreSection note="gratuit — aucune clé d'API">{outilActif.libelle}</TitreSection>
        <p className="mb-4 text-sm leading-relaxed text-[#c8c8c8]">{outilActif.description}</p>

        {outil === "google-maps" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Niche / catégorie" indicatif="ce que font les entreprises">
              <input
                className={styleInput}
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="Ex. salon de coiffure, restaurant, pharmacie…"
              />
            </Champ>
            <Champ label="Lieu" indicatif="ville, pays">
              <input
                className={styleInput}
                value={lieu}
                onChange={(e) => setLieu(e.target.value)}
                placeholder="Ex. Cotonou, Bénin"
              />
            </Champ>
          </div>
        ) : outil === "instagram" ? (
          <Champ label="Recherche" indicatif="mots-clés ou comptes @entreprise / liens">
            <input
              className={styleInput}
              value={rechercheIg}
              onChange={(e) => setRechercheIg(e.target.value)}
              placeholder="Ex. restaurant Cotonou — ou @entreprise, instagram.com/entreprise…"
            />
          </Champ>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Recherche" indicatif="mots-clés, nom d'entreprise ou URL LinkedIn">
              <input
                className={styleInput}
                value={rechercheLi}
                onChange={(e) => setRechercheLi(e.target.value)}
                placeholder="Ex. clinique Bénin — ou linkedin.com/company/entreprise"
              />
            </Champ>
            <Champ label="Employés minimum" indicatif="filtre LinkedIn (ex. 5)">
              <select
                className={styleInput}
                value={minEmployes}
                onChange={(e) => setMinEmployes(Number(e.target.value) || 0)}
              >
                {[0, 5, 10, 50, 200].map((n) => (
                  <option key={n} value={n} className="bg-[#232323]">
                    {n === 0 ? "Toutes les tailles" : `${n} employés et plus`}
                  </option>
                ))}
              </select>
            </Champ>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <BoutonFiltreSite filtre={filtreSite} setFiltre={setFiltreSite} />
          <BoutonAction variant="principal" onClick={() => void scraper()} disabled={chargement}>
            {chargement ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Scraping…
              </>
            ) : (
              <>
                <Search className="h-4 w-4" aria-hidden="true" />
                Scraper
              </>
            )}
          </BoutonAction>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-[#c8c8c8]/80">
          Le filtre « site web » pilote le scraping : « Sans site web » ne renvoie que les
          entreprises sans site — vos prospects. Les données viennent de sources publiques
          (fiches d&apos;entreprises, pages Instagram et LinkedIn accessibles publiquement).
        </p>
      </Carte>

      {/* Résultats */}
      {resultats ? (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-[#c8c8c8]">
              <Radar className="h-4 w-4" aria-hidden="true" />
              <span>
                <strong className="text-white">{resultats.entreprises.length}</strong> entreprise
                {resultats.entreprises.length > 1 ? "s" : ""} affichée
                {resultats.entreprises.length > 1 ? "s" : ""}
                {resultats.totalTrouvees > resultats.entreprises.length
                  ? ` (sur ${resultats.totalTrouvees} trouvées)`
                  : ""}
                {" · "}
                <strong className="text-white">{resultats.sansSiteWeb}</strong> sans site web
              </span>
            </div>
            {resultats.entreprises.length > 0 ? (
              <BoutonAction onClick={() => exporterCsv(outil, resultats.entreprises)}>
                <Download className="h-4 w-4" aria-hidden="true" />
                Exporter en CSV
              </BoutonAction>
            ) : null}
          </div>
          {resultats.avertissement ? (
            <div className="mb-4 rounded-xl border border-[#f5b700]/30 bg-[#f5b700]/10 px-4 py-3">
              <p className="text-sm leading-relaxed text-[#ffe9a3]">{resultats.avertissement}</p>
            </div>
          ) : null}
          <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
            {resultats.entreprises.length === 0 ? (
              <Carte className="p-6 text-center text-sm text-[#c8c8c8]">
                Aucune entreprise — élargissez la recherche ou changez le filtre « site web ».
              </Carte>
            ) : (
              resultats.entreprises.map((e, i) => (
                <CarteEntreprise key={`${e.nom}-${e.urlSource ?? i}`} entreprise={e} />
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
