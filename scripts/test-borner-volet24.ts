/* Test des fonctions de bornage (VOLET 24) — pire cas et modèle. */
import {
  BUDGETS_PROPOSITION,
  bornerLignes,
  bornerPresentation,
  lignesEstimeesPresentation,
  sommeLignes,
} from "../src/lib/documents/budgets-proposition";
import { propositionV2ParDefaut } from "../src/lib/documents/proposition";

const t = (n: number, graine = "conception sur mesure de votre site web professionnel pour presenter votre expertise ") => {
  let s = "";
  while (s.length < n) s += graine;
  return s.slice(0, n).trimEnd();
};

let ok = true;
function check(nom: string, cond: boolean, detail: string) {
  console.log(`${cond ? "✓" : "✗"} ${nom} ${detail}`);
  if (!cond) ok = false;
}

/* 1. Le MODÈLE doit charger dans ses propres budgets. */
const m = propositionV2ParDefaut();
const presB = bornerPresentation(m.sections.presentation);
check(
  "modèle → présentation inchangée",
  presB.join("\n") === m.sections.presentation.join("\n"),
  `(${sommeLignes(presB)}/750 car., ${lignesEstimeesPresentation(presB)}/10 lignes)`,
);
for (const [nom, lignes] of Object.entries({
  objectifs: m.sections.objectifs,
  investissementNotes: m.sections.investissementNotes,
  calendrierEtapes: m.sections.calendrierEtapes,
  validation: m.sections.validation,
  conclusion: m.sections.conclusion,
}) as [string, string[]][]) {
  const b = bornerLignes(lignes, BUDGETS_PROPOSITION[nom as keyof typeof BUDGETS_PROPOSITION] as never);
  check(`modèle → ${nom} inchangé`, b.join("\n") === lignes.join("\n"), `(${b.length} lignes)`);
}

/* 2. Pire cas : 6 paragraphes de 300 caractères → borné à 4 paras /
      215 car. / 750 total / 10 lignes. */
const pire = bornerPresentation([t(300), t(300), t(300), t(300), t(300), t(300)]);
check(
  "pire cas (6×300) → borné",
  pire.length <= 4 &&
    pire.every((l) => l.length <= 215) &&
    sommeLignes(pire) <= 750 &&
    lignesEstimeesPresentation(pire) <= 10,
  `(${pire.length} paras, ${sommeLignes(pire)}/750 car., ${lignesEstimeesPresentation(pire)}/10 lignes)`,
);

/* 3. Cas « lignes nombreuses » : 4 paragraphes de 176 (12 lignes
      rendues à la mesure) → borné à 10 lignes. */
const nombreLignes = bornerPresentation([t(176), t(176), t(176), t(176)]);
check(
  "4×176 car. → ≤ 10 lignes estimées",
  lignesEstimeesPresentation(nombreLignes) <= 10,
  `(${lignesEstimeesPresentation(nombreLignes)} lignes estimées, ${sommeLignes(nombreLignes)} car.)`,
);

/* 4. Une seule très longue ligne. */
const une = bornerPresentation([t(700)]);
check(
  "1×700 → 1 paragraphe ≤ 215",
  une.length === 1 && une[0].length <= 215,
  `(${une.length} para, ${une[0].length} car.)`,
);

/* 5. bornerLignes générique : lignes en trop coupées. */
const obj = bornerLignes(
  Array.from({ length: 12 }, (_, i) => t(70 + i)),
  BUDGETS_PROPOSITION.objectifs,
);
check(
  "12 objectifs → 7 max",
  obj.length <= 7 && obj.every((l) => l.length <= 80),
  `(${obj.length} lignes de ≤ ${Math.max(...obj.map((l) => l.length))} car.)`,
);

console.log(ok ? "\nTOUS LES TESTS PASSENT" : "\nÉCHEC");
process.exit(ok ? 0 : 1);
