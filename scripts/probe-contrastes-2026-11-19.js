/**
 * SONDE CIBLÉE 2026-11-19 — confirme en live les suspicions de l'étape a11y :
 *   1. Contraste des ÉLÉMENTS INTERACTIFS sur les 12 routes (boutons,
 *      entrées) — sans cap d'échantillonnage (l'étape a11y s'arrêtait à
 *      80 éléments : le bouton vert du formulaire de devis, profond dans
 *      le DOM, y avait échappé).
 *   2. Textes d'erreur du LeadForm (#ea384c, 12 px) après soumission vide.
 *   3. Focus des entrées par variante (avant/après focus) + mystère du
 *      outlineColor « null » (chaîne brute).
 *   4. Mouvement réduit — cette fois avec l'ÉMULATION Playwright
 *      (reducedMotion: "reduce") : l'étape a11y l'avait mesuré sans
 *      émulation (Lenis actif = comportement normal attendu).
 *   5. iframe Calendly sur #/reserver-un-appel : attendre jusqu'à 10 s
 *      (l'embed officiel construit l'iframe en 1-3 s) puis vérifier title.
 */

const { chromium, devices } = require("playwright");
const fs = require("fs");

const BASE = "http://127.0.0.1:3100";
const OUT = { interactifs: [], erreurs: [], focusInputs: [], outlineBrut: null, reducedMotion: null, calendly: null };

const ROUTES = [
  "#/accueil", "#/methode", "#/referencement-seo", "#/publicite-meta-ads",
  "#/realisations", "#/projet/mrsteveenglish", "#/a-propos", "#/contact",
  "#/demander-un-devis", "#/audit-gratuit", "#/reserver-un-appel", "#/mentions-legales",
];

const UTILS = `
function pc(s){ if(!s) return null; const m=s.match(/rgba?\\(([^)]+)\\)/); if(!m) return null; const p=m[1].split(',').map(Number); return {r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1}; }
function lin(c){ c/=255; return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4); }
function L(o){ return 0.2126*lin(o.r)+0.7152*lin(o.g)+0.0722*lin(o.b); }
function cr(a,b){ const x=L(a),y=L(b); return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05); }
function bg(el){ let n=el; while(n&&n!==document.documentElement){ const c=pc(getComputedStyle(n).backgroundColor); if(c&&c.a>=0.95) return c; n=n.parentElement; } return pc(getComputedStyle(document.documentElement).backgroundColor)||{r:255,g:255,b:255,a:1}; }
`;

async function open(context, hash, waitUntil = "load") {
  const page = await context.newPage();
  await page.goto(`${BASE}/${hash}`, { waitUntil, timeout: 25000 });
  await page.waitForFunction(() => document.querySelector("main#contenu-principal h1"), null, { timeout: 15000 });
  // LEÇON (2026-11-19) : attendre la bascule du routeur (~1 s) — sinon on
  // mesure l'accueil au lieu de la page du fragment.
  await page.waitForTimeout(1200);
  if (hash !== "#/accueil") {
    await page
      .waitForFunction(
        (home) => {
          const h = document.querySelector("main#contenu-principal h1");
          return h && h.textContent && h.textContent.trim() !== home;
        },
        "Je crée des Sites Web Professionnels qui Génèrent des Ventes",
        { timeout: 6000 },
      )
      .catch(() => {});
  }
  await page.waitForTimeout(400);
  return page;
}

(async () => {
  const browser = await chromium.launch();

  /* ---- 1. interactifs : boutons + entrées, contraste, 12 routes ---- */
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  for (const hash of ROUTES) {
    const page = await open(ctx, hash);
    const res = await page.evaluate((u) => {
      const { pc: pcF, cr: crF, bg: bgF } = new Function(
        u + "; return { pc: pc, cr: cr, bg: bg };",
      )();
      const seen = [];
      const sels = "button, a[class*='btn'], [role='button'], input:not([type='hidden']), select, textarea";
      for (const el of document.querySelectorAll(sels)) {
        if (el.closest("[aria-hidden='true']")) continue;
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden") continue;
        const r = el.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) continue;
        const tag = el.tagName.toLowerCase();
        if (tag === "input" || tag === "select" || tag === "textarea") {
          const b = pcF(cs.backgroundColor);
          const t = pcF(cs.color);
          if (b) seen.push({ type: "champ", nom: el.name || el.id || el.getAttribute("aria-label") || el.placeholder?.slice(0, 20), fond: `rgb(${b.r},${b.g},${b.b})`, ratioFond: b.a > 0.95 ? Math.round(crF(b, { r: 255, g: 255, b: 255 }) * 100) / 100 : null });
          continue;
        }
        const isLink = tag === "a";
        const t = pcF(cs.color);
        const b = bgF(el);
        const size = parseFloat(cs.fontSize);
        const bold = parseInt(cs.fontWeight, 10) >= 700;
        const large = size >= 24 || (size >= 18.66 && bold);
        const need = large ? 3 : 4.5;
        const ratio = t ? Math.round(crF(t, b) * 100) / 100 : null;
        const txt = el.textContent?.trim().slice(0, 32) || el.getAttribute("aria-label")?.slice(0, 32);
        if (ratio !== null && ratio < need)
          seen.push({ type: "bouton", texte: txt, ratio, besoin: need, taille: size, couleur: cs.color, fond: `rgb(${b.r},${b.g},${b.b})`, fondBrut: getComputedStyle(el).backgroundColor });
      }
      return seen;
    }, UTILS);
    OUT.interactifs.push({ route: hash, defauts: res.filter((x) => x.type === "bouton"), champs: res.filter((x) => x.type === "champ") });
    console.log(`${hash.padEnd(26)} défauts boutons: ${res.filter((x) => x.type === "bouton").length} | champs inspectés: ${res.filter((x) => x.type === "champ").length}`);
    for (const d of res.filter((x) => x.type === "bouton"))
      console.log(`   ✗ « ${d.texte} » ${d.ratio}:1 (besoin ${d.besoin}) ${d.couleur} sur ${d.fond} — ${d.taille}px`);
    await page.close();
  }

  /* ---- 2. erreurs #ea384c après soumission vide (3 variantes) ---- */
  for (const v of ["#/demander-un-devis", "#/contact", "#/audit-gratuit"]) {
    const page = await open(ctx, v);
    const btn = page.locator("form button[type='submit'], form > button:last-of-type").first();
    // garde anti-spam : > 3,6 s après le montage → les VRAIES erreurs de
    // validation par champ (et non le message « Prenez quelques instants »)
    await page.waitForTimeout(3600);
    await btn.evaluate((n) => n.click());
    await page.waitForTimeout(700);
    const erreurs = await page.evaluate((u) => {
      const { pc: pcF, cr: crF, bg: bgF } = new Function(u + "; return { pc: pc, cr: cr, bg: bg };")();
      const out = [];
      for (const p of document.querySelectorAll("form [role='alert'], form p[id*='error']")) {
        const txt = p.textContent?.trim();
        if (!txt || !p.getBoundingClientRect().height) continue;
        const cs = getComputedStyle(p);
        const t = pcF(cs.color);
        const b = bgF(p);
        const size = parseFloat(cs.fontSize);
        const need = size >= 24 ? 3 : 4.5;
        out.push({ texte: txt.slice(0, 40), couleur: cs.color, fond: `rgb(${b.r},${b.g},${b.b})`, ratio: t ? Math.round(crF(t, b) * 100) / 100 : null, besoin: need, taille: size });
      }
      return out.slice(0, 6);
    }, UTILS);
    OUT.erreurs.push({ route: v, erreurs });
    for (const e of erreurs)
      console.log(`   ${v} erreur « ${e.texte.slice(0, 30)} » ${e.ratio}:1 (besoin ${e.besoin}) ${e.couleur} sur ${e.fond} ${e.taille}px`);
    await page.close();
  }

  /* ---- 3. focus des entrées par variante + outline brut ---- */
  for (const v of ["#/demander-un-devis", "#/contact", "#/audit-gratuit"]) {
    const page = await open(ctx, v);
    const first = page.locator("form input:not([type='hidden']):not([tabindex='-1'])").first();
    const avant = await first.evaluate((n) => {
      const cs = getComputedStyle(n);
      return { border: cs.borderColor, outline: `${cs.outlineStyle}|${cs.outlineWidth}|${cs.outlineColor}`, shadow: cs.boxShadow.slice(0, 60) };
    });
    await first.focus();
    const apres = await first.evaluate((n) => {
      const cs = getComputedStyle(n);
      return { border: cs.borderColor, outline: `${cs.outlineStyle}|${cs.outlineWidth}|${cs.outlineColor}`, shadow: cs.boxShadow.slice(0, 80) };
    });
    OUT.focusInputs.push({ route: v, avant, apres });
    console.log(`${v} focus: border ${avant.border} → ${apres.border} | outline ${apres.outline} | shadow ${apres.shadow}`);
    await page.close();
  }

  /* mystère outlineColor null : chaîne brute sur un lien d'en-tête focus */
  {
    const page = await open(ctx, "#/accueil");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    OUT.outlineBrut = await page.evaluate(() => {
      const el = document.activeElement;
      const cs = getComputedStyle(el);
      return {
        el: el.textContent?.trim().slice(0, 26),
        outlineStyle: cs.outlineStyle,
        outlineWidth: cs.outlineWidth,
        outlineColor: cs.outlineColor,
        outlineOffset: cs.outlineOffset,
      };
    });
    console.log("outline brut:", JSON.stringify(OUT.outlineBrut));
    await page.close();
  }
  await ctx.close();

  /* ---- 4. mouvement réduit AVEC émulation ---- */
  {
    const ctxRM = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    const page = await ctxRM.newPage();
    await page.goto(`${BASE}/#/accueil`, { waitUntil: "load", timeout: 25000 });
    await page.waitForFunction(() => document.querySelector("main#contenu-principal h1"), null, { timeout: 15000 });
    await page.waitForTimeout(900);
    OUT.reducedMotion = await page.evaluate(() => ({
      mediaQuery: matchMedia("(prefers-reduced-motion: reduce)").matches,
      lenisActive: document.documentElement.classList.contains("lenis"),
      htmlClass: document.documentElement.className,
    }));
    console.log("mouvement réduit (émulé):", JSON.stringify(OUT.reducedMotion));
    await ctxRM.close();
  }

  /* ---- 5. iframe Calendly (attente 10 s, contexte dédié) ---- */
  {
    const ctxC = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await open(ctxC, "#/reserver-un-appel");
    try {
      await page.waitForSelector("main iframe", { timeout: 10000 });
    } catch (e) {}
    await page.waitForTimeout(1500);
    OUT.calendly = await page.evaluate(() =>
      [...document.querySelectorAll("iframe")].map((f) => ({
        title: f.getAttribute("title"),
        src: (f.getAttribute("src") || f.getAttribute("data-url") || "").slice(0, 70),
        visible: f.getBoundingClientRect().width > 10,
      })),
    );
    console.log("iframes #/reserver-un-appel:", JSON.stringify(OUT.calendly));
    await page.close();
    await ctxC.close();
  }

  await browser.close();
  fs.writeFileSync(__dirname + "/probe-contrastes-2026-11-19.json", JSON.stringify(OUT, null, 2));
  console.log("JSON : scripts/probe-contrastes-2026-11-19.json");
})().catch((e) => {
  console.error("ÉCHEC SONDE:", e);
  process.exit(1);
});
