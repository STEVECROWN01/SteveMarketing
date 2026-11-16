#!/usr/bin/env node
/**
 * Vérification headless des corrections du 17/11/2026 :
 *  1. PAGES PROJETS : mockup téléphone à la MÊME HAUTEUR que le
 *     mockup bureau (1024/1280/1440/1920), rayons adoucis, zoom
 *     léger au survol, capture de la section « Le Site ».
 *  2. PAGE MÉTHODE : flèche sinusoïdale re-ancrée — départ à la
 *     fin du titre « …des ventes. » (section « Des sites web qui
 *     vendent »), pointe dix pixels au-dessus de la première carte
 *     de la liste, AUCUN chevauchement du texte (titre, description,
 *     bouton, cartes), absente sous 1024 px. Captures du trajet.
 *
 * Sortie : mesures dans la console + captures dans /tmp/verif-17-11/.
 */
const { chromium } = require("playwright");
const fs = require("fs");

const BASE = process.env.BASE || "http://localhost:3100";
const OUT = "/tmp/verif-17-11";
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const log = (...a) => console.log(...a);

  /* ============ 1. PAGE PROJET — hauteurs / rayons ============ */
  log("\n=== PAGE PROJET (#/projet/mrsteveenglish) ===");
  for (const w of [1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(`${BASE}/#/projet/mrsteveenglish`, { waitUntil: "load" });
    await page.waitForTimeout(1800);
    const m = await page.evaluate(() => {
      const figs = document.querySelectorAll("#le-site figure");
      const b = figs[0], p = figs[1];
      const rb = b.getBoundingClientRect();
      const rp = p.getBoundingClientRect();
      return {
        bw: +rb.width.toFixed(1),
        bh: +rb.height.toFixed(1),
        pw: +rp.width.toFixed(1),
        ph: +rp.height.toFixed(1),
        delta: +(rp.height - rb.height).toFixed(1),
        topDelta: +(rp.top - rb.top).toFixed(1),
        radiusBrowser: getComputedStyle(b).borderTopLeftRadius,
        radiusPhone: getComputedStyle(p).borderTopLeftRadius,
        radiusPhoneInner: getComputedStyle(p.querySelector("span:not([aria-hidden])")).borderTopLeftRadius,
      };
    });
    log(
      `viewport ${w} : bureau ${m.bw}x${m.bh} | tel ${m.pw}x${m.ph} | Δhauteur ${m.delta}px | Δhaut ${m.topDelta}px | rayons bureau ${m.radiusBrowser} tel ${m.radiusPhone}/${m.radiusPhoneInner}`
    );
  }

  /* ---- zoom au survol (souris réelle) ---- */
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/#/projet/mrsteveenglish`, { waitUntil: "load" });
  await page.waitForTimeout(1600);
  const hoverable = await page.evaluate(() => document.documentElement.classList.contains("hoverable"));
  for (const [label, idx] of [["bureau", 0], ["telephone", 1]]) {
    const loc = page.locator("#le-site figure").nth(idx);
    const before = await loc.evaluate((el) => getComputedStyle(el.querySelector("span:not([aria-hidden]) img")).transform);
    await loc.hover();
    await page.waitForTimeout(800);
    const after = await loc.evaluate((el) => getComputedStyle(el.querySelector("span:not([aria-hidden]) img")).transform);
    log(`zoom survol ${label} : ${before} -> ${after}`);
  }
  log(`html.hoverable present : ${hoverable}`);

  /* ---- capture de la section « Le Site » ---- */
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${BASE}/#/projet/mrsteveenglish`, { waitUntil: "load" });
  await page.waitForTimeout(1800);
  const siteClip = await page.evaluate(() => {
    const s = document.getElementById("le-site");
    const r = s.getBoundingClientRect();
    const row = s.querySelectorAll("figure")[0].parentElement.parentElement.getBoundingClientRect();
    return { x: 0, y: row.top + window.scrollY - 40, width: 1440, height: row.height + 90 };
  });
  await page.screenshot({ path: `${OUT}/projet-le-site-1440.png`, clip: siteClip });
  log(`capture : ${OUT}/projet-le-site-1440.png`);

  /* ============ 2. PAGE MÉTHODE — flèche ============ */
  log("\n=== PAGE MÉTHODE (#/methode) : flèche ===");
  for (const w of [1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(`${BASE}/#/methode`, { waitUntil: "load" });
    await page.waitForTimeout(2600);
    const r = await page.evaluate(() => {
      const main = document.getElementById("contenu-principal");
      // La flèche porte un dégradé identifié — les icônes Lucide
      // sont aussi des SVG, on ne peut pas prendre le premier.
      const grad = document.getElementById("fleche-methode");
      const svg = grad ? grad.closest("svg") : null;
      if (!main || !svg) return { exists: false };
      const paths = svg.querySelectorAll("path");
      if (paths.length < 2) return { exists: false, partial: paths.length };
      const svgR = svg.getBoundingClientRect();
      const dBody = paths[0].getAttribute("d") || "";
      const dHead = paths[1].getAttribute("d") || "";
      const sm = dBody.match(/^M\s+([\d.]+)\s+([\d.]+)/);
      const lm = dHead.match(/L\s+([\d.-]+)\s+([\d.-]+)/);
      if (!sm || !lm) return { exists: false, parse: true };
      const start = { x: svgR.left + +sm[1], y: svgR.top + +sm[2] };
      const tip = { x: svgR.left + +lm[1], y: svgR.top + +lm[2] };

      const h2s = Array.from(main.querySelectorAll("h2"));
      // RevealText insère des espaces insécables entre les mots :
      // normaliser avant de chercher.
      const norm = (s) => (s || "").replace(/\u00A0/g, " ");
      const titleH2 = h2s.find((h) => norm(h.textContent).includes("génèrent des ventes"));
      const spans = titleH2.querySelectorAll(":scope > span");
      const word = spans[spans.length - 1].getBoundingClientRect();
      const ol = main.querySelector("ol");
      const olR = ol.getBoundingClientRect();
      const desc = Array.from(main.querySelectorAll("p")).find((p) =>
        norm(p.textContent).trim().startsWith("Chaque projet suit")
      );
      const button = Array.from(main.querySelectorAll("button")).find((b) =>
        norm(b.textContent).trim() === "Demander Un Devis"
      );
      const grid = main.querySelector(".grid");
      const cards = grid ? grid.querySelector(":scope > div") : null;

      // Échantillonnage du corps pour les chevauchements + angles.
      const pathEl = paths[0];
      const L = pathEl.getTotalLength();
      const samples = [];
      for (let i = 0; i <= 80; i++) {
        const pt = pathEl.getPointAtLength((L * i) / 80);
        samples.push({ x: svgR.left + pt.x, y: svgR.top + pt.y });
      }
      // Détection de coudes : angle entre segments consécutifs
      // (échantillonnage fin, pas de 6 px).
      const fine = [];
      for (let i = 0; i <= Math.ceil(L / 6); i++) {
        const pt = pathEl.getPointAtLength(Math.min(L, i * 6));
        fine.push({ x: pt.x, y: pt.y });
      }
      let maxTurn = 0;
      let maxTurnAt = 0;
      for (let i = 2; i < fine.length; i++) {
        const a = fine[i - 2], b = fine[i - 1], c = fine[i];
        const a1 = Math.atan2(b.y - a.y, b.x - a.x);
        const a2 = Math.atan2(c.y - b.y, c.x - b.x);
        let d = Math.abs(a2 - a1);
        if (d > Math.PI) d = 2 * Math.PI - d;
        if (d > maxTurn) { maxTurn = d; maxTurnAt = b.y; }
      }
      const maxX = Math.max(...fine.map((p) => p.x));
      const minX = Math.min(...fine.map((p) => p.x));
      const rect = (el) => {
        const b = el.getBoundingClientRect();
        return { left: b.left, right: b.right, top: b.top, bottom: b.bottom };
      };
      return {
        exists: true,
        start,
        tip,
        word: rect(titleH2.querySelector(":scope > span:last-child")),
        wordH: word.height,
        ol: { left: olR.left, top: olR.top, width: olR.width },
        obstacles: {
          titre: rect(titleH2),
          description: desc ? rect(desc) : null,
          bouton: button ? rect(button) : null,
          cartes: cards ? rect(cards) : null,
        },
        samples,
        kink: { maxTurnDeg: +(maxTurn * 180 / Math.PI).toFixed(1), atY: +(maxTurnAt).toFixed(0) },
        xRange: { min: +minX.toFixed(0), max: +maxX.toFixed(0) },
        svgTop: svgR.top,
      };
    });

    if (!r.exists) {
      log(`viewport ${w} : AUCUNE flèche rendue`);
      continue;
    }
    const expStart = { x: r.word.right + 10, y: r.word.top + r.wordH * 0.7 };
    const expTip = {
      x: r.ol.left + Math.min(Math.max(r.ol.width * 0.16, 44), 130),
      y: r.ol.top - 10,
    };
    const startErr = {
      dx: +(r.start.x - expStart.x).toFixed(1),
      dy: +(r.start.y - expStart.y).toFixed(1),
    };
    const tipErr = { dx: +(r.tip.x - expTip.x).toFixed(1), dy: +(r.tip.y - expTip.y).toFixed(1) };

    // Chevauchements : on ignore les 3 premiers points (glissade de
    // sortie le long de la fin de ligne, à droite du dernier mot).
    const hits = [];
    r.samples.slice(3).forEach((s, i) => {
      const idx = i + 3;
      for (const [name, o] of Object.entries(r.obstacles)) {
        if (!o) continue;
        if (
          s.x > o.left - 3 &&
          s.x < o.right + 3 &&
          s.y > o.top - 3 &&
          s.y < o.bottom + 3
        ) {
          hits.push(`${name}@pt${idx}(${s.x.toFixed(0)},${s.y.toFixed(0)})`);
        }
      }
    });
    // La pointe doit finir AU-DESSUS de la carte, dans le premier
    // tiers gauche de la liste.
    const tipInList =
      r.tip.x >= r.ol.left && r.tip.x <= r.ol.left + r.ol.width * 0.34 && r.tip.y < r.ol.top;

    log(
      `viewport ${w} : depart Δ(${startErr.dx},${startErr.dy}) | pointe Δ(${tipErr.dx},${tipErr.dy}) | pointe au-dessus de la liste: ${tipInList} | coude max ${r.kink.maxTurnDeg}°/6px (y=${r.kink.atY}) | chevauchements: ${hits.length ? hits.join(", ") : "aucun"}`
    );
  }

  /* ---- sous 1024 px : pas de flèche ---- */
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/#/methode`, { waitUntil: "load" });
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(1500);
  const mobileArrow = await page.evaluate(() => !!document.getElementById("fleche-methode"));
  log(`viewport 390 : flèche présente (attendu false) : ${mobileArrow}`);

  /* ---- captures du trajet à 1280 et 1440 ---- */
  for (const w of [1280, 1440]) {
    await page.setViewportSize({ width: w, height: 940 });
    await page.goto(`${BASE}/#/methode`, { waitUntil: "load" });
    await page.reload({ waitUntil: "load" });
    await page.waitForTimeout(2400);
    // Cadrer le trajet : faire défiler pour révéler, puis capturer.
    const zone = await page.evaluate(() => {
      const main = document.getElementById("contenu-principal");
      const norm = (s) => (s || "").replace(/\u00A0/g, " ");
      const h2s = Array.from(main.querySelectorAll("h2"));
      const titleH2 = h2s.find((h) => norm(h.textContent).includes("génèrent des ventes"));
      const word = titleH2.querySelector(":scope > span:last-child").getBoundingClientRect();
      const ol = main.querySelector("ol").getBoundingClientRect();
      const top = word.top + window.scrollY - 90;
      const bottom = ol.top + window.scrollY + 130;
      return { top, height: bottom - top };
    });
    await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, zone.top - 40));
    await page.waitForTimeout(1300);
    await page.screenshot({
      path: `${OUT}/methode-fleche-${w}.png`,
      clip: { x: 0, y: Math.max(0, zone.top - 40), width: w, height: zone.height + 80 },
    });
    log(`capture : ${OUT}/methode-fleche-${w}.png`);
  }

  await browser.close();
  log("\nTerminé.");
})();
