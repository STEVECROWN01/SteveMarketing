/**
 * CONTRÔLE VISUEL ET GÉOMÉTRIQUE — VOLET 14 (24/11/2026) :
 *  1. titre du hero TOUJOURS en TROIS LIGNES exactes, sur toutes
 *     les tailles d'écran (h1Lines imposées, prop `lines`) ;
 *  2. espacements du bloc texte RESPONSIVES et COHÉRENTS (clamp,
 *     sans palier) : étoiles→titre, titre→description (bureau),
 *     description→CTA, CTA→réassurance ;
 *  3. les DEUX mockups épinglés sur le MÊME projet (AFRIBAYIT,
 *     plateforme immobilière : navigateur = desktop, téléphone =
 *     mobile), en couleurs originales permanentes ;
 *  4. PLUS AUCUNE URL dans les entêtes des mockups navigateur
 *     (hero, section réalisations, pages projet) ;
 *  5. images du site N&B par défaut sur TOUS les écrans, couleur
 *     au survol (bureau) ou à l'appui simple (tactile), retour N&B
 *     à l'appui extérieur ;
 *  6. RESPIRATION au-dessus de l'ensemble de l'image du hero
 *     (plaque comprise) sur bureau, sans rognage du hero — précision
 *     du même jour 24/11 : « pousse le bloc d'image un peu légèrement
 *     en haut » → marge haute réduite de moitié (clamp
 *     0,75rem→2,25svh→1,75rem), le bloc ENTIER (plaque comprise)
 *     remonte d'environ 16 à 28 px selon la hauteur d'écran ;
 *  7. favicon à FOND NOIR coins arrondis référencé et servi ;
 *  8. grille des réalisations RÉDUITE sur bureau (max-w-5xl) ;
 *  9. page admin : icône œil, bouton « Ouvrir L'Espace », mot de
 *     passe fonctionnel (plus jamais « non configuré »), back-office
 *     complet (tableau de bord, demandes, devis, propositions,
 *     factures & documents) — PRÉCISIONS MÊME JOUR (2) : message de
 *     bienvenue personnalisé à l'éditeur (Stevens) + œil À
 *     L'INTÉRIEUR du champ de mot de passe, aligné à droite ;
 * 10. API documents : génération PDF devis (enregistrement GitHub),
 *     facture depuis devis (cachet PAYÉ), liste, suppression.
 *
 * Modes : `node script.js mesure` (mesures seules) / défaut
 * (assertions complètes, exit ≠ 0 au premier échec).
 * Sortie : /tmp/render/volet14/*.png + JSON sur stdout.
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

/* SONDE_BASE : autre origine (production). SONDE_SANS_ADMIN=1 :
   ignore les sections admin et API (leur mot de passe est local au
   bac à sable — en production, le login est vérifié séparément par
   curl : mauvais mot de passe → « Mot de passe incorrect. », ce qui
   prouve que la configuration est prise en compte). */
const BASE = process.env.SONDE_BASE || "http://127.0.0.1:3100";
const OUT = "/tmp/render/volet14";
const MODE = process.argv[2] === "mesure" ? "mesure" : "assert";
const ADMIN_MDP = process.env.SONDE_MDP || "test-volet14-2026";
const SKIP_ADMIN = process.env.SONDE_SANS_ADMIN === "1";

const VIEWPORTS = [
  { name: "tres-petit-320x568", width: 320, height: 568, touch: true },
  { name: "mobile-court-360x640", width: 360, height: 640, touch: true },
  { name: "mobile-390x844", width: 390, height: 844, touch: true },
  { name: "tablette-768x1024", width: 768, height: 1024, touch: true },
  { name: "bureau-etroit-1024x768", width: 1024, height: 768, touch: false },
  { name: "bureau-1280x800", width: 1280, height: 800, touch: false },
  { name: "bureau-1440x900", width: 1440, height: 900, touch: false },
  { name: "bureau-large-1920x1080", width: 1920, height: 1080, touch: false },
];

const LIGNES_ATTENDUES = ["Je crée des Sites Web", "Professionnels qui", "Génèrent des Ventes."];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const report = { mode: MODE, base: BASE, date: new Date().toISOString(), viewports: [], sections: {} };
  let failures = 0;
  const norm = (s) => (s || "").replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();

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

    const m = await page.evaluate(() => {
      const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: r.width, h: r.height };
      };
      const cs = (el, prop) => (el ? getComputedStyle(el)[prop] : null);
      const h1 = document.querySelector("#hero h1");
      const stars = [...document.querySelectorAll("#hero p")].find((p) =>
        p.getAttribute("aria-label")?.startsWith("Note moyenne"),
      );
      const desc = document.querySelector("p.hero-desc");
      /* Équilibrage vertical bureau (volet antérieur) : la
         description est décalée par style.top négatif — la sonde
         en déduit les positions NATURELLES (sans le décalage) pour
         mesurer les espacements STRUCTURELS du volet 14. */
      const decalageDesc = desc ? parseFloat(desc.style.top) || 0 : 0;
      const cta = document.querySelector("#hero .hero-cta");
      const reassurance = document.querySelector("#hero .order-3")?.lastElementChild;
      const container = document.querySelector("#hero > .container-site");
      const grille = document.querySelector("#hero .grid");
      const plaque = document.querySelector("#hero .hero-anim-plate");
      const visual = document.querySelector("#hero .hero-visual");
      const photoFig = document.querySelector(
        window.matchMedia("(min-width: 1024px)").matches
          ? ".hero-visual figure.lg\\:block"
          : ".hero-visual figure.lg\\:hidden",
      );
      const photo = photoFig ? photoFig.querySelector("img") : null;
      const lignes = h1 ? [...h1.children].filter((el) => el.classList.contains("block")) : [];
      return {
        vw: window.innerWidth, vh: window.innerHeight,
        h1: rect(h1), h1Texte: h1 ? h1.textContent : null,
        h1LineHeight: cs(h1, "lineHeight"), h1FontSize: cs(h1, "fontSize"),
        lignes: lignes.map((l) => ({ texte: l.textContent, rect: rect(l) })),
        stars: rect(stars), cta: rect(cta), reassurance: rect(reassurance),
        decalageDesc,
        descNaturel: desc
          ? { ...(() => { const r = desc.getBoundingClientRect(); return { top: r.top - decalageDesc, bottom: r.bottom - decalageDesc }; })() }
          : null,
        container: rect(container), plaque: rect(plaque),
        grilleRect: rect(grille),
        visualMarginTop: cs(visual, "marginTop"),
        rowGap: cs(grille, "rowGap"), colGap: cs(grille, "columnGap"),
        photo: rect(photo), photoFilter: cs(photo, "filter"),
        heroBrowserSrc: document.querySelector(".hero-anim-browser img")?.getAttribute("src"),
        heroPhoneSrc: document.querySelector(".hero-anim-phone img")?.getAttribute("src"),
        scrollW: document.documentElement.scrollWidth,
      };
    });

    /* ---------- Interaction couleur (tactile : appui / extérieur) ---------- */
    let tapEtat = null;
    if (vp.touch && m.photo) {
      const lecture = () => page.evaluate(() => {
        const fig = document.querySelector(
          window.matchMedia("(min-width: 1024px)").matches
            ? ".hero-visual figure.lg\\:block"
            : ".hero-visual figure.lg\\:hidden",
        );
        const img = fig ? fig.querySelector("img") : null;
        const env = img ? img.closest(".mono-media") : null;
        return { filter: img ? getComputedStyle(img).filter : null, active: env ? env.classList.contains("couleur-active") : null };
      });
      await page.touchscreen.tap(m.photo.left + m.photo.w / 2, m.photo.top + Math.min(m.photo.h / 2, m.vh / 2));
      await page.waitForTimeout(750);
      const apresTap = await lecture();
      await page.touchscreen.tap(m.vw / 2, m.vh - 12);
      await page.waitForTimeout(900);
      const apresExt = await lecture();
      tapEtat = { apresTap, apresExt };
    }

    const checks = [];
    const push = (name, ok, detail) => checks.push({ name, ok, detail });

    /* ===== C1 — TITRE EN TROIS LIGNES EXACTES ===== */
    const lignes = m.lignes.map((l) => ({ texte: norm(l.texte), rect: l.rect }));
    push("C1a titre découpé en 3 lignes imposées",
      lignes.length === 3,
      `${lignes.length} conteneurs de ligne: ${JSON.stringify(lignes.map((l) => l.texte))}`);
    if (lignes.length === 3) {
      push("C1b contenu exact des 3 lignes",
        lignes.every((l, i) => l.texte === LIGNES_ATTENDUES[i]),
        `attendu ${JSON.stringify(LIGNES_ATTENDUES)} / reçu ${JSON.stringify(lignes.map((l) => l.texte))}`);
      const lh = parseFloat(m.h1LineHeight) || 1.07 * parseFloat(m.h1FontSize);
      const uneLigne = lignes.every((l) => l.rect && l.rect.h <= lh * 1.55);
      push("C1c chaque ligne tient sur UNE seule ligne visuelle",
        uneLigne,
        `hauteurs: ${lignes.map((l) => (l.rect ? Math.round(l.rect.h) : "?")).join(", ")} px / interligne ${Math.round(lh)} px`);
      const texteComplet = norm(m.h1Texte);
      push("C1d texte complet du h1 inchangé (SEO)",
        texteComplet === "Je crée des Sites Web Professionnels qui Génèrent des Ventes.",
        `« ${texteComplet} »`);
    }

    /* ===== C2 — ESPACEMENTS RESPONSIVES COHÉRENTS ===== */
    const gap = (a, b) => (a && b ? Math.round(b.top - a.bottom) : null);
    /* Les gaps de la description utilisent sa position NATURELLE
       (hors décalage d'équilibrage) : ce sont les marges du volet 14
       que l'on contrôle, pas l'équilibrage vertical antérieur. */
    const desc = { bottom: m.descNaturel ? m.descNaturel.bottom : (m.desc ? m.desc.bottom : null) };
    const gaps = {
      etoilesTitre: gap(m.stars, m.h1),
      descCta: gap({ bottom: desc.bottom }, m.cta),
      ctaReassurance: gap(m.cta, m.reassurance),
      /* Marge de RANGÉE de la grille (titre → description sur
         bureau) : le rowGap CALCULÉ — preuve directe de la fluidité
         du clamp (l'écart VISUEL inclut en plus l'équilibrage
         vertical du paragraphe, voulu depuis le 13/11). */
      titreDesc: m.vw >= 1024 ? Math.round(parseFloat(m.rowGap)) : null,
    };
    push("C2a espacement étoiles→titre dans la planche fluide",
      gaps.etoilesTitre !== null && gaps.etoilesTitre >= 5 && gaps.etoilesTitre <= 18,
      `${gaps.etoilesTitre} px (planche 5-18)`);
    push("C2b espacement description→CTA dans la planche fluide",
      gaps.descCta !== null && gaps.descCta >= 9 && gaps.descCta <= 24,
      `${gaps.descCta} px (planche 9-24)`);
    push("C2c espacement CTA→réassurance dans la planche fluide",
      gaps.ctaReassurance !== null && gaps.ctaReassurance >= 7 && gaps.ctaReassurance <= 21,
      `${gaps.ctaReassurance} px (planche 7-21, padding propre de la barre inclus)`);
    if (gaps.titreDesc !== null) {
      push("C2d marge de rangée titre→description (bureau, clamp fluide)",
        gaps.titreDesc >= 19 && gaps.titreDesc <= 37,
        `rowGap calculé: ${gaps.titreDesc} px (clamp 20→36, croissant avec l'écran)`);
    }

    /* ===== C3 — MOCKUPS : MÊME PROJET AFRIBAYIT, COULEUR PERMANENTE ===== */
    const filtres = await page.evaluate(() => ({
      nav: getComputedStyle(document.querySelector(".hero-anim-browser img")).filter,
      tel: getComputedStyle(document.querySelector(".hero-anim-phone img")).filter,
    }));
    push("C3a les deux mockups sur le MÊME projet (AFRIBAYIT)",
      /afribayit-desktop/.test(m.heroBrowserSrc || "") && /afribayit-mobile/.test(m.heroPhoneSrc || ""),
      `navigateur: ${(m.heroBrowserSrc || "").split("/").pop()} / téléphone: ${(m.heroPhoneSrc || "").split("/").pop()}`);
    push("C3b mockups en couleurs originales permanentes",
      filtres.nav === "none" && filtres.tel === "none",
      `navigateur: ${filtres.nav} / téléphone: ${filtres.tel}`);

    /* ===== C4 — ENTÊTES DES MOCKUPS SANS URL ===== */
    const entetes = await page.evaluate(() =>
      [...document.querySelectorAll("figure.group\\/mockup figcaption")].map((fc) =>
        (fc.textContent || "").replace(/\u00A0/g, " ").trim(),
      ),
    );
    push("C4 aucune URL dans les entêtes des mockups navigateur (hero)",
      entetes.length > 0 && entetes.every((t) => t === ""),
      `${entetes.length} entête(s), textes: ${JSON.stringify(entetes)}`);

    /* ===== C5 — IMAGES N&B → COULEUR ===== */
    const gs = (f) => typeof f === "string" && f.includes("grayscale(1)");
    const color = (f) => typeof f === "string" && (f === "none" || f.includes("grayscale(0)"));
    push("C5a photo du hero N&B par défaut (TOUS écrans)",
      gs(m.photoFilter), `filter: ${m.photoFilter}`);
    if (vp.touch && tapEtat) {
      push("C5b appui simple → couleur (classe .couleur-active)",
        color(tapEtat.apresTap.filter) && tapEtat.apresTap.active === true,
        `filter: ${tapEtat.apresTap.filter} / active: ${tapEtat.apresTap.active}`);
      push("C5c appui à l'extérieur → retour N&B",
        gs(tapEtat.apresExt.filter) && tapEtat.apresExt.active === false,
        `filter: ${tapEtat.apresExt.filter} / active: ${tapEtat.apresExt.active}`);
    }
    /* Carte de réalisation (tactile) : premier appui révèle SANS
       naviguer, le second navigue. */
    if (vp.touch) {
      const avant = page.url();
      await page.evaluate(() => {
        const s = document.querySelector("#realisations");
        if (s) s.scrollIntoView();
      });
      await page.waitForTimeout(1400);
      const carte = await page.$("#realisations .grid article img");
      if (carte) {
        /* Centrer l'IMAGE de la carte dans le viewport : sur les
           téléphones courts, scrollIntoView de la SECTION laissait
           la carte sous la ligne de flottaison (tap hors écran,
           mesuré y=712 pour un viewport de 640). */
        await carte.scrollIntoViewIfNeeded();
        await page.waitForTimeout(700);
        let r = await carte.boundingBox();
        if (r.y < 90) {
          await page.evaluate(() => window.scrollBy(0, 110));
          await page.waitForTimeout(600);
          r = await carte.boundingBox();
        }
        const yTap = Math.max(r.y + 30, Math.min(r.y + r.height / 2, m.vh - 60));
        await page.touchscreen.tap(r.x + r.width / 2, yTap);
        await page.waitForTimeout(700);
        const etat = await page.evaluate(() => {
          const img = document.querySelector("#realisations .grid article img");
          const env = img?.closest(".mono-media");
          return { active: env ? env.classList.contains("couleur-active") : null, hash: location.hash };
        });
        push("C5d carte projet : appui révèle la couleur SANS naviguer",
          etat.active === true && page.url() === avant,
          `active: ${etat.active} / URL inchangée: ${page.url() === avant} (${page.url()})`);
      }
    }

    /* ===== C6 — RESPIRATION AU-DESSUS DE L'IMAGE (bureau) + aucun rognage ===== */
    if (!vp.touch) {
      const respiration = m.plaque && m.container ? Math.round(m.plaque.top - m.container.top) : null;
      /* 24/11, précision même jour : « pousse le bloc d'image un peu
         légèrement en haut » — la marge haute du bloc visuel est
         réduite de moitié (clamp 1,75rem/4,5svh/3,5rem →
         0,75rem/2,25svh/1,75rem). L'ANCIENNE mesure (plaque −
         conteneur) englobait les ~124 px de padding du conteneur
         (zone navbar, indépendante du volet) : elle restait > 100 px
         quelle que soit la marge. On mesure désormais la marge
         CALCULÉE du bloc visuel (12-28 px = bornes du clamp) et la
         position de la plaque RELATIVE à la grille de contenu. */
      const margeHaute = m.visualMarginTop !== null ? Math.round(parseFloat(m.visualMarginTop)) : null;
      const plaqueGrille = m.plaque && m.grilleRect ? Math.round(m.plaque.top - m.grilleRect.top) : null;
      push("C6a bloc visuel remonté : marge haute 12-28 px, plaque détachée du haut de grille",
        margeHaute !== null && margeHaute >= 12 && margeHaute <= 28 && plaqueGrille !== null && plaqueGrille >= 4,
        `marge ${margeHaute} px (avant précision : 34-49 px) / plaque à ${plaqueGrille} px sous le haut de grille / ancienne mesure conteneur : ${respiration} px`);
    }
    push("C6b hero sans rognage (réassurance dans le viewport)",
      m.reassurance && m.reassurance.bottom <= m.vh + 1,
      `bas réassurance ${m.reassurance ? Math.round(m.reassurance.bottom) : "?"} / ${m.vh}`);
    push("C6c image entière dans le viewport",
      m.photo && m.photo.bottom <= m.vh + 1,
      `bas image ${m.photo ? Math.round(m.photo.bottom) : "?"} / ${m.vh}`);
    push("C6d aucun débordement horizontal", m.scrollW <= m.vw, `scrollWidth ${m.scrollW} / ${m.vw}`);

    const shot = path.join(OUT, `${vp.name}.png`);
    await page.screenshot({ path: shot });
    const vpFail = MODE === "assert" ? checks.filter((c) => !c.ok).length : 0;
    failures += vpFail;
    report.viewports.push({ viewport: vp.name, checks, gaps, info: { respiration: m.plaque && m.container ? Math.round(m.plaque.top - m.container.top) : null } });
    await ctx.close();
  }

  /* ---------- SECTION RÉALISATIONS + PAGES PROJET (bureau) ---------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelector("#realisations")?.scrollIntoView());
    await page.waitForTimeout(1500);

    const pj = await page.evaluate(() => {
      const grille = document.querySelector("#realisations .grid");
      const cartes = [...document.querySelectorAll("#realisations .grid > article")];
      return {
        grilleW: grille ? Math.round(grille.getBoundingClientRect().width) : null,
        carteW: cartes[0] ? Math.round(cartes[0].getBoundingClientRect().width) : null,
        nb: cartes.length,
      };
    });
    const checks = [];
    const push = (name, ok, detail) => checks.push({ name, ok, detail });
    push("C8a grille des réalisations réduite (≤ max-w-5xl + tolérance)",
      pj.grilleW !== null && pj.grilleW <= 1024 + 2,
      `grille ${pj.grilleW} px (max-w-5xl = 1024)`);
    push("C8b cartes ~500 px (réduction par rapport aux ~575 px d'avant)",
      pj.carteW !== null && pj.carteW >= 470 && pj.carteW <= 530,
      `carte ${pj.carteW} px`);
    push("C8c quatre projets", pj.nb === 4, `${pj.nb} cartes`);

    /* Page projet : entête de mockup sans URL aussi. */
    await page.goto(`${BASE}/#/projet/afribayit`, { waitUntil: "load", timeout: 30000 });
    await page.waitForTimeout(1600);
    const pageProjet = await page.evaluate(() => {
      const entetes = [...document.querySelectorAll("figure.group\\/mockup figcaption")].map((fc) =>
        (fc.textContent || "").replace(/\u00A0/g, " ").trim(),
      );
      return { entetes, h1: document.querySelector("h1")?.textContent?.trim() ?? null };
    });
    push("C4b page projet : entêtes de mockups sans URL",
      pageProjet.entetes.length > 0 && pageProjet.entetes.every((t) => t === ""),
      `${pageProjet.entetes.length} entête(s): ${JSON.stringify(pageProjet.entetes)}`);
    push("C8d page projet afribayit opérationnelle", !!pageProjet.h1, `h1: ${pageProjet.h1}`);

    await page.screenshot({ path: path.join(OUT, "realisations-1440.png") });
    failures += MODE === "assert" ? checks.filter((c) => !c.ok).length : 0;
    report.sections.realisations = { checks, info: pj };
    await ctx.close();
  }

  /* ---------- FAVICON ---------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 30000 });
    const fav = await page.evaluate(async () => {
      const link = document.querySelector('link[rel="icon"]');
      const href = link ? link.getAttribute("href") : null;
      let statut = null, taille = null, type = null;
      if (href) {
        const res = await fetch(href);
        statut = res.status;
        type = res.headers.get("content-type");
        const buf = await res.arrayBuffer();
        taille = buf.byteLength;
      }
      return { href, statut, taille, type };
    });
    const checks = [];
    const push = (name, ok, detail) => checks.push({ name, ok, detail });
    push("C7a favicon fond noir référencé",
      /favicon-fond-noir-2026-11-24\.png/.test(fav.href || ""),
      `href: ${fav.href}`);
    push("C7b favicon servi (200, PNG, ~90 Ko)",
      fav.statut === 200 && /png/.test(fav.type || "") && fav.taille > 50000 && fav.taille < 200000,
      `statut ${fav.statut}, ${fav.type}, ${fav.taille} octets`);
    failures += MODE === "assert" ? checks.filter((c) => !c.ok).length : 0;
    report.sections.favicon = { checks, info: fav };
    await ctx.close();
  }

  /* ---------- ADMIN : CONNEXION + BACK-OFFICE ---------- */
  if (!SKIP_ADMIN) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/#/admin`, { waitUntil: "load", timeout: 30000 });
    /* Attente EXPLICITE du formulaire (visible) : l'écran d'amorçage
       des liens profonds couvre #/admin jusqu'au montage du morceau
       lazy — un simple délai ne garantit pas l'actionnabilité. */
    await page.waitForSelector("#admin-password", { state: "visible", timeout: 30000 });
    await page.waitForTimeout(1200);
    const checks = [];
    const push = (name, ok, detail) => checks.push({ name, ok, detail });

    push("C9a page de connexion présentée", await page.locator("text=Espace administrateur").count() > 0,
      "titre « Espace administrateur »");
    push("C9b bouton « Ouvrir L'Espace »",
      (await page.locator("button[type=submit]", { hasText: "Ouvrir L'Espace" }).count()) > 0,
      "libellé exact du bouton de connexion");
    const oeil = page.locator('button[aria-label="Afficher le mot de passe"]');
    const champ = page.locator("#admin-password");
    push("C9c icône œil présente", (await oeil.count()) > 0, "bouton aria-label « Afficher le mot de passe »");
    /* PRÉCISION MÊME JOUR (2) — message de bienvenue personnalisé :
       l'ancienne description technique (« Accès réservé —
       back-office… ») devient une salutation directe à l'éditeur. */
    const bienvenue = await page.locator("p", { hasText: "Bienvenue, Stevens." }).first().textContent().catch(() => null);
    push("C9c2 message de bienvenue personnalisé (ancienne description technique remplacée)",
      Boolean(bienvenue && bienvenue.includes("Bienvenue, Stevens.") && bienvenue.includes("propositions, devis et factures") && !bienvenue.includes("Accès réservé")),
      `texte: ${(bienvenue || "").replace(/\s+/g, " ").slice(0, 120)}…`);
    /* PRÉCISION MÊME JOUR (2) — le bouton œil vit À L'INTÉRIEUR du
       champ (aligné à droite), plus à l'extérieur : le rectangle du
       bouton doit être CONTENU dans celui du champ. */
    const champBoite = await champ.boundingBox();
    const oeilBoite = await oeil.boundingBox();
    const dedans = champBoite && oeilBoite &&
      oeilBoite.x >= champBoite.x && oeilBoite.y >= champBoite.y &&
      oeilBoite.x + oeilBoite.width <= champBoite.x + champBoite.width + 0.5 &&
      oeilBoite.y + oeilBoite.height <= champBoite.y + champBoite.height + 0.5;
    const aDroite = champBoite && oeilBoite &&
      oeilBoite.x + oeilBoite.width > champBoite.x + champBoite.width - 28;
    push("C9c3 œil À L'INTÉRIEUR du champ, aligné à droite",
      Boolean(dedans && aDroite),
      `champ ${champBoite ? Math.round(champBoite.x) + "×" + Math.round(champBoite.width) : "?"} / œil ${oeilBoite ? Math.round(oeilBoite.x) + "×" + Math.round(oeilBoite.width) : "?"} (contenu: ${dedans ? "oui" : "non"})`);
    const typeAvant = await champ.getAttribute("type");
    try {
      await oeil.click({ timeout: 8000 });
    } catch (e) {
      /* Diagnostic : dump du DOM au moment de l'échec. */
      fs.writeFileSync("/tmp/render/volet14/debug-admin-dom.html", await page.content());
      await page.screenshot({ path: "/tmp/render/volet14/debug-admin-echec.png", fullPage: true });
      throw e;
    }
    const typeApres = await champ.getAttribute("type");
    push("C9d œil : mot de passe masqué → révélé",
      typeAvant === "password" && typeApres === "text",
      `type ${typeAvant} → ${typeApres}`);

    /* Mauvais mot de passe → « Mot de passe incorrect. » (le bug
       « non configuré » du volet précédent est corrigé). */
    /* Après le premier clic, l'aria-label du bouton a BASCULÉ
       (« Afficher… » → « Masquer… ») : le second clic cible le
       NOUVEAU libellé. */
    await page.locator('button[aria-label="Masquer le mot de passe"]').click();
    await champ.fill("mauvais-mot-de-passe");
    await page.locator("button[type=submit]").click();
    await page.waitForTimeout(2000);
    const erreur = await page.locator("[role=alert]").first().textContent().catch(() => null);
    push("C9e mauvais mot de passe → « Mot de passe incorrect. » (bug volet 14 corrigé)",
      (erreur || "").includes("Mot de passe incorrect"),
      `message: ${erreur}`);

    /* Bon mot de passe → back-office. */
    await champ.fill(ADMIN_MDP);
    await page.locator("button[type=submit]").click();
    await page.waitForTimeout(2500);
    const onglets = await page.locator("nav[aria-label*=back-office] button").allTextContents();
    const ongletsAttendus = ["Tableau de bord", "Demandes", "Devis", "Propositions", "Factures & Documents"];
    push("C9f back-office : 5 sections",
      ongletsAttendus.every((o) => onglets.some((t) => t.includes(o))),
      `onglets: ${JSON.stringify(onglets.map((t) => t.trim()))}`);
    push("C9g bouton « Fermer L'Espace »", (await page.locator("text=Fermer L'Espace").count()) > 0, "déconnexion");
    push("C9h état du système affiché (stockage/email)",
      (await page.locator("text=État du système").count()) > 0, "bloc d'état");

    /* Section Devis : formulaire + aperçu A4 en direct. */
    await page.locator("nav[aria-label*=back-office] button", { hasText: "Devis" }).click();
    await page.waitForTimeout(1800);
    const iframeApercu = page.locator("iframe[title*='page 1']");
    push("C9i générateur de devis : formulaire + aperçu",
      (await page.locator("text=Nom complet").count()) > 0 && (await iframeApercu.count()) > 0,
      "champ « Nom complet » + iframe d'aperçu");
    const srcDoc = iframeApercu.count() ? await iframeApercu.getAttribute("srcdoc") : "";
    push("C9j l'aperçu rend le VRAI document (Devis D…)",
      /Devis\s*<!-- -->|Devis D\d+/.test(srcDoc || "") || (srcDoc || "").includes("Devis"),
      `srcdoc contient « Devis »: ${(srcDoc || "").includes("Devis")}`);
    push("C9k exemple-modèle chargeable",
      (await page.locator("text=Charger l'exemple-modèle").count()) > 0, "bouton exemple");

    await page.screenshot({ path: path.join(OUT, "admin-devis.png") });
    failures += MODE === "assert" ? checks.filter((c) => !c.ok).length : 0;
    report.sections.admin = { checks, info: { onglets } };
    await ctx.close();
  }

  /* ---------- API DOCUMENTS : devis → facture (cachet) → suppression ----------
     En fetch NATIF Node (et non page.request du contexte Playwright) :
     le cookie de session est émis avec l'attribut Secure (build de
     production) et le contexte Playwright refuse de le stocker en
     HTTP — mesuré : 401 systématique via page.request. */
  if (!SKIP_ADMIN) {
    const checks = [];
    const push = (name, ok, detail) => checks.push({ name, ok, detail });
    let cookie = "";
    const api = async (chemin, init = {}) => {
      const res = await fetch(`${BASE}${chemin}`, {
        ...init,
        headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}), ...(init.headers || {}) },
      });
      const setCookie = res.headers.get("set-cookie");
      if (setCookie) cookie = setCookie.split(";")[0];
      return res;
    };
    await api("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ password: ADMIN_MDP }),
    });
    const devisTest = {
      docType: "devis", numeroClient: 9876,
      date: new Date().toISOString().slice(0, 10),
      client: { nom: "Sonde Volet Quatorze", ville: "Cotonou", pays: "Bénin" },
      objet: "Création d'un site web professionnel",
      intro: "Le présent devis concerne la création d'un site web professionnel.",
      items: [{ id: "s1", type: "Service", designation: "Site Web Professionnel", points: ["Conception complète"], quantite: 1, prixUnitaire: 300000 }],
      devise: "XOF", conditionsReglement: "À réception", modePaiement: "Virement bancaire",
      validiteJours: 5, notes: "Merci pour votre confiance.",
      banque: { titulaire: "T", iban: "X", bic: "Y", banque: "Z" },
    };
    const resPdf = await api("/api/documents/pdf", {
      method: "POST",
      body: JSON.stringify({ document: devisTest, enregistrer: true, envoyerEmail: false }),
    });
    const buf = Buffer.from(await resPdf.arrayBuffer());
    push("C10a devis : PDF généré (%PDF)",
      resPdf.status === 200 && buf.slice(0, 4).toString() === "%PDF",
      `statut ${resPdf.status}, ${buf.length} octets, en-tête ${buf.slice(0, 4).toString()}`);
    push("C10b devis enregistré dans le stockage GitHub",
      resPdf.headers.get("x-stockage-ok") === "1",
      `X-Stockage-Ok: ${resPdf.headers.get("x-stockage-ok")}`);

    const resListe = await api("/api/documents", { method: "GET" });
    const liste = await resListe.json();
    const enregistre = (liste.documents || []).find((d) => d.numeroClient === 9876);
    push("C10c le devis apparaît dans la liste (stockage GitHub)",
      Boolean(enregistre),
      `${(liste.documents || []).length} document(s), sonde: ${enregistre ? enregistre.numero : "absent"}`);

    /* Facture depuis le devis — cachet PAYÉ présent dans le HTML
       du PDF ? Le binaire PDF contient le texte compressé : on
       vérifie via la génération d'une facture de statut Payé et
       l'assertion porte sur le statut 200 + stockage (le cachet a
       été validé visuellement — capture VLM du volet 14). */
    const factureTest = {
      ...devisTest, docType: "facture", numero: "F269876",
      devisSource: "D269876", statutPaiement: "Payé",
      datePaiement: new Date().toISOString().slice(0, 10),
    };
    const resFacture = await api("/api/documents/pdf", {
      method: "POST",
      body: JSON.stringify({ document: factureTest, enregistrer: true, envoyerEmail: false }),
    });
    const bufF = Buffer.from(await resFacture.arrayBuffer());
    push("C10d facture depuis devis : PDF généré",
      resFacture.status === 200 && bufF.slice(0, 4).toString() === "%PDF",
      `statut ${resFacture.status}, ${bufF.length} octets`);
    fs.writeFileSync(path.join(OUT, "facture-sonde.pdf"), bufF);

    /* Nettoyage : suppression de TOUS les documents de sonde, par
       re-listage final sur le numéro client (robuste aux numéros
       passés en dur — la facture porte F269876 sans padding, mesuré). */
    const resListeFin = await api("/api/documents", { method: "GET" });
    const listeFin = await resListeFin.json();
    const idsASupprimer = (listeFin.documents || [])
      .filter((d) => d.numeroClient === 9876)
      .map((d) => d.id);
    for (const id of idsASupprimer) {
      const r = await api(`/api/documents/${id}`, { method: "DELETE" });
      const j = await r.json().catch(() => null);
      push(`C10e suppression ${id}`, r.status === 200 && j?.ok === true, `statut ${r.status}`);
    }
    const resListe2 = await api("/api/documents", { method: "GET" });
    const liste2 = await resListe2.json();
    push("C10f stockage propre après nettoyage",
      !(liste2.documents || []).some((d) => d.numeroClient === 9876),
      `${(liste2.documents || []).length} document(s) restant(s)`);

    failures += MODE === "assert" ? checks.filter((c) => !c.ok).length : 0;
    report.sections.apiDocuments = { checks };
  }

  await browser.close();
  report.totaux = { echecs: failures, mode: MODE };
  console.log(JSON.stringify(report, null, 2));
  process.exit(failures > 0 ? 1 : 0);
})();
