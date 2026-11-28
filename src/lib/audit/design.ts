/**
 * VOLET 28 (28/11/2026) — OUTIL « AUDIT COMPLET » DE L'AUDIT :
 * analyse d'un site web dans son ENTIÈRETÉ — design (moderne ou
 * non), structure, copywriting et capacité à CONVERTIR — à partir de
 * son URL, avec capture d'écran de la page.
 *
 * Méthode : la page est chargée dans un VRAI Chrome (Puppeteer) ; le
 * DOM et les styles calculés sont mesurés dans la page (polices
 * personnalisées, flexbox/grille, animations, CTA au-dessus de la
 * ligne de flottaison, preuve sociale, formulaire, hiérarchie des
 * sections…) et une capture d'écran accompagne le verdict.
 */
import { ouvrirNavigateur } from "./navigateur";
import { noteDepuisScore, type AxeDesign, type ReleveDesign } from "./types";

interface MesuresPage {
  policesPersonnalisees: boolean;
  famillesPolices: string[];
  nbFlex: number;
  nbGrid: number;
  nbAnimations: number;
  nbArrondis: number;
  nbOmbres: number;
  imagesModernes: number;
  imagesTotales: number;
  aHeader: boolean;
  aNav: boolean;
  aFooter: boolean;
  nbSections: number;
  semantique: number;
  barreDefilementHorizontal: boolean;
  h1: string;
  motsH1: number;
  motsPage: number;
  vouvoie: boolean;
  motsBenefice: string[];
  lorem: boolean;
  ctaPremiereVue: number;
  libellesCta: string[];
  aFormulaire: boolean;
  emailVisible: boolean;
  telephoneVisible: boolean;
  preuveSociale: string[];
  urgence: boolean;
}

export async function auditerDesign(url: string): Promise<ReleveDesign> {
  const browser = await ouvrirNavigateur();
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: "load", timeout: 45000 });
    try {
      await page.waitForNetworkIdle({ idleTime: 800, timeout: 6000 });
    } catch {
      /* le contenu est déjà là */
    }
    /* le rendu se stabilise (animations d'entrée) */
    await new Promise((r) => setTimeout(r, 900));

    /* capture d'écran de la page (partie visible) */
    const capture = String(
      await page.screenshot({ type: "jpeg", quality: 72, encoding: "base64" }),
    );

    const m = (await page.evaluate(() => {
      const r = {
        policesPersonnalisees: false,
        famillesPolices: [] as string[],
        nbFlex: 0,
        nbGrid: 0,
        nbAnimations: 0,
        nbArrondis: 0,
        nbOmbres: 0,
        imagesModernes: 0,
        imagesTotales: 0,
        aHeader: false,
        aNav: false,
        aFooter: false,
        nbSections: 0,
        semantique: 0,
        barreDefilementHorizontal: false,
        h1: "",
        motsH1: 0,
        motsPage: 0,
        vouvoie: false,
        motsBenefice: [] as string[],
        lorem: false,
        ctaPremiereVue: 0,
        libellesCta: [] as string[],
        aFormulaire: false,
        emailVisible: false,
        telephoneVisible: false,
        preuveSociale: [] as string[],
        urgence: false,
      };

      /* --- polices, mises en page, effets --- */
      const familles = new Set<string>();
      let nbFlex = 0;
      let nbGrid = 0;
      let nbAnimations = 0;
      let nbArrondis = 0;
      let nbOmbres = 0;
      const elements = Array.from(document.querySelectorAll<HTMLElement>("body *")).slice(0, 2500);
      for (const el of elements) {
        const cs = getComputedStyle(el);
        familles.add(cs.fontFamily.split(",")[0].replace(/["']/g, "").trim());
        const affichage = cs.display;
        if (affichage === "flex" || affichage === "inline-flex") nbFlex += 1;
        if (affichage === "grid" || affichage === "inline-grid") nbGrid += 1;
        if (parseFloat(cs.transitionDuration) > 0 || cs.animationName !== "none") nbAnimations += 1;
        if (parseFloat(cs.borderRadius) > 2) nbArrondis += 1;
        if (cs.boxShadow !== "none") nbOmbres += 1;
      }
      r.nbFlex = nbFlex;
      r.nbGrid = nbGrid;
      r.nbAnimations = nbAnimations;
      r.nbArrondis = nbArrondis;
      r.nbOmbres = nbOmbres;
      r.famillesPolices = [...familles].filter(Boolean).slice(0, 8);
      const policesSysteme = ["arial", "helvetica", "times new roman", "georgia", "courier", "system-ui", "segoe ui", "roboto", "lucida"];
      r.policesPersonnalisees = [...familles].some((f) => f && !policesSysteme.includes(f.toLowerCase()));

      /* --- images --- */
      const images = Array.from(document.querySelectorAll("img"));
      r.imagesTotales = images.length;
      r.imagesModernes = images.filter((i) => /\.(webp|avif)(\?|$)/i.test(i.currentSrc || i.src)).length;

      /* --- structure --- */
      r.aHeader = Boolean(document.querySelector("header"));
      r.aNav = Boolean(document.querySelector("nav, [role='navigation']"));
      r.aFooter = Boolean(document.querySelector("footer"));
      r.nbSections = document.querySelectorAll("section, main > div").length;
      r.semantique = document.querySelectorAll("header, nav, main, footer, section, article").length;
      r.barreDefilementHorizontal = document.documentElement.scrollWidth > window.innerWidth + 4;

      /* --- copywriting --- */
      const h1 = document.querySelector("h1");
      r.h1 = (h1?.textContent ?? "").replace(/\s+/g, " ").trim();
      r.motsH1 = r.h1 ? r.h1.split(" ").length : 0;
      r.motsPage = (document.body.innerText || "").split(/\s+/).filter(Boolean).length;
      const texte = (document.body.innerText || "").toLowerCase();
      r.vouvoie = /\bvous\b|\bvotre\b|\vvos\b/.test(texte);
      r.lorem = /lorem ipsum|texte de remplissage/.test(texte);
      const benefices = ["résultat", "croissance", "client", "gagnez", "augmentez", "économiser", "rapide", "simple", "efficace", "confiance", "preuve", "rentab", "vendre", "chiffre d'affaires", "conversion", "visibilité"];
      r.motsBenefice = benefices.filter((mot) => texte.includes(mot));

      /* --- conversion --- */
      const motsCta = /(contact|devis|réserver|reserve|appel|call|book|essai|trial|démarrer|start|commencer|je veux|inscription|newsletter|whatsapp)/i;
      const candidats = Array.from(document.querySelectorAll<HTMLElement>("a, button, [role='button']"));
      let ctaTotal = 0;
      for (const el of candidats) {
        const libelle = (el.textContent || "").replace(/\s+/g, " ").trim();
        if (!libelle || libelle.length > 45 || !motsCta.test(libelle)) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width < 8 || rect.height < 8) continue;
        ctaTotal += 1;
        if (r.libellesCta.length < 6) r.libellesCta.push(libelle);
        if (rect.top < 800) r.ctaPremiereVue += 1;
      }
      r.aFormulaire = Boolean(document.querySelector("form input:not([type='hidden']), form textarea"));
      const texteVisible = document.body.innerText || "";
      r.emailVisible = /[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(texteVisible);
      r.telephoneVisible = /(\+?\d[\d\s.-]{7,}\d)/.test(texteVisible);
      const preuves = ["avis", "témoin", "client satisfait", "★", "étoile", "certifi", "noté", "référence", "cas client", "+ de"];
      r.preuveSociale = preuves.filter((p) => texte.includes(p));
      r.urgence = /(limité|aujourd'hui|dernier|places|stock|promotion|-[0-9]{2}\s?%|expire)/i.test(texte);
      void ctaTotal;
      return r;
    }).catch(() => null)) as MesuresPage | null;

    if (!m) {
      throw new Error("La page n'a pas pu être analysée.");
    }

    /* ================== NOTATION ================== */
    const axes: AxeDesign[] = [];
    const forces: string[] = [];
    const ameliorations: { titre: string; detail: string }[] = [];

    /* --- DESIGN (modernité visuelle) --- */
    let design = 100;
    if (m.policesPersonnalisees) {
      forces.push(`Police personnalisée (${m.famillesPolices[0]}) — identité visuelle affirmée.`);
    } else {
      design -= 25;
      ameliorations.push({
        titre: "Police personnalisée manquante",
        detail: "La page utilise des polices par défaut (Arial, system-ui…) — un site moderne s'appuie sur une typographie qui lui appartient.",
      });
    }
    const nbLayoutsModernes = m.nbFlex + m.nbGrid;
    if (nbLayoutsModernes >= 40) {
      forces.push(`Mises en page flexbox/grille omniprésentes (${nbLayoutsModernes} éléments).`);
    } else if (nbLayoutsModernes >= 12) {
      design -= 8;
    } else {
      design -= 20;
      ameliorations.push({
        titre: "Mises en page rigides",
        detail: "Peu de flexbox/grille : la page semble construite avec d'anciennes techniques — signe de design daté.",
      });
    }
    if (m.nbOmbres < 5 && m.nbArrondis < 10) {
      design -= 10;
      ameliorations.push({
        titre: "Profondeur visuelle absente",
        detail: "Aucune ombre ni arrondi notable : l'interface paraît plate et datée.",
      });
    }
    if (m.nbAnimations >= 10) {
      forces.push(`Mouvements et transitions soignés (${m.nbAnimations} éléments animés).`);
    } else if (m.nbAnimations < 3) {
      design -= 10;
      ameliorations.push({
        titre: "Aucun mouvement",
        detail: "Aucune transition ni animation : une page figée paraît moins moderne et vivante.",
      });
    }
    if (m.imagesTotales > 0) {
      const ratioModernes = m.imagesModernes / m.imagesTotales;
      if (ratioModernes < 0.5 && m.imagesTotales >= 3) {
        design -= 8;
        ameliorations.push({
          titre: "Images aux formats anciens",
          detail: `${m.imagesTotales - m.imagesModernes} image(s) sur ${m.imagesTotales} ne sont pas en WebP/AVIF.`,
        });
      }
    }
    design = Math.max(0, Math.min(100, design));
    axes.push({
      nom: "Design",
      score: design,
      avis:
        design >= 80
          ? "Design moderne : typographie, mises en page et mouvements au niveau actuel du web."
          : design >= 60
            ? "Design correct mais daté par endroits."
            : "Design daté : la page ne suit pas les standards visuels actuels.",
    });

    /* --- STRUCTURE --- */
    let structure = 100;
    if (!m.aHeader) {
      structure -= 25;
      ameliorations.push({ titre: "Bandeau d'en-tête absent", detail: "Pas de <header> : la page n'offre pas de repère clair dès l'arrivée." });
    } else {
      forces.push("En-tête clair dès l'arrivée.");
    }
    if (!m.aNav) {
      structure -= 15;
      ameliorations.push({ titre: "Navigation absente", detail: "Aucun menu : le visiteur ne peut pas se déplacer dans le site." });
    }
    if (!m.aFooter) {
      structure -= 15;
      ameliorations.push({ titre: "Pied de page absent", detail: "Sans <footer>, il manque les repères de fin (contact, mentions, liens)." });
    } else {
      forces.push("Pied de page complet.");
    }
    if (m.nbSections < 3) {
      structure -= 15;
      ameliorations.push({
        titre: "Page trop courte en sections",
        detail: `${m.nbSections} section(s) seulement : la page ne raconte pas un parcours guidé (problème → solution → preuve → action).`,
      });
    } else {
      forces.push(`Parcours guidé en ${m.nbSections} sections.`);
    }
    if (m.semantique < 4) structure -= 10;
    if (m.barreDefilementHorizontal) {
      structure -= 15;
      ameliorations.push({ titre: "Défilement horizontal", detail: "La page déborde de l'écran — un défaut de structure visible immédiatement." });
    }
    structure = Math.max(0, Math.min(100, structure));
    axes.push({
      nom: "Structure",
      score: structure,
      avis:
        structure >= 80
          ? "Structure claire : en-tête, sections et pied de page guident la lecture."
          : structure >= 60
            ? "Structure partielle : des repères manquent."
            : "Structure désorganisée : la page n'offre pas de parcours de lecture.",
    });

    /* --- COPYWRITING --- */
    let copy = 100;
    if (m.motsH1 >= 4 && m.motsH1 <= 14) {
      forces.push(`Titre principal percutant en ${m.motsH1} mots (« ${m.h1.slice(0, 70)} »).`);
    } else if (m.motsH1 === 0) {
      copy -= 30;
      ameliorations.push({ titre: "Aucun titre principal", detail: "Sans H1, le visiteur ne sait pas en 3 secondes ce que la page lui apporte." });
    } else if (m.motsH1 < 4) {
      copy -= 15;
      ameliorations.push({ titre: "Titre principal trop bref", detail: `« ${m.h1} » — un bon titre exprime le bénéfice (5 à 12 mots).` });
    } else {
      copy -= 10;
      ameliorations.push({ titre: "Titre trop long", detail: `« ${m.h1.slice(0, 70)}… » — un titre de 5 à 12 mots se retient mieux.` });
    }
    if (m.motsPage < 150) {
      copy -= 20;
      ameliorations.push({ titre: "Presque aucun texte", detail: `${m.motsPage} mots sur la page : le copywriting n'a pas l'espace de convaincre.` });
    }
    if (m.vouvoie) {
      forces.push("Le texte parle directement au visiteur (« vous »).");
    } else {
      copy -= 10;
      ameliorations.push({ titre: "Le texte ne s'adresse pas au lecteur", detail: "Aucun « vous/votre » : le copywriting décrit au lieu de parler AU client." });
    }
    if (m.motsBenefice.length >= 3) {
      forces.push(`Le texte vend des bénéfices (${m.motsBenefice.slice(0, 5).join(", ")}).`);
    } else if (m.motsBenefice.length === 0) {
      copy -= 15;
      ameliorations.push({ titre: "Aucun bénéfice mis en avant", detail: "Le texte ne promet ni résultat ni transformation : il décrit, il ne vend pas." });
    } else {
      copy -= 6;
    }
    if (m.lorem) {
      copy -= 25;
      ameliorations.push({ titre: "Texte de remplissage détecté", detail: "Du « lorem ipsum » est encore sur la page — rédigez le vrai texte." });
    }
    copy = Math.max(0, Math.min(100, copy));
    axes.push({
      nom: "Copywriting",
      score: copy,
      avis:
        copy >= 80
          ? "Copywriting efficace : promesse claire, bénéfices et ton direct."
          : copy >= 60
            ? "Texte correct mais peu vendeur."
            : "Copywriting faible : la promesse n'est pas claire.",
    });

    /* --- CONVERSION --- */
    let conversion = 100;
    if (m.ctaPremiereVue >= 1 && m.libellesCta.length >= 2) {
      forces.push(`Appels à l'action clairs (« ${m.libellesCta.slice(0, 3).join(" », « ")} »).`);
    } else if (m.ctaPremiereVue >= 1) {
      forces.push("Appel à l'action présent dès la première vue.");
    } else {
      conversion -= 35;
      ameliorations.push({
        titre: "Aucun appel à l'action visible",
        detail: "Aucun bouton d'action (contact, devis, réservation) visible dans la première vue : le visiteur ne sait pas quoi faire.",
      });
    }
    const contactPossible = m.aFormulaire || m.emailVisible || m.telephoneVisible || m.libellesCta.some((c) => /contact|whatsapp|appel/i.test(c));
    if (!contactPossible) {
      conversion -= 25;
      ameliorations.push({ titre: "Aucun moyen de contact évident", detail: "Ni formulaire, ni email, ni téléphone visibles : le prospect ne peut pas passer à l'acte." });
    } else {
      const moyens = [
        m.aFormulaire ? "formulaire" : "",
        m.emailVisible ? "email" : "",
        m.telephoneVisible ? "téléphone" : "",
      ].filter(Boolean);
      if (moyens.length) forces.push(`Prise de contact possible (${moyens.join(", ")}).`);
    }
    if (m.preuveSociale.length >= 2) {
      forces.push(`Preuve sociale présente (${m.preuveSociale.slice(0, 4).join(", ")}).`);
    } else if (m.preuveSociale.length === 0) {
      conversion -= 18;
      ameliorations.push({ titre: "Aucune preuve sociale", detail: "Ni avis, ni témoignage, ni référence : rien ne rassure le visiteur avant l'acte d'achat." });
    } else {
      conversion -= 7;
    }
    if (m.urgence) forces.push("Un élément d'urgence pousse à l'action.");
    conversion = Math.max(0, Math.min(100, conversion));
    axes.push({
      nom: "Conversion",
      score: conversion,
      avis:
        conversion >= 80
          ? "La page est conçue pour convertir : action, contact et preuve."
          : conversion >= 60
            ? "Conversion partielle : le passage à l'action pourrait être plus net."
            : "Conversion faible : le visiteur n'est pas conduit à agir.",
    });

    const scoreGlobal = Math.round((design + structure + copy + conversion) / 4);

    return {
      ok: true,
      url,
      scoreGlobal,
      note: noteDepuisScore(scoreGlobal),
      axes,
      capture: `data:image/jpeg;base64,${capture}`,
      forces: forces.slice(0, 8),
      ameliorations: ameliorations.slice(0, 10),
    };
  } finally {
    await page.close().catch(() => undefined);
  }
}
