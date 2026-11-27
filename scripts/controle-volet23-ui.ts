/**
 * CONTRÔLE UI VOLET 23 (27/11/2026) — vérification locale du
 * back-office (serveur de développement + vrai stockage GitHub) :
 *  M1  portfolio : boutons des projets = ICÔNES SEULES ;
 *  M2  « Voir le projet » présent sur les projets publiés ;
 *  M3  aucune barre de défilement horizontal dans les listes ;
 *  M4  modale du devis signé : texte explicatif SUPPRIMÉ ;
 *  M8  « Charger le modèle par défaut » remplace « Enregistrer
 *      seulement » + anti-doublon (toast, aucune requête) ;
 *  M12 sélection du devis : statut dégrisé SEUL + clic → espace
 *      factures avec APERÇU (pas de modale de modification).
 */
import puppeteer from "puppeteer-core";
import os from "os";
import path from "path";
import fs from "fs";

const BASE = "http://localhost:3210";
const MOT_DE_PASSE = "volet23-verification-locale";

let echecs = 0;
function controle(nom: string, ok: boolean, detail = "") {
  console.log(`[${ok ? "OK " : "ÉCHEC"}] ${nom}${detail ? ` — ${detail}` : ""}`);
  if (!ok) echecs++;
}

const screenshots: Record<string, string> = {};
async function capture(page: any, nom: string) {
  const fichier = `/tmp/volet23/ui-${nom}.png`;
  await page.screenshot({ path: fichier, fullPage: false });
  screenshots[nom] = fichier;
}

async function main() {
  fs.mkdirSync("/tmp/volet23", { recursive: true });
  const navigateur = await puppeteer.launch({
    headless: true,
    executablePath: path.join(os.homedir(), ".cache/ms-playwright/chromium-1200/chrome-linux64/chrome"),
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await navigateur.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.3 });
  const requetes: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/")) requetes.push(`${r.method()} ${r.url().replace(BASE, "").split("?")[0]}`);
  });

  /* ---------- Connexion ---------- */
  await page.goto(`${BASE}/`, { waitUntil: "networkidle2" });
  await page.goto(`${BASE}/#/admin`, { waitUntil: "networkidle2" });
  await page.waitForSelector('input[type="password"]', { timeout: 20000 });
  await page.type('input[type="password"]', MOT_DE_PASSE);
  await page.click('button[type="submit"]');
  await page.waitForFunction(
    () => document.body.textContent?.includes("Tableau de bord") ?? false,
    { timeout: 20000 },
  );
  console.log("Connecté au back-office local.\n");

  /* ---------- M3 : listes sans barre horizontale ---------- */
  for (const section of ["propositions", "devis", "factures"] as const) {
    const boutonNav = await page.$(`nav button:nth-child(${section === "propositions" ? 3 : section === "devis" ? 4 : 5})`);
    await boutonNav?.click();
    await page.waitForFunction(
      (s) => document.body.textContent?.includes(s === "propositions" ? "Propositions commerciales" : s === "devis" ? "Créer un nouveau devis" : "Créer une nouvelle facture") ?? false,
      { timeout: 15000 },
      section,
    );
    await new Promise((r) => setTimeout(r, 700));
    const mesure = await page.evaluate(() => {
      const carte = document.querySelector("table")?.closest("div");
      const doc = document.scrollingElement as HTMLElement;
      const depasse =
        doc.scrollWidth - doc.clientWidth > 1 ||
        (carte ? carte.scrollWidth - carte.clientWidth > 1 : false);
      return { depasse, docW: doc.scrollWidth, docC: doc.clientWidth };
    });
    controle(
      `M3 — ${section} : aucune barre de défilement horizontal`,
      !mesure.depasse,
      `scrollWidth ${mesure.docW} / client ${mesure.docC}`,
    );
    await capture(page, `liste-${section}`);
  }

  /* ---------- M4 : modale du devis signé sans texte explicatif ---------- */
  /* Tenter d'ouvrir la modale sur le premier devis NON signé. */
  const navDevis = await page.$(`nav button:nth-child(4)`);
  await navDevis?.click();
  await page.waitForFunction(
    () => document.body.textContent?.includes("Créer un nouveau devis") ?? false,
    { timeout: 15000 },
  );
  await new Promise((r) => setTimeout(r, 800));
  const modaleOuverte = await page.evaluate(() => {
    const boutons = Array.from(document.querySelectorAll('table button')) as HTMLButtonElement[];
    const b = boutons.find((x) => (x.getAttribute("aria-label") || "").includes("Marquer signé"));
    if (b) {
      b.click();
      return true;
    }
    return false;
  });
  if (modaleOuverte) {
    await new Promise((r) => setTimeout(r, 500));
    const texte = await page.evaluate(() => document.body.textContent ?? "");
    controle(
      "M4 — modale du devis signé : texte « Téléversez le PDF… le système vérifie » SUPPRIMÉ",
      !texte.includes("le système vérifie") && !texte.includes("l'enregistrement ne se dégrise"),
    );
    await capture(page, "modale-signature");
    /* fermer par la croix (aria-label « Annuler ») de la modale */
    await page.evaluate(() => {
      const croix = document.querySelector(
        'div[role="dialog"] button[aria-label="Annuler"]',
      ) as HTMLButtonElement;
      croix?.click();
    });
    await new Promise((r) => setTimeout(r, 600));
  } else {
    console.log("[INFO] Aucun devis non signé — contrôle M4 sauté.");
  }

  /* ---------- M12 : sélection du devis, statut dégrisé + aperçu ---------- */
  const navFactures = await page.$(`nav button:nth-child(5)`);
  await navFactures?.click();
  await page.waitForFunction(
    () => document.body.textContent?.includes("Factures") ?? false,
    { timeout: 15000 },
  );
  await new Promise((r) => setTimeout(r, 600));
  /* « Créer une nouvelle facture » en tête de la liste. */
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("button")).find((x) =>
      (x.textContent || "").includes("Créer une nouvelle facture"),
    ) as HTMLButtonElement;
    b?.click();
  });
  await page.waitForFunction(
    () => document.body.textContent?.includes("Sélectionnez le devis à facturer") ?? false,
    { timeout: 15000 },
  );
  await new Promise((r) => setTimeout(r, 600));
  await capture(page, "selection-devis");
  const analyseSelection = await page.evaluate(() => {
    const lignes = Array.from(document.querySelectorAll("table tbody tr")) as HTMLTableRowElement[];
    let griseStatut = null as boolean | null;
    let griseReste: boolean | null = null;
    let statutTrouve = false;
    for (const tr of lignes) {
      const tds = Array.from(tr.children) as HTMLTableCellElement[];
      const celluleStatut = tds[tds.length - 1];
      const boutonStatut = celluleStatut.querySelector("button");
      if (!boutonStatut) continue; /* devis non facturé */
      statutTrouve = true;
      const opaciteStatut = Number(getComputedStyle(boutonStatut).opacity);
      const opaciteNumero = Number(getComputedStyle(tds[1]).opacity);
      griseStatut = opaciteStatut === 1;
      griseReste = opaciteNumero < 1;
      break;
    }
    return { statutTrouve, griseStatut, griseReste };
  });
  if (analyseSelection.statutTrouve) {
    controle(
      "M12 — statut « Facturée (n°) » DÉGRISÉ (clairement cliquable)",
      analyseSelection.griseStatut === true,
    );
    controle(
      "M12 — le reste de la rangée reste grisé (non sélectionnable)",
      analyseSelection.griseReste === true,
    );
    /* Clic sur le statut → espace factures avec APERÇU, PAS de modale. */
    await page.evaluate(() => {
      const boutons = Array.from(document.querySelectorAll("table button")) as HTMLButtonElement[];
      const b = boutons.find((x) => (x.getAttribute("title") || "").includes("Voir la facture"));
      b?.click();
    });
    await new Promise((r) => setTimeout(r, 1200));
    const resultatClic = await page.evaluate(() => {
      const texte = document.body.textContent ?? "";
      const apercu = Boolean(
        document.querySelector('div[role="dialog"][aria-label*="Facture"]') ||
          document.querySelector("iframe[srcdoc]"),
      );
      const modaleModification = texte.includes("Facturer le devis") || texte.includes("Modifier la facture");
      const listeFactures = texte.includes("Factures") && texte.includes("Créer une nouvelle facture");
      return { apercu, modaleModification, listeFactures };
    });
    controle(
      "M12 — clic sur le statut : la facture s'ouvre en APERÇU (plein écran)",
      resultatClic.apercu,
      `apercu=${resultatClic.apercu}`,
    );
    controle(
      "M12 — PAS de modale de modification de facture",
      !resultatClic.modaleModification,
    );
    controle("M12 — la LISTE des factures est bien l'espace affiché", resultatClic.listeFactures);
    await capture(page, "apercu-facture");
    /* Fermer l'aperçu (Échap). */
    await page.keyboard.press("Escape");
    await new Promise((r) => setTimeout(r, 500));
  } else {
    console.log("[INFO] Aucun devis déjà facturé — contrôle M12 sauté.");
  }

  /* ---------- M8 : bouton « Charger le modèle par défaut » + anti-doublon ---------- */
  const navProps = await page.$(`nav button:nth-child(3)`);
  await navProps?.click();
  await page.waitForFunction(
    () => document.body.textContent?.includes("Créer une nouvelle proposition") ?? false,
    { timeout: 15000 },
  );
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("button")).find((x) =>
      (x.textContent || "").includes("Créer une nouvelle proposition"),
    ) as HTMLButtonElement;
    b?.click();
  });
  await page.waitForFunction(
    () => document.body.textContent?.includes("Nouvelle proposition commerciale") ?? false,
    { timeout: 15000 },
  );
  await new Promise((r) => setTimeout(r, 800));
  const texteGen = await page.evaluate(() => document.body.textContent ?? "");
  controle(
    "M8 — bouton « Charger le modèle par défaut » présent",
    texteGen.includes("Charger le modèle par défaut"),
  );
  controle(
    "M8 — bouton « Enregistrer seulement » SUPPRIMÉ",
    !texteGen.includes("Enregistrer seulement"),
  );
  await capture(page, "generateur-proposition");

  /* Anti-doublon : numéro client d'une proposition EXISTANTE →
   * « Générer la proposition » doit REFUSER par un toast, SANS
   * appeler l'API (aucune écriture, aucun email). */
  const numerosExistants = await page.evaluate(async () => {
    const res = await fetch("/api/documents", { cache: "no-store" });
    const data = await res.json();
    return (data.documents ?? [])
      .filter((d: { docType: string }) => d.docType === "proposition")
      .map((d: { numero: string; numeroClient: number }) => ({ numero: d.numero, numeroClient: d.numeroClient }));
  });
  const propExistante = numerosExistants[0];
  if (propExistante) {
    requetes.length = 0;
    await page.evaluate(() => {
      const champ = document.querySelector('input[type="number"]') as HTMLInputElement;
      champ?.focus();
    });
    /* Numéro client du premier champ numérique (le formulaire ouvre
     * sur un numéro LIBRE : il faut celui de la proposition visée). */
    await page.evaluate((num) => {
      const champ = document.querySelector('input[type="number"]') as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      setter?.call(champ, String(num));
      champ.dispatchEvent(new Event("input", { bubbles: true }));
    }, propExistante.numeroClient);
    await new Promise((r) => setTimeout(r, 400));
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll("button")).find((x) =>
        (x.textContent || "").includes("Générer la proposition"),
      ) as HTMLButtonElement;
      b?.click();
    });
    await new Promise((r) => setTimeout(r, 900));
    const apres = await page.evaluate(() => document.body.textContent ?? "");
    const appelPdf = requetes.some((r) => r.startsWith("POST") && r.includes("/api/documents/pdf"));
    controle(
      `M8 — anti-doublon : proposition ${propExistante.numero} REFUSÉE par toast`,
      apres.includes("existe déjà"),
      apres.includes("existe déjà") ? "toast affiché" : "toast absent",
    );
    controle("M8 — AUCUNE requête de génération envoyée (pas d'écriture, pas d'email)", !appelPdf);
  } else {
    console.log("[INFO] Aucune proposition existante — contrôle anti-doublon sauté.");
  }

  /* ---------- M1 + M2 : portfolio, icônes seules + « Voir le projet » ---------- */
  const navPortfolio = await page.$(`nav button:nth-child(6)`);
  await navPortfolio?.click();
  await page.waitForFunction(
    () => document.body.textContent?.includes("Portfolio du site") ?? false,
    { timeout: 15000 },
  );
  await new Promise((r) => setTimeout(r, 1500));
  const analysePortfolio = await page.evaluate(() => {
    const cartes = Array.from(document.querySelectorAll("div.rounded-2xl")).filter((c) =>
      (c.textContent || "").includes("Publié") ||
      (c.textContent || "").includes("Brouillon") ||
      (c.textContent || "").includes("En ligne sur le site"),
    ) as HTMLElement[];
    let boutonsAvecTexte = 0;
    let projetsPubliesAvecVoir = 0;
    let projetsPublies = 0;
    let totalBoutons = 0;
    for (const carte of cartes) {
      const boutons = Array.from(carte.querySelectorAll("button")) as HTMLButtonElement[];
      /* boutons d'action ronds (icônes) : aria-label rempli, sans texte */
      for (const b of boutons) {
        const rond = b.className.includes("rounded-full");
        if (!rond) continue;
        totalBoutons++;
        if ((b.textContent || "").trim() !== "") boutonsAvecTexte++;
      }
      const publie =
        (carte.textContent || "").includes("Publié") ||
        (carte.textContent || "").includes("En ligne sur le site");
      if (publie) {
        projetsPublies++;
        const voir = boutons.find(
          (b) => (b.getAttribute("aria-label") || "").includes("Voir"),
        );
        if (voir) projetsPubliesAvecVoir++;
      }
    }
    return { cartes: cartes.length, boutonsAvecTexte, totalBoutons, projetsPublies, projetsPubliesAvecVoir };
  });
  controle(
    "M1 — portfolio : tous les boutons d'action SANS texte (icônes seules)",
    analysePortfolio.totalBoutons > 0 && analysePortfolio.boutonsAvecTexte === 0,
    `${analysePortfolio.totalBoutons} boutons, ${analysePortfolio.boutonsAvecTexte} avec texte`,
  );
  controle(
    "M2 — portfolio : chaque projet PUBLIÉ porte son bouton « Voir le projet »",
    analysePortfolio.projetsPublies > 0 &&
      analysePortfolio.projetsPubliesAvecVoir === analysePortfolio.projetsPublies,
    `${analysePortfolio.projetsPubliesAvecVoir}/${analysePortfolio.projetsPublies} publiés avec « Voir »`,
  );
  await capture(page, "portfolio");

  await navigateur.close();
  console.log(
    echecs === 0
      ? "\n=== VOLET 23 (UI) : TOUS LES CONTRÔLES PASSENT ==="
      : `\n=== ${echecs} CONTRÔLE(S) UI EN ÉCHEC ===`,
  );
  console.log("Captures :", Object.values(screenshots).join(", "));
  process.exit(echecs === 0 ? 0 : 1);
}

main();
