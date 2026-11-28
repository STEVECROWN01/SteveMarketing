/**
 * VOLET 28 (28/11/2026) — OUTIL « PERFORMANCE » DE L'AUDIT :
 *
 *  - NOTE GLOBALE : moyenne pondérée 60 % Performance + 40 %
 *    Structure → A ≥ 90, B ≥ 80, C ≥ 70, D ≥ 60, E ≥ 50, F ensuite ;
 *  - SCORE PERFORMANCE : les Web Vitals de Lighthouse avec leurs
 *    poids réels — LCP 25 %, TBT 30 %, CLS 25 %, FCP 10 %, SI 10 %
 *    (SI estimé à partir du FCP et du chargement complet) ;
 *  - SCORE STRUCTURE : audits de bonnes pratiques (images récentes,
 *    poids, compression, cache, temps de réponse, nombre de
 *    requêtes, polices, domaines) — chaque audit manqué retire des
 *    points, avec impact élevé / moyen / faible et conseil ;
 *  - DÉTAILS DE LA PAGE : poids total, requêtes et répartition par
 *    type (JS, CSS, images, polices…) ;
 *  - CASCADE : chaque requête avec son début, sa durée, son poids.
 *
 * Tout est mesuré dans un VRAI Chrome (Puppeteer) par le protocole
 * DevTools, directement.
 */
import type { Page } from "puppeteer-core";
import { ouvrirNavigateur } from "./navigateur";
import { noteDepuisScore, type AuditPerf, type DetailType, type LigneCascade, type RelevePerformance, type Vital } from "./types";

/** Courbe de score d'une métrique : 100 sous `bon`, 0 au-delà de
 *  `mauvais`, linéaire entre les deux (barème Lighthouse simplifié). */
function scoreLineaire(valeur: number, bon: number, mauvais: number): number {
  if (valeur <= bon) return 100;
  if (valeur >= mauvais) return 0;
  return Math.round(100 * (mauvais - valeur) / (mauvais - bon));
}

function typeDepuisUrl(url: string, resourceType?: string): DetailType["type"] {
  const chemin = url.split("?")[0].toLowerCase();
  if (resourceType === "Script" || /\.m?js(\.map)?$/.test(chemin) || /\/_next\/static\/chunks\//.test(chemin)) return "JavaScript";
  if (resourceType === "Stylesheet" || /\.css(\.map)?$/.test(chemin)) return "CSS";
  if (resourceType === "Font" || /\.(woff2?|ttf|otf|eot)$/.test(chemin)) return "Polices";
  if (resourceType === "Document" || /\.x?html?$/.test(chemin)) return "HTML";
  if (/\.(png|jpe?g|gif|svg|webp|avif|ico|bmp)$/.test(chemin)) return "Images";
  if (resourceType === "Image") return "Images";
  return "Autre";
}

function octetsLisibles(octets: number): string {
  if (octets >= 1024 * 1024) return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
  if (octets >= 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${octets} o`;
}

/** Mesure la page et produit le relevé complet. */
export async function auditerPerformance(url: string): Promise<RelevePerformance> {
  const browser = await ouvrirNavigateur();
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1280, height: 800 });

    /* --- métriques observées AVANT la navigation (les observateurs
     *      doivent être posés avant le premier rendu) --- */
    await page.evaluateOnNewDocument(() => {
      (window as unknown as Record<string, unknown>).__metriques = {
        fcp: 0,
        lcp: 0,
        cls: 0,
        tbt: 0,
        premiers: [] as number[],
      };
      const w = window as unknown as {
        __metriques: { fcp: number; lcp: number; cls: number; tbt: number; premiers: number[] };
        PerformanceObserver: typeof PerformanceObserver;
      };
      try {
        new w.PerformanceObserver((liste) => {
          for (const entree of liste.getEntries()) {
            if (entree.name === "first-contentful-paint") w.__metriques.fcp = entree.startTime;
          }
        }).observe({ type: "paint", buffered: true });
        new w.PerformanceObserver((liste) => {
          for (const entree of liste.getEntries()) {
            if (entree.name === "largest-contentful-paint") w.__metriques.lcp = entree.startTime;
          }
        }).observe({ type: "largest-contentful-paint", buffered: true });
        new w.PerformanceObserver((liste) => {
          for (const entree of liste.getEntries()) {
            const metrique = entree as PerformanceEntry & { hadRecentInput?: boolean; value: number };
            if (!metrique.hadRecentInput) w.__metriques.cls += metrique.value;
          }
        }).observe({ type: "layout-shift", buffered: true });
      } catch {
        /* navigateur sans PerformanceObserver : tout reste à 0 */
      }
    });

    /* --- réseau : chaque requête suivie par le protocole DevTools --- */
    interface Requête {
      url: string;
      type: DetailType["type"];
      octets: number;
      debut: number;
      fin: number;
      statut: number;
      encodage?: string;
      cache?: string;
    }
    const requetes = new Map<string, Requête>();
    const domaines = new Set<string>();
    const cdp = await page.createCDPSession();
    await cdp.send("Network.enable");
    cdp.on("Network.requestWillBeSent", (e) => {
      const ev = e as unknown as { requestId: string; request: { url: string }; timestamp: number; type?: string };
      if (!ev.request.url.startsWith("http")) return;
      requetes.set(ev.requestId, {
        url: ev.request.url,
        type: typeDepuisUrl(ev.request.url, ev.type),
        octets: 0,
        debut: ev.timestamp * 1000,
        fin: 0,
        statut: 0,
      });
    });
    cdp.on("Network.responseReceived", (e) => {
      const ev = e as unknown as {
        requestId: string;
        response: { url: string; status: number; mimeType: string; headers: Record<string, string>; fromDiskCache?: boolean };
      };
      const r = requetes.get(ev.requestId);
      if (r) {
        r.statut = ev.response.status;
        r.encodage = ev.response.headers?.["content-encoding"] ?? ev.response.headers?.["Content-Encoding"];
        r.cache = ev.response.headers?.["cache-control"] ?? ev.response.headers?.["Cache-Control"];
      }
    });
    cdp.on("Network.loadingFinished", (e) => {
      const ev = e as unknown as { requestId: string; timestamp: number; encodedDataLength: number };
      const r = requetes.get(ev.requestId);
      if (r) {
        r.fin = ev.timestamp * 1000;
        r.octets = ev.encodedDataLength || r.octets;
      }
    });

    const debutNavigation = Date.now();
    let chargeComplete = 0;
    let ttfb = 0;
    try {
      const reponse = await page.goto(url, { waitUntil: "load", timeout: 45000 });
      ttfb = Date.now() - debutNavigation;
      /* TTFB précis : navigationStart → responseStart du navigateur */
      try {
        const nav = await page.evaluate(() => {
          const n = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
          return n ? { ttfb: n.responseStart, duree: n.duration } : null;
        });
        if (nav && nav.ttfb > 0) ttfb = Math.round(nav.ttfb);
      } catch {
        /* garde la mesure haute résolution */
      }
      chargeComplete = Date.now() - debutNavigation;
      try {
        await page.waitForNetworkIdle({ idleTime: 1200, timeout: 8000 });
        chargeComplete = Date.now() - debutNavigation;
      } catch {
        /* la page est déjà chargée — on garde la mesure */
      }
    } catch (e) {
      throw new Error(
        `La page n'a pas chargé (${e instanceof Error ? e.message.split("\n")[0] : "erreur inconnue"}). Vérifiez l'URL.`,
      );
    }

    /* --- TBT : total des longtasks au-delà de 50 ms --- */
    let tbt = 0;
    try {
      tbt = await page.evaluate(
        () =>
          new Promise<number>((resoudre) => {
            let total = 0;
            try {
              const obs = new PerformanceObserver((liste) => {
                for (const e of liste.getEntries()) total += Math.max(0, e.duration - 50);
              });
              obs.observe({ type: "longtask", buffered: true });
              /* les longtasks sont déjà terminées : on lit puis on coupe */
              setTimeout(() => {
                obs.disconnect();
                resoudre(Math.round(total));
              }, 300);
            } catch {
              resoudre(0);
            }
          }),
      );
    } catch {
      tbt = 0;
    }

    /* --- métriques collectées dans la page --- */
    const metriques = (await page.evaluate(() => {
      const w = window as unknown as {
        __metriques?: { fcp: number; lcp: number; cls: number; tbt: number; premiers: number[] };
      };
      const n = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      return {
        fcp: w.__metriques?.fcp ?? 0,
        lcp: w.__metriques?.lcp ?? 0,
        cls: w.__metriques?.cls ?? 0,
        charge: n ? Math.round(n.duration) : 0,
      };
    }).catch(() => ({ fcp: 0, lcp: 0, cls: 0, charge: 0 }))) as { fcp: number; lcp: number; cls: number; charge: number };

    const fcp = Math.round(metriques.fcp);
    const lcp = Math.round(metriques.lcp || metriques.fcp);
    const cls = Math.round(metriques.cls * 1000) / 1000;
    if (metriques.charge > chargeComplete) chargeComplete = metriques.charge;

    /* --- Web Vitals (poids réels de Lighthouse) --- */
    const si = Math.round(fcp + 0.4 * Math.max(0, chargeComplete - fcp));
    const courbes: { code: Vital["code"]; libelle: string; valeur: number; unite: Vital["unite"]; bon: number; mauvais: number }[] = [
      { code: "lcp", libelle: "Largest Contentful Paint", valeur: lcp / 1000, unite: "s", bon: 2.5, mauvais: 4.0 },
      { code: "tbt", libelle: "Total Blocking Time", valeur: tbt / 1000, unite: "s", bon: 0.2, mauvais: 0.6 },
      { code: "cls", libelle: "Cumulative Layout Shift", valeur: cls, unite: "", bon: 0.1, mauvais: 0.25 },
      { code: "fcp", libelle: "First Contentful Paint", valeur: fcp / 1000, unite: "s", bon: 1.8, mauvais: 3.0 },
      { code: "si", libelle: "Speed Index (estimé)", valeur: si / 1000, unite: "s", bon: 3.4, mauvais: 5.8 },
    ];
    const vitals: Vital[] = courbes.map((c) => ({
      ...c,
      score: scoreLineaire(c.valeur, c.bon, c.mauvais),
    }));
    const poids = { lcp: 0.25, tbt: 0.3, cls: 0.25, fcp: 0.1, si: 0.1 };
    const scorePerformance = Math.max(
      0,
      Math.min(100, Math.round(vitals.reduce((somme, v) => somme + v.score * poids[v.code], 0))),
    );

    /* --- détails de la page : répartition par type --- */
    const listeRequetes = [...requetes.values()].filter((r) => r.url.startsWith("http"));
    const poidsTotal = listeRequetes.reduce((s, r) => s + r.octets, 0);
    for (const r of listeRequetes) {
      try {
        domaines.add(new URL(r.url).hostname);
      } catch {
        /* URL mal formée ignorée */
      }
    }
    const parType = new Map<DetailType["type"], { nb: number; octets: number }>();
    for (const r of listeRequetes) {
      const t = parType.get(r.type) ?? { nb: 0, octets: 0 };
      t.nb += 1;
      t.octets += r.octets;
      parType.set(r.type, t);
    }
    const ordreTypes: DetailType["type"][] = ["HTML", "JavaScript", "CSS", "Images", "Polices", "Autre"];
    const detailsTypes = ordreTypes
      .map((type) => ({ type, ...(parType.get(type) ?? { nb: 0, octets: 0 }) }))
      .filter((d) => d.nb > 0);

    /* --- audits de STRUCTURE (les recommandations) --- */
    const audits: AuditPerf[] = [];
    const imagesVieilles = listeRequetes.filter((r) => r.type === "Images" && /\.(png|jpe?g|gif|bmp)(\?|$)/i.test(r.url));
    const octetsImagesVieilles = imagesVieilles.reduce((s, r) => s + r.octets, 0);
    if (octetsImagesVieilles > 100 * 1024) {
      audits.push({
        titre: "Servir les images aux formats récents",
        impact: octetsImagesVieilles > 1024 * 1024 ? "élevé" : "moyen",
        points: octetsImagesVieilles > 1024 * 1024 ? 12 : 6,
        detail: `${imagesVieilles.length} image(s) PNG/JPEG (${octetsLisibles(octetsImagesVieilles)}) — WebP/AVIF pèsent souvent 30 à 60 % de moins.`,
        conseil: "Convertissez les images en WebP ou AVIF (compression moderne, qualité visuelle identique).",
      });
    }
    if (poidsTotal > 3 * 1024 * 1024) {
      audits.push({
        titre: "Réduire le poids de la page",
        impact: poidsTotal > 7 * 1024 * 1024 ? "élevé" : "moyen",
        points: poidsTotal > 7 * 1024 * 1024 ? 14 : 7,
        detail: `${octetsLisibles(poidsTotal)} transférés au chargement — une page légère s'affiche plus vite, surtout sur mobile.`,
        conseil: "Compressez les images, allégez les vidéos et n'envoyez que ce qui est affiché.",
      });
    }
    if (ttfb > 600) {
      audits.push({
        titre: "Réduire le temps de réponse initial du serveur",
        impact: ttfb > 1200 ? "élevé" : "moyen",
        points: ttfb > 1200 ? 12 : 6,
        detail: `Premier octet reçu en ${(ttfb / 1000).toFixed(2)} s — recommandé : moins de 0,6 s.`,
        conseil: "Activez la mise en cache serveur, un CDN, et vérifiez la vitesse d'hébergement.",
      });
    }
    const grosTexteSansCompression = listeRequetes.filter(
      (r) => ["JavaScript", "CSS", "HTML"].includes(r.type) && r.octets > 20 * 1024 && !r.encodage,
    );
    if (grosTexteSansCompression.length > 0) {
      audits.push({
        titre: "Activer la compression des textes",
        impact: grosTexteSansCompression.reduce((s, r) => s + r.octets, 0) > 500 * 1024 ? "élevé" : "moyen",
        points: 8,
        detail: `${grosTexteSansCompression.length} ressource(s) texte volumineuse(s) sans gzip/brotli.`,
        conseil: "Activez gzip ou brotli sur le serveur (Content-Encoding).",
      });
    }
    if (listeRequetes.length > 80) {
      audits.push({
        titre: "Réduire le nombre de requêtes",
        impact: listeRequetes.length > 150 ? "moyen" : "faible",
        points: 5,
        detail: `${listeRequetes.length} requêtes pour afficher la page — chaque aller-retour coûte du temps.`,
        conseil: "Regroupez les fichiers (bundles) et limitez les ressources externes.",
      });
    }
    const polices = listeRequetes.filter((r) => r.type === "Polices");
    if (polices.length > 4) {
      audits.push({
        titre: "Limiter les polices web",
        impact: "faible",
        points: 4,
        detail: `${polices.length} fichiers de police chargés — chaque police ralentit l'affichage du texte.`,
        conseil: "Gardez 2 polices (titres + texte) maximum et préchargez la police principale.",
      });
    }
    if (domaines.size > 6) {
      audits.push({
        titre: "Réduire le nombre de domaines",
        impact: "faible",
        points: 3,
        detail: `${domaines.size} domaines contactés — chaque domaine ajoute une résolution DNS et une connexion.`,
        conseil: "Hébergez les ressources vous-même ou limitez les services tiers.",
      });
    }
    const statiquesSansCache = listeRequetes.filter(
      (r) => ["JavaScript", "CSS", "Images", "Polices"].includes(r.type) && !r.cache,
    );
    if (statiquesSansCache.length > 3) {
      audits.push({
        titre: "Activer la mise en cache du navigateur",
        impact: "faible",
        points: 4,
        detail: `${statiquesSansCache.length} ressource(s) statique(s) sans Cache-Control — rechargées à chaque visite.`,
        conseil: "Servez les fichiers statiques avec Cache-Control (ex. 1 an, avec version d'URL).",
      });
    }
    const scoreStructure = Math.max(0, 100 - audits.reduce((s, a) => s + a.points, 0));

    /* --- note globale : 60 % performance + 40 % structure --- */
    const scoreGlobal = Math.round(0.6 * scorePerformance + 0.4 * scoreStructure);

    /* --- cascade (waterfall) --- */
    const debutMin = Math.min(...listeRequetes.map((r) => r.debut));
    const cascade: LigneCascade[] = listeRequetes
      .sort((a, b) => a.debut - b.debut)
      .slice(0, 120)
      .map((r, i) => ({
        ordre: i + 1,
        url: r.url,
        type: r.type,
        octets: r.octets,
        debut: Math.max(0, Math.round(r.debut - debutMin)),
        duree: Math.max(1, Math.round((r.fin || r.debut + 50) - r.debut)),
        statut: r.statut,
      }));

    return {
      ok: true,
      url,
      note: noteDepuisScore(scoreGlobal),
      scorePerformance,
      scoreStructure,
      vitals,
      chargeComplete,
      ttfb,
      poidsTotal,
      nbRequetes: listeRequetes.length,
      domaines: domaines.size,
      detailsTypes,
      audits,
      cascade,
    };
  } finally {
    await page.close().catch(() => undefined);
  }
}
