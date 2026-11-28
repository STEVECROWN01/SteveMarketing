/**
 * VOLET 28 — lancement du navigateur d'audit (le même que la
 * génération PDF : @sparticuz/chromium sur Vercel, Chrome local au
 * développement), avec une instance réutilisée par le processus.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import puppeteer, { type Browser } from "puppeteer-core";

let browserInstance: Browser | null = null;

function findLocalChrome(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const racines = [
    path.join(os.homedir(), ".cache", "ms-playwright"),
    path.join(process.cwd(), "node_modules", ".cache", "ms-playwright"),
  ];
  for (const racine of racines) {
    if (!fs.existsSync(racine)) continue;
    for (const version of fs.readdirSync(racine).sort().reverse()) {
      for (const dossier of ["chrome-linux64", "chrome-linux", "chrome"]) {
        const exe = path.join(racine, version, dossier, "chrome");
        if (fs.existsSync(exe)) return exe;
      }
    }
  }
  for (const p of [
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/local/bin/chromium",
  ]) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

export async function ouvrirNavigateur(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) return browserInstance;

  const argsBase = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--disable-software-rasterizer",
  ];

  let executablePath: string | undefined;
  let args = argsBase;
  if (process.env.VERCEL) {
    const { default: chromium } = await import("@sparticuz/chromium");
    executablePath = await chromium.executablePath();
    args = chromium.args as unknown as string[];
  } else {
    executablePath = findLocalChrome();
    if (!executablePath) {
      throw new Error("Aucun exécutable Chrome/Chromium trouvé — définissez PUPPETEER_EXECUTABLE_PATH.");
    }
  }

  browserInstance = await puppeteer.launch({ headless: true, executablePath, args });
  return browserInstance;
}
