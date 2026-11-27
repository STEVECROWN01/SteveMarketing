"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Camera,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Search,
  Eye,
  EyeOff,
} from "lucide-react";
import { AnneauProgression, BoutonAction, Carte, Champ, ModaleConfirmation, Pastille, styleInput, TitreSection } from "./elements";
import type { ProjetAdmin, ImageProjet } from "@/lib/portfolio/types";
/* VOLET 20 (26/11/2026) — l'espace portfolio ne doit JAMAIS être
   vide : les projets STATIQUES du site (ceux en ligne actuellement)
   sont TOUJOURS listés — en plus des projets administrés ici. */
import { PROJECTS as PROJETS_SITE } from "@/lib/site";
import { useRouter } from "@/components/router-context";

/**
 * GESTION DU PORTFOLIO DEPUIS L'ESPACE ADMIN (VOLET 19 → VOLET 22).
 *
 * VOLET 22 (27/11/2026) — reprise EXACTE des demandes de l'éditeur,
 * formulées À TROIS REPRISES :
 *
 *  - « TOUS les projets affichés dans cet espace — même ceux déjà en
 *    ligne, les projets du site — doivent être MODIFIABLES,
 *    SUPPRIMABLES et DÉPUBLIABLES. Dépublier = l'enlever du site ;
 *    supprimer = l'enlever du site ET de l'espace ; modifier = ouvrir
 *    l'espace d'édition. Les boutons de suppression et de
 *    dépublication demandent une CONFIRMATION avec alerte sur les
 *    risques. »
 *    → chaque projet (administré OU réalisation du site) porte ses
 *    trois boutons ; les réalisations du site converties deviennent
 *    des projets administrés (même identifiant, origine "site") ;
 *    suppression d'une réalisation du site = définitive (elle
 *    disparaît du site et de l'espace) ;
 *
 *  - « quand on clique sur "ajouter un projet", la PREMIÈRE ÉTAPE est
 *    un CHAMP qui demande l'URL du projet + un bouton SCRAPER. Le
 *    scraping récupère les informations (nom du site, titre selon ce
 *    que fait le site, description) et les aperçus mobile/desktop
 *    automatiquement ; le formulaire s'ouvre ensuite PRÉ-REMPLI —
 *    tout reste modifiable. »
 *    → ÉTAPE 1 : URL + Scraper (chargement circulaire 0 → 100 %) ;
 *    ÉTAPE 2 : le formulaire habituel, pré-rempli ;
 *
 *  - « l'aperçu desktop est trop petit : augmente sa taille pour
 *    s'aligner avec l'aperçu mobile, les deux côte à côte, centrés. »
 *    → les DEUX aperçus partagent la même HAUTEUR, côte à côte,
 *    centrés.
 */

type TypeToast = (t: { title: string; description?: string; variant?: "default" | "destructive" }) => void;

/** VOLET 22 — forme d'une réalisation STATIQUE du site (PROJECTS de
 *  src/lib/site.ts, `as const`) — vue locale tolérante. */
type ProjetStatique = {
  id: string;
  name: string;
  category: string;
  description: string;
  cta: string;
  url: string;
  desktop: string;
  desktopSmall?: string;
  mobile?: string;
};

/* ------------------------------------------------------------------ */
/* Aperçu d'une capture                                               */
/* ------------------------------------------------------------------ */

function apercuDataUri(image: ImageProjet | null | undefined): string {
  if (!image?.data) return "";
  return `data:${image.mime};base64,${image.data}`;
}

function formatDateCourte(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { dateStyle: "medium" });
  } catch {
    return iso?.slice(0, 10) ?? "";
  }
}

/** VOLET 22 — charge une image du SITE (même origine) en ImageProjet
 *  (base64 + dimensions) : sert à pré-remplir le formulaire quand on
 *  MODIFIE une réalisation statique du site (conversion). */
async function chargerImageDepuisUrl(url: string): Promise<ImageProjet | null> {
  if (!url || !url.startsWith("/")) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const dims = await createImageBitmap(blob).catch(() => null);
    const data = await new Promise<string>((resolve, reject) => {
      const lecteur = new FileReader();
      lecteur.onload = () => {
        const contenu = String(lecteur.result ?? "");
        resolve(contenu.slice(contenu.indexOf(",") + 1));
      };
      lecteur.onerror = () => reject(new Error("Lecture impossible."));
      lecteur.readAsDataURL(blob);
    });
    return {
      data,
      mime: blob.type || "image/webp",
      largeur: dims?.width ?? 0,
      hauteur: dims?.height ?? 0,
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Formulaire de projet                                               */
/* ------------------------------------------------------------------ */

type Formulaire = {
  id: string | null;
  nom: string;
  titre: string;
  description: string;
  url: string;
  desktop: ImageProjet | null;
  mobile: ImageProjet | null;
  /** VOLET 22 — conversion d'une réalisation STATIQUE du site. */
  origine: "site" | null;
};

const FORMULAIRE_VIDE: Formulaire = {
  id: null,
  nom: "",
  titre: "",
  description: "",
  url: "",
  desktop: null,
  mobile: null,
  origine: null,
};

function FormulaireProjet({
  initial,
  onAnnuler,
  onEnregistre,
  toast,
  /* VOLET 22 — nouvelle création : ÉTAPE 1 = URL + SCRAPER, puis le
   * formulaire pré-rempli (ETAPE 2). */
  departScraper = false,
}: {
  initial: ProjetAdmin | null;
  onAnnuler: () => void;
  onEnregistre: (
    projet: ProjetAdmin,
    statut: "brouillon" | "publie",
  ) => Promise<void>;
  toast: TypeToast;
  departScraper?: boolean;
}) {
  const [f, setF] = useState<Formulaire>(() =>
    initial
      ? {
          id: initial.id,
          nom: initial.nom,
          titre: initial.categorie,
          description: initial.description,
          url: initial.url,
          desktop: initial.desktop,
          mobile: initial.mobile,
          origine: initial.origine ?? null,
        }
      : FORMULAIRE_VIDE,
  );
  const [enregistrement, setEnregistrement] = useState<"brouillon" | "publie" | null>(null);
  /* VOLET 20 — capture automatique des mockups depuis l'URL. */
  const [captureEnCours, setCaptureEnCours] = useState(false);

  /* ---- VOLET 22 — ÉTAPE 1 : URL + SCRAPER ---- */
  const [etape, setEtape] = useState<"url" | "formulaire">(
    initial || !departScraper ? "formulaire" : "url",
  );
  const [urlScraper, setUrlScraper] = useState("");
  const [scraping, setScraping] = useState(false);
  const [progressionScrape, setProgressionScrape] = useState(0);
  const [erreurScraper, setErreurScraper] = useState<string | null>(null);

  const maj = <K extends keyof Formulaire>(cle: K, valeur: Formulaire[K]) =>
    setF((ancien) => ({ ...ancien, [cle]: valeur }));

  /* VOLET 22 — SCRAPER : ouvre le site, lit ses informations (nom du
   * site, titre selon ce qu'il présente, description) et capture les
   * aperçus ordinateur + mobile — le formulaire est ensuite PRÉ-REMPLI
   * (tout reste modifiable). Pendant le scraping : chargement
   * circulaire VERT 0 → 100 % avec le pourcentage au centre. */
  async function scraper() {
    const cible = urlScraper.trim();
    if (!cible) {
      toast({
        title: "URL requise",
        description: "Renseignez d'abord l'URL du site du projet.",
        variant: "destructive",
      });
      return;
    }
    setScraping(true);
    setErreurScraper(null);
    setProgressionScrape(0);
    const minuteur = window.setInterval(() => {
      setProgressionScrape((p) => (p < 95 ? p + Math.max(0.8, (95 - p) / 16) : 95));
    }, 120);
    try {
      const res = await fetch("/api/admin/projects/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cible }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Scraping impossible.");
      setProgressionScrape(100);
      /* petit temps d'arrêt : l'anneau termine son tour */
      await new Promise((r) => setTimeout(r, 350));
      setF((ancien) => ({
        ...ancien,
        url: cible,
        nom: (data.nom as string) || ancien.nom,
        titre: (data.titre as string) || ancien.titre,
        description: (data.description as string) || ancien.description,
        desktop: (data.desktop as ImageProjet) ?? ancien.desktop,
        mobile: (data.mobile as ImageProjet) ?? ancien.mobile,
      }));
      setEtape("formulaire");
      toast({
        title: "Site scrapé",
        description:
          "Nom, titre, description et aperçus sont pré-remplis — tout reste modifiable avant l'enregistrement.",
      });
    } catch (e) {
      setProgressionScrape(100);
      setErreurScraper(
        e instanceof Error
          ? e.message
          : "Scraping impossible — vérifiez l'URL du site.",
      );
    } finally {
      window.clearInterval(minuteur);
      setScraping(false);
    }
  }

  /* VOLET 20 — CAPTURE AUTOMATIQUE : le site en ligne est ouvert et
   * capturé (ordinateur 1280 × 800 + mobile 390 × 844) — l'éditeur
   * n'a qu'à donner l'URL du projet. Retourne les captures (posées
   * dans le formulaire), ou null en cas d'échec. */
  async function capturer(
    url: string,
  ): Promise<{ desktop: ImageProjet; mobile: ImageProjet } | null> {
    const cible = url.trim();
    if (!cible) {
      toast({
        title: "URL requise",
        description: "Renseignez d'abord l'URL du site du projet.",
        variant: "destructive",
      });
      return null;
    }
    setCaptureEnCours(true);
    try {
      const res = await fetch("/api/admin/projects/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cible }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? "Capture impossible.");
      }
      const captures = {
        desktop: data.desktop as ImageProjet,
        mobile: data.mobile as ImageProjet,
      };
      setF((ancien) => ({ ...ancien, desktop: captures.desktop, mobile: captures.mobile }));
      toast({
        title: "Aperçus capturés",
        description: "Les captures ordinateur et mobile sont prêtes.",
      });
      return captures;
    } catch (e) {
      toast({
        title: "Capture impossible",
        description: e instanceof Error ? e.message : "Vérifiez l'URL du site.",
        variant: "destructive",
      });
      return null;
    } finally {
      setCaptureEnCours(false);
    }
  }

  async function enregistrer(statut: "brouillon" | "publie") {
    if (enregistrement) return;
    if (statut === "publie") {
      const manques: string[] = [];
      if (!f.nom.trim()) manques.push("le nom");
      if (!f.titre.trim()) manques.push("le titre");
      if (!f.description.trim()) manques.push("la description");
      if (!f.url.trim()) manques.push("l'URL du site");
      if (!f.desktop) manques.push("les aperçus (capturez ou scrapez le site)");
      if (manques.length) {
        toast({
          title: "Publication impossible",
          description: `Il manque : ${manques.join(", ")}.`,
          variant: "destructive",
        });
        return;
      }
    } else if (!f.nom.trim()) {
      toast({
        title: "Nom requis",
        description: "Donnez au moins un nom au brouillon.",
        variant: "destructive",
      });
      return;
    }
    setEnregistrement(statut);
    try {
      let desktop = f.desktop;
      let mobile = f.mobile;
      if (!desktop && f.url.trim()) {
        const captures = await capturer(f.url);
        if (captures) {
          desktop = captures.desktop;
          mobile = captures.mobile;
        } else if (statut === "publie") {
          setEnregistrement(null);
          return;
        }
      }
      await onEnregistre(
        {
          id: f.id ?? "",
          nom: f.nom.trim(),
          categorie: f.titre.trim(),
          description: f.description.trim(),
          cta: "Voir Le Site",
          url: f.url.trim(),
          statut,
          desktop,
          mobile,
          /* VOLET 22 — une réalisation du site modifiée reste reliée à
           * son original (même identifiant) : la version administrée
           * la REMPLACE sur le site, sa suppression est définitive. */
          origine: f.origine,
          traductions: null,
          createdAt: "",
          updatedAt: "",
        },
        statut,
      );
    } finally {
      setEnregistrement(null);
    }
  }

  /* ------------------ ÉTAPE 1 : URL + SCRAPER ------------------ */
  if (etape === "url") {
    return (
      <Carte className="p-5 sm:p-7">
        <TitreSection note="première étape — récupération automatique">
          Ajouter un projet
        </TitreSection>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#c8c8c8]">
          Collez l&apos;adresse en ligne du site du projet puis cliquez sur{" "}
          <strong className="text-white">Scraper</strong> : le système ouvre le site, lit ses
          informations (nom du site, titre selon ce qu&apos;il présente, description) et en
          extrait les aperçus ordinateur et mobile. Le formulaire s&apos;ouvre ensuite,{" "}
          <strong className="text-white">pré-rempli</strong> — tout reste modifiable.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <input
            className={`${styleInput} min-w-[240px] flex-1`}
            value={urlScraper}
            onChange={(e) => setUrlScraper(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !scraping && void scraper()}
            placeholder="https://exemple.vercel.app"
            inputMode="url"
            aria-label="URL du site du projet"
            disabled={scraping}
          />
          <BoutonAction
            variant="principal"
            onClick={() => void scraper()}
            disabled={scraping}
            className="shrink-0"
          >
            {scraping ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="h-4 w-4" aria-hidden="true" />
            )}
            {scraping ? "Scraping…" : "Scraper"}
          </BoutonAction>
        </div>

        {/* Chargement circulaire VERT 0 → 100 %, pourcentage au centre */}
        {scraping ? (
          <div className="mt-10 flex flex-col items-center gap-4">
            <AnneauProgression pourcentage={progressionScrape} taille={112} />
            <p className="text-sm text-[#c8c8c8]">
              Scraping du site en cours — lecture des informations et capture des aperçus…
            </p>
          </div>
        ) : null}

        {erreurScraper ? (
          <div className="mt-5 rounded-xl border border-[#ea384c]/30 bg-[#ea384c]/10 px-4 py-3">
            <p className="text-sm text-[#ffdede]">{erreurScraper}</p>
            <button
              type="button"
              onClick={() => {
                setF((ancien) => ({ ...ancien, url: ancien.url || urlScraper.trim() }));
                setEtape("formulaire");
              }}
              className="mt-2 text-xs text-[#c8c8c8] underline underline-offset-4 transition-colors hover:text-white"
            >
              Continuer sans scraping (formulaire manuel) →
            </button>
          </div>
        ) : null}

        {!scraping && !erreurScraper ? (
          <button
            type="button"
            onClick={() => {
              setF((ancien) => ({ ...ancien, url: ancien.url || urlScraper.trim() }));
              setEtape("formulaire");
            }}
            className="mt-6 text-xs text-[#c8c8c8] underline underline-offset-4 transition-colors hover:text-white"
          >
            Remplir le formulaire manuellement (sans scraping) →
          </button>
        ) : null}

        <div className="mt-8 flex justify-end border-t border-[#e4e4e4]/10 pt-5">
          <BoutonAction onClick={onAnnuler} disabled={scraping}>
            Annuler
          </BoutonAction>
        </div>
      </Carte>
    );
  }

  /* ------------------ ÉTAPE 2 : formulaire pré-rempli ------------------ */
  return (
    <Carte className="p-5 sm:p-7">
      <TitreSection note={f.id ? `identifiant : ${f.id}` : "nouveau projet"}>
        {f.id ? "Modifier le projet" : "Nouveau projet"}
      </TitreSection>

      <div className="grid gap-4 lg:grid-cols-2">
        <Champ label="Nom du projet" indicatif="obligatoire pour publier">
          <input
            className={styleInput}
            value={f.nom}
            onChange={(e) => maj("nom", e.target.value)}
            placeholder="Ex. MAISON KÔDA"
          />
        </Champ>
        {/* VOLET 20 — l'ancien champ « Catégorie » s'appelle
            « TITRE » : ce n'est pas une catégorie, c'est un titre
            (demande de l'éditeur). */}
        <Champ label="Titre" indicatif="sous le nom du projet (ex. Site web immobilier)">
          <input
            className={styleInput}
            value={f.titre}
            onChange={(e) => maj("titre", e.target.value)}
            placeholder="Ex. Site web professionnel pour coach"
          />
        </Champ>
      </div>

      <div className="mt-4">
        <Champ label="Description" indicatif="telle qu'elle apparaîtra sur le site">
          <textarea
            className={`${styleInput} min-h-[110px] resize-y`}
            value={f.description}
            onChange={(e) => maj("description", e.target.value)}
            placeholder="Une phrase claire qui présente le projet et sa valeur."
          />
        </Champ>
      </div>

      <div className="mt-4">
        {/* VOLET 20 — URL SEULE : les mockups ordinateur et mobile
            sont EXTRAILS AUTOMATIQUEMENT du site en ligne (capture)
            — plus aucun téléversement d'image. */}
        <Champ label="URL du site en ligne" indicatif="obligatoire pour publier — les aperçus en sont extraits automatiquement">
          <div className="flex flex-wrap items-center gap-3">
            <input
              className={`${styleInput} flex-1`}
              value={f.url}
              onChange={(e) => maj("url", e.target.value)}
              placeholder="https://exemple.vercel.app"
              inputMode="url"
            />
            <BoutonAction
              onClick={() => void capturer(f.url)}
              disabled={captureEnCours}
              className="shrink-0"
            >
              {captureEnCours ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Camera className="h-4 w-4" aria-hidden="true" />
              )}
              {captureEnCours ? "Capture…" : "Capturer les aperçus"}
            </BoutonAction>
          </div>
        </Champ>
      </div>

      {/* VOLET 22 — APERÇUS : même HAUTEUR pour l'ordinateur et le
          mobile, CÔTE À CÔTE, CENTRÉS (demande de l'éditeur : «
          l'aperçu desktop est trop petit — augmente sa taille pour
          s'aligner avec l'aperçu mobile, et que ces deux aperçus
          soient côte à côte, centrés, et non éparpillés »). */}
      <div className="mt-6 flex flex-wrap items-start justify-center gap-8">
        {(
          [
            ["Aperçu ordinateur", f.desktop, 416, 260],
            ["Aperçu mobile", f.mobile, 120, 260],
          ] as const
        ).map(([libelle, image, w, h]) => (
          <div key={libelle} className="flex flex-col items-center">
            <p className="mb-1.5 text-xs font-medium text-white">{libelle}</p>
            <div
              className="flex items-center justify-center overflow-hidden rounded-lg border border-dashed border-[#e4e4e4]/30 bg-[#1c1c1c]"
              style={{ height: `${h}px`, width: `${w}px`, maxWidth: "100%" }}
            >
              {image ? (
                <img
                  src={apercuDataUri(image)}
                  alt=""
                  width={image.largeur}
                  height={image.hauteur}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex flex-col items-center gap-2 px-4 text-center text-[#c8c8c8]/70">
                  <ImageIcon className="h-5 w-5" aria-hidden="true" />
                  <span className="text-[11px] leading-snug">
                    {f.url.trim()
                      ? "Extrait automatiquement depuis l'URL"
                      : "Renseignez l'URL du site"}
                  </span>
                </span>
              )}
            </div>
            {image ? (
              <p className="mt-1.5 text-xs text-[#86efac]">
                {image.largeur || "?"} × {image.hauteur || "?"} px ·{" "}
                {(image.data.length / 1024).toFixed(0)} Ko
              </p>
            ) : null}
          </div>
        ))}
      </div>

      {/* ---- Actions ---- */}
      <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-[#e4e4e4]/10 pt-5">
        <BoutonAction onClick={() => enregistrer("brouillon")} disabled={enregistrement !== null || captureEnCours}>
          {enregistrement === "brouillon" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          Enregistrer comme brouillon
        </BoutonAction>
        <BoutonAction variant="principal" onClick={() => enregistrer("publie")} disabled={enregistrement !== null || captureEnCours}>
          {enregistrement === "publie" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
          Enregistrer et publier
        </BoutonAction>
        <BoutonAction onClick={onAnnuler} disabled={enregistrement !== null || captureEnCours}>
          Annuler
        </BoutonAction>
        <p className="text-xs text-[#c8c8c8]/80">
          Le brouillon reste privé ; la publication l&apos;ajoute aussitôt au site public.
        </p>
      </div>
    </Carte>
  );
}

/* ------------------------------------------------------------------ */
/* Section complète (liste + formulaire)                               */
/* ------------------------------------------------------------------ */

export function GestionPortfolio({
  stockageConfigure,
  toast,
}: {
  stockageConfigure: boolean;
  toast: TypeToast;
}) {
  const [projets, setProjets] = useState<ProjetAdmin[]>([]);
  /* VOLET 22 — identifiants des réalisations STATIQUES du site
   * supprimées DÉFINITIVEMENT (elles ne s'affichent plus ici). */
  const [siteSupprimes, setSiteSupprimes] = useState<string[]>([]);
  const [chargement, setChargement] = useState(true);
  const [actionRapide, setActionRapide] = useState<string | null>(null);
  const [enCreation, setEnCreation] = useState(false);
  const [enEdition, setEnEdition] = useState<ProjetAdmin | null>(null);
  /* Conversion (édition) d'une réalisation du site : chargement des
   * captures de l'original avant d'ouvrir le formulaire. */
  const [conversionEnCours, setConversionEnCours] = useState<string | null>(null);
  /* VOLET 20 — modale de confirmation PERSONNALISÉE pour la
   * suppression d'un projet (plus de window.confirm).
   * VOLET 22 — la DÉPUBLICATION (admin ET réalisations du site)
   * demande AUSSI une confirmation, avec alerte sur les risques. */
  const [suppression, setSuppression] = useState<ProjetAdmin | null>(null);
  const [suppressionSite, setSuppressionSite] = useState<ProjetStatique | null>(null);
  const [depublication, setDepublication] = useState<ProjetAdmin | null>(null);
  const [depublicationSite, setDepublicationSite] = useState<ProjetStatique | null>(null);
  const router = useRouter();

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const res = await fetch("/api/admin/projects", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        setProjets((data.projets ?? []) as ProjetAdmin[]);
        setSiteSupprimes(Array.isArray(data.siteSupprimes) ? (data.siteSupprimes as string[]) : []);
      } else if (data?.error) {
        toast({ title: "Portfolio", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Portfolio", description: "Liste indisponible — réessayez.", variant: "destructive" });
    } finally {
      setChargement(false);
    }
  }, [toast]);

  useEffect(() => {
    charger();
  }, [charger]);

  async function enregistrer(projet: ProjetAdmin, statut: "brouillon" | "publie") {
    const corps = {
      projet: {
        id: projet.id || undefined,
        nom: projet.nom,
        categorie: projet.categorie,
        description: projet.description,
        cta: projet.cta,
        url: projet.url,
        desktop: projet.desktop,
        mobile: projet.mobile,
        traductions: projet.traductions,
        /* VOLET 22 — origine conservée (réalisation du site convertie). */
        origine: projet.origine ?? undefined,
      },
      statut,
    };
    const res = await fetch("/api/admin/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corps),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      toast({
        title: statut === "publie" ? "Publication impossible" : "Enregistrement impossible",
        description: data?.error ?? "Réessayez dans un instant.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: statut === "publie" ? "Projet publié" : "Brouillon enregistré",
      description:
        statut === "publie"
          ? `« ${projet.nom} » apparaît dès maintenant sur le site, présenté comme les autres réalisations.`
          : `« ${projet.nom} » est enregistré en brouillon — il reste privé jusqu'à sa publication.`,
    });
    setEnCreation(false);
    setEnEdition(null);
    await charger();
  }

  /* VOLET 22 — DÉPUBLICATION d'un projet ADMIN (confirmation d'abord) :
   * le projet quitte le site public et redevient un brouillon privé. */
  async function confirmerDepublication() {
    const projet = depublication;
    if (!projet) return;
    setActionRapide(projet.id);
    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projet: { id: projet.id }, statut: "brouillon" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        toast({
          title: "Action impossible",
          description: data?.error ?? "Réessayez dans un instant.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Projet dépublié",
          description: `« ${projet.nom} » a été retiré du site — il reste dans cet espace comme brouillon.`,
        });
      }
      await charger();
    } finally {
      setActionRapide(null);
      setDepublication(null);
    }
  }

  /* VOLET 22 — DÉPUBLICATION d'une réalisation STATIQUE du site
   * (confirmation d'abord) : l'original est CONVERTI en projet admin
   * « brouillon » (même identifiant, origine "site") — il quitte le
   * site public mais reste dans cet espace (modifiable,
   * re-publiable, supprimable). */
  async function confirmerDepublicationSite() {
    const projet = depublicationSite;
    if (!projet) return;
    setActionRapide(projet.id);
    try {
      const res = await fetch("/api/admin/projects/site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projet.id, statut: "brouillon" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        toast({
          title: "Dépublication impossible",
          description: data?.error ?? "Réessayez dans un instant.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Réalisation dépubliée",
          description: `« ${projet.name} » a été retirée du site — elle reste dans cet espace comme brouillon.`,
        });
      }
      await charger();
    } finally {
      setActionRapide(null);
      setDepublicationSite(null);
    }
  }

  /* VOLET 20 — suppression derrière une MODALE DE CONFIRMATION
   * PERSONNALISÉE (plus de window.confirm). */
  async function confirmerSuppression() {
    const projet = suppression;
    if (!projet) return;
    setActionRapide(projet.id);
    try {
      const res = await fetch("/api/admin/projects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projet.id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        toast({ title: "Suppression impossible", description: data?.error ?? "Réessayez.", variant: "destructive" });
      } else {
        toast({ title: "Projet supprimé", description: `« ${projet.nom} » a été retiré.` });
      }
      await charger();
    } finally {
      setActionRapide(null);
      setSuppression(null);
    }
  }

  /* VOLET 22 — SUPPRESSION DÉFINITIVE d'une réalisation STATIQUE du
   * site : elle disparaît du site public ET de cet espace,
   * définitivement (identifiant enregistré dans le stockage). */
  async function confirmerSuppressionSite() {
    const projet = suppressionSite;
    if (!projet) return;
    setActionRapide(projet.id);
    try {
      const res = await fetch("/api/admin/projects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projet.id, site: true }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        toast({ title: "Suppression impossible", description: data?.error ?? "Réessayez.", variant: "destructive" });
      } else {
        toast({
          title: "Réalisation supprimée",
          description: `« ${projet.name} » a été retirée du site et de cet espace — définitivement.`,
        });
      }
      await charger();
    } finally {
      setActionRapide(null);
      setSuppressionSite(null);
    }
  }

  /* VOLET 22 — MODIFIER une réalisation STATIQUE du site : l'original
   * est converti en projet ADMIN (même identifiant, origine "site",
   * captures chargées depuis les images du site) et le formulaire
   * s'ouvre pré-rempli — enregistrer (brouillon ou publication)
   * enregistrera la version administrée, qui REMPLACE l'original sur
   * le site. */
  async function modifierRealisationSite(projet: ProjetStatique) {
    if (conversionEnCours) return;
    setConversionEnCours(projet.id);
    try {
      const [desktop, mobile] = await Promise.all([
        chargerImageDepuisUrl(projet.desktop),
        projet.mobile ? chargerImageDepuisUrl(projet.mobile) : Promise.resolve(null),
      ]);
      const maintenant = new Date().toISOString();
      setEnCreation(false);
      setEnEdition({
        id: projet.id,
        nom: projet.name,
        categorie: projet.category,
        description: projet.description,
        cta: projet.cta,
        url: projet.url,
        statut: "publie",
        desktop,
        mobile,
        origine: "site",
        traductions: null,
        createdAt: maintenant,
        updatedAt: maintenant,
      });
    } finally {
      setConversionEnCours(null);
    }
  }

  /* ---------- Formulaire ouvert ---------- */
  if (enCreation || enEdition) {
    return (
      <div>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">
              {enCreation ? "Ajouter un projet" : `Modifier « ${enEdition?.nom} »`}
            </h2>
            <p className="mt-1 text-sm text-[#c8c8c8]">
              {enCreation
                ? "Collez l'URL du site du projet : le scraping récupère le nom, le titre, la description et les aperçus, puis le formulaire pré-rempli s'ouvre."
                : enEdition?.origine === "site"
                  ? "Réalisation du site convertie en projet administré : vos modifications la remplaceront sur le site (même position)."
                  : "Ajustez le projet, puis enregistrez-le comme brouillon ou publiez-le sur le site."}
            </p>
          </div>
          <BoutonAction
            onClick={() => {
              setEnCreation(false);
              setEnEdition(null);
            }}
          >
            Retour au portfolio
          </BoutonAction>
        </div>
        <FormulaireProjet
          initial={enEdition}
          onAnnuler={() => {
            setEnCreation(false);
            setEnEdition(null);
          }}
          onEnregistre={enregistrer}
          toast={toast}
          departScraper={enCreation}
        />
      </div>
    );
  }

  /* ---------- Liste ----------
   * VOLET 22 — les réalisations STATIQUES du site gérées ici :
   * celles CONVERTIES (même identifiant qu'un projet admin) sont
   * affichées par leur version administrée (boutons habituels) ;
   * celles SUPPRIMÉES DÉFINITIVEMENT disparaissent ; les autres
   * reçoivent Modifier / Dépublier / Supprimer comme tout projet. */
  const idsAdmin = new Set(projets.map((p) => p.id));
  const statiquesRestants = (PROJETS_SITE as readonly unknown[] as readonly ProjetStatique[]).filter(
    (p) => !idsAdmin.has(p.id) && !siteSupprimes.includes(p.id),
  );
  const publies = projets.filter((p) => p.statut === "publie").length;
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">
          Portfolio du site
          <span className="ml-2 align-middle text-sm font-normal text-[#c8c8c8]">
            ({publies} publié{publies > 1 ? "s" : ""} · {projets.length - publies} brouillon
            {projets.length - publies > 1 ? "s" : ""} · {statiquesRestants.length} réalisation
            {statiquesRestants.length > 1 ? "s" : ""} du site)
          </span>
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <BoutonAction onClick={charger} disabled={chargement} titre="Actualiser la liste">
            <RefreshCw className={`h-4 w-4 ${chargement ? "animate-spin" : ""}`} aria-hidden="true" />
            Actualiser
          </BoutonAction>
          <BoutonAction
            variant="principal"
            onClick={() => setEnCreation(true)}
            disabled={!stockageConfigure}
            titre={stockageConfigure ? undefined : "Stockage non configuré (GITHUB_DOCS_TOKEN)"}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Ajouter un projet
          </BoutonAction>
        </div>
      </div>

      {!stockageConfigure ? (
        <Carte className="mb-4 border-[#ea384c]/30 p-5">
          <p className="text-sm leading-relaxed text-[#ffdede]">
            Le stockage du portfolio n&apos;est pas configuré : définissez GITHUB_DOCS_TOKEN
            (jeton GitHub avec accès au dépôt privé SteveMarketing-Documents) dans les
            variables d&apos;environnement du serveur — voir DEPLOIEMENT.md.
          </p>
        </Carte>
      ) : null}

      {chargement ? (
        <div className="flex items-center justify-center rounded-2xl border border-[#e4e4e4]/12 bg-[#232323] py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#e4e4e4]" aria-hidden="true" />
        </div>
      ) : (
        <div className="space-y-3">
          {/* VOLET 20 — PROJETS ADMINISTRÉS (brouillons et publiés). */}
          {projets.map((projet) => (
            <Carte key={projet.id} className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
              <div className="h-[64px] w-[104px] shrink-0 overflow-hidden rounded-lg border border-[#e4e4e4]/12 bg-[#1c1c1c]">
                {projet.desktop ? (
                  <img
                    src={apercuDataUri(projet.desktop)}
                    alt=""
                    width={projet.desktop.largeur}
                    height={projet.desktop.hauteur}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[#c8c8c8]/50">
                    <ImageIcon className="h-5 w-5" aria-hidden="true" />
                  </span>
                )}
              </div>
              <div className="min-w-[180px] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-white">{projet.nom || "— sans nom —"}</p>
                  <Pastille ton={projet.statut === "publie" ? "valide" : "neutre"}>
                    {projet.statut === "publie" ? "Publié" : "Brouillon"}
                  </Pastille>
                  {projet.origine === "site" ? (
                    <Pastille ton="valide">Réalisation du site</Pastille>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-[#c8c8c8]">
                  {projet.categorie || "sans titre"} · maj {formatDateCourte(projet.updatedAt)}
                </p>
                {projet.url ? (
                  <a
                    href={projet.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-[#e4e4e4] underline decoration-[#e4e4e4]/40 underline-offset-2 hover:decoration-[#e4e4e4]"
                  >
                    {projet.url.replace(/^https?:\/\//, "")}
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <BoutonAction
                  onClick={() => {
                    setEnCreation(false);
                    setEnEdition(projet);
                  }}
                  titre="Modifier ce projet"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Modifier
                </BoutonAction>
                {projet.statut === "publie" ? (
                  /* VOLET 22 — DÉPUBLICATION avec confirmation (le
                     projet quitte le site, il reste dans l'espace). */
                  <BoutonAction
                    onClick={() => setDepublication(projet)}
                    disabled={actionRapide === projet.id}
                    titre="Retirer le projet du site (il reste dans cet espace)"
                  >
                    {actionRapide === projet.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    )}
                    Dépublier
                  </BoutonAction>
                ) : (
                  <BoutonAction
                    onClick={async () => {
                      if (actionRapide) return;
                      setActionRapide(projet.id);
                      try {
                        const res = await fetch("/api/admin/projects", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ projet: { id: projet.id }, statut: "publie" }),
                        });
                        const data = await res.json().catch(() => null);
                        if (!res.ok || !data?.ok) {
                          toast({ title: "Action impossible", description: data?.error ?? "Réessayez.", variant: "destructive" });
                        } else {
                          toast({ title: "Projet publié", description: `« ${projet.nom} » est en ligne sur le site.` });
                        }
                        await charger();
                      } finally {
                        setActionRapide(null);
                      }
                    }}
                    disabled={actionRapide === projet.id}
                    titre="Publier sur le site"
                  >
                    {actionRapide === projet.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                    Publier
                  </BoutonAction>
                )}
                <BoutonAction variant="danger" onClick={() => setSuppression(projet)} disabled={actionRapide === projet.id} titre="Supprimer">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Supprimer
                </BoutonAction>
              </div>
            </Carte>
          ))}

          {/* VOLET 22 — RÉALISATIONS DU SITE (projets statiques en
              ligne) : MODIFIABLES, DÉPUBLIABLES, SUPPRIMABLES comme
              tous les autres (demandé à trois reprises par
              l'éditeur). « Modifier » convertit l'original en projet
              administré (même identifiant) ; « Dépublier » le retire
              du site (brouillon dans cet espace) ; « Supprimer »
              l'efface définitivement du site ET de l'espace. */}
          {statiquesRestants.map((projet) => (
            <Carte key={projet.id} className="flex flex-wrap items-center gap-4 border-[#e4e4e4]/12 bg-[#1c1c1c] p-4 sm:p-5">
              <div className="h-[64px] w-[104px] shrink-0 overflow-hidden rounded-lg border border-[#e4e4e4]/12 bg-[#070707]">
                <img
                  src={projet.desktopSmall ?? projet.desktop}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-[180px] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-white">{projet.name}</p>
                  <Pastille ton="valide">En ligne sur le site</Pastille>
                </div>
                <p className="mt-1 text-xs text-[#c8c8c8]">{projet.category}</p>
                {projet.url ? (
                  <a
                    href={projet.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-[#e4e4e4] underline decoration-[#e4e4e4]/40 underline-offset-2 hover:decoration-[#e4e4e4]"
                  >
                    {projet.url.replace(/^https?:\/\//, "")}
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <BoutonAction
                  onClick={() => router.navigate("projet", projet.id)}
                  titre="Voir la page projet du site"
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  Voir le projet
                </BoutonAction>
                <BoutonAction
                  onClick={() => void modifierRealisationSite(projet)}
                  disabled={conversionEnCours === projet.id}
                  titre="Modifier cette réalisation (elle devient administrée)"
                >
                  {conversionEnCours === projet.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  )}
                  Modifier
                </BoutonAction>
                <BoutonAction
                  onClick={() => setDepublicationSite(projet)}
                  disabled={actionRapide === projet.id}
                  titre="Retirer la réalisation du site (elle reste dans cet espace)"
                >
                  {actionRapide === projet.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  )}
                  Dépublier
                </BoutonAction>
                <BoutonAction
                  variant="danger"
                  onClick={() => setSuppressionSite(projet)}
                  disabled={actionRapide === projet.id}
                  titre="Supprimer définitivement (site et espace)"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Supprimer
                </BoutonAction>
              </div>
            </Carte>
          ))}
        </div>
      )}

      {/* VOLET 20 — MODALE DE CONFIRMATION PERSONNALISÉE pour la
          suppression d'un projet du portfolio. */}
      <ModaleConfirmation
        ouvert={Boolean(suppression)}
        titre={`Supprimer « ${suppression?.nom ?? ""} » ?`}
        message={
          suppression ? (
            <>
              <p>
                Le projet <strong className="text-white">{suppression.nom}</strong> sera
                définitivement retiré du stockage.
                {suppression.statut === "publie"
                  ? " Il disparaîtra aussi du site public."
                  : ""}
              </p>
              <p className="mt-3 text-xs text-[#c8c8c8]/70">Cette action est irréversible.</p>
            </>
          ) : null
        }
        libelleConfirmer="Supprimer définitivement"
        enCours={Boolean(suppression && actionRapide === suppression.id)}
        onAnnuler={() => setSuppression(null)}
        onConfirmer={() => void confirmerSuppression()}
      />

      {/* VOLET 22 — SUPPRESSION DÉFINITIVE d'une réalisation du site :
          elle disparaît du site ET de cet espace. */}
      <ModaleConfirmation
        ouvert={Boolean(suppressionSite)}
        titre={`Supprimer « ${suppressionSite?.name ?? ""} » ?`}
        message={
          suppressionSite ? (
            <>
              <p>
                La réalisation <strong className="text-white">{suppressionSite.name}</strong>{" "}
                sera <strong className="text-white">définitivement supprimée</strong> : elle
                disparaîtra du site public (portfolio et page projet) ET de cet espace.
              </p>
              <p className="mt-3 rounded-lg border border-[#ea384c]/30 bg-[#ea384c]/10 px-3.5 py-2.5 text-[13px] text-[#ffdede]">
                Attention : cette suppression est irréversible — les visiteurs ne verront plus
                cette réalisation, et sa page ne sera plus accessible.
              </p>
            </>
          ) : null
        }
        libelleConfirmer="Supprimer définitivement"
        enCours={Boolean(suppressionSite && actionRapide === suppressionSite.id)}
        onAnnuler={() => setSuppressionSite(null)}
        onConfirmer={() => void confirmerSuppressionSite()}
      />

      {/* VOLET 22 — DÉPUBLICATION d'un projet administré : il quitte
          le site public mais reste dans cet espace (brouillon). */}
      <ModaleConfirmation
        ouvert={Boolean(depublication)}
        titre={`Dépublier « ${depublication?.nom ?? ""} » ?`}
        message={
          depublication ? (
            <>
              <p>
                Le projet <strong className="text-white">{depublication.nom}</strong> sera{" "}
                <strong className="text-white">retiré du site public</strong> : les visiteurs
                ne le verront plus au portfolio ni sur sa page projet.
              </p>
              <p className="mt-3 rounded-lg border border-[#ea384c]/30 bg-[#ea384c]/10 px-3.5 py-2.5 text-[13px] text-[#ffdede]">
                Attention : tant qu&apos;il restera dépublié, cette réalisation sera invisible
                pour vos futurs clients.
              </p>
              <p className="mt-3 text-xs text-[#c8c8c8]/70">
                Il restera dans cet espace comme brouillon —modifiable et re-publiable à tout moment.
              </p>
            </>
          ) : null
        }
        libelleConfirmer="Dépublier du site"
        enCours={Boolean(depublication && actionRapide === depublication.id)}
        onAnnuler={() => setDepublication(null)}
        onConfirmer={() => void confirmerDepublication()}
      />

      {/* VOLET 22 — DÉPUBLICATION d'une réalisation du site
          (conversion en brouillon administré). */}
      <ModaleConfirmation
        ouvert={Boolean(depublicationSite)}
        titre={`Dépublier « ${depublicationSite?.name ?? ""} » ?`}
        message={
          depublicationSite ? (
            <>
              <p>
                La réalisation <strong className="text-white">{depublicationSite.name}</strong>{" "}
                sera <strong className="text-white">retirée du site public</strong> : les
                visiteurs ne la verront plus au portfolio ni sur sa page projet.
              </p>
              <p className="mt-3 rounded-lg border border-[#ea384c]/30 bg-[#ea384c]/10 px-3.5 py-2.5 text-[13px] text-[#ffdede]">
                Attention : tant qu&apos;elle restera dépubliée, cette réalisation sera
                invisible pour vos futurs clients.
              </p>
              <p className="mt-3 text-xs text-[#c8c8c8]/70">
                Elle restera dans cet espace comme brouillon — modifiable et re-publiable à
                tout moment.
              </p>
            </>
          ) : null
        }
        libelleConfirmer="Dépublier du site"
        enCours={Boolean(depublicationSite && actionRapide === depublicationSite.id)}
        onAnnuler={() => setDepublicationSite(null)}
        onConfirmer={() => void confirmerDepublicationSite()}
      />
    </div>
  );
}
