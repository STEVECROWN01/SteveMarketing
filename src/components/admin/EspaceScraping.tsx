"use client";

import React, { useState } from "react";
import { Download, ExternalLink, Globe, Loader2, Mail, MapPin, Phone, Radar, Search, Users } from "lucide-react";
import { BoutonAction, Carte, Champ, Pastille, TitreSection, styleInput } from "./elements";
import type { EntrepriseScraped } from "@/lib/scraping/types";
import {
  CATEGORIES_PROSPECTION,
  NICHES_PROSPECTION,
  etoilesAffichees,
  fourchettePanier,
  nichesDeCategorie,
  type NicheProspection,
} from "@/lib/scraping/niches";

/**
 * VOLET 27 (28/11/2026) — ESPACE « SCRAPING » DU BACK-OFFICE.
 * CORRECTIF 28/11 (soir) — CIBLAGE PAR FICHIER DE PROSPECTION :
 * le formulaire demande la CATÉGORIE puis la NICHE (drop-downs liés
 * du fichier « Pack_Prospection_2026.xlsx » : la niche se dégrise
 * après le choix de la catégorie et ne présente que les niches
 * qu'elle contient, chacune avec son ÉTOILE de classement et le PRIX
 * facturable du site entre parenthèses ; la niche choisie affiche sa
 * cible idéale et ses upsells). Les autres filtres (employés
 * minimum, complément libre) restent OPTIONNELS.
 *
 * Trois outils de prospection d'entreprises pour le service de web
 * design, sans clé d'API ni abonnement :
 *
 *  - GOOGLE MAPS : fiches d'entreprises par LIEU et par NICHE — nom,
 *    catégorie, adresse, ville, pays, téléphone, email, site web ;
 *  - INSTAGRAM : pages d'entreprises — nom, bio, catégorie, email,
 *    téléphone, site web, localisation, abonnés ;
 *  - LINKEDIN : pages d'entreprises — nom, description, industrie,
 *    siège, nombre d'employés, site web, type.
 *
 * Chaque outil porte le FILTRE « avec site web / sans site web »
 * (c'est en fonction de ce filtre qu'il scrape) et l'export CSV.
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

  /* CORRECTIF 28/11 (soir) — CIBLAGE PAR CATÉGORIE PUIS NICHE (le
   * fichier de prospection de l'éditeur) : le drop-down de niche
   * reste GRISEÉ jusqu'au choix de la catégorie, puis présente les
   * niches QUE de cette catégorie, avec leur ÉTOILE de classement
   * et le PRIX facturable entre parenthèses. La niche choisie
   * affiche sa cible idéale et ses upsells (du fichier). « Autre »
   * laisse préciser librement. Les autres filtres restent
   * OPTIONNELS : sans rien remplir de plus, le scraping ramène tous
   * les prospects de la niche. */
  const [categorie, setCategorie] = useState("");
  const [nicheCle, setNicheCle] = useState("");
  const [nicheAutre, setNicheAutre] = useState("");
  const [lieu, setLieu] = useState("");
  const [complementIg, setComplementIg] = useState("");
  const [complementLi, setComplementLi] = useState("");
  const [filtreSite, setFiltreSite] = useState<FiltreSite>("tous");
  const [minEmployes, setMinEmployes] = useState(0);

  const outilActif = OUTILS.find((o) => o.cle === outil) ?? OUTILS[0];
  const nicheObjet: NicheProspection | null = NICHES_PROSPECTION.find((n) => n.cle === nicheCle) ?? null;
  /* Le mot-clé réel envoyé aux outils : celui de la niche choisie
   * (le fichier donne le terme qui trouve ces entreprises), ou la
   * saisie libre « Autre ». */
  const motCleNiche = nicheObjet ? nicheObjet.motsCles : nicheAutre.trim();

  function choisirCategorie(nom: string) {
    setCategorie(nom);
    setNicheCle("");
    setNicheAutre("");
  }

  async function scraper() {
    if (chargement) return;
    const cible = outil;
    let corps: Record<string, unknown>;
    if (cible === "google-maps") {
      if (!motCleNiche || !lieu.trim()) {
        toast({
          title: "Recherche incomplète",
          description:
            "Choisissez la catégorie puis la niche (ou précisez-la librement), et indiquez le lieu (ex. « Cotonou, Bénin »).",
          variant: "destructive",
        });
        return;
      }
      corps = { niche: motCleNiche, lieu: lieu.trim(), filtreSite };
    } else if (cible === "instagram") {
      const recherche = [motCleNiche, complementIg.trim()].filter(Boolean).join(" ");
      if (!recherche) {
        toast({
          title: "Recherche vide",
          description:
            "Choisissez une niche — ou indiquez des comptes @entreprise / liens / mots-clés libres.",
          variant: "destructive",
        });
        return;
      }
      corps = { recherche, filtreSite };
    } else {
      const recherche = [motCleNiche, complementLi.trim()].filter(Boolean).join(" ");
      if (!recherche) {
        toast({
          title: "Recherche vide",
          description:
            "Choisissez une niche — ou indiquez un nom d'entreprise, une URL LinkedIn ou des mots-clés libres.",
          variant: "destructive",
        });
        return;
      }
      corps = { recherche, filtreSite, minEmployes };
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
        <Pastille ton="valide">Prospection</Pastille>
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

      {/* Formulaire de l'outil actif — ciblage CATÉGORIE → NICHE du
          fichier de prospection (drop-downs liés : la niche se
          dégrise après la catégorie et ne présente que les niches
          qu'elle contient, avec étoiles et prix entre parenthèses) ;
          lieu pour Google Maps, complément optionnel pour Instagram /
          LinkedIn, filtre employés étendu (2+, 3+, 5+…). */}
      <Carte className="mb-6 p-5 sm:p-6">
        <TitreSection note="gratuit — aucune clé d'API">{outilActif.libelle}</TitreSection>
        <p className="mb-4 text-sm leading-relaxed text-[#c8c8c8]">{outilActif.description}</p>

        {/* Catégorie puis niche — les deux drop-downs du ciblage */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Champ label="Catégorie" indicatif="le secteur des entreprises">
            <select
              className={styleInput}
              value={categorie}
              onChange={(e) => choisirCategorie(e.target.value)}
            >
              <option value="" className="bg-[#232323]">
                Choisir une catégorie…
              </option>
              {CATEGORIES_PROSPECTION.map((c) => (
                <option key={c.nom} value={c.nom} className="bg-[#232323]">
                  {etoilesAffichees(c.etoiles)} {c.nom} (panier ≈ {c.panierMoyen.toLocaleString("fr-FR")} €)
                </option>
              ))}
            </select>
          </Champ>
          <Champ label="Niche" indicatif={categorie ? "niches de la catégorie choisie" : "s'active après la catégorie"}>
            <select
              className={styleInput}
              value={nicheCle || (nicheAutre ? "autre" : "")}
              onChange={(e) => {
                setNicheCle(e.target.value === "autre" ? "" : e.target.value);
                if (e.target.value !== "autre") setNicheAutre("");
              }}
              disabled={!categorie}
            >
              <option value="" className="bg-[#232323]">
                {categorie ? "Choisir une niche…" : "Choisissez d'abord une catégorie"}
              </option>
              {nichesDeCategorie(categorie).map((n) => (
                <option key={n.cle} value={n.cle} className="bg-[#232323]">
                  {etoilesAffichees(n.etoiles)} {n.nom} ({fourchettePanier(n.panierMin, n.panierMax)})
                </option>
              ))}
              <option value="autre" className="bg-[#232323]">
                Autre — préciser librement
              </option>
            </select>
          </Champ>
        </div>

        {/* Saisie libre quand la niche n'est pas dans le fichier */}
        {!nicheCle && (categorie !== "" || nicheAutre) ? (
          <div className="mt-4">
            <Champ label="Précisez la niche" indicatif="ce que font les entreprises">
              <input
                className={styleInput}
                value={nicheAutre}
                onChange={(e) => setNicheAutre(e.target.value)}
                placeholder="Ex. salon de coiffure, restaurant, pharmacie…"
              />
            </Champ>
          </div>
        ) : null}

        {/* La niche choisie : cible idéale, prix facturable et
            upsells — tels quels du fichier de prospection */}
        {nicheObjet ? (
          <div className="mt-4 rounded-xl border border-[#e4e4e4]/10 bg-[#1c1c1c] px-4 py-3">
            <p className="text-xs leading-relaxed text-[#c8c8c8]">
              <span className="font-medium text-white">Cible idéale :</span> {nicheObjet.cible}
              <span className="mx-2 text-[#c8c8c8]/40">·</span>
              <span className="font-medium text-white">Panier vitrine :</span>{" "}
              {fourchettePanier(nicheObjet.panierMin, nicheObjet.panierMax)}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-[#c8c8c8]">
              <span className="font-medium text-white">Upsells recommandés :</span>{" "}
              {nicheObjet.upsells.join(" · ")}
            </p>
          </div>
        ) : null}

        {outil === "google-maps" ? (
          <div className="mt-4">
            <Champ label="Lieu" indicatif="ville, pays">
              <input
                className={styleInput}
                value={lieu}
                onChange={(e) => setLieu(e.target.value)}
                placeholder="Ex. Cotonou, Bénin — ou Paris, France"
              />
            </Champ>
          </div>
        ) : outil === "instagram" ? (
          <div className="mt-4">
            <Champ label="Comptes ou mots-clés libres" indicatif="optionnel — complète la niche">
              <input
                className={styleInput}
                value={complementIg}
                onChange={(e) => setComplementIg(e.target.value)}
                placeholder="Ex. @entreprise, instagram.com/entreprise — ou « restaurant Cotonou »"
              />
            </Champ>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Champ label="Entreprise ou mots-clés libres" indicatif="optionnel — complète la niche">
              <input
                className={styleInput}
                value={complementLi}
                onChange={(e) => setComplementLi(e.target.value)}
                placeholder="Ex. linkedin.com/company/entreprise — ou un nom, « clinique Bénin »"
              />
            </Champ>
            <Champ label="Employés minimum" indicatif="optionnel — pour mieux cibler">
              <select
                className={styleInput}
                value={minEmployes}
                onChange={(e) => setMinEmployes(Number(e.target.value) || 0)}
              >
                {[0, 2, 3, 5, 10, 50, 200].map((n) => (
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
