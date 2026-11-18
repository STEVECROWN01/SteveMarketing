/**
 * Vérification du 18/11/2026 — IMAGE ÉPINGLÉE DE LA SECTION
 * « VOTRE ACTIVITÉ MÉRITE D'ÊTRE DAVANTAGE VISIBLE » (demande de
 * l'éditeur) : « Je veux que l'image épinglée […] soit
 * exclusivement en blanc-noir ».
 *
 * L'image épinglée est la SECONDE illustration de la section
 * problème (problem-ineffective-website.webp, celle posée en biais
 * par-dessus l'image principale) — pas l'image principale
 * (problem-no-website.webp).
 *
 * Nouvelle prop forceMono sur MonoImage → classe .mono-locked :
 * grayscale(1) verrouillé sur TOUS les écrans, aucune couleur au
 * survol. Annule le retour au comportement standard du 16/11
 * (« couleur sur mobile/tablette »).
 *
 * Contrôles :
 *  A. BUREAU 1440 (contexte avec survol, html.hoverable présent) :
 *    1. l'enveloppe de l'image épinglée porte mono-media + mono-locked ;
 *    2. filtre calculé de l'image épinglée au repos = grayscale(1) ;
 *    3. AU SURVOL de l'image épinglée : Toujours grayscale(1) —
 *       aucune couleur ne se révèle (c'est le cœur de la demande) ;
 *    4. l'image PRINCIPALE garde le comportement standard :
 *       grayscale(1) au repos, grayscale(0) au survol (couleur
 *       révélée) — non-régression ;
 *    5. l'image épinglée est toujours inclinée (rotate-[3deg]) ;
 *    6. html.hoverable présent (précondition du contexte bureau).
 *  B. MOBILE 390 ET TABLETTE 768 (contexte tactile isMobile+hasTouch,
 *     html.hoverable ABSENT) :
 *    7. html.hoverable absent (précondition du contexte tactile) ;
 *    8. image épinglée : grayscale(1) — verrouillée même sur tactile ;
 *    9. image principale : filter none — couleur d'origine,
 *       comportement standard sur mobile/tablette conservé.
 *  C. PARTOUT : aucune erreur console, aucun débordement horizontal.
 *
 * LEÇONS appliquées :
 *  - attendre « load » et non « networkidle » (l'iframe Calendly de
 *    la page Réservation d'appel garde des connexions ouvertes —
 *    leçon du 17/11) ;
 *  - les images sont LAZY (loading="lazy") : défiler jusqu'à la
 *    section #probleme AVANT de lire les styles, sinon rien n'est
 *    encore rendu ; attendre la fin des révélations (~1,8 s) ;
 *  - la transition de filtre dure 0,55 s : après un survol,
 *    attendre 0,9 s avant de lire la valeur finale (sinon lecture
 *    en cours de transition, ex. grayscale(0.42)) ;
 *  - Chromium rend grayscale(1) sous la forme « grayscale(1) » ou
 *    « grayscale(100%) » selon la version — regex acceptant les
 *    deux écritures ;
 *  - sur tactile, le survol n'existe pas : PAS de test de survol
 *    dans le contexte mobile, uniquement les valeurs au repos ;
 *  - lire le filtre DIRECTEMENT sur l'élément <img> via
 *    locator.evaluate — les tentatives d'interpolation de
 *    fonctions dans page.evaluate(string) passaient la FONCTION
 *    comme argument au lieu de son résultat (TypeError:
 *    el.querySelector is not a function) ;
 *  - Tailwind v4 génère la propriété CSS NATIVE « rotate: 3deg »
 *    et non transform: rotate(3deg) comme en v3 — lire
 *    getComputedStyle().rotate (le test initial lisait .transform
 *    et voyait « none » alors que l'inclinaison était bien
 *    appliquée).
 */
const { chromium, devices } = require("playwright");

const BASE = "http://localhost:3100";

const GRAYSCALE_1 = /^grayscale\((1|100%)\)$/;   // verrouillé
const GRAYSCALE_0 = /^grayscale\((0|0%)\)$/;     // couleur révélée

(async () => {
  const browser = await chromium.launch();
  let failures = 0;
  const ok = (cond, label) => {
    console.log(`${cond ? "OK  " : "ÉCHEC"} ${label}`);
    if (!cond) failures++;
  };

  // Ouvre la page, défile jusqu'à la section problème (images lazy)
  // et attend révélations + transitions.
  const ouvrirSectionProbleme = async (page) => {
    await page.goto(`${BASE}/`, { waitUntil: "load" });
    await page.waitForTimeout(1200);
    await page.evaluate(() => {
      document.getElementById("probleme").scrollIntoView({ block: "center" });
    });
    await page.waitForTimeout(1800);
  };
  const sansErreursNiDebordement = async (page, contexte) => {
    const errors = page._errors || [];
    ok(errors.length === 0, `${contexte} : aucune erreur console (${errors.length})${errors.length ? " — " + errors[0].slice(0, 120) : ""}`);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    ok(overflow <= 0, `${contexte} : aucun débordement horizontal (delta = ${overflow}px)`);
  };
  const ecouterErreurs = (page) => {
    page._errors = [];
    page.on("console", (m) => m.type() === "error" && page._errors.push(m.text()));
    page.on("pageerror", (e) => page._errors.push(String(e)));
  };

  const imgEpinglee = (page) => page.locator('#probleme img[src*="problem-ineffective"]');
  const imgPrincipale = (page) => page.locator('#probleme img[src*="problem-no-website"]');

  /* ============ A. BUREAU 1440 (survol possible) ============ */
  {
    console.log("\n===== A. BUREAU 1440 =====");
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    ecouterErreurs(page);
    await ouvrirSectionProbleme(page);

    // 6. Précondition : contexte bureau détecté
    const hoverable = await page.evaluate(() =>
      document.documentElement.classList.contains("hoverable")
    );
    ok(hoverable, "html.hoverable présent (contexte bureau)");

    // 1. Classes des deux enveloppes
    const classesEp = await imgEpinglee(page).evaluate((img) => [
      ...img.parentElement.classList,
    ]);
    ok(
      classesEp.includes("mono-media") && classesEp.includes("mono-locked"),
      `enveloppe image épinglée = mono-media + mono-locked (${classesEp.join(" ")})`
    );
    const classesPr = await imgPrincipale(page).evaluate((img) => [
      ...img.parentElement.classList,
    ]);
    ok(
      classesPr.includes("mono-media") && !classesPr.includes("mono-locked"),
      `image principale = mono-media SANS mono-locked (${classesPr.join(" ")})`
    );

    // 2. Repos : épinglée grayscale(1), principale grayscale(1)
    const reposEp = await imgEpinglee(page).evaluate((img) => getComputedStyle(img).filter);
    ok(GRAYSCALE_1.test(reposEp), `image épinglée au repos : ${reposEp} (attendu grayscale(1))`);
    const reposPr = await imgPrincipale(page).evaluate((img) => getComputedStyle(img).filter);
    ok(GRAYSCALE_1.test(reposPr), `image principale au repos : ${reposPr} (standard bureau, attendu grayscale(1))`);

    // 3. SURVOL de l'image épinglée : doit RESTER en noir et blanc
    await imgEpinglee(page).hover();
    await page.waitForTimeout(900);
    const survolEp = await imgEpinglee(page).evaluate((img) => getComputedStyle(img).filter);
    ok(
      GRAYSCALE_1.test(survolEp),
      `image épinglée AU SURVOL : ${survolEp} — aucune couleur révélée (cœur de la demande)`
    );

    // 4. SURVOL de l'image principale : la couleur se révèle (standard)
    await imgPrincipale(page).hover();
    await page.waitForTimeout(900);
    const survolPr = await imgPrincipale(page).evaluate((img) => getComputedStyle(img).filter);
    ok(
      GRAYSCALE_0.test(survolPr),
      `image principale AU SURVOL : ${survolPr} (couleur révélée — comportement standard intact)`
    );

    // 5. Inclinaison conservée (rotate-[3deg] sur l'enveloppe).
    const transformEp = await imgEpinglee(page).evaluate(
      (img) => getComputedStyle(img.parentElement).rotate
    );
    ok(
      transformEp === "3deg",
      `inclinaison de l'image épinglée conservée (rotate: ${transformEp})`
    );

    // C. Console + débordement
    await sansErreursNiDebordement(page, "bureau 1440");
    await page.close();
  }

  /* ====== B. MOBILE 390 ET TABLETTE 768 (tactile, sans survol) ====== */
  for (const [nom, device] of [
    ["MOBILE 390", devices["iPhone 13"]],
    ["TABLETTE 768", devices["iPad (gen 7)"]],
  ]) {
    console.log(`\n===== B. ${nom} =====`);
    const context = await browser.newContext({ ...device });
    const page = await context.newPage();
    ecouterErreurs(page);
    await ouvrirSectionProbleme(page);

    // 7. Précondition : contexte tactile (pas de html.hoverable)
    const hoverable = await page.evaluate(() =>
      document.documentElement.classList.contains("hoverable")
    );
    ok(!hoverable, "html.hoverable ABSENT (contexte tactile confirmé)");

    // 8. Image épinglée : verrouillée en noir et blanc même sur tactile
    const fEp = await imgEpinglee(page).evaluate((img) => getComputedStyle(img).filter);
    ok(
      GRAYSCALE_1.test(fEp),
      `image épinglée : ${fEp} (noir et blanc exclusif, tactile compris)`
    );

    // 9. Image principale : couleur d'origine (comportement standard)
    const fPr = await imgPrincipale(page).evaluate((img) => getComputedStyle(img).filter);
    ok(
      fPr === "none",
      `image principale : ${fPr} (couleur d'origine — standard conservé)`
    );

    // C. Console + débordement
    await sansErreursNiDebordement(page, nom.toLowerCase());
    await context.close();
  }

  await browser.close();
  console.log(
    failures === 0
      ? `\nRÉSULTAT : TOUS LES CONTRÔLES PASSENT — l'image épinglée est exclusivement en noir et blanc (tous écrans, survol compris), l'image principale garde son comportement standard.`
      : `\nRÉSULTAT : ${failures} ÉCHEC(S) — voir ci-dessus.`
  );
  process.exit(failures === 0 ? 0 : 1);
})();
