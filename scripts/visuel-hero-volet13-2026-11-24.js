/**
 * CONTRÔLE VISUEL ET GÉOMÉTRIQUE — VOLET 13 (24/11/2026) :
 *  1. espace au-dessus de la mention 5 étoiles RÉDUIT (sans
 *     chevaucher les éléments fixes de l'en-tête) ;
 *  2. photo du hero en NOIR ET BLANC sur mobile/tablette tactile —
 *     couleur UNIQUEMENT pendant l'appui du doigt, retour au N&B
 *     au relâchement ;
 *  3. les deux mockups épinglés TOUJOURS en couleurs originales ;
 *  4. description du hero à la MÊME taille de police que les
 *     descriptions des sections (.text-body) ;
 *  5. intégration du projet JOURNALISTEFR (Alexandre Morel) dans
 *     « Projets Réalisés » sans toucher aux mockups du hero.
 *
 * Deux modes :
 *  - `node script.js mesure` : mesures seules, aucune assertion ;
 *  - `node script.js` (défaut) : assertions complètes, exit ≠ 0 au
 *    premier échec.
 *
 * Sortie : /tmp/render/volet13/<viewport>.png + JSON sur stdout.
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = "http://127.0.0.1:3100";
const OUT = "/tmp/render/volet13";
const MODE = process.argv[2] === "mesure" ? "mesure" : "assert";
const VIEWPORTS = [
  { name: "mobile-court-360x640", width: 360, height: 640, touch: true },
  { name: "mobile-390x844", width: 390, height: 844, touch: true },
  { name: "tablette-768x1024", width: 768, height: 1024, touch: true },
  { name: "bureau-etroit-1024x768", width: 1024, height: 768, touch: false },
  { name: "bureau-1280x800", width: 1280, height: 800, touch: false },
  { name: "bureau-1440x900", width: 1440, height: 900, touch: false },
  /* Viewports extrêmes des paliers « téléphones courts » de
     globals.css — déterminants depuis la suppression des règles
     font-size réduites de .hero-desc (volet 13) : le hero doit
     tenir sans défilement même à 320×568 et 280×653. */
  { name: "tres-petit-320x568", width: 320, height: 568, touch: true },
  { name: "fold-280x653", width: 280, height: 653, touch: true },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const report = { mode: MODE, base: BASE, date: new Date().toISOString(), viewports: [] };
  let failures = 0;

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      hasTouch: vp.touch,
      isMobile: vp.touch,
      deviceScaleFactor: vp.touch ? 2 : 1,
    });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 30000 });
    await page.waitForTimeout(4600);

    /* ---------- Mesures ---------- */
    const m = await page.evaluate(() => {
      const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: r.width, h: r.height };
      };
      const cs = (el, prop) => (el ? getComputedStyle(el)[prop] : null);
      // Mention 5 étoiles : le <p> avec aria-label « Note moyenne… »
      const stars = [...document.querySelectorAll("#hero p")].find((p) =>
        p.getAttribute("aria-label")?.startsWith("Note moyenne"),
      );
      // Éléments fixes de l'en-tête (plaque logo + bouton menu)
      const header = document.querySelector("header.fixed");
      const plaque = header ? rect(header.querySelector("a[href='#/']") || header.firstElementChild) : null;
      const menuBtn = rect(document.querySelector("button[aria-label*='menu' i], #menu-plein-ecran"));
      // Photo du hero VISIBLE (figure non masquée)
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      const fig = document.querySelector(
        isDesktop ? ".hero-visual figure.lg\\:block" : ".hero-visual figure.lg\\:hidden",
      );
      const photo = fig ? fig.querySelector("img") : null;
      // Mockups épinglés
      const browserMock = document.querySelector(".hero-anim-browser img");
      const phoneMock = document.querySelector(".hero-anim-phone img");
      // Description hero + référence section (.text-body du PROBLÈME)
      const desc = document.querySelector("p.hero-desc");
      const bodyRef = [...document.querySelectorAll(".text-body")].find((el) => el.tagName === "P");
      // Dernier élément de la colonne texte (barre de réassurance)
      const col = document.querySelector("#hero .order-3");
      const reassurance = col ? col.lastElementChild : null;
      return {
        vw: window.innerWidth,
        vh: window.innerHeight,
        stars: rect(stars),
        plaque, menuBtn,
        photo: rect(photo),
        photoFilter: cs(photo, "filter"),
        browserMockFilter: cs(browserMock, "filter"),
        phoneMockFilter: cs(phoneMock, "filter"),
        descFont: desc ? cs(desc, "fontSize") : null,
        descLH: desc ? cs(desc, "lineHeight") : null,
        bodyFont: bodyRef ? cs(bodyRef, "fontSize") : null,
        bodyLH: bodyRef ? cs(bodyRef, "lineHeight") : null,
        reassuranceBottom: reassurance ? rect(reassurance).bottom : null,
        scrollW: document.documentElement.scrollWidth,
        descRect: rect(desc),
      };
    });

    /* ---------- Appui simulé sur la photo (tactile) ---------- */
    let pressFilter = null;
    let releaseFilter = null;
    if (vp.touch && m.photo) {
      const cx = m.photo.left + m.photo.w / 2;
      const cy = m.photo.top + Math.min(m.photo.h / 2, m.vh / 2);
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.waitForTimeout(750); // transition filtre 0,55 s
      pressFilter = await page.evaluate(() => {
        const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
        const fig = document.querySelector(
          isDesktop ? ".hero-visual figure.lg\\:block" : ".hero-visual figure.lg\\:hidden",
        );
        const img = fig ? fig.querySelector("img") : null;
        return img ? getComputedStyle(img).filter : null;
      });
      await page.mouse.up();
      await page.waitForTimeout(900); // retour transition
      releaseFilter = await page.evaluate(() => {
        const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
        const fig = document.querySelector(
          isDesktop ? ".hero-visual figure.lg\\:block" : ".hero-visual figure.lg\\:hidden",
        );
        const img = fig ? fig.querySelector("img") : null;
        return img ? getComputedStyle(img).filter : null;
      });
    }

    const checks = [];
    const push = (name, ok, detail) => checks.push({ name, ok, detail });

    /* C1 — espace au-dessus des étoiles réduit, sans chevaucher
       l'en-tête fixe (plaque logo ~64/104 px + bouton menu). */
    const fixedBottom = Math.max(m.plaque?.bottom ?? 0, m.menuBtn?.bottom ?? 0);
    push("C1 espace au-dessus des étoiles", m.stars && m.stars.top >= fixedBottom + 4,
      `étoiles top ${m.stars ? Math.round(m.stars.top) : "?"} px / en-tête fixe bas ${Math.round(fixedBottom)} px — écart ${m.stars ? Math.round(m.stars.top - fixedBottom) : "?"} px`);

    /* C2 — photo N&B par défaut sur tactile, couleur pendant
       l'appui, retour N&B au relâchement. */
    if (vp.touch) {
      const gs = (f) => typeof f === "string" && f.includes("grayscale(1)");
      /* « couleur » = pas de grayscale actif : none OU grayscale(0)
         (valeur ANNULÉE ≠ appliquée — bug de la première passe :
         grayscale(0) contient la chaîne « grayscale » et était
         compté comme noir et blanc). */
      const color = (f) => typeof f === "string" && (f === "none" || f.includes("grayscale(0)"));
      push("C2a photo N&B par défaut (tactile)", gs(m.photoFilter), `filter: ${m.photoFilter}`);
      push("C2b photo en couleur pendant l'appui", color(pressFilter), `filter: ${pressFilter}`);
      push("C2c photo retour N&B au relâchement", gs(releaseFilter), `filter: ${releaseFilter}`);
    } else {
      push("C2 photo bureau inchangée (N&B par défaut, survol → couleur)",
        typeof m.photoFilter === "string" && m.photoFilter.includes("grayscale(1)"),
        `filter: ${m.photoFilter}`);
    }

    /* C3 — mockups en couleurs originales (aucun grayscale). */
    push("C3 mockups en couleurs originales",
      m.browserMockFilter === "none" && m.phoneMockFilter === "none",
      `navigateur: ${m.browserMockFilter} / smartphone: ${m.phoneMockFilter}`);

    /* C4 — description à la même taille que .text-body. */
    const eq = (a, b) => Math.abs(parseFloat(a) - parseFloat(b)) < 0.15;
    push("C4 description = taille des sections (.text-body)",
      eq(m.descFont, m.bodyFont),
      `hero ${m.descFont} (interligne ${m.descLH}) / sections ${m.bodyFont} (interligne ${m.bodyLH})`);

    /* C5 — le hero tient toujours dans le viewport. */
    push("C5 barre de réassurance entière dans le viewport",
      m.reassuranceBottom !== null && m.reassuranceBottom <= m.vh + 1,
      `bas ${m.reassuranceBottom ? Math.round(m.reassuranceBottom) : "?"} / ${m.vh} — marge ${m.reassuranceBottom ? Math.round(m.vh - m.reassuranceBottom) : "?"} px`);

    /* C6 — aucun débordement horizontal. */
    push("C6 aucun débordement horizontal", m.scrollW <= m.vw, `scrollWidth ${m.scrollW} / ${m.vw}`);

    const shot = path.join(OUT, `${vp.name}.png`);
    await page.screenshot({ path: shot });
    const vpFail = MODE === "assert" ? checks.filter((c) => !c.ok).length : 0;
    failures += vpFail;
    report.viewports.push({
      viewport: vp.name,
      checks,
      info: {
        starsTop: m.stars ? Math.round(m.stars.top) : null,
        fixedBottom: Math.round(fixedBottom),
        descFont: m.descFont, bodyFont: m.bodyFont,
        margeHero: m.reassuranceBottom ? Math.round(m.vh - m.reassuranceBottom) : null,
      },
      screenshot: shot,
    });
    await ctx.close();
  }

  /* ---------- PROJETS (bureau) ---------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 30000 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);
    await page.evaluate(() => {
      const s = document.querySelector("#realisations");
      if (s) s.scrollIntoView();
    });
    await page.waitForTimeout(1200);

    const pj = await page.evaluate(async () => {
      const cards = [...document.querySelectorAll("#realisations article, #realisations .grid > *")];
      const imgs = [...document.querySelectorAll("#realisations img")];
      const loaded = await Promise.all(
        imgs.map((im) => new Promise((res) => (im.complete ? res(!!im.naturalWidth) : im.addEventListener("load", () => res(!!im.naturalWidth), { once: true })))),
      );
      // Mockups du hero : navigateur = PROJECTS[0], smartphone = PROJECTS[2]
      const heroBrowser = document.querySelector(".hero-anim-browser img");
      const heroPhone = document.querySelector(".hero-anim-phone img");
      return {
        nbCartes: cards.length,
        noms: cards.map((c) => c.textContent?.replace(/\s+/g, " ").trim().slice(0, 40)),
        imagesChargees: loaded.filter(Boolean).length,
        imagesTotales: imgs.length,
        heroBrowserSrc: heroBrowser?.currentSrc || heroBrowser?.src || null,
        heroPhoneSrc: heroPhone?.currentSrc || heroPhone?.src || null,
      };
    });

    const checks = [];
    const push = (name, ok, detail) => checks.push({ name, ok, detail });
    push("C7 quatre projets dans la grille", pj.nbCartes === 4, `${pj.nbCartes} cartes : ${pj.noms.join(" | ")}`);
    push("C7b captures toutes chargées", pj.imagesChargees === pj.imagesTotales && pj.imagesTotales >= 4,
      `${pj.imagesChargees}/${pj.imagesTotales} images chargées`);
    push("C7c mockups du hero inchangés",
      /mrsteveenglish/.test(pj.heroBrowserSrc || "") && /afribayit/.test(pj.heroPhoneSrc || ""),
      `navigateur: ${(pj.heroBrowserSrc || "").split("/").pop()} / smartphone: ${(pj.heroPhoneSrc || "").split("/").pop()}`);

    /* Page de détail du nouveau projet. */
    await page.goto(`${BASE}/#/projet/journalistefr`, { waitUntil: "load", timeout: 30000 });
    await page.waitForTimeout(1500);
    const detail = await page.evaluate(() => ({
      h1: document.querySelector("h1")?.textContent?.trim() ?? null,
      url: [...document.querySelectorAll("a")].some((a) => (a.href || "").includes("journalistefr.vercel.app")),
    }));
    push("C7d page détail #/projet/journalistefr", !!detail.h1 && detail.url,
      `h1: ${detail.h1} — lien vers le site: ${detail.url}`);

    await page.screenshot({ path: path.join(OUT, "projet-journalistefr.png") });
    const pjFail = MODE === "assert" ? checks.filter((c) => !c.ok).length : 0;
    failures += pjFail;
    report.projets = { checks, info: pj };
    await ctx.close();
  }

  await browser.close();
  report.totaux = { echecs: failures, mode: MODE };
  console.log(JSON.stringify(report, null, 2));
  process.exit(failures > 0 ? 1 : 0);
})();
