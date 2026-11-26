"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { BoutonAction, Carte, Champ, ModaleConfirmation, Pastille, styleInput, TitreSection } from "./elements";
import type { ProjetAdmin, ImageProjet } from "@/lib/portfolio/types";
/* VOLET 20 (26/11/2026) — l'espace portfolio ne doit JAMAIS être
   vide (demande de l'éditeur) : les projets STATIQUES du site
   (ceux en ligne actuellement) sont TOUJOURS listés — en plus des
   projets administrés ici. */
import { PROJECTS as PROJETS_SITE } from "@/lib/site";
import { useRouter } from "@/components/router-context";

/**
 * GESTION DU PORTFOLIO DEPUIS L'ESPACE ADMIN (VOLET 19 → VOLET 20).
 *
 * VOLET 20 (26/11/2026) — reprise EXACTE des demandes de l'éditeur :
 *
 *  - la liste ne doit JAMAIS être vide : TOUS les projets en ligne
 *    sur le site (projets statiques + projets administrés) sont
 *    TOUJOURS listés et affichés ici, en plus du bouton d'ajout ;
 *  - ANCIENS textes d'aide SUPPRIMÉS : la note « Les projets publiés
 *    s'ajoutent à la suite… » et le bloc « Aucun projet géré ici
 *    pour l'instant… » disparaissent ;
 *  - PLUS DE VERSION ANGLAISE à remplir (« ce n'est pas à moi de
 *    mettre la version anglaise lors de l'ajout du projet ») : le
 *    site traduit lui-même — le champ et le bloc disparaissent ;
 *  - MOCKUPS EXTRAITS AUTOMATIQUEMENT de l'URL du projet (« je
 *    n'ai qu'à ajouter l'URL du projet et le site extrait
 *    directement le mockup mobile et desktop ») : le site en ligne
 *    est ouvert et capturé (ordinateur + mobile) — plus aucun
 *    téléversement d'image ;
 *  - le champ « Catégorie » est RENOMMÉ « Titre » (ce n'est pas une
 *    catégorie, c'est un titre) ;
 *  - le champ « Libellé du bouton » SUPPRIMÉ : le libellé est
 *    toujours « Voir Le Site », posé automatiquement par le site ;
 *  - suppression d'un projet : MODALE DE CONFIRMATION
 *    PERSONNALISÉE (plus de window.confirm).
 *
 * - deux boutons d'enregistrement conservés : « Enregistrer comme
 *   brouillon » et « Enregistrer et publier » ;
 * - les projets ADMINISTRÉS (brouillon/publié) restent modifiables ;
 *   les projets STATIQUES du site sont présentés en lecture seule
 *   (ils vivent dans le code du site).
 */

type TypeToast = (t: { title: string; description?: string; variant?: "default" | "destructive" }) => void;

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
};

const FORMULAIRE_VIDE: Formulaire = {
  id: null,
  nom: "",
  titre: "",
  description: "",
  url: "",
  desktop: null,
  mobile: null,
};

function FormulaireProjet({
  initial,
  onAnnuler,
  onEnregistre,
  toast,
}: {
  initial: ProjetAdmin | null;
  onAnnuler: () => void;
  onEnregistre: (
    projet: ProjetAdmin,
    statut: "brouillon" | "publie",
  ) => Promise<void>;
  toast: TypeToast;
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
        }
      : FORMULAIRE_VIDE,
  );
  const [enregistrement, setEnregistrement] = useState<"brouillon" | "publie" | null>(null);
  /* VOLET 20 — capture automatique des mockups depuis l'URL. */
  const [captureEnCours, setCaptureEnCours] = useState(false);

  const maj = <K extends keyof Formulaire>(cle: K, valeur: Formulaire[K]) =>
    setF((ancien) => ({ ...ancien, [cle]: valeur }));

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
      /* Contrôles côté client (le serveur revérifie) — VOLET 20 :
       * plus de libellé de bouton (posé par le site) ; le champ
       * « catégorie » s'appelle désormais « TITRE ». */
      const manques: string[] = [];
      if (!f.nom.trim()) manques.push("le nom");
      if (!f.titre.trim()) manques.push("le titre");
      if (!f.description.trim()) manques.push("la description");
      if (!f.url.trim()) manques.push("l'URL du site");
      if (!f.desktop) manques.push("les aperçus (capturez le site)");
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
      /* VOLET 20 — « je n'ai qu'à ajouter l'URL du projet » : si
       * aucune capture n'existe encore, elle est faite
       * AUTOMATIQUEMENT avant l'enregistrement. */
      let desktop = f.desktop;
      let mobile = f.mobile;
      if (!desktop && f.url.trim()) {
        const captures = await capturer(f.url);
        if (captures) {
          desktop = captures.desktop;
          mobile = captures.mobile;
        } else if (statut === "publie") {
          /* Publication sans capture possible : on arrête (la
             capture peut être relancée). */
          setEnregistrement(null);
          return;
        }
        /* Brouillon : enregistré sans capture — elle pourra être
           * refaite à la modification. */
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

      {/* Aperçus extraits (ou en attente) */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {(
          [
            ["Aperçu ordinateur", f.desktop, 1280, 800],
            ["Aperçu mobile", f.mobile, 240, 520],
          ] as const
        ).map(([libelle, image, w, h]) => (
          <div key={libelle}>
            <p className="mb-1.5 text-xs font-medium text-white">{libelle}</p>
            <div
              className="flex items-center justify-center overflow-hidden rounded-lg border border-dashed border-[#e4e4e4]/30 bg-[#1c1c1c]"
              style={{ height: `${Math.round((h / w) * 168)}px`, width: "168px" }}
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
                {image.largeur} × {image.hauteur} px · {(image.data.length / 1024).toFixed(0)} Ko
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
  const [chargement, setChargement] = useState(true);
  const [actionRapide, setActionRapide] = useState<string | null>(null);
  const [enCreation, setEnCreation] = useState(false);
  const [enEdition, setEnEdition] = useState<ProjetAdmin | null>(null);
  /* VOLET 20 — modale de confirmation PERSONNALISÉE pour la
   * suppression d'un projet (plus de window.confirm). */
  const [suppression, setSuppression] = useState<ProjetAdmin | null>(null);
  const router = useRouter();

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const res = await fetch("/api/admin/projects", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        setProjets((data.projets ?? []) as ProjetAdmin[]);
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

  async function basculerStatut(projet: ProjetAdmin) {
    if (actionRapide) return;
    setActionRapide(projet.id);
    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projet: { id: projet.id }, statut: projet.statut === "publie" ? "brouillon" : "publie" }),
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
          title: projet.statut === "publie" ? "Projet dépublié" : "Projet publié",
          description:
            projet.statut === "publie"
              ? `« ${projet.nom} » redevient un brouillon privé.`
              : `« ${projet.nom} » est en ligne sur le site.`,
        });
      }
      await charger();
    } finally {
      setActionRapide(null);
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
              Renseignez le nom, le titre, la description et l&apos;URL du site : les aperçus
              ordinateur et mobile sont extraits automatiquement, et le site traduit lui-même
              le projet en anglais.
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
        />
      </div>
    );
  }

  /* ---------- Liste ---------- */
  const publies = projets.filter((p) => p.statut === "publie").length;
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">
          Portfolio du site
          <span className="ml-2 align-middle text-sm font-normal text-[#c8c8c8]">
            ({publies} publié{publies > 1 ? "s" : ""} · {projets.length - publies} brouillon
            {projets.length - publies > 1 ? "s" : ""} · {PROJETS_SITE.length} projet
            {PROJETS_SITE.length > 1 ? "s" : ""} du site)
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
                <BoutonAction
                  onClick={() => basculerStatut(projet)}
                  disabled={actionRapide === projet.id}
                  titre={projet.statut === "publie" ? "Repasser en brouillon" : "Publier sur le site"}
                >
                  {actionRapide === projet.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : projet.statut === "publie" ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                  {projet.statut === "publie" ? "Dépublier" : "Publier"}
                </BoutonAction>
                <BoutonAction variant="danger" onClick={() => setSuppression(projet)} disabled={actionRapide === projet.id} titre="Supprimer">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Supprimer
                </BoutonAction>
              </div>
            </Carte>
          ))}

          {/* VOLET 20 — PROJETS DU SITE (réalisations actuelles, en
              ligne) : TOUJOURS listés — l'espace portfolio n'est
              jamais vide. Ils vivent dans le code du site : consultés
              ici en lecture seule (page projet + site en ligne). */}
          {PROJETS_SITE.map((projet) => (
            <Carte key={projet.id} className="flex flex-wrap items-center gap-4 border-[#e4e4e4]/12 bg-[#1c1c1c] p-4 sm:p-5">
              <div className="h-[64px] w-[104px] shrink-0 overflow-hidden rounded-lg border border-[#e4e4e4]/12 bg-[#070707]">
                {/* Aperçu léger : la variante 640 px existe pour deux
                    projets ; sinon l'aperçu standard. */}
                <img
                  src={(projet as { desktopSmall?: string }).desktopSmall ?? projet.desktop}
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
    </div>
  );
}
