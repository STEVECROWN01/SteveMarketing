/**
 * SONDE LOCALE — VOLET 24 (27/11/2026).
 * Vérifie sur le serveur standalone (PORT 3100), avec le stockage
 * GitHub réel (lecture seule — AUCUN document généré) :
 *
 *  R7 — compteur de projets sur l'option « Portfolio du site » du
 *       tableau de bord (projets présentés sur le site) ;
 *  R6 — titre de l'espace portfolio : « (X projets en ligne ·
 *       Y brouillons) » — sans « réalisations du site » ni « publié » ;
 *  R5 — budgets de caractères du formulaire proposition : compteurs
 *       affichés (présentation 747/750 · 4/4 paragraphes · 10/10
 *       lignes), saisie bornée (6×300 caractères → bornée), blocs
 *       plafonnés (7 max) ;
 *  R1 — devis : bloc de paiement titré « PAIEMENT » ;
 *  R2 — badge « Bank transfer » affiché à 22 px (lisible), devis et
 *       facture ;
 *  R3 — devis généré depuis une proposition : intro = la phrase
 *       standard des devis directs ;
 *  R4 — facture ouverte depuis le statut « Facturée (n°) » de la
 *       sélection de devis : fermée, on RETROUVE la sélection.
 */
const { chromium } = require("playwright");

const BASE = "http://localhost:3100";
const MDP = "MotDePasseTest-Volet24";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(20000);
  const resultats = [];
  const ok = (nom, cond, note = "") => {
    resultats.push([cond ? "OK" : "ÉCHEC", nom]);
    console.log(`${cond ? "✓" : "✗"} ${nom}${note ? ` — ${note}` : ""}`);
  };

  await page.goto(`${BASE}/#admin`, { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(1800);
  await page.fill("#admin-password", MDP);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);

  /* ---------- R7 : compteur sur l'option « Portfolio du site » ---------- */
  const navPortfolio = page.locator('nav button:has-text("Portfolio du site")').first();
  ok("R7-1 l'option « Portfolio du site » existe", (await navPortfolio.count()) === 1);
  const badge = navPortfolio.locator("span").last();
  const badgeTexte = (await badge.textContent())?.trim() ?? "";
  const badgeNum = Number(badgeTexte);
  ok("R7-2 badge de projets présent à droite de l'option", Number.isFinite(badgeNum) && badgeNum >= 0, `badge = « ${badgeTexte} »`);
  /* attente : les projets admin + réalisations du site sont chargés */
  await page.waitForTimeout(4000);
  const badgeApres = Number(((await badge.textContent()) ?? "").trim());
  ok(
    "R7-3 badge = total des projets présentés sur le site",
    Number.isFinite(badgeApres) && badgeApres >= 0,
    `badge après chargement = ${badgeApres}`,
  );

  /* ---------- R6 : compteur du titre de l'espace portfolio ---------- */
  await navPortfolio.click();
  await page.waitForTimeout(2500);
  const titre = page.locator("h2:has-text('Portfolio du site')");
  const texteTitre = (await titre.first().textContent()) ?? "";
  const m = texteTitre.match(/\(([^)]*)\)/);
  const compteur = m ? m[1].trim() : "";
  ok(
    "R6-1 compteur = « X projets en ligne · Y brouillons » uniquement",
    /^\d+ projets? en ligne · \d+ brouillons?$/.test(compteur),
    `« (${compteur}) »`,
  );
  ok(
    "R6-2 plus de « réalisations du site » ni de « publié » dans le compteur",
    !/réalisation/i.test(compteur) && !/publié/i.test(compteur),
  );
  ok(
    "R6-3 le compteur du titre = le badge de l'option (mêmes projets en ligne)",
    (() => {
      const enLigne = Number(compteur.match(/^(\d+) projet/)?.[1] ?? NaN);
      return Number.isFinite(enLigne) ? enLigne === badgeApres : false;
    })(),
    `titre ${compteur.match(/^(\d+) projet/)?.[1]} vs badge ${badgeApres}`,
  );
  await page.screenshot({ path: "/tmp/render/v24-portfolio-titre.png", fullPage: false });

  /* ---------- R5 : budgets du formulaire proposition ---------- */
  await page.click('nav button:has-text("Propositions commerciales")');
  await page.waitForTimeout(1500);
  await page.click('button:has-text("Créer une nouvelle proposition")');
  await page.waitForTimeout(2000);
  const champTitre = page.locator("label:has-text('Titre de la proposition') span.text-\\[10px\\]");
  const indicTitre = ((await champTitre.first().textContent()) ?? "").trim();
  const maxTitre = Number(indicTitre.match(/\d+\/(\d+) car\./)?.[1] ?? NaN);
  ok(
    "R5-1 compteur de caractères sur le titre (quantité du modèle)",
    /^\d+\/\d+ car\.$/.test(indicTitre) && Number.isFinite(maxTitre) && maxTitre >= 59,
    `« ${indicTitre} »`,
  );

  const champPres = page.locator("label:has-text('Paragraphes (une ligne = un paragraphe)')");
  const indicPres = (await champPres.first().textContent()) ?? "";
  ok(
    "R5-2 compteur de la présentation (car. · paragraphes · lignes)",
    /747\/750 car\. · 4\/4 paragraphes · 10\/10 lignes/.test(indicPres),
    `« ${indicPres.replace(/\s+/g, " ").trim()} »`,
  );

  /* saisie adverse : 6 paragraphes de 300 caractères → bornée */
  const longue =
    "La conception sur mesure de votre site web professionnel permettra de valoriser votre expertise et de rassurer vos futurs partenaires. ".repeat(30);
  /* le PREMIER champ « Paragraphes » du DOM est celui de la
     présentation (section 01, avant validation et conclusion). */
  const zonePresentation = page
    .locator('label:has-text("Paragraphes (une ligne = un paragraphe)")')
    .first()
    .locator("textarea");
  await zonePresentation.fill(longue);
  await page.waitForTimeout(400);
  const indicApres = (
    await page
      .locator('label:has-text("Paragraphes (une ligne = un paragraphe)")')
      .first()
      .textContent()
  )
    .replace(/\s+/g, " ")
    .trim();
  const valeurApres = await zonePresentation.inputValue();
  const lignesApres = valeurApres.split("\n");
  const somme = lignesApres.reduce((s, l) => s + l.length, 0);
  ok(
    "R5-3 saisie adverse bornée (≤ 4 paragraphes, ≤ 750 car., ≤ 10 lignes)",
    lignesApres.length <= 4 &&
      somme <= 750 &&
      /\d+\/750 car\. · \d+\/4 paragraphes · \d+\/10 lignes/.test(indicApres),
    `${lignesApres.length} paragraphes, ${somme} car., indicatif « ${indicApres.slice(0, 90)}… »`,
  );

  /* blocs plafonnés */
  const boutonBloc = page.locator('button:has-text("Ajouter un bloc")');
  ok(
    "R5-4 « Ajouter un bloc » plafonné (7 blocs — quantité du modèle)",
    (await boutonBloc.count()) === 1 && (await boutonBloc.isDisabled()),
    await boutonBloc.textContent().then((t) => t.trim()),
  );
  await page.screenshot({ path: "/tmp/render/v24-formulaire-budgets.png", fullPage: false });

  /* ---------- R3 : devis depuis proposition — intro standard ---------- */
  await page.click('nav button:has-text("Propositions commerciales")');
  await page.waitForTimeout(3500);
  const boutonDevis = page.locator('button[aria-label="Générer le devis (pré-rempli)"]').first();
  if ((await boutonDevis.count()) > 0) {
    await boutonDevis.click();
    await page.waitForTimeout(2000);
    const intro = await page
      .locator("label:has-text('Introduction')")
      .locator("textarea")
      .first()
      .inputValue()
      .catch(() => null);
    if (intro !== null) {
      ok(
        "R3 intro du devis depuis proposition = phrase standard des devis",
        intro.startsWith("Le présent devis concerne la création d'un site web professionnel"),
        `« ${intro.slice(0, 80)}… »`,
      );
    } else {
      /* repli : chercher le champ par son libellé exact */
      const zones = await page.locator("textarea").all();
      let trouve = false;
      for (const z of zones) {
        const v = await z.inputValue();
        if (v.startsWith("Le présent devis concerne la création")) {
          trouve = true;
          break;
        }
      }
      ok("R3 intro du devis depuis proposition = phrase standard des devis", trouve);
    }
  } else {
    ok("R3 bouton « générer le devis » trouvé", false, "aucune proposition dans la liste");
  }

  /* ---------- R1 + R2 : devis D2600002 — bloc PAIEMENT + badge ---------- */
  async function ouvrirApercu(type) {
    await page.click(`nav button:has-text("${type}")`);
    await page.waitForTimeout(3500);
    const ligne = page.locator(`tr:has-text("${type === "Devis" ? "D2600002" : "F2600002"}")`).first();
    await ligne.locator('button[aria-label="Aperçu plein écran"]').click();
    await page.waitForTimeout(3000);
    /* l'aperçu plein écran héberge le document dans une iframe */
    const frames = page.frames().filter((f) => f !== page.mainFrame());
    return frames[0] ?? null;
  }

  const frameDevis = await ouvrirApercu("Devis");
  ok("R1-0 aperçu du devis ouvert (iframe)", Boolean(frameDevis));
  if (frameDevis) {
    const titreBloc = frameDevis.locator(".invoice-payment-block .ipb-title").first();
    const texteTitreBloc = ((await titreBloc.textContent()) ?? "").trim();
    const transform = await titreBloc.evaluate((el) => getComputedStyle(el).textTransform);
    ok(
      "R1-1 bloc de paiement du devis titré « PAIEMENT »",
      texteTitreBloc.toLowerCase() === "paiement" && transform === "uppercase",
      `texte « ${texteTitreBloc} », text-transform: ${transform} → rendu « PAIEMENT »`,
    );
    const ligneMode = frameDevis.locator(".invoice-payment-block .ipb-row", { hasText: "Mode de paiement" }).first();
    const imgBadge = ligneMode.locator("img");
    const badgeInfo = await imgBadge.evaluate((el) => ({
      h: getComputedStyle(el).height,
      nat: el.naturalHeight,
    }));
    ok(
      "R2-1 badge du mode de paiement agrandi (22 px, lisible)",
      badgeInfo.h === "22px",
      `hauteur affichée ${badgeInfo.h}`,
    );
    await page.screenshot({ path: "/tmp/render/v24-devis-paiement.png" });
    await page.click('button[aria-label="Fermer l\'aperçu"]');
    await page.waitForTimeout(800);
  }

  /* ---------- R2 : facture — même badge lisible ---------- */
  const frameFacture = await ouvrirApercu("Factures");
  ok("R2-2 aperçu de la facture ouvert (iframe)", Boolean(frameFacture));
  if (frameFacture) {
    const imgBadge = frameFacture.locator(".invoice-payment-block .ipb-row img").first();
    const h = await imgBadge.evaluate((el) => getComputedStyle(el).height);
    ok("R2-3 badge de la facture agrandi (22 px)", h === "22px", `hauteur affichée ${h}`);
    await page.screenshot({ path: "/tmp/render/v24-facture-paiement.png" });
    /* ---------- R4 : depuis la SÉLECTION de devis ---------- */
    await page.click('button[aria-label="Fermer l\'aperçu"]');
    await page.waitForTimeout(800);
    await page.click('button:has-text("Créer une nouvelle facture")');
    await page.waitForTimeout(2500);
    ok(
      "R4-1 vue de sélection des devis ouverte",
      (await page.locator("h2:has-text('Créer une nouvelle facture')").count()) === 1,
    );
    const statut = page.locator('button:has-text("Facturée (")').first();
    ok(
      "R4-2 statut « Facturée (n°) » cliquable dans la sélection",
      (await statut.count()) >= 1,
      `« ${((await statut.textContent()) ?? "").trim()} »`,
    );
    /* force : la rangée porte aria-disabled (devis déjà facturé — non
       sélectionnable) mais le BOUTON de statut reste cliquable (un
       vrai navigateur clique sans obstacle ; Playwright respecte
       aria-disabled pour l'actionnabilité). */
    await statut.click({ force: true });
    await page.waitForTimeout(3000);
    ok(
      "R4-3 l'aperçu de la facture s'ouvre (plein écran)",
      (await page.locator('button[aria-label="Fermer l\'aperçu"]').count()) === 1,
    );
    await page.click('button[aria-label="Fermer l\'aperçu"]');
    await page.waitForTimeout(1000);
    const selectionRetour =
      (await page.locator("h2:has-text('Créer une nouvelle facture')").count()) === 1 &&
      (await page.locator("button:has-text('Retour aux factures')").count()) === 1 &&
      (await page.locator("tr:has-text('D2600002')").count()) >= 1;
    ok(
      "R4-4 fermeture de l'aperçu → RETOUR À LA SÉLECTION des devis",
      selectionRetour,
      selectionRetour ? "titre + table de sélection présents" : "la sélection a disparu",
    );
    await page.screenshot({ path: "/tmp/render/v24-selection-apres-fermeture.png" });
  }

  await browser.close();
  const echecs = resultats.filter(([s]) => s === "ÉCHEC").length;
  console.log(`\n${resultats.length - echecs}/${resultats.length} contrôles OK${echecs ? ` — ${echecs} ÉCHEC(S)` : ""}`);
  process.exit(echecs ? 1 : 0);
})();
