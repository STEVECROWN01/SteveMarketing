#!/usr/bin/env python3
"""E2E 28/11 — API : connexion, portfolio, 401 session expirée,
génération PDF d'un devis depuis proposition (M18/M19 vérifiés dans
le PDF réel), désélection (testée côté UI dans e2e-28-11.js)."""
import json
import os
import sys

import requests

BASE = os.environ.get("E2E_BASE", "http://localhost:3100")
MOT_DE_PASSE = os.environ.get("ADMIN_PASSWORD", "MotDePasseTest-Volet25")

ok_global = True

def check(nom, cond, detail=""):
    global ok_global
    ok_global &= bool(cond)
    print(f"{'OK ' if cond else 'ÉCHEC'} {nom}" + (f" — {detail}" if detail else ""))

s = requests.Session()

# ---------- 1. connexion ----------
r = s.post(f"{BASE}/api/admin/login", json={"password": MOT_DE_PASSE}, timeout=30)
check("connexion admin", r.status_code == 200 and r.json().get("ok"), r.text[:80])
cookie = r.headers.get("set-cookie", "")
check("cookie de session posé (30 jours)",
      "max-age=2592000" in cookie.lower(),
      cookie.split(";")[1].strip() if cookie else "aucun")

# le cookie est SECURE (production) : requests ne le renvoie pas sur
# HTTP — on le porte MANUELLEMENT (les navigateurs, eux, l'envoient à
# localhost qui est un contexte sécurisé).
JETON = (cookie.split(";")[0].split("=", 1)[1] if "=" in cookie else "").strip()
ENTETES = {"Cookie": f"stevens_admin_session={JETON}"} if JETON else {}

# ---------- 2. portfolio : les projets de l'éditeur sont TOUJOURS là ----------
r = s.get(f"{BASE}/api/admin/projects", headers=ENTETES, timeout=60)
data = r.json()
check("liste portfolio (ok)", r.ok and data.get("ok"), r.text[:80])
ids = {p["id"]: p["statut"] for p in data.get("projets", [])}
check("A2Sniper présent et publié", ids.get("a2sniper-2026-11-27") == "publie", str(ids))
check("Academia Helm RESTAURÉ et publié", ids.get("academia-helm-2026-11-27") == "publie")

# public : 2 projets publiés + 4 réalisations statiques → badge 6
r = requests.get(f"{BASE}/api/projects", timeout=60)
public = r.json()
check("API publique : 2 projets publiés",
      len(public.get("projets", [])) == 2, f"{[p['id'] for p in public.get('projets', [])]}")
check("API publique : aucune réalisation masquée", public.get("statiquesMasques") == [])

# ---------- 3. 401 : SANS cookie, la réponse reste 401 (le SPA gère proprement) ----------
r = requests.get(f"{BASE}/api/admin/projects", timeout=30)
check("sans session → 401 (le front affichera l'écran de connexion)",
      r.status_code == 401, str(r.status_code))

# ---------- 4. PDF d'un devis depuis proposition (9 périmètres) ----------
DEPUIS_PROPOSITION = os.environ.get("E2E_DEVIS_JSON", "/tmp/render/e2e-devis-prop.json")
with open(DEPUIS_PROPOSITION, "r", encoding="utf-8") as f:
    devis = json.load(f)
r = s.post(f"{BASE}/api/documents/pdf",
           headers=ENTETES,
           json={"document": devis, "enregistrer": False, "envoyerEmail": False},
           timeout=180)
check("génération du PDF (devis depuis proposition, 9 périmètres)",
      r.ok and r.content[:5] == b"%PDF-",
      f"{len(r.content) // 1024} Ko" if r.ok else f"HTTP {r.status_code} : {r.text[:200]}")
with open("/tmp/render/e2e-devis-prop.pdf", "wb") as f:
    f.write(r.content)

print()
print("VERDICT API :", "TOUT OK" if ok_global else "ÉCHECS À CORRIGER")
sys.exit(0 if ok_global else 1)
