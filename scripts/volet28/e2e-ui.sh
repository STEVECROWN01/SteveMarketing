#!/usr/bin/env bash
# E2E UI VOLET 28 — back-office dans un vrai navigateur (agent-browser) :
#   1. connexion admin ;
#   2. NAV : bouton « Tableau de bord » SUPPRIMÉ (seul le logo le porte),
#      libellé « Propositions », nouvelle rubrique « Audit » ;
#   3. LOGO → clic ramène au tableau de bord ;
#   4. espace « Scraping » : badge « Prospection », texte supprimé,
#      drop-downs CATÉGORIE → NICHE liés (étoiles + prix, niches de la
#      catégorie uniquement), cible + upsells de la niche, filtre
#      employés étendu (2+, 3+, 5+…) ;
#   5. espace « Audit » : trois outils, une vraie analyse rendue ;
#   6. aucune erreur console.
set -u
cd /home/z/my-project/SteveMarketing
export NODE_ENV=production PORT=3100 ADMIN_PASSWORD="MotDePasseTest-Volet28"
export PUPPETEER_EXECUTABLE_PATH="$HOME/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome"

bun .next/standalone/server.js > /tmp/render/serveur-ui28.log 2>&1 &
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
S=/tmp/render/ui28-snapshot.txt
note() { echo "== $1"; }
verif() {
  if eval "$2"; then echo "OK  $1"; else echo "ÉCHEC  $1"; ECHECS=$((ECHECS+1)); fi
}
ref() { # ref 'libellé' → première ref correspondante du dernier instantané
  # l'instantané écrit « [ref=e12] » — le clic attend « @e12 »
  rg -m1 "\"$1\"" "$S" | rg -o 'ref=e[0-9]+' | head -1 | sed -E 's/^ref=(.*)$/@\1/'
}
snapshot() { agent-browser snapshot -i > "$S" 2>&1; }

# navigateur NEUF (aucun état hérité d'une session précédente)
agent-browser close >/dev/null 2>&1 || true

# ---------- connexion admin ----------
note "connexion admin"
agent-browser open "http://localhost:3100/#/admin" >/dev/null
sleep 2
agent-browser find label "Mot de passe" fill "MotDePasseTest-Volet28" >/dev/null 2>&1 || true
agent-browser find text "Ouvrir L'Espace" click >/dev/null 2>&1 || true
sleep 3
snapshot
verif "tableau de bord affiché" 'rg -q "État du système" "$S"'

# ---------- NAV ----------
note "navigation : bouton tableau de bord supprimé — logo + Propositions + Audit"
NB_TABDEBORD=$(rg -o "Tableau de bord" "$S" | wc -l)
verif "« Tableau de bord » n'apparaît qu'une fois (le logo), plus dans la navigation" '[ "$NB_TABDEBORD" -le 1 ]'
verif "libellé court « Propositions » (NAV)" 'rg -q "\"Propositions " "$S" && ! rg -q "Propositions commerciales" "$S"'
verif "rubrique « Audit » présente" 'rg -q "\"Audit\"" "$S"'

# ---------- LOGO → tableau de bord ----------
note "logo du header → tableau de bord"
REF_DEMANDES=$(rg -m1 '"Demandes 0"' "$S" | rg -o 'ref=e[0-9]+' | head -1 | sed -E 's/^ref=(.*)$/@\1/')
verif "extraction de la ref du bouton Demandes" '[ -n "$REF_DEMANDES" ]'
agent-browser click "$REF_DEMANDES" >/dev/null 2>&1
sleep 1.5
snapshot
agent-browser eval "document.body.innerText.includes('Export CSV') || document.body.innerText.includes('Aucune demande')" >/tmp/render/ui28-dem.txt 2>&1
REF_LOGO=$(rg -m1 'button "Tableau de bord"' "$S" | rg -o 'ref=e[0-9]+' | head -1 | sed -E 's/^ref=(.*)$/@\1/')
verif "extraction de la ref du logo" '[ -n "$REF_LOGO" ]'
agent-browser click "$REF_LOGO" >/dev/null 2>&1
sleep 1.5
agent-browser eval "document.body.innerText.includes('État du système')" >/tmp/render/ui28-logo.txt 2>&1
verif "clic sur le LOGO ramène au tableau de bord" 'rg -q "true" /tmp/render/ui28-logo.txt'

# ---------- espace Scraping ----------
note "espace « Scraping »"
snapshot
REF_SCRAPING=$(ref "Scraping")
agent-browser click "$REF_SCRAPING" >/dev/null 2>&1
sleep 2
agent-browser eval "document.body.innerText" >/tmp/render/ui28-scraping.txt 2>&1
snapshot
verif "badge « Prospection »" 'rg -q "Prospection" /tmp/render/ui28-scraping.txt'
verif "ancien badge « Aucune clé d'API » disparu" '! rg -q "Aucune clé" /tmp/render/ui28-scraping.txt'
verif "texte d'aide du filtre supprimé" '! rg -q "pilote le scraping" /tmp/render/ui28-scraping.txt'
verif "champ Catégorie présent" 'rg -q "Catégorie" /tmp/render/ui28-scraping.txt'
verif "champ Niche grisé avant la catégorie" 'rg -q "Choisissez d" "$S" && rg -q "disabled" "$S"'
REF_CATEGORIE=$(rg -m1 'combobox "Catégorie' "$S" | rg -o 'ref=e[0-9]+' | head -1 | sed -E 's/^ref=(.*)$/@\1/')
REF_NICHE=$(rg -m1 'combobox "Niche' "$S" | rg -o 'ref=e[0-9]+' | head -1 | sed -E 's/^ref=(.*)$/@\1/')
agent-browser select "$REF_CATEGORIE" "BTP / Rénovation" >/dev/null 2>&1
sleep 1
agent-browser eval "Array.from(document.querySelectorAll('select')[1].options).map(o => o.textContent.trim()).join(' | ')" >/tmp/render/ui28-options-niche.txt 2>&1
verif "le drop-down niche ne propose QUE les niches BTP" 'rg -q "Paysagistes" /tmp/render/ui28-options-niche.txt && ! rg -q "Dentistes\|Kinésithérapie" /tmp/render/ui28-options-niche.txt'
verif "prix entre parenthèses dans les options" 'rg -q "3.000 €" /tmp/render/ui28-options-niche.txt && rg -q "6.000 €" /tmp/render/ui28-options-niche.txt'
verif "étoiles de classement dans les options" 'rg -q "★★★★★" /tmp/render/ui28-options-niche.txt'
agent-browser select "$REF_NICHE" "#02" >/dev/null 2>&1
sleep 1
agent-browser eval "document.body.innerText" >/tmp/render/ui28-niche.txt 2>&1
verif "niche #02 : cible idéale + panier + upsells (du fichier)" 'rg -q "Cible idéale" /tmp/render/ui28-niche.txt && rg -q "3.000 €" /tmp/render/ui28-niche.txt && rg -q "Upsells recommandés" /tmp/render/ui28-niche.txt'

# filtre employés étendu (LinkedIn)
snapshot
REF_LINKEDIN=$(rg -m1 'tab "LinkedIn"' "$S" | rg -o 'ref=e[0-9]+' | head -1 | sed -E 's/^ref=(.*)$/@\1/')
agent-browser click "$REF_LINKEDIN" >/dev/null 2>&1
sleep 1.5
agent-browser eval "var s = Array.from(document.querySelectorAll('select')); Array.from(s[s.length-1].options).map(o => o.textContent.trim()).join(' | ')" >/tmp/render/ui28-employes.txt 2>&1
verif "options employés 2+, 3+, 5+ (LinkedIn)" 'rg -q "2 employés et plus" /tmp/render/ui28-employes.txt && rg -q "3 employés et plus" /tmp/render/ui28-employes.txt && rg -q "5 employés et plus" /tmp/render/ui28-employes.txt'

# ---------- espace Audit ----------
note "espace « Audit »"
snapshot
REF_AUDIT=$(rg -m1 '"Audit" \[' "$S" | rg -o 'ref=e[0-9]+' | head -1 | sed -E 's/^ref=(.*)$/@\1/')
agent-browser click "$REF_AUDIT" >/dev/null 2>&1
sleep 2
agent-browser eval "document.body.innerText" >/tmp/render/ui28-audit.txt 2>&1
verif "les trois outils présents" 'rg -q "Performance" /tmp/render/ui28-audit.txt && rg -q "SEO" /tmp/render/ui28-audit.txt && rg -q "Audit complet" /tmp/render/ui28-audit.txt'
verif "champ URL présent" 'rg -q "URL de la page" /tmp/render/ui28-audit.txt'

# analyse SEO (rapide) sur example.com
snapshot
REF_OUTIL_SEO=$(rg -m1 'tab "SEO"' "$S" | rg -o 'ref=e[0-9]+' | head -1 | sed -E 's/^ref=(.*)$/@\1/')
agent-browser click "$REF_OUTIL_SEO" >/dev/null 2>&1
sleep 1
agent-browser fill "input[type=url]" "https://example.com" >/dev/null 2>&1
snapshot
REF_ANALYSER=$(rg -m1 '"Analyser"' "$S" | rg -o 'ref=e[0-9]+' | head -1 | sed -E 's/^ref=(.*)$/@\1/')
agent-browser click "$REF_ANALYSER" >/dev/null 2>&1
sleep 16
agent-browser eval "document.body.innerText" >/tmp/render/ui28-seo.txt 2>&1
verif "analyse SEO rendue (verdict)" 'rg -q "Mauvais|Médiocre|Correct|Bon|Excellent" /tmp/render/ui28-seo.txt'
verif "score /100 affiché" 'rg -q "/100" /tmp/render/ui28-seo.txt'
verif "plan d'action affiché" 'rg -q "Plan d" /tmp/render/ui28-seo.txt'
agent-browser screenshot /tmp/render/ui-audit-seo28.png >/dev/null 2>&1 || true

# capture visuelle de l'espace scraping (drop-downs du fichier)
REF_SCRAPING=$(ref "Scraping")
agent-browser click "$REF_SCRAPING" >/dev/null 2>&1
sleep 2
agent-browser screenshot /tmp/render/ui-scraping28.png >/dev/null 2>&1 || true

# ---------- erreurs console ----------
note "console"
agent-browser console >/tmp/render/ui28-console.txt 2>&1 || true
verif "aucune erreur console" '! rg -qi "error" /tmp/render/ui28-console.txt'

echo
echo "=== verdict UI : $ECHECS échec(s) ==="
exit $([ $ECHECS -eq 0 ] && echo 0 || echo 1)
