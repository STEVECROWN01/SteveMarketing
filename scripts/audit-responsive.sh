#!/bin/bash
# Audit responsive du site (agent-browser) — usage :
#   bash audit-responsive.sh "320 568;360 640"   (viewports "L H;L H;...")
# Pour chaque page et viewport : détection des éléments qui dépassent
# horizontalement du viewport SANS être rognés par un ancêtre
# overflow-hidden/clip (les vrais débordements de page, ceux que le
# visiteur voit coupés ou qui créent un scroll horizontal).
BASE=http://localhost:3000
PAGES="accueil methode referencement-seo publicite-meta-ads realisations a-propos contact demander-un-devis reserver-un-appel mentions-legales projet/mrsteveenglish projet/afribayit projet/prelaunch"

JS='(() => { const vw = window.innerWidth; const bad = []; const clipped = (el) => { let p = el.parentElement; while (p && p !== document.body) { const s = getComputedStyle(p); const o = s.overflow + " " + s.overflowX; if (/(hidden|clip|auto|scroll)/.test(o)) return true; p = p.parentElement; } return false; }; const animating = (el) => { let n = el; while (n && n !== document.body) { const st = n.style; if (st.transform && st.transform !== "none") return true; if (st.opacity === "0") return true; n = n.parentElement; } return false; }; document.querySelectorAll("body *").forEach(el => { const r = el.getBoundingClientRect(); if (r.width === 0 && r.height === 0) return; if (r.right > vw + 2 || r.left < -2) { if (!clipped(el) && !animating(el)) { const cls = (typeof el.className === "string" ? el.className : "").slice(0, 110); bad.push(el.tagName + " L" + Math.round(r.left) + " R" + Math.round(r.right) + " :: " + cls); } } }); return JSON.stringify({ vw: vw + "x" + window.innerHeight, n: bad.length, bad: bad.slice(0, 4) }); })()'

# Échauffement : premier chargement (compilation Next) + animations
agent-browser set viewport 1280 800 > /dev/null 2>&1
agent-browser open "$BASE/#/accueil" > /dev/null 2>&1
sleep 4

VPS="$1"
echo "$VPS" | tr ';' '\n' | while read -r vp; do
  W=$(echo "$vp" | awk '{print $1}')
  H=$(echo "$vp" | awk '{print $2}')
  agent-browser set viewport "$W" "$H" > /dev/null 2>&1
  sleep 0.3
  for p in $PAGES; do
    agent-browser open "$BASE/#/$p" > /dev/null 2>&1
    sleep 1.1
    RES=$(agent-browser eval "$JS" 2>/dev/null | tail -1)
    echo "[$W x $H] $p => $RES"
  done
done
agent-browser set viewport 1920 1080 > /dev/null 2>&1
echo "DONE"
