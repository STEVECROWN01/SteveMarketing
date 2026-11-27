/**
 * MESURE DU MOULAGE DU GABARIT (VOLET 24 — budgets de caractères).
 *
 * Pour CHAQUE page du rendu du modèle par défaut : dernier bloc, bas du
 * dernier bloc vs la limite (960 px), espace restant — puis la PAGE de
 * DÉPART de chaque section (01-08). C'est la base du calcul des
 * budgets : chaque champ doit pouvoir être rempli sans déplacer les
 * sections de la page où le modèle les pose.
 */
import { renderPropositionHtml } from "../src/lib/documents/proposition-html";
import { propositionV2ParDefaut } from "../src/lib/documents/proposition";
import { readFileSync, mkdirSync } from "fs";
import { chromium } from "playwright";

const LIMITE_PX = Math.round((720 * 4) / 3);
const logo = readFileSync("public/assets/logo-noir.png");
const logoData = `data:image/png;base64,${logo.toString("base64")}`;

function construire(sections?: Partial<ReturnType<typeof propositionV2ParDefaut>["sections"]>) {
  const base = propositionV2ParDefaut();
  const rec = {
    ...base,
    sections: { ...base.sections, ...(sections ?? {}) },
    destinataire: { nomComplet: "Aïcha Dossou", entreprise: "Cabinet Essentiel & Stratégie" },
    docType: "proposition" as const,
    id: "",
    numero: "PC2600001",
    numeroClient: 1,
    date: "2026-11-27",
    createdAt: "",
    updatedAt: "",
  };
  return renderPropositionHtml(rec, logoData);
}

async function mesurer(html: string) {
  const nav = await chromium.launch();
  const page = await nav.newPage({ viewport: { width: 1000, height: 1400 } });
  await page.setContent(html, { waitUntil: "load" });
  await page.waitForFunction("window.__pagesPc > 0", null, { timeout: 15000 });
  await page.waitForTimeout(1500);
  const res = await page.evaluate(`((limitePx) => {
    const pages = Array.from(document.querySelectorAll(".ppage"));
    const moulePages = [];
    for (const p of pages) {
      const blocs = Array.from(p.querySelectorAll(".corps [data-bloc]"));
      const dernier = blocs.length ? blocs[blocs.length - 1] : null;
      const pTop = p.getBoundingClientRect().top;
      const num = Number(p.getAttribute("data-page"));
      let basDernier = 0;
      let dernierTexte = "";
      if (dernier) {
        basDernier = Math.round(dernier.getBoundingClientRect().bottom - pTop);
        dernierTexte = (dernier.textContent || "").trim().slice(0, 40);
      }
      moulePages.push({ page: num, basDernier, restant: limitePx - basDernier, dernierTexte });
    }
    const sections = {};
    for (const b of document.querySelectorAll("[data-bloc]")) {
      if (b.classList.contains("s-head")) {
        const num = ((b.querySelector(".s-num")?.textContent || "")).trim();
        if (num && !sections[num]) {
          sections[num] = Number((b.closest(".ppage")?.getAttribute("data-page")) || -1);
        }
      }
    }
    return { pages: window.__pagesPc, moulePages, sections };
  })(${LIMITE_PX})`);
  await nav.close();
  return res as {
    pages: number;
    moulePages: { page: number; basDernier: number; restant: number; dernierTexte: string }[];
    sections: Record<string, number>;
  };
}

(async () => {
  mkdirSync("/tmp/render", { recursive: true });
  console.log("== Rendu du MODÈLE PAR DÉFAUT (avec destinataire) ==");
  const m = await mesurer(construire());
  console.log("pages:", m.pages);
  console.log("départ des sections:", JSON.stringify(m.sections));
  for (const p of m.moulePages) {
    console.log(
      `  page ${p.page} : bas dernier bloc = ${p.basDernier}px, restant = ${p.restant}px  « ${p.dernierTexte} »`,
    );
  }
})();
