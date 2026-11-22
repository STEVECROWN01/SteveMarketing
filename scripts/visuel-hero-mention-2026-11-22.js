/**
 * CONTRÔLE VISUEL ET GÉOMÉTRIQUE — MENTION « À QUI JE VENDS » EN
 * ITALIQUE À LA SUITE DE LA DESCRIPTION + SUPPRESSION DES BADGES
 * (volet 11 de l'audit intégral, 22/11/2026).
 *
 * La mention « — PMEs / PROFESSIONNELS » (italic, propre ligne dans
 * le paragraphe de description) remplace les deux badges épinglés du
 * volet 10 (supprimés). Le point sensible : le hero doit rester
 * ENTIÈREMENT visible sans défilement sur toutes les tailles (la
 * section est min-h-svh + overflow-hidden — tout dépassement serait
 * ROGNÉ, invisible) ; la mention ajoute une ligne de texte sous la
 * description, d'où une mesure AVANT/après du bas de la barre de
 * réassurance.
 *
 * Deux modes :
 *  - `node script.js mesure` : mesures seules (aucune assertion) —
 *    à lancer sur le build AVANT modification pour le point de
 *    référence ;
 *  - `node script.js` (défaut) : assertions complètes.
 *
 * Pour 6 viewports représentatifs (mobile court → bureau large) :
 *  C1 — aucun débordement horizontal du document ;
 *  C2 — AUCUN badge épinglé restant (sélecteurs .hero-anim-badge--*)
 *       ni pilule .hero-badge dans le DOM ;
 *  C3 — la mention italique existe EXACTEMENT une fois, DANS le
 *       paragraphe .hero-desc, texte exact « — PMEs / PROFESSIONNELS »,
 *       rendue en italique, et posée sur sa propre ligne (bord
 *       gauche de la boîte aligné sur le paragraphe) ;
 *  C4 — le hero tient dans le viewport : bas de la barre de
 *       réassurance (dernier élément de la colonne texte) ≤ hauteur
 *       du viewport (tolérance 1 px — au-delà, la barre est rognée
 *       par overflow-hidden) ;
 *  C5 — informatif : géométrie de la mention (position, taille) et
 *       marge entre description et mention.
 *
 * Sortie : /tmp/render/mention/<viewport>.png + rapport JSON sur
 * stdout + code de sortie non nul au premier échec C1-C4.
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = "http://127.0.0.1:3100";
const OUT = "/tmp/render/mention";
const MODE = process.argv[2] === "mesure" ? "mesure" : "assert";
const VIEWPORTS = [
  { name: "mobile-court-360x640", width: 360, height: 640 },
  { name: "mobile-390x844", width: 390, height: 844 },
  { name: "tablette-768x1024", width: 768, height: 1024 },
  { name: "bureau-etroit-1024x768", width: 1024, height: 768 },
  { name: "bureau-1280x800", width: 1280, height: 800 },
  { name: "bureau-1440x900", width: 1440, height: 900 },
];
const MENTION = "— PMEs / PROFESSIONNELS";

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const report = { mode: MODE, base: BASE, date: new Date().toISOString(), viewports: [] };
  let failures = 0;

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 30000 });
    await page.waitForTimeout(4600); // chorégraphie complète des épinglés

    const m = await page.evaluate(() => {
      const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: r.width, h: r.height };
      };
      const p = document.querySelector("p.hero-desc");
      const em = p ? p.querySelector("em") : null;
      // Dernier élément de la colonne texte (order-3) : le Reveal qui
      // enveloppe la barre de réassurance.
      const col = document.querySelector("#hero .order-3");
      const reassurance = col ? col.lastElementChild : null;
      return {
        vw: window.innerWidth,
        vh: window.innerHeight,
        scrollW: document.documentElement.scrollWidth,
        badgesAnciens: document.querySelectorAll("[class*='hero-anim-badge']").length,
        pilules: document.querySelectorAll(".hero-badge").length,
        p: rect(p),
        em: rect(em),
        emText: em ? em.textContent.trim() : null,
        emItalic: em ? getComputedStyle(em).fontStyle : null,
        emOwnLine: null, // calculé hors evaluate (comparaison des gauches)
        reassuranceBottom: reassurance ? rect(reassurance).bottom : null,
      };
    });
    m.emOwnLine = m.p && m.em ? Math.abs(m.em.left - m.p.left) < 2 : false;
    m.margeDescMention = m.p && m.em ? Math.round(m.em.top - m.p.top) : null;

    const checks = [];
    const push = (name, ok, detail) => checks.push({ name, ok, detail });
    push("C1 aucun débordement horizontal", m.scrollW <= m.vw, `scrollWidth ${m.scrollW} / viewport ${m.vw}`);
    push("C2 aucun badge épinglé restant", m.badgesAnciens === 0 && m.pilules === 0,
      `hero-anim-badge ${m.badgesAnciens}, .hero-badge ${m.pilules}`);
    push("C3 mention italique exacte, une fois, dans la description",
      m.emText === MENTION && m.emItalic === "italic" && m.emOwnLine,
      `texte « ${m.emText} », fontStyle ${m.emItalic}, propre ligne ${m.emOwnLine}`);
    if (m.reassuranceBottom !== null) {
      push("C4 barre de réassurance entière dans le viewport", m.reassuranceBottom <= m.vh + 1,
        `bas ${Math.round(m.reassuranceBottom)} / hauteur ${m.vh} — marge ${Math.round(m.vh - m.reassuranceBottom)} px`);
    } else {
      push("C4 barre de réassurance trouvée", false, "sélecteur #hero .order-3 > dernier enfant introuvable");
    }

    const shot = path.join(OUT, `${vp.name}.png`);
    await page.screenshot({ path: shot });
    const vpFail = MODE === "assert" ? checks.filter((c) => !c.ok).length : 0;
    failures += vpFail;
    report.viewports.push({
      viewport: vp.name,
      checks,
      info: {
        margeSousViewportPx: m.reassuranceBottom !== null ? Math.round(m.vh - m.reassuranceBottom) : null,
        margeDescMentionPx: m.margeDescMention,
        mention: m.em ? { w: Math.round(m.em.w), h: Math.round(m.em.h) } : null,
      },
      screenshot: shot,
    });
    await page.close();
  }

  await browser.close();
  report.totaux = { echecs: failures, mode: MODE };
  console.log(JSON.stringify(report, null, 2));
  process.exit(failures > 0 ? 1 : 0);
})();
