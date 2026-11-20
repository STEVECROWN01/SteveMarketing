/**
 * CONTRÔLE VISUEL ET GÉOMÉTRIQUE — BADGES « À QUI JE VENDS » DU HERO
 * (volet 10 de l'audit intégral, 20/11/2026).
 *
 * Pour 6 viewports représentatifs (du mobile court au bureau large) :
 *  1. capture d'écran du premier écran, chorégraphie complète (les
 *     badges se posent à 2,6 s et 3,2 s, durée 0,7 s chacune) ;
 *  2. contrôles géométriques, en pixels réels :
 *     C1 — aucun débordement horizontal du document ;
 *     C2 — chaque badge entièrement DANS le viewport (rien de coupé) ;
 *     C3 — les badges ne chevauchent NI le mockup navigateur, NI le
 *          mockup smartphone, NI la mention « Stevens Akpovi » ;
 *     C4 — sur bureau (≥ 1024 px), les badges n'empîtent pas sur la
 *          colonne de texte (h1 + description) ;
 *     C5 — informatif : fraction de chaque badge posée SUR l'image
 *          (cible de l'éditeur : « peut couvrir l'image juste à
 *          moitié » — attendu entre 20 % et 80 %).
 *
 * Sortie : /tmp/render/badges/<viewport>.png + rapport JSON sur
 * stdout + code de sortie non nul au premier échec C1-C4.
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = "http://127.0.0.1:3100";
const OUT = "/tmp/render/badges";
const VIEWPORTS = [
  { name: "mobile-court-360x640", width: 360, height: 640 },
  { name: "mobile-390x844", width: 390, height: 844 },
  { name: "tablette-768x1024", width: 768, height: 1024 },
  { name: "bureau-etroit-1024x768", width: 1024, height: 768 },
  { name: "bureau-1280x800", width: 1280, height: 800 },
  { name: "bureau-1440x900", width: 1440, height: 900 },
];

/** Aire d'intersection de deux boîtes {left,top,right,bottom}. */
function interArea(a, b) {
  if (!a || !b) return 0;
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return w > 0 && h > 0 ? w * h : 0;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const report = { base: BASE, date: new Date().toISOString(), viewports: [] };
  let failures = 0;

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 30000 });
    await page.waitForTimeout(4600); // fin de la chorégraphie des épinglés

    const m = await page.evaluate(() => {
      const box = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          left: r.left, top: r.top, right: r.right, bottom: r.bottom,
          w: r.width, h: r.height,
        };
      };
      const badges = [...document.querySelectorAll("[class*='hero-anim-badge--']")].map((el) => ({
        text: (el.querySelector(".hero-badge")?.textContent || "").trim(),
        box: box(el),
      }));
      const image = box(
        document.querySelector(".hero-visual figure img") // 1re figure (bureau) ou 2e (mobile) — la VISIBLE :
          ? (document.querySelector(".hero-visual figure.lg\\:block") && window.matchMedia("(min-width: 1024px)").matches
              ? document.querySelector(".hero-visual figure.lg\\:block img")
              : document.querySelector(".hero-visual figure.lg\\:hidden img")) : null
      );
      return {
        vw: window.innerWidth,
        vh: window.innerHeight,
        scrollW: document.documentElement.scrollWidth,
        badges,
        image,
        browserMockup: box(document.querySelector(".hero-anim-browser")),
        phoneMockup: box(document.querySelector(".hero-anim-phone")),
        nameTag: box(document.querySelector(".hero-anim-name")),
        h1: box(document.querySelector("#hero h1")),
        desc: box(document.querySelector("p.hero-desc")),
      };
    });

    const checks = [];
    const push = (name, ok, detail) => checks.push({ name, ok, detail });

    // C1 — débordement horizontal
    push("C1 aucun débordement horizontal", m.scrollW <= m.vw,
      `scrollWidth ${m.scrollW} / viewport ${m.vw}`);

    // C2 — badges entièrement dans le viewport
    for (const b of m.badges) {
      push(`C2 badge « ${b.text} » entier dans le viewport`,
        b.box.left >= 0 && b.box.right <= m.vw && b.box.top >= 0 && b.box.bottom <= m.vh,
        `x ${Math.round(b.box.left)}→${Math.round(b.box.right)} / ${m.vw}, y ${Math.round(b.box.top)}→${Math.round(b.box.bottom)} / ${m.vh}`);
    }

    // C3 — pas de chevauchement avec les épinglés existants
    for (const b of m.badges) {
      for (const [label, ref] of [["mockup navigateur", m.browserMockup], ["mockup smartphone", m.phoneMockup], ["mention nom", m.nameTag]]) {
        const a = interArea(b.box, ref);
        push(`C3 badge « ${b.text} » vs ${label}`, a < 50, `intersection ${Math.round(a)} px²`);
      }
    }

    // C4 — bureau : pas d'empîtement sur la colonne de texte
    if (vp.width >= 1024) {
      for (const b of m.badges) {
        for (const [label, ref] of [["titre h1", m.h1], ["description", m.desc]]) {
          const a = interArea(b.box, ref);
          push(`C4 badge « ${b.text} » vs ${label}`, a < 50, `intersection ${Math.round(a)} px²`);
        }
      }
    }

    // C5 — informatif : fraction du badge posée sur l'image
    const fractions = m.badges.map((b) => {
      const f = m.image ? interArea(b.box, m.image) / (b.box.w * b.box.h) : 0;
      return { text: b.text, surImage: Math.round(f * 100) + "%" };
    });

    const shot = path.join(OUT, `${vp.name}.png`);
    await page.screenshot({ path: shot });
    const vpFail = checks.filter((c) => !c.ok).length;
    failures += vpFail;
    report.viewports.push({ viewport: vp.name, checks, fractions, screenshot: shot });
    await page.close();
  }

  await browser.close();
  report.totaux = { echecs: failures };
  console.log(JSON.stringify(report, null, 2));
  process.exit(failures > 0 ? 1 : 0);
})();
