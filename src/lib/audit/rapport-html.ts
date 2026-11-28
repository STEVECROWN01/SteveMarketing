/**
 * VOLET 29 (28/11/2026) — RAPPORTS PDF DE L'AUDIT COMPLET.
 *
 * Deux documents professionnels, générés en HTML puis rendus en PDF
 * par le navigateur du back-office (même moteur que les documents
 * commerciaux) :
 *  - l'AUDIT COMPLET (le titre dit « AUDIT COMPLET », jamais
 *    « rapport », demande de l'éditeur) : synthèse notée puis les
 *    trois blocs — performance, SEO, structure / design /
 *    copywriting / conversion ;
 *  - les AXES D'AMÉLIORATION : tout ce qu'il faut corriger, par
 *    bloc et par priorité, pour amener le site à 100 %.
 *
 * Aucune requête externe : polices système, images en data URI.
 */
import type { AuditComplet, AxeAmelioration } from "./complet";
import { compilerAxes, scorePerformanceComposite } from "./complet";

function couleur(score: number): string {
  if (score >= 90) return "#16a34a";
  if (score >= 70) return "#65a30d";
  if (score >= 50) return "#d97706";
  return "#dc2626";
}

function octets(o: number): string {
  if (o >= 1024 * 1024) return `${(o / (1024 * 1024)).toFixed(1)} Mo`;
  if (o >= 1024) return `${Math.round(o / 1024)} Ko`;
  return `${o} o`;
}

function secondes(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms)} ms`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function dateFr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

const CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; color: #141414; font-size: 12px; line-height: 1.55; }
  .bandeau { background: #141414; color: #fff; padding: 34px 40px; border-radius: 14px; }
  .bandeau .surtitre { font-size: 11px; letter-spacing: 0.28em; text-transform: uppercase; color: #b9b9b9; }
  .bandeau h1 { font-size: 34px; letter-spacing: 0.04em; margin-top: 6px; }
  .bandeau .site { margin-top: 10px; font-size: 14px; color: #e6e6e6; }
  .synthese { display: flex; gap: 22px; margin-top: 20px; align-items: stretch; }
  .note-globale { width: 150px; text-align: center; border: 1px solid #e3e3e3; border-radius: 14px; padding: 16px 10px; }
  .note-globale .lettre { font-size: 44px; font-weight: 700; line-height: 1.1; }
  .note-globale .valeur { font-size: 13px; color: #555; }
  .blocs-scores { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 12px; }
  .ligne-score { display: flex; align-items: center; gap: 12px; }
  .ligne-score .nom { width: 210px; font-weight: 600; font-size: 12.5px; }
  .ligne-score .barre { flex: 1; height: 10px; background: #efefef; border-radius: 6px; overflow: hidden; }
  .ligne-score .barre > div { height: 100%; border-radius: 6px; }
  .ligne-score .val { width: 62px; text-align: right; font-weight: 700; font-size: 12.5px; }
  h2.section { margin: 26px 0 4px; font-size: 17px; letter-spacing: 0.02em; border-left: 5px solid #141414; padding-left: 12px; page-break-after: avoid; }
  p.sous-section { color: #6b6b6b; margin-bottom: 12px; font-size: 11.5px; }
  .grille { display: flex; flex-wrap: wrap; gap: 10px; page-break-inside: avoid; }
  .case { flex: 1 1 120px; border: 1px solid #e3e3e3; border-radius: 10px; padding: 10px 12px; }
  .case .k { font-size: 9.5px; letter-spacing: 0.12em; text-transform: uppercase; color: #777; }
  .case .v { font-size: 17px; font-weight: 700; margin-top: 3px; }
  .case .s { font-size: 10px; color: #888; margin-top: 2px; }
  .conseil { border: 1px solid #e3e3e3; border-radius: 10px; padding: 12px 14px; margin-bottom: 9px; page-break-inside: avoid; }
  .conseil .t { font-weight: 700; font-size: 12.5px; }
  .conseil .impact { display: inline-block; font-size: 9.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; border-radius: 20px; padding: 2px 9px; margin-left: 6px; }
  .conseil .d { color: #555; margin-top: 5px; font-size: 11.5px; }
  .conseil .c { margin-top: 4px; font-size: 11.5px; }
  .apercu-google { border: 1px solid #e3e3e3; border-radius: 10px; padding: 12px 14px; margin-top: 10px; page-break-inside: avoid; }
  .apercu-google .u { color: #1a7f37; font-size: 11px; }
  .apercu-google .t { color: #1a0dab; font-size: 15px; margin-top: 2px; }
  .apercu-google .desc { color: #555; font-size: 11.5px; margin-top: 3px; }
  .famille { border: 1px solid #e3e3e3; border-radius: 10px; padding: 10px 14px; margin-bottom: 8px; page-break-inside: avoid; }
  .famille .t { font-weight: 700; }
  .famille li { margin-left: 16px; margin-top: 3px; color: #444; font-size: 11.5px; }
  ul.forces { list-style: none; }
  ul.forces li { padding-left: 20px; position: relative; margin-bottom: 5px; page-break-inside: avoid; }
  ul.forces li:before { content: "✓"; position: absolute; left: 0; color: #16a34a; font-weight: 700; }
  .capture { width: 100%; border: 1px solid #e3e3e3; border-radius: 10px; margin-top: 10px; page-break-inside: avoid; }
  .axe { border: 1px solid #e3e3e3; border-left: 5px solid #d97706; border-radius: 10px; padding: 12px 14px; margin-bottom: 9px; page-break-inside: avoid; }
  .axe.haute { border-left-color: #dc2626; }
  .axe.basse { border-left-color: #65a30d; }
  .axe .t { font-weight: 700; font-size: 12.5px; }
  .axe .p { float: right; font-size: 9.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; border-radius: 20px; padding: 2px 9px; background: #f3f3f3; }
  .axe .d { color: #555; margin-top: 5px; font-size: 11.5px; }
  .axe .c { margin-top: 4px; font-size: 11.5px; }
  .aucun { color: #6b6b6b; font-style: italic; }
`;

function htmlValeurSecurisee(s: string): string {
  return esc(s);
}

/** La synthèse notée (bandeau + note globale + trois blocs). */
function htmlSynthese(a: AuditComplet): string {
  const perf = scorePerformanceComposite(a.performance);
  const lignes = [
    { nom: "Rapport performance", score: perf, detail: `${a.performance.scorePerformance} perf × 60 % + ${a.performance.scoreStructure} structure × 40 %` },
    { nom: "Rapport SEO on-page", score: a.seo.score, detail: a.seo.verdict },
    { nom: "Rapport structure / design / copywriting", score: a.design.scoreGlobal, detail: a.design.axes.map((x) => `${x.nom} ${x.score}`).join(" · ") },
  ];
  return `
  <div class="bandeau">
    <div class="surtitre">Stevens AKPOVI — Analyse de site web</div>
    <h1>AUDIT COMPLET</h1>
    <div class="site">${esc(a.url)}</div>
    <div class="site" style="color:#9a9a9a;font-size:11.5px;margin-top:4px;">Réalisé le ${dateFr(a.date)}</div>
  </div>
  <div class="synthese">
    <div class="note-globale">
      <div class="lettre" style="color:${couleur(a.scoreGlobal)};">${esc(a.note)}</div>
      <div class="valeur">${a.scoreGlobal}/100 — note globale</div>
    </div>
    <div class="blocs-scores">
      ${lignes
        .map(
          (l) => `
      <div class="ligne-score">
        <div class="nom">${esc(l.nom)}</div>
        <div class="barre"><div style="width:${Math.max(2, Math.min(100, l.score))}%;background:${couleur(l.score)};"></div></div>
        <div class="val" style="color:${couleur(l.score)};">${l.score}</div>
      </div>
      <div style="color:#8a8a8a;font-size:10px;margin:-8px 0 0 222px;">${esc(l.detail)}</div>`,
        )
        .join("")}
    </div>
  </div>`;
}

/** Le bloc PERFORMANCE du rapport. */
function htmlPerformance(a: AuditComplet): string {
  const r = a.performance;
  return `
  <h2 class="section">RAPPORT PERFORMANCE</h2>
  <p class="sous-section">Vitesse de chargement : note ${esc(r.note)} — ${scorePerformanceComposite(r)}/100 (Performance ${r.scorePerformance} × 60 % + Structure ${r.scoreStructure} × 40 %)</p>
  <div class="grille">
    ${r.vitals
      .map(
        (v) => `<div class="case">
      <div class="k">${esc(v.libelle)}</div>
      <div class="v" style="color:${couleur(v.score)};">${v.valeur.toFixed(v.code === "cls" ? 3 : v.valeur >= 10 ? 1 : 2)}${v.unite === "s" ? " s" : ""}</div>
      <div class="s">${v.score}/100</div>
    </div>`,
      )
      .join("")}
  </div>
  <div class="grille" style="margin-top:10px;">
    <div class="case"><div class="k">Chargement complet</div><div class="v">${secondes(r.chargeComplete)}</div></div>
    <div class="case"><div class="k">Poids total</div><div class="v">${octets(r.poidsTotal)}</div></div>
    <div class="case"><div class="k">Requêtes</div><div class="v">${r.nbRequetes}</div></div>
    <div class="case"><div class="k">Domaines</div><div class="v">${r.domaines}</div></div>
    ${r.detailsTypes
      .map((d) => `<div class="case"><div class="k">${esc(d.type)} (${d.nb})</div><div class="v">${octets(d.octets)}</div></div>`)
      .join("")}
  </div>
  ${
    r.audits.length === 0
      ? `<p class="aucun" style="margin-top:8px;">Aucun problème de structure détecté — la page suit les bonnes pratiques de performance.</p>`
      : `<div style="margin-top:10px;">${r.audits
          .map(
            (x) => `<div class="conseil">
        <div class="t">${esc(x.titre)}<span class="impact" style="background:${x.impact === "élevé" ? "#fde8e8" : "#f3f3f3"};color:${x.impact === "élevé" ? "#b91c1c" : "#555"};">Impact ${esc(x.impact)} · −${x.points} pts</span></div>
        <div class="d">${esc(x.detail)}</div>
        <div class="c"><b>→</b> ${esc(x.conseil)}</div>
      </div>`,
          )
          .join("")}</div>`
  }`;
}

/** Le bloc SEO du rapport. */
function htmlSeo(a: AuditComplet): string {
  const r = a.seo;
  return `
  <h2 class="section">RAPPORT SEO</h2>
  <p class="sous-section">Audit SEO on-page : ${r.score}/100 — note ${esc(r.note)} — ${esc(r.verdict)}</p>
  <div class="apercu-google">
    <div class="u">${esc(r.apercu.url.replace(/^https?:\/\//, ""))}</div>
    <div class="t">${esc(r.apercu.titre)}</div>
    <div class="desc">${esc(r.apercu.description)}</div>
  </div>
  ${
    r.plan.length === 0
      ? `<p class="aucun" style="margin-top:8px;">Aucun critère SEO à corriger.</p>`
      : `<div style="margin-top:10px;">${r.plan
          .map(
            (c) => `<div class="conseil">
        <div class="t">${esc(c.libelle)} <span style="color:#888;font-weight:400;">(${c.obtenu}/${c.points})</span></div>
        <div class="d">${esc(c.detail)}</div>
        ${c.conseil ? `<div class="c"><b>→</b> ${esc(c.conseil)}</div>` : ""}
      </div>`,
          )
          .join("")}</div>`
  }
  <div style="margin-top:10px;">
    ${r.familles
      .map((f) => {
        const points = f.criteres.reduce((s, c) => s + c.obtenu, 0);
        const max = f.criteres.reduce((s, c) => s + c.points, 0);
        return `<div class="famille">
      <div class="t">${esc(f.nom)} <span style="color:${couleur((points / Math.max(1, max)) * 100)};">${points}/${max}</span></div>
      <ul>${f.criteres.map((c) => `<li><b>${c.etat === "ok" ? "✓" : c.etat === "moyen" ? "~" : "✗"}</b> ${esc(c.libelle)} — <span style="color:#666;">${esc(c.detail)}</span></li>`).join("")}</ul>
    </div>`;
      })
      .join("")}
  </div>`;
}

/** Le bloc STRUCTURE / DESIGN du rapport. */
function htmlDesign(a: AuditComplet): string {
  const r = a.design;
  return `
  <h2 class="section">RAPPORT STRUCTURE / DESIGN / COPYWRITING / CONVERSION</h2>
  <p class="sous-section">Le site est-il bien designé, moderne, bien structuré, écrit pour convertir ? ${r.scoreGlobal}/100 — note ${esc(r.note)}</p>
  <div class="grille">
    ${r.axes
      .map(
        (x) => `<div class="case">
      <div class="k">${esc(x.nom)}</div>
      <div class="v" style="color:${couleur(x.score)};">${x.score}/100</div>
      <div class="s">${esc(x.avis.slice(0, 110))}${x.avis.length > 110 ? "…" : ""}</div>
    </div>`,
      )
      .join("")}
  </div>
  <div style="display:flex;gap:14px;margin-top:12px;">
    <div style="flex:1;">
      <h3 style="font-size:12.5px;margin-bottom:6px;">Ce qui fonctionne</h3>
      <ul class="forces">${r.forces.map((f) => `<li>${esc(f)}</li>`).join("") || '<li class="aucun">Aucun point fort majeur détecté.</li>'}</ul>
    </div>
    <div style="flex:1;">
      <h3 style="font-size:12.5px;margin-bottom:6px;">À améliorer</h3>
      <ul class="forces">${r.ameliorations.map((m) => `<li><b>${esc(m.titre)}.</b> <span style="color:#666;">${esc(m.detail)}</span></li>`).join("") || '<li class="aucun">Rien à signaler — la page est solide.</li>'}</ul>
    </div>
  </div>
  ${r.capture ? `<img class="capture" src="${htmlValeurSecurisee(r.capture)}" alt="Capture de la page analysée" />` : ""}`;
}

/** Le document complet « AUDIT COMPLET ». */
export function htmlAuditComplet(a: AuditComplet): string {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8" /><style>${CSS}</style></head><body>
  ${htmlSynthese(a)}
  ${htmlPerformance(a)}
  ${htmlSeo(a)}
  ${htmlDesign(a)}
</body></html>`;
}

/** Le document « AXES D'AMÉLIORATION » (les priorités par bloc). */
export function htmlAxesAmelioration(a: AuditComplet): string {
  const axes = compilerAxes(a);
  const parBloc = new Map<string, AxeAmelioration[]>();
  for (const axe of axes) {
    parBloc.set(axe.bloc, [...(parBloc.get(axe.bloc) ?? []), axe]);
  }
  const classe = (p: AxeAmelioration["priorite"]) => (p === "élevée" ? "haute" : p === "faible" ? "basse" : "");
  const sections = [...parBloc.entries()]
    .map(
      ([bloc, liste]) => `
  <h2 class="section">${esc(bloc.toUpperCase())}</h2>
  ${liste
    .map(
      (x) => `<div class="axe ${classe(x.priorite)}">
    <span class="p">Priorité ${x.priorite}</span>
    <div class="t">${esc(x.titre)}</div>
    <div class="d">${esc(x.detail)}</div>
    <div class="c"><b>→</b> ${esc(x.conseil)}</div>
  </div>`,
    )
    .join("")}`,
    )
    .join("");
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8" /><style>${CSS}</style></head><body>
  <div class="bandeau">
    <div class="surtitre">Stevens AKPOVI — Analyse de site web</div>
    <h1>AUDIT COMPLET<br /><span style="font-size:20px;font-weight:600;color:#d9d9d9;">AXES D'AMÉLIORATION</span></h1>
    <div class="site">${esc(a.url)} — ${axes.length} axe${axes.length > 1 ? "s" : ""} priorisé${axes.length > 1 ? "s" : ""} pour amener le site à 100 %</div>
    <div class="site" style="color:#9a9a9a;font-size:11.5px;margin-top:4px;">Réalisé le ${dateFr(a.date)} — note ${esc(a.note)} (${a.scoreGlobal}/100)</div>
  </div>
  ${axes.length === 0 ? `<p class="aucun" style="margin-top:14px;">Aucun axe d'amélioration : le site est déjà en très bonne forme.</p>` : sections}
</body></html>`;
}
