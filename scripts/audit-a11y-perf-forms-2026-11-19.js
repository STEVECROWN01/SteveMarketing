/**
 * AUDIT 2026-11-19 — SUITE ACCESSIBILITÉ + PERFORMANCE + FORMULAIRES
 * (suite de l'audit intégral 4e51251 et de l'application SEO f690a43)
 *
 * Dimensions NON couvertes par les audits précédents :
 *   A. Accessibilité WCAG 2.1/2.2 AA — landmarks, skip-link, cibles
 *      tactiles (2.5.8), contraste du texte (1.4.3), contraste du
 *      focus (1.4.11), visibilité du focus (2.4.7), iframes (4.1.2),
 *      aria des formulaires, honeypot.
 *   B. Performance — LCP, CLS, FCP, poids des ressources au
 *      chargement initial vs après préchargement à l'inactivité,
 *      dimensions explicites des images (protection CLS), attribut
 *      loading.
 *   C. Parcours formulaires (approfondi) — validation vide (erreurs
 *      reliées par aria-describedby), envoi valide avec réponse
 *      simulée (UX de succès), envoi valide réel dans un environnement
 *      sans base ni email (UX de l'échec honnête : message affiché,
 *      bouton débloqué).
 *
 * LEÇON OPS (héritée) : ce sandbox tue tout processus enfant à la fin
 * de CHAQUE commande — serveur standalone et audit vivent dans la
 * MÊME invocation shell. waitUntil "load" uniquement (jamais
 * networkidle : iframe Calendly).
 */

const { chromium, devices } = require("playwright");
const fs = require("fs");

const BASE = "http://127.0.0.1:3100";
const OUT = {
  meta: { date: "2026-11-19", base: BASE, build: "f690a43 local" },
  a11y: { routes: [], focus: [], iframes: [], reducedMotion: null },
  forms: [],
  perf: [],
};

const ROUTES = [
  { key: "accueil", hash: "#/accueil" },
  { key: "methode", hash: "#/methode" },
  { key: "referencement", hash: "#/referencement-seo" },
  { key: "publicite", hash: "#/publicite-meta-ads" },
  { key: "realisations", hash: "#/realisations" },
  { key: "projet", hash: "#/projet/mrsteveenglish" },
  { key: "aPropos", hash: "#/a-propos" },
  { key: "contact", hash: "#/contact" },
  { key: "devis", hash: "#/demander-un-devis" },
  { key: "audit", hash: "#/audit-gratuit" },
  { key: "appel", hash: "#/reserver-un-appel" },
  { key: "legal", hash: "#/mentions-legales" },
];

/* ---------- utilitaires contraste (dans le contexte page) ---------- */
const CONTRAST_UTILS = `
function toRgb(str){
  // Chrome récent sérialise oklab()/lab() PARTOUT (y compris la propriété
  // color) — conversion robuste par CANVAS : fillStyle accepte toute
  // couleur CSS, getImageData rend les octets sRGB.
  if(!toRgb._c){ toRgb._c=document.createElement('canvas'); toRgb._c.width=1; toRgb._c.height=1; toRgb._ctx=toRgb._c.getContext('2d', { willReadFrequently: true }); }
  var ctx=toRgb._ctx;
  ctx.clearRect(0,0,1,1);
  ctx.fillStyle='#000';
  try{ ctx.fillStyle=str; }catch(e){ return null; }
  if(ctx.fillStyle === '#000' && str !== '#000') return null;
  ctx.fillRect(0,0,1,1);
  var d=ctx.getImageData(0,0,1,1).data;
  return { r:d[0], g:d[1], b:d[2], a:d[3]/255 };
}
function parseColor(str){
  if(!str) return null;
  const m = str.match(/rgba?\\(([^)]+)\\)/);
  // Chrome 111+ sérialise les couleurs AVEC ALPHA en oklab()/lab() — passer
  // par la propriété color qui sérialise TOUJOURS en rgb() (leçon du 19/11 :
  // outline-color "oklab(0.92 / 0.5)" → null silencieux → contrastes non mesurés)
  if(!m) return str.indexOf('(') > 0 ? toRgb(str) : null;
  const p = m[1].split(',').map(Number);
  return { r:p[0], g:p[1], b:p[2], a: p.length>3 ? p[3] : 1 };
}
function lin(c){ c/=255; return c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4); }
function lum(col){ return 0.2126*lin(col.r)+0.7152*lin(col.g)+0.0722*lin(col.b); }
function contrastRatio(a,b){
  const l1=lum(a), l2=lum(b);
  return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
}
function effectiveBg(el){
  let n = el;
  while(n && n !== document.documentElement){
    const c = parseColor(getComputedStyle(n).backgroundColor);
    if(c && c.a >= 0.95) return c;
    n = n.parentElement;
  }
  const c = parseColor(getComputedStyle(document.documentElement).backgroundColor);
  return c || {r:255,g:255,b:255,a:1};
}
`;

const HOME_H1 = "Je crée des Sites Web Professionnels qui Génèrent des Ventes";
async function newPage(context, hash, extraWait = 300, waitUntil = "domcontentloaded") {
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200));
  });
  await page.goto(`${BASE}/${hash}`, { waitUntil, timeout: 25000 });
  // Attendre le H1 de la page (morceau lazy chargé + rendu)
  await page.waitForFunction(
    () => document.querySelector("main#contenu-principal h1"),
    null,
    { timeout: 15000 },
  );
  // LEÇON (2026-11-19) : au chargement direct d'un fragment, le routeur
  // peut rendre l'accueil ~1 s avant de basculer — l'attendre explicitement
  // (sans cela, l'étape a11y du 19/11 a audité l'accueil 12 fois : H1 de
  // l'accueil détecté immédiatement, évaluation lancée trop tôt).
  await page.waitForTimeout(1200);
  if (hash !== "#/accueil") {
    await page
      .waitForFunction(
        (home) => {
          const h = document.querySelector("main#contenu-principal h1");
          return h && h.textContent && h.textContent.trim() !== home;
        },
        HOME_H1,
        { timeout: 6000 },
      )
      .catch(() => {});
  }
  await page.waitForTimeout(extraWait);
  return { page, consoleErrors };
}
function log(msg) {
  console.log(msg);
  try {
    fs.appendFileSync("/tmp/audit-progress.log", `${new Date().toISOString().slice(11, 19)} ${msg}\n`);
  } catch (e) {}
}

/* ============================ A. A11Y ============================ */
async function auditA11y(context) {
  for (const r of ROUTES) {
    log(`  a11y ${r.hash}…`);
    let page = null;
    let consoleErrors = [];
    try {
      ({ page, consoleErrors } = await newPage(context, r.hash));
    const info = await page.evaluate((u) => {
      const { parseColor, contrastRatio, effectiveBg } = new Function(
        u + "; return { parseColor: parseColor, contrastRatio: contrastRatio, effectiveBg: effectiveBg };",
      )();
      const out = {
        route: location.hash,
        lang: document.documentElement.lang || null,
        landmarks: {
          header: !!document.querySelector("header"),
          footer: !!document.querySelector("footer"),
          main: !!document.querySelector("main#contenu-principal"),
          navs: document.querySelectorAll("nav").length,
          navLabels: [...document.querySelectorAll("nav")]
            .map((n) => n.getAttribute("aria-label"))
            .filter(Boolean),
        },
        skipLink: !!document.querySelector(
          'a[href="#contenu-principal"], a[href="#main"], a[aria-label*="contenu"]',
        ),
        h1: document.querySelectorAll("h1").length,
        h1Text: document.querySelector("h1")?.textContent?.trim().slice(0, 90),
        iframes: [...document.querySelectorAll("iframe")].map((f) => ({
          title: f.getAttribute("title"),
          src: (f.getAttribute("src") || "").slice(0, 60),
        })),
        overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };

      /* --- Cibles tactiles (WCAG 2.5.8 : minimum 24×24) --- */
      const SELE = 'a[href], button, [role="button"], input:not([type="hidden"]), select, textarea, label:has(input), [tabindex]:not([tabindex="-1"])';
      const targets = [];
      for (const el of document.querySelectorAll(SELE)) {
        if (el.closest("[aria-hidden='true']")) continue;
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden") continue;
        const rect = el.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) continue;
        const inline = !!el.closest("p, li, span:not([class*='btn'])");
        const name =
          el.getAttribute("aria-label") ||
          el.textContent?.trim().slice(0, 30) ||
          el.getAttribute("placeholder") ||
          el.tagName.toLowerCase();
        targets.push({
          name,
          w: Math.round(rect.width),
          h: Math.round(rect.height),
          inline,
          under24: !inline && (rect.width < 24 || rect.height < 24),
        });
      }
      targets.sort((a, b) => Math.min(a.w, a.h) - Math.min(b.w, b.h));
      out.tapTargets = {
        total: targets.length,
        under24: targets.filter((t) => t.under24),
        smallest: targets.slice(0, 6),
      };

      /* --- Contraste du texte (WCAG 1.4.3) --- */
      const failures = [];
      const samples = [];
      const all = [...document.querySelectorAll("header *, main *, footer *")];
      let considered = 0;
      for (const el of all) {
        if (considered > 150) break;
        if (el.closest("[aria-hidden='true']")) continue;
        const direct = [...el.childNodes].some(
          (n) => n.nodeType === 3 && n.textContent.trim().length > 0,
        );
        if (!direct) continue;
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden") continue;
        const rect = el.getBoundingClientRect();
        if (rect.width < 4 || rect.height < 4) continue;
        considered++;
        const fg = parseColor(cs.color);
        const bg = effectiveBg(el);
        if (!fg || !bg) continue;
        const size = parseFloat(cs.fontSize);
        const bold = parseInt(cs.fontWeight, 10) >= 700;
        const large = size >= 24 || (size >= 18.66 && bold);
        const need = large ? 3 : 4.5;
        const ratio = contrastRatio(fg, bg);
        const rec = {
          tag: el.tagName.toLowerCase(),
          text: el.textContent.trim().slice(0, 40),
          ratio: Math.round(ratio * 100) / 100,
          need,
          size: Math.round(size * 10) / 10,
          fg: cs.color,
          bg: `rgb(${bg.r},${bg.g},${bg.b})`,
        };
        samples.push(rec);
        if (ratio < need) failures.push(rec);
      }
      out.textContrast = { samples: samples.length, failures };
      return out;
    }, CONTRAST_UTILS);
    info.consoleErrors = consoleErrors;
      OUT.a11y.routes.push(info);
    } catch (e) {
      log(`  ✗ ${r.hash} ERREUR: ${String(e).slice(0, 120)}`);
      OUT.a11y.routes.push({ route: r.hash, error: String(e).slice(0, 200) });
    } finally {
      if (page) await page.close().catch(() => {});
    }
  }
}

/* --- Focus visible : Tab à travers les premiers éléments --- */
async function auditFocus(context) {
  for (const r of [
    { key: "accueil", hash: "#/accueil" },
    { key: "devis", hash: "#/demander-un-devis" },
    { key: "contact", hash: "#/contact" },
  ]) {
    log(`  focus ${r.hash}…`);
    const { page } = await newPage(context, r.hash);
    const steps = [];
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      const step = await page.evaluate((u) => {
        const { parseColor, contrastRatio, effectiveBg } = new Function(
          u + "; return { parseColor: parseColor, contrastRatio: contrastRatio, effectiveBg: effectiveBg };",
        )();
        const el = document.activeElement;
        if (!el || el === document.body)
          return { end: true };
        const cs = getComputedStyle(el);
        const outline = `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`;
        const bg = effectiveBg(el);
        const oc = parseColor(cs.outlineColor);
        // CONTRASTE PERÇU : si l'outline a une alpha < 1 (ex. #e4e4e4 à
        // 50 %), l'anneau RENDERED est le blend sur le fond — c'est lui
        // que l'œil voit (1.4.11 se juge sur la couleur rendue).
        let ratio = null;
        let ringEff = null;
        if (oc) {
          ringEff =
            oc.a < 1
              ? {
                  r: Math.round(oc.r * oc.a + bg.r * (1 - oc.a)),
                  g: Math.round(oc.g * oc.a + bg.g * (1 - oc.a)),
                  b: Math.round(oc.b * oc.a + bg.b * (1 - oc.a)),
                }
              : oc;
          ratio = contrastRatio(ringEff, bg);
        }
        return {
          end: false,
          el: el.textContent?.trim().slice(0, 30) || el.getAttribute("aria-label") || el.tagName.toLowerCase(),
          outline,
          outlineWidthPx: cs.outlineWidth,
          visible: cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0,
          bg: `rgb(${bg.r},${bg.g},${bg.b})`,
          outlineVsBg: ratio ? Math.round(ratio * 100) / 100 : null,
        };
      }, CONTRAST_UTILS);
      if (step.end) break;
      steps.push(step);
    }
    OUT.a11y.focus.push({ route: r.hash, steps });
    await page.close();
  }
}

/* --- prefers-reduced-motion : Lenis ne doit pas s'activer --- */
async function auditReducedMotion(context) {
  const page = await context.newPage();
  await page.goto(`${BASE}/#/accueil`, { waitUntil: "domcontentloaded", timeout: 25000 });
  await page.waitForFunction(() => document.querySelector("main#contenu-principal h1"), null, { timeout: 15000 });
  await page.waitForTimeout(800);
  OUT.a11y.reducedMotion = await page.evaluate(() => ({
    lenisHtmlClass: document.documentElement.className,
    lenisActive: document.documentElement.classList.contains("lenis"),
  }));
  await page.close();
}

/* ======================= C. FORMULAIRES ======================= */
const FILL_VALUE = (input) => {
  const t = `${input.name || ""} ${input.placeholder || ""} ${input.getAttribute('aria-label') || ''} ${input.id || ''}`.toLowerCase();
  const type = input.type;
  if (type === "checkbox" || type === "radio") return "__CHECK__";
  if (type === "email" || t.includes("mail")) return "audit.test@example.com";
  if (type === "tel" || t.includes("tel") || t.includes("phone")) return "+229 97 00 00 00";
  if (t.includes("site") || t.includes("web") || t.includes("url")) return "https://exemple.com";
  if (t.includes("entreprise") || t.includes("société") || t.includes("company")) return "Audit & Co";
  if (t.includes("activité") || t.includes("activity")) return "Services professionnels";
  if (t.includes("nom") || t.includes("prénom") || t.includes("name")) return "Test Audit";
  if (input.tagName === "TEXTAREA") return "Message de test automatique suffisamment long pour la validation.";
  if (input.tagName === "SELECT") return "__SELECT__";
  return "Test Audit";
};

async function auditForms(context) {
  const variants = [
    { key: "devis", hash: "#/demander-un-devis", submit: "Obtenir Un Devis" },
    { key: "contact", hash: "#/contact", submit: "Envoyer Mon Message" },
    { key: "audit", hash: "#/audit-gratuit" },
  ];
  for (const v of variants) {
    const result = { variant: v.key, hash: v.hash };
    log(`  forms ${v.key}…`);
    try {

    /* Phase 1 — inventaire + soumission VIDE (validation client) */
    {
      const { page } = await newPage(context, v.hash);
      // repérer le bouton de soumission du formulaire (pas les CTA de page)
      const submitBtn = await page
        .locator("form button[type='submit'], form > button:last-of-type")
        .first();
      const btnText = (await submitBtn.textContent())?.trim();
      result.submitButton = btnText;

      // structure interactive complète du formulaire (pour comprendre
      // le markup des questions à choix unique avant de remplir)
      result.formStructure = await page.evaluate(() => {
        const form = document.querySelector("form");
        if (!form) return [];
        return [...form.querySelectorAll("button, input, select, textarea, [role='radio'], [role='option'], label")].map((i) => {
          const cs = getComputedStyle(i);
          const r = i.getBoundingClientRect();
          const visible = cs.display !== "none" && cs.visibility !== "hidden" && r.width > 2 && r.height > 2;
          return {
            tag: i.tagName.toLowerCase(),
            type: i.type || i.getAttribute("role") || null,
            name: i.name || i.id || i.getAttribute("aria-label") || i.textContent?.trim().slice(0, 26) || i.placeholder?.slice(0, 20) || null,
            visible,
          };
        }).slice(0, 40);
      });

      // tous les champs visibles + association de libellé + autocomplete
      result.fields = await page.evaluate(() => {
        const form = document.querySelector("form");
        if (!form) return [];
        return [...form.querySelectorAll("input:not([type='hidden']), select, textarea")].filter((i) => {
          const cs = getComputedStyle(i);
          if (cs.display === "none" || cs.visibility === "hidden") return false;
          const r = i.getBoundingClientRect();
          return r.width > 2 && r.height > 2;
        }).map((i) => ({
          tag: i.tagName.toLowerCase(),
          type: i.type || null,
          name: i.name || i.id || i.getAttribute("aria-label") || i.placeholder?.slice(0, 24),
          labelled: !!(i.labels && i.labels.length) || !!i.getAttribute("aria-label"),
          autocomplete: i.getAttribute("autocomplete"),
          required: i.required || i.getAttribute("aria-required") === "true",
        }));
      });

      // honeypot : présent mais inaccessible ?
      result.honeypot = await page.evaluate(() => {
        const form = document.querySelector("form");
        if (!form) return null;
        const hp = form.querySelector("input[name*='honeypot'], input[tabindex='-1']");
        if (!hp) return { found: false };
        const cs = getComputedStyle(hp);
        const r = hp.getBoundingClientRect();
        return {
          found: true,
          visible: cs.display !== "none" && r.width > 2,
          tabIndex: hp.tabIndex,
          ariaHidden: hp.getAttribute("aria-hidden"),
          autocomplete: hp.getAttribute("autocomplete"),
        };
      });

      // SOUMISSION VIDE (click DOM). Garde anti-spam : une soumission < 3 s
      // après le montage est refusée AVANT la validation — attendre 3,6 s
      // pour mesurer les VRAIES erreurs de validation par champ.
      await page.waitForTimeout(3600);
      await submitBtn.evaluate((n) => n.click());
      await page.waitForTimeout(700);
      result.emptySubmit = await page.evaluate(() => {
        const form = document.querySelector("form");
        const out = { errorsShown: [], firstInputInvalid: null, roleAlerts: 0 };
        if (!form) return out;
        out.roleAlerts = form.querySelectorAll("[role='alert']").length;
        for (const p of form.querySelectorAll("[role='alert'], [class*='error'], p[id*='error']")) {
          const txt = p.textContent?.trim();
          const cs = getComputedStyle(p);
          if (txt && txt.length < 200 && cs.display !== "none" && p.getBoundingClientRect().height > 2)
            out.errorsShown.push(txt.slice(0, 80));
        }
        out.errorsShown = [...new Set(out.errorsShown)].slice(0, 10);
        const first = form.querySelector("input:not([type='hidden'])");
        if (first)
          out.firstInputInvalid = {
            ariaInvalid: first.getAttribute("aria-invalid"),
            describedby: first.getAttribute("aria-describedby"),
            describedbyResolves: first.getAttribute("aria-describedby")
              ? !!document.getElementById(first.getAttribute("aria-describedby"))
              : null,
          };
        return out;
      });
      await page.close();
    }

    /* Phase 2 — remplissage valide + réponse SIMULÉE ok (UX de succès) */
    {
      await context.route("**/api/leads", (route) =>
        route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            id: "audit-simule",
            emailNotified: true,
            message: "Votre demande a bien été enregistrée.",
          }),
        }),
      );
      const { page } = await newPage(context, v.hash);
      const form = page.locator("form").first();
      // remplir tous les champs visibles — click/fill au niveau DOM
      // (aucune attente d'actionabilité : les natifs cachés marchent aussi)
      const fillErrors = [];
      const inputs = form.locator("input:not([type='hidden']):not([tabindex='-1']), select, textarea");
      const n = await inputs.count();
      for (let i = 0; i < n; i++) {
        const el = inputs.nth(i);
        try {
          const type = await el.getAttribute("type");
          if (type === "checkbox" || type === "radio") await el.evaluate((nd) => nd.click());
          else if ((await el.evaluate((nd) => nd.tagName)) === "SELECT") await el.selectOption({ index: 1 });
          else {
            const vis = await el.isVisible().catch(() => true);
            if (vis) await el.fill(await el.evaluate((nd) => FILL_VALUE_GLOBAL(nd)));
            else await el.evaluate((nd) => { nd.value = FILL_VALUE_GLOBAL(nd); nd.dispatchEvent(new Event("input", { bubbles: true })); });
          }
        } catch (e) {
          fillErrors.push(String(e).slice(0, 80));
        }
      }
      const btn = page.locator("form button[type='submit'], form > button:last-of-type").first();
      // garde anti-spam : > 3,6 s après le montage avant de cliquer
      await page.waitForTimeout(3600);
      await btn.evaluate((nd) => nd.click());
      await page.waitForTimeout(1200);
      result.mockedSuccess = await page.evaluate(() => {
        const toasts = [...document.querySelectorAll("[role='status'], [data-radix-viewport], li[data-state]")].map((t) => t.textContent?.trim().slice(0, 120)).filter(Boolean);
        const form = document.querySelector("form");
        return {
          toastRoleStatus: !!document.querySelector("[role='status']"),
          toastText: toasts.slice(0, 3),
          toastAriaLive: document.querySelector("[role='status']")?.getAttribute("aria-live"),
          // zones d'annonce aria-live dans le DOM (Radix ToastAnnounce =
          // span role=status aria-live=polite — source vérifiée)
          ariaLiveZones: [...document.querySelectorAll("[aria-live]")].map((z) => ({
            tag: z.tagName,
            live: z.getAttribute("aria-live"),
            role: z.getAttribute("role"),
            txt: (z.textContent || "").trim().slice(0, 60),
          })),
          // le toast est-il un li data-state ? attributs complets
          toastLiAttrs: document.querySelector("li[data-state]")
            ? [...document.querySelector("li[data-state]").attributes].map((a) => a.name).join(",")
            : null,
          formStillVisible: !!form,
          formCleared: form ? !(form.querySelector("input:not([type=hidden])")?.value || "") : null,
          // bloc de confirmation : role=status posé ? (correctif 4.1.3 du 19/11)
          confirmationRole: document.querySelector("[id$='-confirmation']")
            ? document.querySelector("[id$='-confirmation']").getAttribute("role")
            : "(absent)",
          confirmationText: [...document.querySelectorAll("body *")]
            .filter((e) => /enregistr|envoyé|reçu|merci/i.test(e.textContent || "") && e.children.length === 0)
            .map((e) => e.textContent?.trim().slice(0, 90))
            .slice(0, 3),
        };
      });
      result.mockedSuccess.fillErrors = fillErrors.slice(0, 5);
      await context.unroute("**/api/leads");
      await page.close();
    }

    /* Phase 3 — envoi RÉEL dans cet environnement sans base ni email
       (le serveur local n'a ni DATABASE_URL ni RESEND_API_KEY :
       l'API répond 500 « refus honnête » — le visiteur DOIT le voir) */
    {
      const { page } = await newPage(context, v.hash);
      const form = page.locator("form").first();
      const fillErrors = [];
      const inputs = form.locator("input:not([type='hidden']):not([tabindex='-1']), select, textarea");
      const n = await inputs.count();
      for (let i = 0; i < n; i++) {
        const el = inputs.nth(i);
        try {
          const type = await el.getAttribute("type");
          if (type === "checkbox" || type === "radio") await el.evaluate((nd) => nd.click());
          else if ((await el.evaluate((nd) => nd.tagName)) === "SELECT") await el.selectOption({ index: 1 });
          else {
            const vis = await el.isVisible().catch(() => true);
            if (vis) await el.fill(await el.evaluate((nd) => FILL_VALUE_GLOBAL(nd)));
            else await el.evaluate((nd) => { nd.value = FILL_VALUE_GLOBAL(nd); nd.dispatchEvent(new Event("input", { bubbles: true })); });
          }
        } catch (e) {
          fillErrors.push(String(e).slice(0, 80));
        }
      }
      const btn = page.locator("form button[type='submit'], form > button:last-of-type").first();
      const btnBefore = (await btn.textContent())?.trim();
      // garde anti-spam : > 3,6 s après le montage avant de cliquer
      await page.waitForTimeout(3600);
      await btn.evaluate((nd) => nd.click());
      await page.waitForTimeout(1800);
      result.realSubmit = await page.evaluate((btnBefore) => {
        const btn = [...document.querySelectorAll("button")].find(
          (b) => b.textContent?.trim() === btnBefore,
        );
        return {
          responseFeedback: [...document.querySelectorAll("[role='status'], [role='alert']")]
            .map((t) => t.textContent?.trim().slice(0, 200))
            .filter(Boolean)
            .slice(0, 3),
          anyTextMention: [...document.querySelectorAll("body *")]
            .filter(
              (e) =>
                /enregistré|réessayer|réservez un appel|m'écrire directement|pas pu être finalisé/i.test(
                  e.textContent || "",
                ) && e.children.length === 0,
            )
            .map((e) => e.textContent?.trim().slice(0, 160))
            .slice(0, 4),
          buttonEnabled: btn ? !btn.disabled : null,
          spinnerStillAlone: btn?.querySelector(".animate-spin") ? true : false,
        };
      }, btnBefore);
      await page.close();
    }
    OUT.forms.push(result);
    } catch (e) {
      result.error = String(e).slice(0, 200);
      log(`  ✗ forms ${v.key} ERREUR: ${result.error.slice(0, 120)}`);
      OUT.forms.push(result);
    }
  }
}

/* ======================= B. PERFORMANCE ======================= */
async function auditPerf(browser) {
  const cases = [
    { page: "accueil", hash: "#/accueil" },
    { page: "methode", hash: "#/methode" },
    { page: "realisations", hash: "#/realisations" },
  ];
  for (const device of [
    { name: "desktop", ctx: { viewport: { width: 1440, height: 900 } } },
    { name: "mobile-iphone13", ctx: { ...devices["iPhone 13"] } },
  ]) {
    for (const c of cases) {
      const context = await browser.newContext({
        ...device.ctx,
      });
      await context.addInitScript(() => {
        window.__perf = { lcp: 0, lcpEl: null, cls: 0, fcp: 0 };
        try {
          new PerformanceObserver((l) => {
            const es = l.getEntries();
            const e = es[es.length - 1];
            if (e) {
              window.__perf.lcp = e.startTime;
              window.__perf.lcpEl = e.element
                ? `${e.element.tagName.toLowerCase()}.${(e.element.className || "").toString().split(" ")[0]} ${Math.round(e.element.getBoundingClientRect().width)}x${Math.round(e.element.getBoundingClientRect().height)}`
                : null;
            }
          }).observe({ type: "largest-contentful-paint", buffered: true });
          new PerformanceObserver((l) => {
            for (const e of l.getEntries()) if (!e.hadRecentInput) window.__perf.cls += e.value;
          }).observe({ type: "layout-shift", buffered: true });
          new PerformanceObserver((l) => {
            for (const e of l.getEntries())
              if (e.name === "first-contentful-paint") window.__perf.fcp = e.startTime;
          }).observe({ type: "paint", buffered: true });
        } catch (e) {}
      });
      const page = await context.newPage();
      const t0 = Date.now();
      log(`  perf ${device.name} ${c.page}…`);
      try {
      await page.goto(`${BASE}/${c.hash}`, { waitUntil: "load", timeout: 30000 });
      await page.waitForFunction(() => document.querySelector("main#contenu-principal h1"), null, { timeout: 15000 });
      const atLoad = await page.evaluate(() => {
        const rs = performance.getEntriesByType("resource");
        const cls = (ext) =>
          rs.filter((r) => r.name.split("?")[0].endsWith(ext)).reduce((s, r) => s + (r.transferSize || 0), 0);
        return {
          requests: rs.length,
          js: { n: rs.filter((r) => r.name.endsWith(".js")).length, bytes: cls(".js") },
          css: { n: rs.filter((r) => r.name.endsWith(".css")).length, bytes: cls(".css") },
          img: {
            n: rs.filter((r) => /\.(webp|png|jpg|jpeg|svg)$/i.test(r.name)).length,
            bytes: cls(".webp") + cls(".png") + cls(".jpg") + cls(".jpeg") + cls(".svg"),
          },
          fonts: {
            n: rs.filter((r) => r.name.endsWith(".woff2")).length,
            bytes: cls(".woff2"),
          },
        };
      });
      // laisser le préchargement à l'inactivité se déclencher (fallback 2500ms)
      await page.waitForTimeout(6000);
      const afterPrefetch = await page.evaluate(() => {
        const rs = performance.getEntriesByType("resource");
        const bytes = rs.reduce((s, r) => s + (r.transferSize || 0), 0);
        return { requests: rs.length, totalBytes: bytes };
      });
      const perf = await page.evaluate(() => window.__perf);
      const imgs = await page.evaluate(() =>
        [...document.querySelectorAll("img")].slice(0, 40).map((i) => ({
          src: i.getAttribute("src")?.split("/").pop()?.slice(0, 40),
          loading: i.getAttribute("loading") || "(eager)",
          hasDims: !!(i.getAttribute("width") && i.getAttribute("height")),
          aspectRatio: getComputedStyle(i).aspectRatio,
          complete: i.complete,
        })),
      );
      OUT.perf.push({
        device: device.name,
        page: c.page,
        fcp: Math.round(perf.fcp),
        lcp: Math.round(perf.lcp),
        lcpEl: perf.lcpEl,
        cls: Math.round(perf.cls * 1000) / 1000,
        atLoad,
        afterPrefetch,
        loadWallMs: Date.now() - t0 - 6000,
        images: imgs,
        clsVerdict: perf.cls <= 0.1 ? "OK (≤0,1)" : "DÉFAUT (>0,1)",
      });
      await context.close();
      } catch (e) {
        log(`  ✗ perf ${device.name} ${c.page} ERREUR: ${String(e).slice(0, 120)}`);
        OUT.perf.push({ device: device.name, page: c.page, error: String(e).slice(0, 200) });
        await context.close().catch(() => {});
      }
    }
  }
}

/* ============================ MAIN ============================
   Étapes séparées (STAGE=a11y|forms|perf) : le sandbox tue les
   process à la fin de chaque commande — chaque étape écrit son
   propre JSON et survit seule. Progression journalisée dans
   /tmp/audit-progress.log (survit aux timeouts). */
const STAGE = process.env.STAGE || "a11y";
const OUTFILE = `${__dirname}/audit-${STAGE}-2026-11-19.json`;

const FILL_VALUE_SRC = `
  window.FILL_VALUE_GLOBAL = function(input){
    const t = \`\${input.name||''} \${input.placeholder||''} \${input.getAttribute('aria-label')||''} \${input.id||''}\`.toLowerCase();
    const type = input.type;
    if (type === 'checkbox' || type === 'radio') return '__CHECK__';
    if (type === 'email' || t.includes('mail')) return 'audit.test@example.com';
    if (type === 'tel' || t.includes('tel') || t.includes('phone')) return '+229 97 00 00 00';
    if (t.includes('site') || t.includes('web') || t.includes('url')) return 'https://exemple.com';
    if (t.includes('entreprise') || t.includes('société') || t.includes('company')) return 'Audit & Co';
    if (t.includes('activité') || t.includes('activity')) return 'Services professionnels';
    if (t.includes('nom') || t.includes('prénom') || t.includes('name')) return 'Test Audit';
    if (input.tagName === 'TEXTAREA') return 'Message de test automatique suffisamment long pour la validation.';
    if (input.tagName === 'SELECT') return '__SELECT__';
    return 'Test Audit';
  };
`;

(async () => {
  if (STAGE === "a11y") {
    const browser = await chromium.launch();
    const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    log("[a11y] 12 routes…");
    await auditA11y(desktop);
    log("[a11y] focus clavier (3 pages)…");
    await auditFocus(desktop);
    log("[a11y] mouvement réduit…");
    await auditReducedMotion(desktop);
    await browser.close();
  } else if (STAGE === "forms") {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(FILL_VALUE_SRC);
    log("[forms] 3 variantes × 3 phases…");
    await auditForms(ctx);
    await browser.close();
  } else if (STAGE === "perf") {
    const browser = await chromium.launch();
    log("[perf] 3 pages × 2 appareils…");
    await auditPerf(browser);
    await browser.close();
  } else {
    throw new Error(`STAGE inconnu: ${STAGE}`);
  }

  fs.writeFileSync(OUTFILE, JSON.stringify(OUT, null, 2));
  log(`JSON écrit : ${OUTFILE}`);

  /* ------- SYNTHÈSE CONSOLE (dépend de l'étape) ------- */
  console.log("\n========== SYNTHÈSE ==========");
  for (const r of OUT.a11y.routes) {
    if (r.error) {
      console.log(`${(r.route || "?").padEnd(28)} ✗ ERREUR: ${r.error.slice(0, 120)}`);
      continue;
    }
    const t = r.textContrast || { samples: 0, failures: [] };
    console.log(
      `${r.route.padEnd(28)} H1:${r.h1} « ${(r.h1Text || "").slice(0, 34)} » skip:${r.skipLink ? 1 : 0} cibles<24:${(r.tapTargets?.under24 || []).length} échantillons:${t.samples} échecsContraste:${t.failures.length} overflow:${r.overflowX ? "OUI" : "non"} console:${(r.consoleErrors || []).length}`,
    );
    for (const f of (t.failures || []).slice(0, 4))
      console.log(`   ✗ contraste ${f.ratio}:1 (requis ${f.need}) — « ${f.text.slice(0, 38)} » ${f.fg} sur ${f.bg} (${f.size}px)`);
    for (const u of (r.tapTargets?.under24 || []).slice(0, 3))
      console.log(`   ✗ cible ${u.w}x${u.h} < 24 — « ${u.name} »`);
    if (r.consoleErrors?.length) console.log(`   console: ${r.consoleErrors.slice(0, 2).join(" | ").slice(0, 140)}`);
  }
  if (OUT.a11y.focus.length) {
    console.log("\n--- FOCUS CLAVIER ---");
    for (const f of OUT.a11y.focus)
      for (const s of f.steps.slice(0, 6))
        console.log(
          `${f.route} « ${String(s.el).slice(0, 24)} » outline:${s.outlineWidthPx} visible:${s.visible} contrasteOutline:${s.outlineVsBg} fond:${s.bg}`,
        );
  }
  if (OUT.a11y.reducedMotion) {
    console.log(`\n--- MOUVEMENT RÉDUIT --- lenis actif: ${OUT.a11y.reducedMotion.lenisActive} (html: « ${OUT.a11y.reducedMotion.lenisHtmlClass} »)`);
  }
  if (OUT.forms.length) {
    console.log("\n--- FORMULAIRES ---");
    for (const f of OUT.forms) {
      console.log(`[${f.variant}] bouton « ${f.submitButton} »`);
      console.log(`  vide: erreurs=${JSON.stringify(f.emptySubmit?.errorsShown?.slice(0, 3))} ariaInvalid=${f.emptySubmit?.firstInputInvalid?.ariaInvalid} describedby:${JSON.stringify(f.emptySubmit?.firstInputInvalid?.describedbyResolves)} roleAlerts:${f.emptySubmit?.roleAlerts}`);
      console.log(`  honeypot: ${JSON.stringify(f.honeypot)}`);
      console.log(`  succès simulé: toast=${JSON.stringify(f.mockedSuccess?.toastText)} role=status:${f.mockedSuccess?.toastRoleStatus} ariaLive:${f.mockedSuccess?.toastAriaLive} formCleared:${f.mockedSuccess?.formCleared} confirmé:${JSON.stringify(f.mockedSuccess?.confirmationText?.slice(0, 2))}`);
      console.log(`  échec réel: ${JSON.stringify(f.realSubmit?.anyTextMention?.slice(0, 2))} boutonActif:${f.realSubmit?.buttonEnabled} feedback:${JSON.stringify(f.realSubmit?.responseFeedback?.slice(0, 1))}`);
      if (f.error) console.log(`  ✗ ERREUR: ${f.error.slice(0, 120)}`);
    }
  }
  if (OUT.perf.length) {
    console.log("\n--- PERFORMANCE ---");
    for (const p of OUT.perf)
      console.log(
        `${p.device.padEnd(16)} ${p.page.padEnd(12)} FCP:${p.fcp}ms LCP:${p.lcp}ms CLS:${p.cls} (${p.clsVerdict}) req@load:${p.atLoad.requests} js:${Math.round(p.atLoad.js.bytes / 1024)}Ko img:${Math.round(p.atLoad.img.bytes / 1024)}Ko → prefetch:${p.afterPrefetch.requests} req/${Math.round(p.afterPrefetch.totalBytes / 1024)}Ko`,
      );
    console.log(`\nLCP élément: ${JSON.stringify(OUT.perf.map((p) => [p.device, p.page, p.lcpEl]))}`);
  }
  console.log(`JSON complet : ${OUTFILE}`);
})().catch((e) => {
  console.error("ÉCHEC AUDIT:", e);
  fs.appendFileSync("/tmp/audit-progress.log", `ÉCHEC: ${String(e).slice(0, 300)}\n`);
  process.exit(1);
});
