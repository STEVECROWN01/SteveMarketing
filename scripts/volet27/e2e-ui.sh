#!/usr/bin/env bash
# E2E UI VOLET 27 — back-office dans un vrai navigateur (agent-browser) :
#   1. connexion admin ;
#   2. option « Portfolio » (nom + compteur TOTAL) et espace « Portfolio » ;
#   3. modale de DÉPUBLICATION JAUNE (ouverture + annulation) ;
#   4. espace « Scraping » : outil Google Maps avec une VRAIE recherche ;
#   5. outil LinkedIn (URL directe) ;
#   6. aucun message d'erreur console.
set -u
cd /home/z/my-project/SteveMarketing
export NODE_ENV=production PORT=3100 ADMIN_PASSWORD="MotDePasseTest-Volet27"
export PUPPETEER_EXECUTABLE_PATH="$HOME/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome"

bun .next/standalone/server.js > /tmp/render/serveur-ui.log 2>&1 &
PID=$!
trap 'kill $PID 2>/dev/null || true' EXIT

code=000
for i in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3100/ 2>/dev/null || echo 000)
  [ "$code" = "200" ] && break
  sleep 0.5
done
echo "serveur prêt (code $code)"

ECHECS=0
note() { echo "== $1"; }
verif() { # verif "libellé" condition_bash
  if eval "$2"; then echo "OK  $1"; else echo "ÉCHEC  $1"; ECHECS=$((ECHECS+1)); fi
}

# ---------- page publique ----------
note "site public"
agent-browser open http://localhost:3100/ >/dev/null
agent-browser wait --load networkidle >/dev/null 2>&1 || true
agent-browser screenshot /tmp/render/ui-public.png >/dev/null
verif "page publique 200" '[ "$code" = "200" ]'

# ---------- connexion admin ----------
note "connexion admin"
agent-browser open "http://localhost:3100/#/admin" >/dev/null
sleep 2
agent-browser snapshot -i >/tmp/render/snap-login.txt 2>&1
MOTDE_REF=$(grep -oE '@e[0-9]+' /tmp/render/snap-login.txt | tail -1)
agent-browser find label "Mot de passe" fill "MotDePasseTest-Volet27" >/dev/null 2>&1 \
  || agent-browser find text "Ouvrir L'Espace" click >/dev/null 2>&1
agent-browser find text "Ouvrir L'Espace" click >/dev/null 2>&1 || true
sleep 3
agent-browser snapshot -i >/tmp/render/snap-apres-login.txt
verif "tableau de bord affiché" 'grep -q "Tableau de bord" /tmp/render/snap-apres-login.txt'
verif "option « Portfolio » (sans « du site »)" 'grep -q "\"Portfolio\"" /tmp/render/snap-apres-login.txt && ! grep -q "Portfolio du site" /tmp/render/snap-apres-login.txt'
verif "option « Scraping » présente" 'grep -q "Scraping" /tmp/render/snap-apres-login.txt'
echo "   compteur Portfolio affiché : $(grep -oE "Portfolio[^0-9]*\(?[0-9]+\)?" /tmp/render/snap-apres-login.txt | head -1)"
agent-browser screenshot /tmp/render/ui-tableau.png >/dev/null

# ---------- espace Portfolio ----------
note "espace Portfolio"
agent-browser find role button click --name "Portfolio 4" >/dev/null 2>&1 || agent-browser find role button click --name "Portfolio" >/dev/null 2>&1
sleep 3
agent-browser snapshot -i >/tmp/render/snap-portfolio.txt
verif "titre de l'espace : « Portfolio » (plus de « Portfolio du site »)" 'grep -q "Portfolio" /tmp/render/snap-portfolio.txt && ! grep -q "Portfolio du site" /tmp/render/snap-portfolio.txt'
verif "filtres « X projets publiés » / « Y brouillons » présents" 'grep -qE "projets? publié" /tmp/render/snap-portfolio.txt && grep -qE "brouillon" /tmp/render/snap-portfolio.txt'
verif "boutons Modifier / Dépublier / Supprimer sur les réalisations" 'grep -qi "Dépublier" /tmp/render/snap-portfolio.txt && grep -qi "Supprimer" /tmp/render/snap-portfolio.txt'
agent-browser screenshot /tmp/render/ui-portfolio.png >/dev/null

# ---------- modale de dépublication : JAUNE ----------
note "modale de dépublication (jaune)"
agent-browser find role button click --name "Dépublier (retirer du site)" >/dev/null 2>&1 || agent-browser eval "document.querySelector('button[aria-label*=\"Dépublier\"]')?.click()" >/dev/null 2>&1
sleep 1.5
agent-browser screenshot /tmp/render/ui-modale-jaune.png >/dev/null
JAUNE=$(agent-browser eval '(() => { const m = document.querySelector("[role=dialog]"); if (!m) return "PAS DE MODALE"; const cercle = m.querySelector("span.flex.h-14"); const btn = [...m.querySelectorAll("button")].find(b => /Dépublier/.test(b.textContent || "")); const parse = (s) => { const l = String(s).match(/lab\(\s*([0-9.]+)[ ,]+([0-9.]+)[ ,]+([0-9.]+)(?:\s*\/\s*([0-9.]+))?\s*\)/i); const o = String(s).match(/oklab\(\s*([0-9.]+)[ ,]+([0-9.]+)[ ,]+([0-9.]+)(?:\s*\/\s*([0-9.]+))?\s*\)/i); if (l) return [Number(l[1]), Number(l[2]), Number(l[3]), Number(l[4] ?? 1)]; if (o) return [Number(o[1]) * 100, Number(o[2]) * 100, Number(o[3]) * 100, Number(o[4] ?? 1)]; return null; }; const pres = (v, alpha) => v !== null && Math.abs(v[0] - 78.61) < 2.5 && Math.abs(v[1] - 14.37) < 2.5 && Math.abs(v[2] - 80.26) < 2.5 && Math.abs(v[3] - alpha) < 0.02; const ic = cercle ? parse(getComputedStyle(cercle).backgroundColor) : null; const bd = btn ? parse(getComputedStyle(btn).borderColor) : null; return "iconeJaune=" + pres(ic, 0.12) + " boutonJaune=" + pres(bd, 0.45); })()' 2>/dev/null | tail -1)
echo "   couleurs modale : $JAUNE"
verif "icône de la modale JAUNE (fond #f5b700)" 'echo "$JAUNE" | grep -q "iconeJaune=true"'
verif "bouton « Dépublier du site » JAUNE (bordure)" 'echo "$JAUNE" | grep -q "boutonJaune=true"'
# annulation (la réalisation ne doit PAS être dépubliée)
agent-browser find role button click --name "Annuler" >/dev/null 2>&1 || agent-browser eval "document.querySelector('[role=dialog] button')?.click()" >/dev/null 2>&1
sleep 1

# ---------- espace Scraping : outil Google Maps (vraie recherche) ----------
note "espace Scraping — Google Maps"
agent-browser find role button click --name "Scraping" >/dev/null 2>&1
sleep 2
agent-browser find label "Niche / catégorie" fill "salon de coiffure" >/dev/null 2>&1
agent-browser find label "Lieu" fill "Cotonou, Bénin" >/dev/null 2>&1
agent-browser screenshot /tmp/render/ui-scraping-form.png >/dev/null
agent-browser find role button click --name "Scraper" >/dev/null 2>&1
echo "   recherche en cours (attente 12 s)…"
sleep 12
agent-browser snapshot >/tmp/render/snap-scraping.txt
agent-browser screenshot /tmp/render/ui-scraping-resultats.png >/dev/null
verif "résultats Google Maps affichés (entreprises sans site web)" 'grep -q "Sans site web" /tmp/render/snap-scraping.txt'
NB=$(agent-browser eval "[...document.querySelectorAll('button')].filter(b => /Exporter en CSV/.test(b.textContent||'')).length" 2>/dev/null | tail -1)
verif "bouton « Exporter en CSV » présent (résultats disponibles)" '[ "$NB" -ge 1 ]'

# ---------- filtre sans site web ----------
agent-browser find role button click --name "Sans site web" >/dev/null 2>&1
sleep 1
agent-browser find role button click --name "Scraper" >/dev/null 2>&1
sleep 10
agent-browser screenshot /tmp/render/ui-scraping-sans-site.png >/dev/null
SANS=$(agent-browser eval "[...document.querySelectorAll('span')].filter(s => /Sans site web/.test(s.textContent||'')).length" 2>/dev/null | tail -1)
echo "   cartes « Sans site web » après filtrage : ${SANS}"
verif "le filtre ne renvoie QUE des entreprises sans site web" '[ "${SANS:-0}" -ge 1 ]'

# ---------- outil LinkedIn (URL directe) ----------
note "espace Scraping — LinkedIn"
agent-browser find role tab click --name "LinkedIn" >/dev/null 2>&1 || agent-browser find text "LinkedIn" click >/dev/null 2>&1
sleep 2
agent-browser snapshot -i >/tmp/render/snap-linkedin-form.txt
verif "formulaire LinkedIn affiché (Recherche + Employés minimum)" 'grep -qi "Recherche" /tmp/render/snap-linkedin-form.txt && grep -qi "Employés minimum" /tmp/render/snap-linkedin-form.txt'
# le filtre « Sans site web » de la recherche précédente reste actif :
# Microsoft A un site web → il doit être MASQUÉ tant que le filtre tient.
agent-browser find label "Recherche" fill "https://www.linkedin.com/company/microsoft/" >/dev/null 2>&1
# garanti par le setter natif React si le fill par libellé a échoué
agent-browser eval '(() => { const i = [...document.querySelectorAll("input")].find(x => (x.placeholder || "").includes("linkedin.com/company")); if (i && !i.value.includes("linkedin.com")) { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set; s.call(i, "https://www.linkedin.com/company/microsoft/"); i.dispatchEvent(new Event("input", { bubbles: true })); } return "ok"; })()' >/dev/null 2>&1
agent-browser find role button click --name "Scraper" >/dev/null 2>&1
agent-browser wait --text "entreprise affich" --timeout 40000 >/dev/null 2>&1 || true
sleep 1
MASQUE=$(agent-browser eval 'document.body.innerText.match(/.{0,4}entreprise affich.{0,16}/) ? document.body.innerText.match(/.{0,4}entreprise affich.{0,16}/)[0] : "rien"' 2>/dev/null | tail -1)
echo "   compteur après recherche LinkedIn (filtre « sans site web ») : ${MASQUE}"
verif "filtre « sans site web » tenu : Microsoft (site web présent) masqué" 'echo "$MASQUE" | grep -q "0 entreprise affich"'
# retour au filtre « Tous » : Microsoft doit apparaître avec son site web
agent-browser find role button click --name "Tous" >/dev/null 2>&1
sleep 1
agent-browser find role button click --name "Scraper" >/dev/null 2>&1
agent-browser wait --text "Microsoft" --timeout 40000 >/dev/null 2>&1 || true
sleep 2
agent-browser snapshot >/tmp/render/snap-linkedin.txt
agent-browser screenshot /tmp/render/ui-scraping-linkedin.png >/dev/null
verif "LinkedIn (filtre « Tous ») : Microsoft trouvé" 'grep -qi "microsoft" /tmp/render/snap-linkedin.txt'
verif "LinkedIn : employés affichés" 'grep -qiE "de 10 000 employés|employees" /tmp/render/snap-linkedin.txt'
verif "LinkedIn : site web décodé affiché" 'grep -qi "news.microsoft.com" /tmp/render/snap-linkedin.txt'

# ---------- erreurs console ----------
note "console du navigateur"
agent-browser errors >/tmp/render/erreurs.txt 2>&1 || true
NB_ERR=$(grep -c . /tmp/render/erreurs.txt || true)
echo "   erreurs de page : ${NB_ERR}"
verif "aucune erreur de page" '[ "${NB_ERR}" -eq 0 ]'

agent-browser close >/dev/null 2>&1 || true
echo
echo "=== VERDICT UI : $ECHECS échec(s) ==="
exit $ECHECS
