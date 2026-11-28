#!/usr/bin/env python3
"""VOLET 27 — proposition commerciale V2 : génération PDF valide
(gabarit Poppins — polices inlinées) et page de titre intacte."""
import time
import requests

BASE = "http://localhost:3100"
s = requests.Session()
r = s.post(f"{BASE}/api/admin/login", json={"password": "MotDePasseTest-Volet27"}, timeout=30)
assert r.ok and r.json().get("ok")
cookie = r.headers.get("set-cookie", "")
jeton = cookie.split(";")[0].split("=", 1)[1]
H = {"Cookie": f"stevens_admin_session={jeton}"}

# gabarit d'une proposition V2 : le MODÈLE PAR DÉFAUT COMPLET de la
# lib (propositionV2ParDefaut) est exporté en JSON par l'étape bun du
# wrapper — on y ajoute l'entête (numéro, dates).
import json

with open("/tmp/render/prop-defaut.json", encoding="utf-8") as f:
    base = json.load(f)
doc = {
    **base,
    "docType": "proposition",
    "id": "e2e-v27-prop",
    "numero": "PC2600310",
    "numeroClient": 2600310,
    "date": "2026-11-28",
    "langue": "fr",
    "projet": "Site web professionnel — Maison Kalio",
    "titre": "Transformer votre visibilité en demandes concrètes",
    "montant": 450000,
    "devise": "XOF",
    "delai": "03 à 04 semaines",
}

t0 = time.time()
r = s.post(f"{BASE}/api/documents/pdf", headers=H,
           json={"document": doc, "enregistrer": False, "envoyerEmail": False}, timeout=240)
duree = time.time() - t0
ok = r.ok and r.content[:5] == b"%PDF-"
print(f"{'OK ' if ok else 'ÉCHEC'} PDF proposition : HTTP {r.status_code} · "
      f"{len(r.content) // 1024} Ko · {duree:.1f} s")
if ok:
    with open("/tmp/render/e2e-v27-proposition.pdf", "wb") as f:
        f.write(r.content)
else:
    print(r.text[:300])
    raise SystemExit(1)
