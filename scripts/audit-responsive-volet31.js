#!/usr/bin/env node
/* VOLET 31 (29/11/2026) — AUDIT RESPONSIVE AUTOMATISÉ du
 * back-office : tous les espaces × toutes les tailles d'écran
 * (mobiles, tablettes, desktop), détection programmatique des
 * débordements horizontaux, éléments coupés, tableaux sans
 * conteneur défilant, modales trop larges.
 *
 * Sortie : rapport console + JSON (/tmp/audit-responsive.json) +
 * captures aux tailles clés (/tmp/render/volet31/). */

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://127.0.0.1:3100";
const MOT_DE_PASSE = process.env.MOT_DE_PASSE || "TestVolet31!2026";
const DOSSIER = "/tmp/render/volet31";

/* 11 tailles : mobiles (360→414), tablettes (600/768/834/1024),
 * desktop (1280/1440/1920). */
const VIEWPORTS = [
  { nom: "mobile-s-360", largeur: 360, hauteur: 740 },
  { nom: "mobile-375", largeur: 375, hauteur: 667 },
  { nom: "mobile-390", largeur: 390, hauteur: 844 },
  { nom: "mobile-l-414", largeur: 414, hauteur: 896 },
  { nom: "tablette-600", largeur: 600, hauteur: 1024 },
  { nom: "tablette-768", largeur: 768, hauteur: 1024 },
  { nom: "tablette-834", largeur: 834, hauteur: 1112 },
  { nom: "tablette-paysage-1024", largeur: 1024, hauteur: 768 },
  { nom: "desktop-1280", largeur: 1280, hauteur: 800 },
  { nom: "desktop-1440", largeur: 1440, hauteur: 900 },
  { nom: "desktop-1920", largeur: 1920, hauteur: 1080 },
];

/* Espaces : boutons de la nav « Sections du back-office ». */
const ESPACES = [
  { cle: "tableau-de-bord", label: null }, /* logo → tableau de bord */
  { cle: "demandes", label: "Demandes" },
  { cle: "propositions", label: "Propositions" },
  { cle: "devis", label: "Devis" },
  { cle: "factures", label: "Factures" },
  { cle: "portfolio", label: "Portfolio" },
  { cle: "scraping", label: "Scraping" },
  { cle: "prospects", label: "Prospects" },
  { cle: "audit", label: "Audit" },
];

/* Modales à ouvrir depuis le tableau de bord. */
const MODALES = [
  { cle: "nouvelle-proposition", bouton: "Nouvelle proposition" },
  { cle: "nouveau-devis", bouton: "Nouveau devis" },
  { cle: "nouveau-projet-portfolio", bouton: "Ajouter un projet au portfolio" },
];

const RAPPORT = {};
let problemes = 0;

function noter(cle, ok, detail = "") {
  if (!RAPPORT[cle]) RAPPORT[cle] = [];
  RAPPORT[cle].push({ ok, detail });
  if (!ok) problemes++;
  console.log(`  ${ok ? "OK " : "!! "} ${cle}${!ok && detail ? ` — ${detail}` : ""}`);
}

/* Mesures dans la page : débordement page, éléments hors cadre,
 * éléments texte tronqués, tableaux mal contenus. */
const MESURES = `(() => {
  const vw = document.documentElement.clientWidth;
  const css = getComputedStyle;
  const dansAscendantDefilant = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const o = css(p).overflowX;
      if (o === "auto" || o === "scroll") return true;
    }
    return false;
  };
  /* 1. Débordement de la page entière */
  const pageDebord = document.documentElement.scrollWidth - vw;
  /* 2. Éléments visibles qui dépassent à droite */
  const horsCadre = [];
  const tous = document.querySelectorAll("body *");
  for (const el of tous) {
    if (horsCadre.length >= 8) break;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    if (r.right <= vw + 2) continue;
    const style = css(el);
    if (style.visibility === "hidden" || style.display === "none") continue;
    if (style.position === "fixed" || style.position === "absolute") {
      /* les éléments positionnés coupés par un parent overflow hidden sont acceptés */
      let coupe = false;
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        if (css(p).overflow === "hidden" || css(p).overflowX === "hidden") { coupe = true; break; }
      }
      if (coupe) continue;
    }
    if (dansAscendantDefilant(el)) continue;
    horsCadre.push({
      tag: el.tagName.toLowerCase(),
      cls: String(el.className).slice(0, 90),
      texte: (el.textContent || "").trim().slice(0, 40),
      droite: Math.round(r.right),
    });
  }
  /* 3. Texte tronqué (scrollWidth > clientWidth avec overflow masqué) —
   *    les ellipses VOLONTAIRES (classes truncate / line-clamp) sont le
   *    comportement attendu des tableaux : elles ne comptent pas. */
  const tronques = [];
  const ellipsVolontaire = (el) => {
    for (let p = el; p && p !== document.body; p = p.parentElement) {
      const c = String(p.className || "");
      if (c.includes("truncate") || c.includes("line-clamp") || c.includes("sr-only")) return true;
    }
    return false;
  };
  for (const el of tous) {
    if (tronques.length >= 6) break;
    const style = css(el);
    if (!el.children.length && el.textContent && el.textContent.trim().length > 3) {
      if (ellipsVolontaire(el)) continue;
      if (el.scrollWidth > el.clientWidth + 3 && (style.overflowX === "hidden" || style.overflow === "hidden")) {
        tronques.push({ tag: el.tagName.toLowerCase(), texte: el.textContent.trim().slice(0, 40) });
      }
    }
  }
  /* 4. Tableaux : doivent tenir ou être dans un conteneur défilant */
  const tables = [];
  for (const t of document.querySelectorAll("table")) {
    const r = t.getBoundingClientRect();
    tables.push({ tient: r.right <= vw + 2, defilant: dansAscendantDefilant(t) });
  }
  return { vw, pageDebord, horsCadre, tronques, tables };
})()`;

(async () => {
  fs.mkdirSync(DOSSIER, { recursive: true });
  const browser = await chromium.launch();

  for (const vp of VIEWPORTS) {
    console.log(`\n■ ${vp.nom} (${vp.largeur}×${vp.hauteur})`);
    const ctx = await browser.newContext({
      viewport: { width: vp.largeur, height: vp.hauteur },
      deviceScaleFactor: 1,
      isMobile: vp.largeur < 600,
      hasTouch: vp.largeur < 600,
    });
    const page = await ctx.newPage();

    /* Connexion */
    await page.goto(`${BASE}/#/admin`, { waitUntil: "load", timeout: 30000 });
    await page.waitForSelector("#admin-password", { state: "visible", timeout: 30000 });
    await page.fill("#admin-password", MOT_DE_PASSE);
    await page.click('button:has-text("Ouvrir L\'Espace")');
    await page.waitForSelector('nav[aria-label="Sections du back-office"]', { timeout: 30000 });
    await page.waitForTimeout(900);

    /* La nav elle-même doit défiler sans casser la page */
    const nav = await page.locator('nav[aria-label="Sections du back-office"]').evaluate((el) => ({
      scrollable: getComputedStyle(el).overflowX,
      tient: el.scrollWidth <= el.clientWidth + 2 || getComputedStyle(el).overflowX !== "visible",
    }));
    noter(`${vp.nom} · nav sections : défilement propre`, nav.scrollable !== "visible");

    for (const espace of ESPACES) {
      let cle = `${vp.nom} · ${espace.cle}`;
      try {
        if (espace.label) {
          const bouton = page.locator(`nav[aria-label="Sections du back-office"] button:has-text("${espace.label}")`).first();
          await bouton.click();
        } else {
          /* logo = tableau de bord */
          await page.locator('button[aria-label="Tableau de bord"]').click();
        }
        await page.waitForTimeout(1100);
        const m = await page.evaluate(MESURES);
        const erreurs = [];
        if (m.pageDebord > 2) erreurs.push(`débordement page +${m.pageDebord}px`);
        if (m.horsCadre.length) erreurs.push(`hors-cadre : ${m.horsCadre.map((e) => `<${e.tag}> ${e.texte}`).join(" | ")}`);
        if (m.tronques.length) erreurs.push(`tronqués : ${m.tronques.map((e) => `${e.tag} « ${e.texte} »`).join(" | ")}`);
        const tableMal = m.tables.filter((t) => !t.tient && !t.defilant).length;
        if (tableMal) erreurs.push(`${tableMal} tableau(x) sans conteneur défilant`);
        noter(`${cle}`, erreurs.length === 0, erreurs.join(" ; "));

        /* Captures aux trois tailles clés */
        if (["mobile-s-360", "tablette-768", "desktop-1440"].includes(vp.nom)) {
          const f = path.join(DOSSIER, `${espace.cle}-${vp.largeur}.png`);
          await page.screenshot({ path: f, fullPage: false });
        }
      } catch (e) {
        noter(`${cle}`, false, `ERREUR : ${String(e).slice(0, 140)}`);
      }
    }

    /* Modales de création (depuis le tableau de bord) */
    for (const modale of MODALES) {
      try {
        await page.locator('button[aria-label="Tableau de bord"]').click();
        await page.waitForTimeout(500);
        const btn = page.locator(`button:has-text("${modale.bouton}")`).first();
        await btn.click();
        await page.waitForTimeout(900);
        const m = await page.evaluate(MESURES);
        const erreurs = [];
        if (m.pageDebord > 2) erreurs.push(`débordement page +${m.pageDebord}px`);
        if (m.horsCadre.length) erreurs.push(`hors-cadre : ${m.horsCadre.map((e) => `<${e.tag}> ${e.texte}`).join(" | ")}`);
        noter(`${vp.nom} · modale ${modale.cle}`, erreurs.length === 0, erreurs.join(" ; "));
        if (["mobile-s-360", "tablette-768", "desktop-1440"].includes(vp.nom)) {
          await page.screenshot({ path: path.join(DOSSIER, `modale-${modale.cle}-${vp.largeur}.png`) });
        }
        /* fermer la modale (Échap ou bouton Annuler) */
        await page.keyboard.press("Escape");
        await page.waitForTimeout(400);
        const encore = await page.locator('[role="dialog"]').count();
        if (encore > 0) {
          const annuler = page.locator('[role="dialog"] button:has-text("Annuler")').first();
          if (await annuler.count()) await annuler.click();
          await page.waitForTimeout(400);
        }
      } catch (e) {
        noter(`${vp.nom} · modale ${modale.cle}`, false, `ERREUR : ${String(e).slice(0, 140)}`);
      }
    }

    await ctx.close();
  }

  await browser.close();
  fs.writeFileSync("/tmp/audit-responsive.json", JSON.stringify(RAPPORT, null, 2));

  const total = Object.values(RAPPORT).flat().length;
  console.log(`\n═══ AUDIT RESPONSIVE : ${total - problemes}/${total} contrôles OK, ${problemes} problème(s) ═══`);
  process.exit(problemes > 0 ? 1 : 0);
})();
