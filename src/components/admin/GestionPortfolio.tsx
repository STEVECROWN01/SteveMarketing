"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Globe,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  Languages,
  ExternalLink,
} from "lucide-react";
import { BoutonAction, Carte, Champ, Pastille, styleInput, TitreSection } from "./elements";
import type { ProjetAdmin, ImageProjet, TraductionProjet } from "@/lib/portfolio/types";
import { TAILLE_IMAGE_MAX } from "@/lib/portfolio/types";

/**
 * GESTION DU PORTFOLIO DEPUIS L'ESPACE ADMIN (VOLET 19, 26/11/2026).
 *
 * Demande de l'éditeur : « créer une partie dans l'espace admin pour
 * mettre à jour mon portfolio… remplir toutes les informations,
 * enregistrer comme brouillon ou enregistrer et publier
 * directement. Le projet s'ajoute sur le site web comme tous les
 * autres, présenté de la même façon. »
 *
 * - LISTE : vignette, nom, catégorie, statut (Publié/Brouillon),
 *   date de dernière mise à jour, actions Modifier / Publier ou
 *   Dépublier / Supprimer ;
 * - FORMULAIRE : nom, catégorie, description, libellé du bouton,
 *   URL du site, capture d'ordinateur (requis pour publier),
 *   capture mobile (recommandée — la page projet l'affiche),
 *   traduction anglaise optionnelle (le site est bilingue) ;
 * - deux boutons d'enregistrement : « Enregistrer comme brouillon »
 *   et « Enregistrer et publier » ;
 * - images COMPRIMÉES DANS LE NAVIGATEUR (canvas → WebP, largeur
 *   plafonnée : 1280 px ordinateur / 640 px mobile) avant l'envoi —
 *   légères, nettes, sans dépendance.
 */

type TypeToast = (t: { title: string; description?: string; variant?: "default" | "destructive" }) => void;

/* ------------------------------------------------------------------ */
/* Compression d'image dans le navigateur                              */
/* ------------------------------------------------------------------ */

async function chargerBitmap(fichier: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(fichier);
    } catch {
      /* repli ci-dessous */
    }
  }
  return new Promise((resoudre, rejeter) => {
    const url = URL.createObjectURL(fichier);
    const img = new Image();
    img.onload = () => resoudre(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      rejeter(new Error("Image illisible."));
    };
    img.src = url;
  });
}

function dimensions(bmp: ImageBitmap | HTMLImageElement): { l: number; h: number } {
  if ("width" in bmp && "height" in bmp && !(bmp instanceof HTMLImageElement)) {
    return { l: bmp.width, h: bmp.height };
  }
  const img = bmp as HTMLImageElement;
  return { l: img.naturalWidth, h: img.naturalHeight };
}

/** Compresse une capture : redimensionne (largeur max) puis encode
 *  en WebP (JPEG en repli). Retourne l'enregistrement base64. */
async function comprimerCapture(fichier: File, largeurMax: number): Promise<ImageProjet> {
  const bmp = await chargerBitmap(fichier);
  const { l, h } = dimensions(bmp);
  const ratio = Math.min(1, largeurMax / (l || largeurMax));
  const largeur = Math.max(1, Math.round(l * ratio));
  const hauteur = Math.max(1, Math.round(h * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = largeur;
  canvas.height = hauteur;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Compression impossible (canvas).");
  ctx.drawImage(bmp as CanvasImageSource, 0, 0, largeur, hauteur);
  if ("close" in bmp && typeof bmp.close === "function") bmp.close();

  const blob = await new Promise<Blob | null>((resoudre) =>
    canvas.toBlob(resoudre, "image/webp", 0.85),
  );
  const blobFinal = blob ?? await new Promise<Blob | null>((resoudre) =>
    canvas.toBlob(resoudre, "image/jpeg", 0.85),
  );
  if (!blobFinal) throw new Error("Encodage de l'image impossible.");
  const data = await new Promise<string>((resoudre) => {
    const lecteur = new FileReader();
    lecteur.onload = () => resoudre(String(lecteur.result));
    lecteur.onerror = () => resoudre("");
    lecteur.readAsDataURL(blobFinal);
  });
  const base64 = data.slice(data.indexOf(",") + 1);
  if (!base64) throw new Error("Lecture de l'image impossible.");
  if (base64.length > TAILLE_IMAGE_MAX) {
    throw new Error(
      "Capture trop lourde même après compression — essayez un fichier plus léger.",
    );
  }
  return {
    data: base64,
    mime: blob ? "image/webp" : "image/jpeg",
    largeur,
    hauteur,
  };
}

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
/* Champ de capture avec compression et aperçu                         */
/* ------------------------------------------------------------------ */

function ChampCapture({
  label,
  indicatif,
  image,
  onChoisir,
  erreur,
}: {
  label: string;
  indicatif: string;
  image: ImageProjet | null;
  onChoisir: (image: ImageProjet | null) => void;
  erreur: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [encours, setEncours] = useState(false);

  async function surFichiers(fichiers: FileList | null) {
    const fichier = fichiers?.[0];
    if (!fichier) return;
    if (!fichier.type.startsWith("image/")) {
      onChoisir(null);
      return;
    }
    setEncours(true);
    try {
      onChoisir(await comprimerCapture(fichier, label.startsWith("Capture d") ? 1280 : 640));
    } catch (e) {
      onChoisir(null);
      alert(e instanceof Error ? e.message : "Image impossible à traiter.");
    } finally {
      setEncours(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Champ label={label} indicatif={indication(indicatif, image)}>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative flex h-[104px] w-[168px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-[#e4e4e4]/30 bg-[#1c1c1c] transition-colors hover:border-[#e4e4e4]/60"
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
            <span className="flex flex-col items-center gap-2 text-[#c8c8c8]/70">
              <ImageIcon className="h-6 w-6" aria-hidden="true" />
              <span className="text-[11px]">Choisir une image</span>
            </span>
          )}
          {encours ? (
            <span className="absolute inset-0 flex items-center justify-center bg-[#070707]/70">
              <Loader2 className="h-5 w-5 animate-spin text-white" aria-hidden="true" />
            </span>
          ) : null}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => surFichiers(e.target.files)}
          aria-label={label}
        />
        <div className="min-w-0 flex-1 text-xs leading-relaxed text-[#c8c8c8]">
          <p>Glissez une capture nette du site (PNG, JPG, WebP).</p>
          <p className="mt-1">
            Elle est automatiquement redimensionnée et compressée (WebP)
            avant l&apos;enregistrement.
          </p>
          {image ? (
            <p className="mt-1 text-[#86efac]">
              {image.largeur} × {image.hauteur} px · {(image.data.length / 1024).toFixed(0)} Ko
            </p>
          ) : null}
          {erreur ? <p className="mt-1 text-[#ffdede]">{erreur}</p> : null}
        </div>
      </div>
    </Champ>
  );

  function indication(defaut: string, img: ImageProjet | null): string {
    if (img) return `${defaut} — remplacée à la prochaine sélection`;
    return defaut;
  }
}

/* ------------------------------------------------------------------ */
/* Formulaire de projet                                                */
/* ------------------------------------------------------------------ */

type Formulaire = {
  id: string | null;
  nom: string;
  categorie: string;
  description: string;
  cta: string;
  url: string;
  desktop: ImageProjet | null;
  mobile: ImageProjet | null;
  en: TraductionProjet;
};

const FORMULAIRE_VIDE: Formulaire = {
  id: null,
  nom: "",
  categorie: "",
  description: "",
  cta: "Voir Le Site",
  url: "",
  desktop: null,
  mobile: null,
  en: {},
};

function FormulaireProjet({
  initial,
  onAnnuler,
  onEnregistre,
  toast,
}: {
  initial: ProjetAdmin | null;
  onAnnuler: () => void;
  onEnregistre: (projet: ProjetAdmin, statut: "brouillon" | "publie") => Promise<void>;
  toast: TypeToast;
}) {
  const [f, setF] = useState<Formulaire>(() =>
    initial
      ? {
          id: initial.id,
          nom: initial.nom,
          categorie: initial.categorie,
          description: initial.description,
          cta: initial.cta,
          url: initial.url,
          desktop: initial.desktop,
          mobile: initial.mobile,
          en: initial.traductions ?? {},
        }
      : FORMULAIRE_VIDE,
  );
  const [enregistrement, setEnregistrement] = useState<"brouillon" | "publie" | null>(null);
  const [anglaisOuvert, setAnglaisOuvert] = useState(() =>
    Boolean(initial?.traductions && Object.values(initial.traductions).some((v) => (v ?? "").trim())),
  );

  const maj = <K extends keyof Formulaire>(cle: K, valeur: Formulaire[K]) =>
    setF((ancien) => ({ ...ancien, [cle]: valeur }));
  const majEn = (cle: keyof TraductionProjet, valeur: string) =>
    setF((ancien) => ({ ...ancien, en: { ...ancien.en, [cle]: valeur } }));

  async function enregistrer(statut: "brouillon" | "publie") {
    if (enregistrement) return;
    if (statut === "publie") {
      /* Contrôles côté client (le serveur revérifie). */
      const manques: string[] = [];
      if (!f.nom.trim()) manques.push("le nom");
      if (!f.categorie.trim()) manques.push("la catégorie");
      if (!f.description.trim()) manques.push("la description");
      if (!f.cta.trim()) manques.push("le libellé du bouton");
      if (!f.url.trim()) manques.push("l'URL du site");
      if (!f.desktop) manques.push("la capture d'ordinateur");
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
      await onEnregistre(
        {
          id: f.id ?? "",
          nom: f.nom.trim(),
          categorie: f.categorie.trim(),
          description: f.description.trim(),
          cta: f.cta.trim(),
          url: f.url.trim(),
          statut,
          desktop: f.desktop,
          mobile: f.mobile,
          traductions: Object.values(f.en).some((v) => (v ?? "").trim()) ? f.en : null,
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
        <Champ label="Catégorie" indicatif="ex. Site web professionnel pour coach">
          <input
            className={styleInput}
            value={f.categorie}
            onChange={(e) => maj("categorie", e.target.value)}
            placeholder="Ex. Plateforme immobilière"
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

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Champ label="Libellé du bouton" indicatif="par défaut « Voir Le Site »">
          <input
            className={styleInput}
            value={f.cta}
            onChange={(e) => maj("cta", e.target.value)}
            placeholder="Voir Le Site"
          />
        </Champ>
        <Champ label="URL du site en ligne" indicatif="obligatoire pour publier">
          <input
            className={styleInput}
            value={f.url}
            onChange={(e) => maj("url", e.target.value)}
            placeholder="https://exemple.vercel.app"
            inputMode="url"
          />
        </Champ>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChampCapture
          label="Capture d'ordinateur"
          indicatif="obligatoire pour publier"
          image={f.desktop}
          onChoisir={(image) => maj("desktop", image)}
          erreur={null}
        />
        <ChampCapture
          label="Capture mobile"
          indicatif="recommandée — page projet"
          image={f.mobile}
          onChoisir={(image) => maj("mobile", image)}
          erreur={null}
        />
      </div>

      {/* ---- Version anglaise (optionnelle) ---- */}
      <div className="mt-6 rounded-xl border border-[#e4e4e4]/12 bg-[#1c1c1c] p-4">
        <button
          type="button"
          onClick={() => setAnglaisOuvert((v) => !v)}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={anglaisOuvert}
        >
          <span className="flex items-center gap-2 text-sm font-medium text-white">
            <Languages className="h-4 w-4 text-[#c8c8c8]" aria-hidden="true" />
            Version anglaise (optionnelle)
            <Pastille ton="neutre">site bilingue</Pastille>
          </span>
          <span className="text-xs text-[#c8c8c8]">{anglaisOuvert ? "replier" : "déplier"}</span>
        </button>
        {anglaisOuvert ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Champ label="Nom (anglais)" indicatif="laisser vide = garder le français">
              <input
                className={styleInput}
                value={f.en.nom ?? ""}
                onChange={(e) => majEn("nom", e.target.value)}
              />
            </Champ>
            <Champ label="Catégorie (anglais)">
              <input
                className={styleInput}
                value={f.en.categorie ?? ""}
                onChange={(e) => majEn("categorie", e.target.value)}
              />
            </Champ>
            <div className="lg:col-span-2">
              <Champ label="Description (anglais)">
                <textarea
                  className={`${styleInput} min-h-[90px] resize-y`}
                  value={f.en.description ?? ""}
                  onChange={(e) => majEn("description", e.target.value)}
                />
              </Champ>
            </div>
            <Champ label="Libellé du bouton (anglais)">
              <input
                className={styleInput}
                value={f.en.cta ?? ""}
                onChange={(e) => majEn("cta", e.target.value)}
                placeholder="View The Website"
              />
            </Champ>
          </div>
        ) : null}
      </div>

      {/* ---- Actions ---- */}
      <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-[#e4e4e4]/10 pt-5">
        <BoutonAction onClick={() => enregistrer("brouillon")} disabled={enregistrement !== null}>
          {enregistrement === "brouillon" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          Enregistrer comme brouillon
        </BoutonAction>
        <BoutonAction variant="principal" onClick={() => enregistrer("publie")} disabled={enregistrement !== null}>
          {enregistrement === "publie" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Globe className="h-4 w-4" aria-hidden="true" />
          )}
          Enregistrer et publier
        </BoutonAction>
        <BoutonAction onClick={onAnnuler} disabled={enregistrement !== null}>
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

  async function supprimer(projet: ProjetAdmin) {
    if (actionRapide) return;
    const confirme = window.confirm(
      `Supprimer définitivement « ${projet.nom} » ?${projet.statut === "publie" ? " Il disparaîtra aussi du site public." : ""}`,
    );
    if (!confirme) return;
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
              Remplissez les informations du projet : il sera présenté sur le site exactement
              comme les autres réalisations.
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
            {projets.length - publies > 1 ? "s" : ""})
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
      ) : projets.length === 0 ? (
        <Carte className="p-8 text-center">
          <p className="text-sm text-[#c8c8c8]">
            Aucun projet géré ici pour l&apos;instant. Les quatre réalisations actuelles du site
            restent en place ; chaque nouveau projet que vous ajoutez viendra s&apos;y joindre,
            présenté de la même façon, partout sur le site.
          </p>
        </Carte>
      ) : (
        <div className="space-y-3">
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
                  {projet.categorie || "sans catégorie"} · maj{" "}
                  {formatDateCourte(projet.updatedAt)}
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
                <BoutonAction variant="danger" onClick={() => supprimer(projet)} disabled={actionRapide === projet.id} titre="Supprimer">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Supprimer
                </BoutonAction>
              </div>
            </Carte>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs leading-relaxed text-[#c8c8c8]/80">
        Les projets publiés s&apos;ajoutent à la suite des réalisations déjà présentées sur le
        site (accueil, page Réalisations, pages projet) — jamais en tête de liste : les
        mockups de la page d&apos;accueil restent inchangés. Sur l&apos;accueil, trois projets
        partagent une même ligne ; à partir de quatre, ils se rangent par deux.
      </p>
    </div>
  );
}
