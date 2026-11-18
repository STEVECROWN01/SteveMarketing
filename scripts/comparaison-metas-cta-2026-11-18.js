/**
 * COMPARAISON AVANT/APRÈS — raccourcissement métadonnées SEO + centralisation
 * des libellés CTA (recommandations de l'audit intégral du 18/11/2026,
 * appliquées le même jour sur décision de l'éditeur).
 *
 * Usage : node scripts/comparaison-metas-cta-2026-11-18.js <avant.json> <apres.json>
 *
 * Contrôles :
 *  1. LIBELLÉS CTA INVARIANTS : pour chacune des 14 routes, la liste des
 *     libellés de boutons .btn-fill doit être STRICTEMENT identique avant /
 *     après (la centralisation CTA_LABELS est un refactor pur — zéro
 *     changement visible).
 *  2. SEUILS GOOGLE PARTOUT : title ≤ 60 car., description ≤ 155 car. sur
 *     chaque route.
 *  3. COHÉRENCE INTERNE : og:title / og:description / twitter:title /
 *     twitter:description = title / description de la page, sur chaque route.
 *  4. PÉRIMÈTRE EXACT : seules les 5 pages visées changent de title ou de
 *     description ; les 9 autres sont identiques au point d'avant.
 *  5. VALEURS ATTENDUES : les 5 nouvelles métadonnées égalent les textes
 *     prévus (aucune coquille glissée dans l'édition).
 */
const fs = require("fs");

const [avantPath, apresPath] = process.argv.slice(2);
if (!avantPath || !apresPath) {
  console.error("Usage : node scripts/comparaison-metas-cta-2026-11-18.js <avant.json> <apres.json>");
  process.exit(1);
}
const avant = JSON.parse(fs.readFileSync(avantPath, "utf8"));
const apres = JSON.parse(fs.readFileSync(apresPath, "utf8"));

/** Métadonnées attendues après application des recommandations. */
const ATTENDU = {
  accueil: {
    title: "Stevens Akpovi — Votre site web qui travaille pour vous",
    description:
      "Sites vitrines, multipages, landing pages et pages de vente pensés pour convertir. Copywriting et SEO de base inclus. Demandez votre devis personnalisé.",
  },
  methode: {
    title: "Méthode — Comment je travaille | Stevens Akpovi",
    description:
      "La méthode de Stevens Akpovi : compréhension de votre activité, parcours de vos visiteurs, conception, rédaction, développement et mise en ligne.",
  },
  referencement: {
    title: "Référencement SEO — Positionnement Google | Stevens Akpovi",
    description:
      "Améliorez votre positionnement sur Google et attirez des visiteurs sur la durée, sans dépendre de la publicité : référencement adapté à votre marché.",
  },
  "a-propos": {
    title: "À propos — Stevens Akpovi, concepteur de sites web",
    description:
      "Je conçois des sites web professionnels qui servent le business qu'ils représentent. Collaboration à distance, au-delà des frontières.",
  },
  audit: {
    title: "Audit Gratuit De Votre Site — Stevens Akpovi",
    description:
      "Votre site vous rapporte-t-il assez de clients ? Recevez un audit concret : ce qui fonctionne, ce qui freine vos visiteurs, les priorités — gratuitement.",
  },
};

let ok = 0;
let ko = 0;
const echecs = [];
const check = (cond, label) => {
  if (cond) ok++;
  else {
    ko++;
    echecs.push(label);
  }
};

const norm = (s) => (s || "").replace(/\u00A0/g, " ");

for (const route of Object.keys(apres)) {
  const a = avant[route];
  const p = apres[route];

  // 1. Libellés CTA invariants
  check(
    JSON.stringify(a.ctas) === JSON.stringify(p.ctas),
    `[${route}] CTA invariants (${a.ctas.length} boutons avant → ${p.ctas.length} après)`
  );

  // 2. Seuils Google
  check(p.title.length <= 60, `[${route}] title ≤ 60 (${p.title.length}c)`);
  check(
    norm(p.description).length <= 155,
    `[${route}] description ≤ 155 (${norm(p.description).length}c)`
  );

  // 3. og/twitter = title/description
  check(norm(p.ogTitle) === norm(p.title), `[${route}] og:title = title`);
  check(norm(p.ogDescription) === norm(p.description), `[${route}] og:description = description`);
  check(norm(p.twTitle) === norm(p.title), `[${route}] twitter:title = title`);
  check(
    norm(p.twDescription) === norm(p.description),
    `[${route}] twitter:description = description`
  );

  // 4. Périmètre : pages non visées inchangées
  if (!ATTENDU[route]) {
    check(a.title === p.title, `[${route}] title inchangé (page non visée)`);
    check(
      norm(a.description) === norm(p.description),
      `[${route}] description inchangée (page non visée)`
    );
  } else {
    // 5. Valeurs attendues pour les 5 pages visées
    check(p.title === ATTENDU[route].title, `[${route}] title = valeur attendue`);
    check(
      norm(p.description) === ATTENDU[route].description,
      `[${route}] description = valeur attendue`
    );
    if (route !== "methode" && route !== "referencement" && route !== "a-propos") {
      // methode/referencement/a-propos : title déjà conforme, seul le
      // description change ; accueil et audit : title conforme aussi
      // (accueil raccourci, audit inchangé à 44c). Aucun title ne change
      // sauf accueil :
    }
    if (route === "accueil") {
      check(a.title !== p.title, "[accueil] title bien raccourci (74 → 55)");
    }
  }
}

console.log(`\n${ok}/${ok + ko} contrôles OK`);
if (ko) {
  console.log(`ÉCHECS (${ko}) :`);
  echecs.forEach((e) => console.log("  ✗ " + e));
  process.exit(1);
}
console.log("→ Libellés CTA strictement identiques sur les 14 routes ;");
console.log("→ title ≤ 60 et description ≤ 155 partout ;");
console.log("→ og/twitter synchronisés ; périmètre exact ; textes conformes.");
