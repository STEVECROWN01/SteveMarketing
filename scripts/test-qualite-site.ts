/**
 * VOLET 32 — TESTS du diagnostic de qualité des sites prospects.
 * Run : bun scripts/test-qualite-site.ts
 *
 * Gabarits HTML synthétiques (vieux site WordPress des années 2010,
 * site moderne type Wix, site intermédiaire) + cas limites (email,
 * plateforme, année de copyright) — validés par assertions.
 */
import { analyserPageSite, chercherEmailDansHtml, type QualiteSite } from "../src/lib/scraping/qualite-site";

let ok = 0;
let total = 0;
function controle(label: string, condition: boolean, detail = "") {
  total++;
  if (condition) {
    ok++;
    console.log(`  ✓ ${label}`);
  } else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

/* ---------- Gabarit 1 : vieux site « à refaire » ---------- */
const vieuxSite = `<!DOCTYPE html>
<html><head><title>Boulangerie Dupont</title></head>
<frameset rows="80,*"><frame src="menu.html"><frame src="accueil.html"></frameset>
<body>
<p>Bienvenue ! Contactez-nous à contact@boulangerie-dupont.fr</p>
<div>Copyright 2014 Boulangerie Dupont</div>
<object data="animation.swf" type="application/x-shockwave-flash"></object>
</body></html>`;
const vieux = analyserPageSite(vieuxSite, { https: false, tailleOctets: 90_000, url: "http://boulangerie-dupont.fr" });

console.log("1. Vieux site (HTTP, frameset, Flash, 2014, sans viewport)");
controle("verdict « à refaire »", vieux.verdict === "a-refaire", `obtenu : ${vieux.verdict} (${vieux.score})`);
controle("score bas (< 40)", vieux.score < 40, `obtenu : ${vieux.score}`);
controle("pas de mobile (viewport absent)", vieux.mobile === false);
controle("HTTPS manquant signalé", vieux.problemes.some((p) => p.includes("HTTPS")));
controle("mise à jour 2014 signalée", vieux.anneeMiseAJour === 2014 && vieux.problemes.some((p) => p.includes("2014")));
controle("email trouvé", chercherEmailDansHtml(vieuxSite) === "contact@boulangerie-dupont.fr");

/* ---------- Gabarit 2 : site moderne « correct » ---------- */
const siteModerne = `<!DOCTYPE html>
<html lang="fr"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Institut Beauté — Soins du visage à Lomé</title>
<meta name="description" content="Institut de beauté à Lomé : soins du visage, épilation et conseils personnalisés.">
<script>/*<![CDATA[*/ var Squarespace = {}; window.Static = {SQUARESPACE_CONTEXT:{}}; /*]]>*/</script>
</head>
<body>
<h1>Institut Beauté — l'expertise visage à Lomé</h1>
<footer>© 2026 Institut Beauté. Tous droits réservés.</footer>
</body></html>`;
const moderne = analyserPageSite(siteModerne, { https: true, tailleOctets: 120_000, url: "https://institut-beaute.tg" });

console.log("2. Site moderne (HTTPS, viewport, description, H1, 2026)");
controle("verdict « correct »", moderne.verdict === "correct", `obtenu : ${moderne.verdict} (${moderne.score})`);
controle("score élevé (≥ 90)", moderne.score >= 90, `obtenu : ${moderne.score}`);
controle("plateforme Squarespace", moderne.plateforme === "Squarespace", `obtenu : ${moderne.plateforme}`);
controle("année 2026", moderne.anneeMiseAJour === 2026);
controle("aucun problème", moderne.problemes.length === 0, moderne.problemes.join(" | "));

/* ---------- Gabarit 3 : site moyen ---------- */
const siteMoyen = `<!DOCTYPE html>
<html lang="fr"><head>
<title>Cabinet Kiné Plus</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<div>Bienvenue au cabinet</div>
<a href="mailto:contact@kineplus.fr">Nous écrire</a>
<div>© 2021 Cabinet Kiné Plus — <a href="/wp-content/themes/kiné/style.css">thème</a></div>
</body></html>`;
const moyen = analyserPageSite(siteMoyen, { https: true, tailleOctets: 300_000, url: "https://kineplus.fr" });

console.log("3. Site moyen (sans description, sans H1, 2021, WordPress, 300 Ko)");
controle("verdict « moyen »", moyen.verdict === "moyen", `obtenu : ${moyen.verdict} (${moyen.score})`);
controle("score médian (40-80)", moyen.score >= 40 && moyen.score < 80, `obtenu : ${moyen.score}`);
controle("plateforme WordPress", moyen.plateforme === "WordPress", `obtenu : ${moyen.plateforme}`);
controle("description manquante signalée", moyen.metaDescription === false && moyen.problemes.some((p) => p.includes("Description Google")));
controle("H1 manquant signalé", moyen.h1 === false && moyen.problemes.some((p) => p.includes("H1")));
controle("email mailto trouvé", chercherEmailDansHtml(siteMoyen) === "contact@kineplus.fr");

/* ---------- Cas limites ---------- */
console.log("4. Cas limites");
controle("email d'image ignoré", chercherEmailDansHtml('<img src="logo@2x.png"> photo@exemple.png') === undefined);
controle("email sentry ignoré", chercherEmailDansHtml("erreur@sentry.io contact@entreprise.fr") === "contact@entreprise.fr");
controle("année absente → undefined", analyserPageSite("<html><body>x</body></html>", { https: true, tailleOctets: 1000, url: "https://a.fr" }).anneeMiseAJour === undefined);
controle("page lourde pénalisée", analyserPageSite(siteModerne, { https: true, tailleOctets: 2_000_000, url: "https://a.fr" }).score < moderne.score);

/* ---------- Les trois verdicts restent distincts ---------- */
console.log("5. Hiérarchie des verdicts");
const scores: [QualiteSite["verdict"], number][] = [
  [vieux.verdict, vieux.score],
  [moyen.verdict, moyen.score],
  [moderne.verdict, moderne.score],
];
controle("vieux < moyen < moderne", vieux.score < moyen.score && moyen.score < moderne.score, `${vieux.score} / ${moyen.score} / ${moderne.score}`);
controle("verdicts distincts", new Set(scores.map(([v]) => v)).size === 3, scores.map(([v]) => v).join(", "));

console.log("");
console.log(`TESTS QUALITÉ SITE : ${ok}/${total}`);
process.exit(ok === total ? 0 : 1);
