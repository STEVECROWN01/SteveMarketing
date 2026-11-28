"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  Download,
  Gauge,
  Globe,
  Layers,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  Square,
  Users,
} from "lucide-react";
import { BoutonAction, Carte, Champ, ModaleContenu, Pastille, TitreSection, styleInput } from "./elements";
import type { EntrepriseScraped } from "@/lib/scraping/types";
import { VERDICTS_LIBELLES, VERDICTS_TONS, type VerdictSite } from "@/lib/scraping/qualite-site";
import {
  CATEGORIES_PROSPECTION,
  NICHES_PROSPECTION,
  categoriesTrieesParEtoiles,
  etoilesAffichees,
  fourchettePanier,
  nichesTrieesParEtoiles,
  panierMoyenAjuste,
  recoAjustee,
  type NicheProspection,
} from "@/lib/scraping/niches";
import { PAYS_MONDE } from "@/lib/scraping/pays";

/**
 * VOLET 27 (28/11/2026) — ESPACE « SCRAPING » DU BACK-OFFICE.
 * VOLET 29 (28/11/2026 soir) — les demandes de l'éditeur :
 *
 *  - DROP-DOWNS TRIÉS PAR ÉTOILES : les catégories puis les niches
 *    s'affichent du mieux noté au moins bien noté (jamais 5 étoiles,
 *    puis 2, puis 4) ;
 *  - LIEU EN DEUX DROP-DOWNS : le PAYS (tous les pays du monde)
 *    d'abord ; la VILLE ne s'active qu'après le pays et présente
 *    les villes du pays choisi ;
 *  - PLUS DE CHAMP « précisez la niche » qui apparaissait : si le
 *    scraping est lancé SANS niche, une MODALE s'ouvre — on y
 *    choisit la niche (drop-down) ou on scrape SANS la préciser, et
 *    le système en tient compte puis la modale se ferme ;
 *  - RÉSULTATS DANS UN ESPACE DÉDIÉ : terminé, le scraping n'affiche
 *    plus ses résultats sous le formulaire — il ouvre la vue
 *    résultats ; chaque prospect porte un bouton « Voir les détails »
 *    qui déplie TOUTES ses données en dessous (un seul déplié à la
 *    fois — cliquer un autre prospect referme le premier) et ce qui
 *    n'a pas été trouvé est marqué « Non trouvé » ;
 *  - IMPORT DES PROSPECTS : on sélectionne les prospects voulus
 *    puis on les importe — ils sont enregistrés (avec un message
 *    email personnalisé par niche) dans l'espace Prospects.
 */

type TypeToast = (t: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
type FiltreSite = "tous" | "avec" | "sans";
type Outil = "google-maps" | "instagram" | "linkedin";

type ReponseScraping = {
  ok: boolean;
  entreprises: EntrepriseScraped[];
  totalTrouvees: number;
  sansSiteWeb: number;
  /* VOLET 32 — combien de sites jugés « à refaire » (score < 55). */
  sitesARefaire?: number;
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

/* Cache du fichier des villes du monde (chargé une seule fois). */
let cacheVilles: Record<string, [string, number][]> | null = null;
let promesseVilles: Promise<Record<string, [string, number][]> | null> | null = null;

async function chargerVilles(): Promise<Record<string, [string, number][]> | null> {
  if (cacheVilles) return cacheVilles;
  if (!promesseVilles) {
    promesseVilles = fetch("/villes-monde.json")
      .then((r) => (r.ok ? (r.json() as Promise<Record<string, [string, number][]>>) : null))
      .catch(() => null);
  }
  cacheVilles = await promesseVilles;
  return cacheVilles;
}

/* ------------------------------------------------------------------
 * COMBO DES VILLES — la ville du pays choisi (recherche instantanée).
 * ------------------------------------------------------------------ */
function ComboVilles({
  villes,
  valeur,
  onChange,
  desactive,
}: {
  villes: [string, number][];
  valeur: string;
  onChange: (ville: string) => void;
  desactive: boolean;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const racine = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function clicDehors(e: MouseEvent) {
      if (racine.current && !racine.current.contains(e.target as Node)) setOuvert(false);
    }
    document.addEventListener("mousedown", clicDehors);
    return () => document.removeEventListener("mousedown", clicDehors);
  }, []);

  const correspondances = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return villes.slice(0, 80);
    return villes.filter((v) => v[0].toLowerCase().includes(q)).slice(0, 80);
  }, [recherche, villes]);

  if (desactive) {
    return (
      <select className={`${styleInput} opacity-50`} disabled value="">
        <option value="">Choisissez d&apos;abord le pays</option>
      </select>
    );
  }
  return (
    <div className="relative" ref={racine}>
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        className={`${styleInput} flex cursor-pointer items-center justify-between gap-2 text-left`}
        aria-haspopup="listbox"
        aria-expanded={ouvert}
        aria-label="Ville du pays choisi"
      >
        <span className="truncate">{valeur ? valeur : "Toutes les villes (pays entier)"}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[#c8c8c8] transition-transform ${ouvert ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {ouvert ? (
        <div className="absolute z-40 mt-2 w-full rounded-xl border border-[#e4e4e4]/15 bg-[#1c1c1c] shadow-[0_18px_50px_rgba(0,0,0,0.55)]">
          <div className="border-b border-[#e4e4e4]/10 p-2">
            <input
              className="w-full rounded-lg border border-[#e4e4e4]/18 bg-[#232323] px-3 py-2 text-sm text-white placeholder:text-[#c8c8c8]/45 focus:border-[#e4e4e4] focus:outline-none"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher une ville…"
              autoFocus
            />
          </div>
          <ul role="listbox" className="scroll-slim max-h-64 overflow-y-auto py-1">
            <li>
              <button
                type="button"
                className="w-full cursor-pointer px-3.5 py-2 text-left text-sm text-[#c8c8c8] hover:bg-[#e4e4e4]/8 hover:text-white"
                onClick={() => {
                  onChange("");
                  setOuvert(false);
                }}
              >
                Toutes les villes (pays entier)
              </button>
            </li>
            {correspondances.map(([nom, population]) => (
              <li key={nom}>
                <button
                  type="button"
                  role="option"
                  aria-selected={valeur === nom}
                  className="flex w-full cursor-pointer items-baseline justify-between gap-2 px-3.5 py-2 text-left text-sm text-white hover:bg-[#e4e4e4]/8"
                  onClick={() => {
                    onChange(nom);
                    setOuvert(false);
                    setRecherche("");
                  }}
                >
                  <span>{nom}</span>
                  <span className="shrink-0 text-[10px] text-[#c8c8c8]/60">
                    {population.toLocaleString("fr-FR")} hab.
                  </span>
                </button>
              </li>
            ))}
            {correspondances.length === 0 ? (
              <li className="px-3.5 py-3 text-sm text-[#c8c8c8]/70">Aucune ville de ce nom.</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

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
          className={`min-h-[32px] cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors ${
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

/** Une ligne de données du bloc de détails (« Non trouvé » si absente). */
function Donnee({
  icone,
  libelle,
  valeur,
  lien,
}: {
  icone: React.ReactNode;
  libelle: string;
  valeur?: string | null;
  lien?: string;
}) {
  const absent = !valeur || !valeur.trim();
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-[#e4e4e4]/10 bg-[#1c1c1c] px-3.5 py-2.5">
      <span className="mt-0.5 shrink-0 text-[#c8c8c8]">{icone}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#c8c8c8]/70">{libelle}</p>
        {absent ? (
          <p className="text-xs italic text-[#c8c8c8]/50">Non trouvé</p>
        ) : lien ? (
          <a
            href={lien}
            target="_blank"
            rel="noopener noreferrer"
            className="break-words text-xs text-[#e4e4e4] underline decoration-[#e4e4e4]/40 underline-offset-2 hover:decoration-[#e4e4e4]"
          >
            {valeur}
          </a>
        ) : (
          <p className="break-words text-xs leading-relaxed text-white">{valeur}</p>
        )}
      </div>
    </div>
  );
}

/** Un prospect des résultats — bouton « Voir les détails » qui déplie
 *  toutes ses données (un seul prospect déplié à la fois). */
function CarteEntreprise({
  entreprise,
  ouverte,
  onOuvrir,
  selectionnee,
  onSelection,
}: {
  entreprise: EntrepriseScraped;
  ouverte: boolean;
  onOuvrir: () => void;
  selectionnee: boolean;
  onSelection: (v: boolean) => void;
}) {
  return (
    <Carte className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
        <button
          type="button"
          onClick={() => onSelection(!selectionnee)}
          aria-pressed={selectionnee}
          aria-label={selectionnee ? `Désélectionner ${entreprise.nom}` : `Sélectionner ${entreprise.nom}`}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-colors"
          style={{
            borderColor: selectionnee ? "#22c55e" : "rgba(228,228,228,0.25)",
            backgroundColor: selectionnee ? "rgba(34,197,94,0.15)" : "transparent",
          }}
        >
          {selectionnee ? (
            <CheckSquare className="h-5 w-5 text-[#86efac]" aria-hidden="true" />
          ) : (
            <Square className="h-5 w-5 text-[#c8c8c8]/60" aria-hidden="true" />
          )}
        </button>
        <div className="min-w-[200px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-white">{entreprise.nom}</p>
            {entreprise.siteWebPresent ? (
              <Pastille ton="valide">Site web</Pastille>
            ) : (
              <Pastille ton="alerte">Sans site web</Pastille>
            )}
            {/* VOLET 32 — LE DIAGNOSTIC DU SITE : score 0-100 + verdict
                (À refaire / Moyen / Correct) — le prospect idéal d'un
                service de création de sites est l'entreprise DONT LE
                SITE A DE VRAIS PROBLÈMES. */}
            {entreprise.qualiteSite ? (
              <Pastille ton={VERDICTS_TONS[entreprise.qualiteSite.verdict]}>
                {VERDICTS_LIBELLES[entreprise.qualiteSite.verdict]} · {entreprise.qualiteSite.score}/100
              </Pastille>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-[#c8c8c8]">{entreprise.niche}</p>
          {entreprise.localisation || entreprise.pays ? (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-[#c8c8c8]">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {entreprise.localisation}
              {entreprise.pays && entreprise.localisation && !entreprise.localisation.includes(entreprise.pays)
                ? ` · ${entreprise.pays}`
                : entreprise.pays && !entreprise.localisation
                  ? entreprise.pays
                  : ""}
            </p>
          ) : null}
        </div>
        {/* Le bouton qui REMPLACE l'ancien lien « fiche publique » :
            il déplie les données du prospect (façon liste déroulante). */}
        <button
          type="button"
          onClick={onOuvrir}
          aria-expanded={ouverte}
          className="inline-flex min-h-[38px] cursor-pointer items-center gap-2 rounded-full border border-[#e4e4e4]/25 px-4 py-1.5 text-sm text-white transition-colors hover:border-[#e4e4e4]"
        >
          Voir les détails
          <ChevronDown
            className={`h-4 w-4 transition-transform ${ouverte ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>
      {/* Le bloc de détails déplié : TOUTES les données du prospect,
          celles qui manquent sont marquées « Non trouvé ». */}
      {ouverte ? (
        <div className="border-t border-[#e4e4e4]/10 bg-[#232323]/60 p-4 sm:p-5">
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            <Donnee
              icone={<Building2 className="h-3.5 w-3.5" aria-hidden="true" />}
              libelle="Dirigeant / propriétaire"
              valeur={entreprise.dirigeant}
            />
            <Donnee
              icone={<Mail className="h-3.5 w-3.5" aria-hidden="true" />}
              libelle="Email"
              valeur={entreprise.email}
              lien={entreprise.email ? `mailto:${entreprise.email}` : undefined}
            />
            <Donnee
              icone={<Phone className="h-3.5 w-3.5" aria-hidden="true" />}
              libelle="Téléphone"
              valeur={entreprise.telephone}
              lien={entreprise.telephone ? `tel:${entreprise.telephone.replace(/\s+/g, "")}` : undefined}
            />
            <Donnee
              icone={<MapPin className="h-3.5 w-3.5" aria-hidden="true" />}
              libelle="Adresse de localisation"
              valeur={entreprise.adresse ?? entreprise.localisation}
            />
            <Donnee
              icone={<CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />}
              libelle="Depuis quand l'entreprise existe"
              valeur={entreprise.anciennete ? `Depuis ${entreprise.anciennete}` : null}
            />
            <Donnee
              icone={<Users className="h-3.5 w-3.5" aria-hidden="true" />}
              libelle="Nombre d'employés"
              valeur={entreprise.employes}
            />
            <Donnee
              icone={<Globe className="h-3.5 w-3.5" aria-hidden="true" />}
              libelle="Site web"
              valeur={entreprise.siteWeb?.replace(/^https?:\/\//, "")}
              lien={entreprise.siteWeb}
            />
            <Donnee
              icone={<CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />}
              libelle="Heures de travail"
              valeur={entreprise.horaires}
            />
            {/* VOLET 32 — le diagnostic du site web du prospect. */}
            <Donnee
              icone={<Gauge className="h-3.5 w-3.5" aria-hidden="true" />}
              libelle="Qualité du site web"
              valeur={
                entreprise.qualiteSite
                  ? `${entreprise.qualiteSite.score}/100 — ${VERDICTS_LIBELLES[entreprise.qualiteSite.verdict].replace(/^Site /, "")}`
                  : entreprise.siteWebPresent
                    ? "Diagnostic indisponible (site muet)"
                    : null
              }
            />
            <Donnee
              icone={<Layers className="h-3.5 w-3.5" aria-hidden="true" />}
              libelle="Plateforme du site"
              valeur={entreprise.qualiteSite?.plateforme}
            />
            <Donnee
              icone={<CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />}
              libelle="Dernière mise à jour du site"
              valeur={entreprise.qualiteSite?.anneeMiseAJour ? String(entreprise.qualiteSite.anneeMiseAJour) : null}
            />
            <Donnee
              icone={<Building2 className="h-3.5 w-3.5" aria-hidden="true" />}
              libelle="Ce qu'ils font"
              valeur={entreprise.bio ?? entreprise.niche}
            />
          </div>
          {/* VOLET 32 — LE DIAGNOSTIC DU SITE : les problèmes trouvés,
              en français, dans l'ordre d'importance — ce que VOUS
              pouvez résoudre pour ce prospect. */}
          {entreprise.qualiteSite ? (
            <div className="mt-3 rounded-xl border border-[#e4e4e4]/10 bg-[#1c1c1c] p-3.5">
              <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] text-[#c8c8c8]/70 uppercase">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                Diagnostic du site web — ce que vous pouvez résoudre
              </p>
              {entreprise.qualiteSite.problemes.length > 0 ? (
                <ul className="mt-2 space-y-1.5">
                  {entreprise.qualiteSite.problemes.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-xs leading-relaxed text-[#d9d9d9]">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff8080]" aria-hidden="true" />
                      {p}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs leading-relaxed text-[#86efac]">
                  Aucun problème détecté sur la page d'accueil — un site déjà bien tenu.
                </p>
              )}
              <p className="mt-2.5 text-[10px] leading-relaxed text-[#c8c8c8]/50">
                Page d'accueil uniquement : {entreprise.qualiteSite.poidsKo} Ko de HTML
                {entreprise.qualiteSite.plateforme ? ` · construit avec ${entreprise.qualiteSite.plateforme}` : ""}
                {entreprise.qualiteSite.anneeMiseAJour ? ` · dernière mise à jour visible : ${entreprise.qualiteSite.anneeMiseAJour}` : ""}.
              </p>
            </div>
          ) : null}
          {entreprise.urlSource ? (
            <p className="mt-3 text-[11px] text-[#c8c8c8]/60">
              Source :{" "}
              <a
                href={entreprise.urlSource}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[#c8c8c8]/40 underline-offset-2 hover:decoration-[#c8c8c8]"
              >
                {entreprise.urlSource.replace(/^https?:\/\//, "").slice(0, 60)}
              </a>
            </p>
          ) : null}
        </div>
      ) : null}
    </Carte>
  );
}

/** Exporte les entreprises affichées en CSV. */
function exporterCsv(nomOutil: string, entreprises: EntrepriseScraped[]) {
  const colonnes: [string, (e: EntrepriseScraped) => string][] = [
    ["Nom", (e) => e.nom],
    ["Niche", (e) => e.niche],
    ["Dirigeant", (e) => e.dirigeant ?? "Non trouvé"],
    ["Localisation", (e) => e.localisation ?? ""],
    ["Pays", (e) => e.pays ?? ""],
    ["Telephone", (e) => e.telephone ?? ""],
    ["Email", (e) => e.email ?? ""],
    ["Site web", (e) => e.siteWeb ?? ""],
    ["Site web present", (e) => (e.siteWebPresent ? "oui" : "non")],
    /* VOLET 32 — le diagnostic du site rejoint l'export. */
    ["Plateforme du site", (e) => e.qualiteSite?.plateforme ?? ""],
    ["Derniere mise a jour", (e) => (e.qualiteSite?.anneeMiseAJour ? String(e.qualiteSite.anneeMiseAJour) : "")],
    ["Score du site", (e) => (e.qualiteSite ? `${e.qualiteSite.score}/100` : "")],
    ["Verdict du site", (e) => (e.qualiteSite ? VERDICTS_LIBELLES[e.qualiteSite.verdict] : "")],
    ["Problemes du site", (e) => e.qualiteSite?.problemes.join(" | ") ?? ""],
    ["Employes", (e) => e.employes ?? ""],
    ["Horaires", (e) => e.horaires ?? ""],
    ["Anciennete", (e) => e.anciennete ?? ""],
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
  ouvrirProspects,
}: {
  stockageConfigure: boolean;
  toast: TypeToast;
  sessionExpiree: () => void;
  /** Ramène dans l'espace Prospects après l'import d'un lot. */
  ouvrirProspects: () => void;
}) {
  const [outil, setOutil] = useState<Outil>("google-maps");
  const [chargement, setChargement] = useState(false);
  const [resultats, setResultats] = useState<ReponseScraping | null>(null);
  const [vueResultats, setVueResultats] = useState(false);

  /* Ciblage par le fichier de prospection : catégorie puis niche —
   * drop-downs triés par ÉTOILES (du mieux noté au moins bien
   * noté). Plus de champ « précisez la niche » qui apparaissait :
   * sans niche, une MODALE s'ouvre au lancement du scraping. */
  const [categorie, setCategorie] = useState("");
  const [nicheCle, setNicheCle] = useState("");
  const [modaleNicheOuverte, setModaleNicheOuverte] = useState(false);
  const [nicheModale, setNicheModale] = useState("");

  /* Le lieu : PAYS puis VILLE — la ville ne s'active qu'après le
   * pays (tous les pays du monde dans le drop-down). */
  const [pays, setPays] = useState("");
  const [ville, setVille] = useState("");
  const [villes, setVilles] = useState<[string, number][]>([]);
  const [villesChargees, setVillesChargees] = useState(false);

  const [complementIg, setComplementIg] = useState("");
  const [complementLi, setComplementLi] = useState("");
  const [filtreSite, setFiltreSite] = useState<FiltreSite>("tous");
  /* VOLET 32 — FILTRES ET TRI DES RÉSULTATS : trouver vite les
   * prospects les plus intéressants (sans site, avec email, ou le
   * site le plus « à refaire » d'abord). */
  const [filtreResultat, setFiltreResultat] = useState<"tous" | "sans-site" | "avec-email" | "a-refaire">("tous");
  const [triResultat, setTriResultat] = useState<"defaut" | "score-croissant" | "nom">("defaut");
  const [minEmployes, setMinEmployes] = useState(0);

  /* Sélection des prospects à importer dans l'espace Prospects. */
  const [selection, setSelection] = useState<Set<number>>(new Set());
  const [detailOuvert, setDetailOuvert] = useState<number | null>(null);
  const [importEnCours, setImportEnCours] = useState(false);

  const outilActif = OUTILS.find((o) => o.cle === outil) ?? OUTILS[0];
  const nicheObjet: NicheProspection | null = NICHES_PROSPECTION.find((n) => n.cle === nicheCle) ?? null;
  const categorieObjet = CATEGORIES_PROSPECTION.find((c) => c.nom === categorie) ?? null;
  /* Le mot-clé réel envoyé aux outils : celui de la niche choisie ;
   *  sans niche, le terme par défaut de la catégorie (ou une
   *  recherche générique) — le système scrape « par défaut ». */
  const motCleNiche = nicheObjet
    ? nicheObjet.motsCles
    : categorieObjet
      ? categorieObjet.motCleDefaut
      : "entreprise";

  /* Charge les villes du monde dès que l'outil Google Maps (le seul
   * qui cible un lieu) est actif. */
  useEffect(() => {
    if (outil === "google-maps" && !villesChargees) {
      void chargerVilles().then(() => setVillesChargees(true));
    }
  }, [outil, villesChargees]);

  /* Les villes du pays choisi (les plus peuplées d'abord) — le
   * fichier est indéxé par CODE pays (FR, BJ…), le formulaire
   * présente les NOMS français. */
  useEffect(() => {
    if (!pays) {
      setVilles([]);
      return;
    }
    const codePays = PAYS_MONDE.find((p) => p.nom === pays)?.code ?? "";
    void chargerVilles().then((data) => {
      setVilles(data?.[codePays] ?? []);
    });
    setVille("");
  }, [pays]);

  function choisirCategorie(nom: string) {
    setCategorie(nom);
    setNicheCle("");
  }

  function choisirOutil(o: Outil) {
    setOutil(o);
    setResultats(null);
    setVueResultats(false);
    setSelection(new Set());
    setDetailOuvert(null);
  }

  /** Lancement du scraping — la niche est optionnelle : sans niche,
   *  la modale propose de la préciser ou de scraper sans. */
  function lancer() {
    if (chargement) return;
    if (!nicheCle) {
      setNicheModale("");
      setModaleNicheOuverte(true);
      return;
    }
    void scraper(nicheCle);
  }

  async function scraper(cleNiche?: string) {
    const nicheChoisie = cleNiche ? (NICHES_PROSPECTION.find((n) => n.cle === cleNiche) ?? null) : null;
    const motCle = nicheChoisie
      ? nicheChoisie.motsCles
      : categorieObjet
        ? categorieObjet.motCleDefaut
        : "entreprise";
    const cible = outil;
    const lieuComplet = ville ? `${ville}, ${pays}` : pays;
    let corps: Record<string, unknown>;
    if (cible === "google-maps") {
      if (!lieuComplet.trim()) {
        toast({
          title: "Lieu manquant",
          description: "Choisissez le pays (et éventuellement la ville) des entreprises à scraper.",
          variant: "destructive",
        });
        return;
      }
      corps = {
        niche: motCle,
        lieu: lieuComplet.trim(),
        filtreSite,
        nicheProspection: nicheChoisie?.cle,
      };
    } else if (cible === "instagram") {
      const recherche = [motCle, complementIg.trim()].filter(Boolean).join(" ");
      corps = { recherche: recherche || "entreprise", filtreSite, nicheProspection: nicheChoisie?.cle };
    } else {
      const recherche = [motCle, complementLi.trim()].filter(Boolean).join(" ");
      corps = { recherche: recherche || "entreprise", filtreSite, minEmployes, nicheProspection: nicheChoisie?.cle };
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
      setVueResultats(true);
      setSelection(new Set());
      setDetailOuvert(null);
      setFiltreResultat("tous");
      setTriResultat("defaut");
      const nb = data.entreprises.length;
      toast({
        title: nb > 0 ? `${nb} entreprise${nb > 1 ? "s" : ""} trouvée${nb > 1 ? "s" : ""}` : "Aucune entreprise",
        description:
          nb > 0
            ? `${data.sansSiteWeb} sans site web — sélectionnez les prospects à importer.`
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

  /** Sélection d'un prospect. */
  function basculerSelection(index: number) {
    setSelection((s) => {
      const copie = new Set(s);
      if (copie.has(index)) copie.delete(index);
      else copie.add(index);
      return copie;
    });
  }

  /** VOLET 32 — un prospect passe-t-il le FILTRE de la vue
   *  résultats ? (sans site web, avec email, ou site « à refaire »). */
  function passeFiltreResultat(e: EntrepriseScraped): boolean {
    if (filtreResultat === "sans-site") return !e.siteWebPresent;
    if (filtreResultat === "avec-email") return Boolean(e.email);
    if (filtreResultat === "a-refaire") return e.qualiteSite?.verdict === "a-refaire" || !e.siteWebPresent;
    return true;
  }

  function toutSelectionner() {
    /* VOLET 32 — « Tout sélectionner » porte sur la liste AFFICHÉE
     * (après filtres) : ce qu'on voit, c'est ce qu'on sélectionne. */
    const toutes = resultats?.entreprises ?? [];
    const affichees = toutes
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => passeFiltreResultat(e))
      .map(({ i }) => i);
    const toutesAfficheesSelectionnees = affichees.length > 0 && affichees.every((i) => selection.has(i));
    if (toutesAfficheesSelectionnees) {
      setSelection((s) => {
        const copie = new Set(s);
        for (const i of affichees) copie.delete(i);
        return copie;
      });
    } else {
      setSelection((s) => new Set([...s, ...affichees]));
    }
  }

  /** Importe les prospects sélectionnés dans l'espace Prospects
   *  (enregistrés dans le dépôt GitHub de stockage avec leur
   *  message email personnalisé). */
  async function importer() {
    if (chargement || importEnCours || selection.size === 0) return;
    const liste = resultats?.entreprises ?? [];
    const choisis = liste.filter((_, i) => selection.has(i));
    const intituleParts = [
      nicheObjet?.nom ?? categorieObjet?.nom ?? "",
      outil === "google-maps" ? (ville || pays) : "",
    ].filter(Boolean);
    setImportEnCours(true);
    try {
      const res = await fetch("/api/admin/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "importer",
          prospects: choisis,
          intitule: intituleParts.join(" — "),
        }),
      });
      if (res.status === 401) {
        sessionExpiree();
        return;
      }
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; total?: number } | null;
      if (!res.ok || !data?.ok) {
        toast({
          title: "Import impossible",
          description: data?.error ?? "Réessayez dans un instant.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: `${choisis.length} prospect${choisis.length > 1 ? "s" : ""} importé${choisis.length > 1 ? "s" : ""}`,
        description: `Espace Prospects : ${data.total ?? "?"} prospects enregistrés au total.`,
      });
      setResultats(null);
      setVueResultats(false);
      setSelection(new Set());
      setDetailOuvert(null);
      ouvrirProspects();
    } catch {
      toast({
        title: "Import indisponible",
        description: "Le serveur n'a pas répondu — réessayez dans un instant.",
        variant: "destructive",
      });
    } finally {
      setImportEnCours(false);
    }
  }

  /* ================= LA VUE RÉSULTATS (espace dédié) ================= */
  if (vueResultats && resultats) {
    const nb = resultats.entreprises.length;
    /* VOLET 32 — la liste AFFICHÉE : filtre + tri, l'index d'origine
     * suit chaque prospect (la sélection ne se perd jamais). */
    const listeAffichee = resultats.entreprises
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => passeFiltreResultat(e));
    if (triResultat === "score-croissant") {
      listeAffichee.sort((a, b) => (a.e.qualiteSite?.score ?? 999) - (b.e.qualiteSite?.score ?? 999));
    } else if (triResultat === "nom") {
      listeAffichee.sort((a, b) => a.e.nom.localeCompare(b.e.nom, "fr"));
    }
    const toutesAfficheesSelectionnees =
      listeAffichee.length > 0 && listeAffichee.every(({ i }) => selection.has(i));
    const nbSansSite = resultats.entreprises.filter((e) => !e.siteWebPresent).length;
    const nbAvecEmail = resultats.entreprises.filter((e) => e.email).length;
    const nbARefaire =
      resultats.sitesARefaire ?? resultats.entreprises.filter((e) => e.qualiteSite?.verdict === "a-refaire").length;
    return (
      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BoutonAction onClick={() => setVueResultats(false)}>
              <ChevronDown className="h-4 w-4 rotate-90" aria-hidden="true" />
              Nouvelle recherche
            </BoutonAction>
            <div>
              <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">Résultats du scraping</h2>
              <p className="text-xs text-[#c8c8c8]">
                {outilActif.libelle}
                {nicheObjet ? ` · ${nicheObjet.nom}` : " · sans niche précisée"}
                {outil === "google-maps" ? ` · ${ville || pays}` : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <BoutonAction onClick={toutSelectionner}>
              <CheckSquare className="h-4 w-4" aria-hidden="true" />
              {toutesAfficheesSelectionnees ? "Tout désélectionner" : "Tout sélectionner"}
            </BoutonAction>
            <BoutonAction onClick={() => exporterCsv(outil, listeAffichee.map(({ e }) => e))} disabled={listeAffichee.length === 0}>
              <Download className="h-4 w-4" aria-hidden="true" />
              CSV
            </BoutonAction>
            <BoutonAction variant="principal" onClick={() => void importer()} disabled={selection.size === 0 || importEnCours}>
              {importEnCours ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Building2 className="h-4 w-4" aria-hidden="true" />}
              Importer {selection.size > 0 ? `${selection.size} prospect${selection.size > 1 ? "s" : ""}` : "les prospects"}
            </BoutonAction>
          </div>
        </div>

        {/* VOLET 32 — FILTRES + TRI DES RÉSULTATS : cibler tout de suite
            les prospects les plus intéressants. */}
        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          {([
            { cle: "tous", libelle: `Tous (${nb})` },
            { cle: "sans-site", libelle: `Sans site web (${nbSansSite})` },
            { cle: "a-refaire", libelle: `À refaire (${nbARefaire + nbSansSite})` },
            { cle: "avec-email", libelle: `Avec email (${nbAvecEmail})` },
          ] as const).map((f) => (
            <button
              key={f.cle}
              type="button"
              onClick={() => setFiltreResultat(f.cle)}
              aria-pressed={filtreResultat === f.cle}
              className={`min-h-[40px] cursor-pointer rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                filtreResultat === f.cle
                  ? "border border-[#e4e4e4] bg-white text-[#1c1c1c]"
                  : "border border-[#e4e4e4]/20 text-[#c8c8c8] hover:border-[#e4e4e4]/40"
              }`}
            >
              {f.libelle}
            </button>
          ))}
          <span className="mx-1 hidden h-4 w-px bg-[#e4e4e4]/20 sm:block" aria-hidden="true" />
          <label className="flex items-center gap-2 text-xs text-[#c8c8c8]">
            Trier par
            <select
              value={triResultat}
              onChange={(ev) => setTriResultat(ev.target.value as "defaut" | "score-croissant" | "nom")}
              className="min-h-[40px] cursor-pointer rounded-full border border-[#e4e4e4]/20 bg-[#1c1c1c] px-3 py-2 text-xs text-white focus:border-[#e4e4e4] focus:outline-none"
            >
              <option value="defaut">Ordre de la recherche</option>
              <option value="score-croissant">Qualité du site — la pire d'abord</option>
              <option value="nom">Nom (A → Z)</option>
            </select>
          </label>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#c8c8c8]">
          <span>
            <strong className="text-white">{listeAffichee.length}</strong> affichée{listeAffichee.length > 1 ? "s" : ""}
            {resultats.totalTrouvees > nb ? ` (sur ${resultats.totalTrouvees} trouvées)` : ""}
          </span>
          <span>
            <strong className="text-white">{nbSansSite}</strong> sans site web
          </span>
          <span>
            <strong className="text-white">{nbARefaire}</strong> site{nbARefaire > 1 ? "s" : ""} à refaire
          </span>
          <span>
            <strong className="text-white">{selection.size}</strong> sélectionnée{selection.size > 1 ? "s" : ""}
          </span>
        </div>

        {resultats.avertissement ? (
          <div className="mb-4 rounded-xl border border-[#f5b700]/30 bg-[#f5b700]/10 px-4 py-3">
            <p className="text-sm leading-relaxed text-[#ffe9a3]">{resultats.avertissement}</p>
          </div>
        ) : null}

        <div className="space-y-3">
          {listeAffichee.length === 0 ? (
            <Carte className="p-6 text-center text-sm text-[#c8c8c8]">
              Aucune entreprise ne passe ce filtre — changez de filtre ou relancez la recherche.
            </Carte>
          ) : (
            listeAffichee.map(({ e, i }) => (
              <CarteEntreprise
                key={`${e.nom}-${e.urlSource ?? i}`}
                entreprise={e}
                ouverte={detailOuvert === i}
                onOuvrir={() => setDetailOuvert((actuel) => (actuel === i ? null : i))}
                selectionnee={selection.has(i)}
                onSelection={(v) =>
                  setSelection((s) => {
                    const copie = new Set(s);
                    if (v) copie.add(i);
                    else copie.delete(i);
                    return copie;
                  })
                }
              />
            ))
          )}
        </div>
      </div>
    );
  }

  /* ==================== LE FORMULAIRE DE RECHERCHE ==================== */
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
            onClick={() => choisirOutil(o.cle)}
            className={`min-h-[38px] cursor-pointer rounded-full border px-4 py-1.5 text-sm transition-colors ${
              outil === o.cle
                ? "border-[#e4e4e4] bg-white font-medium text-[#1c1c1c]"
                : "border-[#e4e4e4]/25 text-[#c8c8c8] hover:border-[#e4e4e4]/60 hover:text-white"
            }`}
          >
            {o.libelle}
          </button>
        ))}
      </div>

      <Carte className="mb-2 p-5 sm:p-6">
        <TitreSection>{outilActif.libelle}</TitreSection>
        <p className="mb-4 text-sm leading-relaxed text-[#c8c8c8]">{outilActif.description}</p>

        {/* Catégorie puis niche — les deux drop-downs du ciblage,
            triés par ÉTOILES (du mieux noté au moins bien noté). */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Champ label="Catégorie" indicatif="le secteur des entreprises">
            <select
              className={`${styleInput} cursor-pointer`}
              value={categorie}
              onChange={(e) => choisirCategorie(e.target.value)}
            >
              <option value="" className="bg-[#232323]">
                Choisir une catégorie…
              </option>
              {categoriesTrieesParEtoiles().map((c) => (
                <option key={c.nom} value={c.nom} className="bg-[#232323]">
                  {etoilesAffichees(c.etoiles)} {c.nom} (panier ≈ {panierMoyenAjuste(c).toLocaleString("fr-FR")} €)
                </option>
              ))}
            </select>
          </Champ>
          <Champ label="Niche" indicatif={categorie ? "niches de la catégorie choisie" : "s'active après la catégorie"}>
            <select
              className={`${styleInput} cursor-pointer`}
              value={nicheCle}
              onChange={(e) => setNicheCle(e.target.value)}
              disabled={!categorie}
            >
              <option value="" className="bg-[#232323]">
                {categorie ? "Choisir une niche…" : "Choisissez d'abord une catégorie"}
              </option>
              {(categorie ? nichesTrieesParEtoiles(categorie) : []).map((n) => (
                <option key={n.cle} value={n.cle} className="bg-[#232323]">
                  {etoilesAffichees(n.etoiles)} {n.nom} ({fourchetteReco(n)})
                </option>
              ))}
            </select>
          </Champ>
        </div>

        {/* La niche choisie : cible idéale, prix recommandé et
            upsells — les recommandations du fichier de prospection. */}
        {nicheObjet ? (
          <div className="mt-4 rounded-xl border border-[#e4e4e4]/10 bg-[#1c1c1c] px-4 py-3">
            <p className="text-xs leading-relaxed text-[#c8c8c8]">
              <span className="font-medium text-white">Cible idéale :</span> {recoAjustee(nicheObjet).cible}
              <span className="mx-2 text-[#c8c8c8]/40">·</span>
              <span className="font-medium text-white">Panier vitrine :</span> {fourchetteReco(nicheObjet)}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-[#c8c8c8]">
              <span className="font-medium text-white">Upsells recommandés :</span>{" "}
              {nicheObjet.upsells.join(" · ")}
            </p>
          </div>
        ) : null}

        {/* Le lieu : PAYS (tous les pays du monde) puis VILLE (les
            villes du pays — le drop-down ne s'active qu'après le
            pays). */}
        {outil === "google-maps" ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Champ label="Pays" indicatif="le pays des entreprises">
              <select
                className={`${styleInput} cursor-pointer`}
                value={pays}
                onChange={(e) => setPays(e.target.value)}
              >
                <option value="" className="bg-[#232323]">
                  Choisir un pays…
                </option>
                {PAYS_MONDE.map((p) => (
                  <option key={p.code} value={p.nom} className="bg-[#232323]">
                    {p.nom}
                  </option>
                ))}
              </select>
            </Champ>
            <Champ
              label="Ville"
              indicatif={pays ? `villes de ${pays} — ou tout le pays` : "s'active après le pays"}
            >
              <ComboVilles
                villes={villes}
                valeur={ville}
                onChange={setVille}
                desactive={!pays}
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
                className={`${styleInput} cursor-pointer`}
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
          <BoutonAction variant="principal" onClick={() => lancer()} disabled={chargement}>
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

      {chargement ? (
        <Carte className="flex items-center justify-center gap-3 px-6 py-14">
          <Loader2 className="h-5 w-5 animate-spin text-[#e4e4e4]" aria-hidden="true" />
          <p className="text-sm text-[#c8c8c8]">
            Le scraping collecte les fiches d&apos;entreprises (y compris le dirigeant, quand il est trouvable)…
          </p>
        </Carte>
      ) : null}

      {/* MODALE DE NICHE — le scraping est lancé sans niche précisée :
          on choisit la niche ici, ou on scrape sans la préciser ; le
          système en tient compte et la modale se referme. */}
      <ModaleContenu
        ouvert={modaleNicheOuverte}
        titre="Préciser la niche ?"
        sousTitre="Le scraping est plus efficace ciblé sur une niche du fichier de prospection — mais vous pouvez aussi le lancer sans la préciser."
        onClose={() => setModaleNicheOuverte(false)}
        pied={
          <>
            <BoutonAction onClick={() => setModaleNicheOuverte(false)}>
              Annuler
            </BoutonAction>
            <BoutonAction
              onClick={() => {
                setModaleNicheOuverte(false);
                void scraper();
              }}
            >
              Scraper sans préciser la niche
            </BoutonAction>
            <BoutonAction
              variant="principal"
              disabled={!nicheModale}
              onClick={() => {
                setNicheCle(nicheModale);
                const n = NICHES_PROSPECTION.find((x) => x.cle === nicheModale);
                if (n && n.categorie !== categorie) setCategorie(n.categorie);
                setModaleNicheOuverte(false);
                void scraper(nicheModale);
              }}
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Lancer le scraping
            </BoutonAction>
          </>
        }
      >
        <Champ label="Niche" indicatif={categorie ? `niches de « ${categorie} »` : "toutes les niches, par étoiles"}>
          <select
            className={`${styleInput} cursor-pointer`}
            value={nicheModale}
            onChange={(e) => setNicheModale(e.target.value)}
          >
            <option value="" className="bg-[#232323]">
              Choisir une niche…
            </option>
            {categorie ? (
              nichesTrieesParEtoiles(categorie).map((n) => (
                <option key={n.cle} value={n.cle} className="bg-[#232323]">
                  {etoilesAffichees(n.etoiles)} {n.nom} ({fourchetteReco(n)})
                </option>
              ))
            ) : (
              categoriesTrieesParEtoiles().map((c) => (
                <optgroup key={c.nom} label={`${etoilesAffichees(c.etoiles)} ${c.nom}`} className="bg-[#232323]">
                  {nichesTrieesParEtoiles(c.nom).map((n) => (
                    <option key={n.cle} value={n.cle} className="bg-[#232323]">
                      {etoilesAffichees(n.etoiles)} {n.nom} ({fourchetteReco(n)})
                    </option>
                  ))}
                </optgroup>
              ))
            )}
          </select>
        </Champ>
        <p className="mt-3 text-xs leading-relaxed text-[#c8c8c8]">
          Sans niche, le scraping recherche « {categorieObjet?.motCleDefaut ?? "entreprise"} » sur
          {outil === "google-maps" ? ` ${ville || pays || "le lieu choisi"}` : " la source choisie"}.
        </p>
      </ModaleContenu>
    </div>
  );
}

/** La fourchette de panier recommandée (ajustée). */
function fourchetteReco(n: NicheProspection): string {
  const reco = recoAjustee(n);
  return fourchettePanier(reco.panierMin, reco.panierMax);
}
