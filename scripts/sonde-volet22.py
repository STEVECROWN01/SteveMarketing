#!/usr/bin/env python3
"""VOLET 22 — SONDE END-TO-END LOCALE des nouvelles API du back-office.

1. Connexion admin (cookie de session).
2. Portfolio : liste + conversion d'une réalisation du site
   (dépublication → publication → suppression définitive) puis
   NETTOYAGE complet du stockage GitHub (retour à l'état initial).
3. Devis signé : vérification stricte à l'upload (bon PDF → valide ;
   PDF étranger → invalide avec raisons).
4. Scraper : scraping du site local (nom/titre/description + captures).
"""
import requests, base64, json, sys

BASE = "http://localhost:3000"
ok_global = True

def check(nom, cond, detail=""):
    global ok_global
    ok_global &= bool(cond)
    print(f"{'✓' if cond else '✗'} {nom}" + (f" — {detail}" if detail else ""))

s = requests.Session()

# ---------- 1. Connexion ----------
r = s.post(f"{BASE}/api/admin/login", json={"password": "test-volet22-local"}, timeout=30)
check("connexion admin", r.status_code == 200 and r.json().get("ok"), r.text[:80])

# ---------- 2. Portfolio : gestion des réalisations du site ----------
r = s.get(f"{BASE}/api/admin/projects", timeout=60)
data = r.json()
check("liste admin (siteSupprimes fourni)", r.ok and data.get("ok") and isinstance(data.get("siteSupprimes"), list),
      f"{len(data.get('projets', []))} projets admin, siteSupprimes={data.get('siteSupprimes')}")

avant = {p["id"] for p in data.get("projets", [])}
check("afribayit pas encore administré", "afribayit" not in avant)

# 2a. Dépublication de la réalisation AFRIBAYIT du site
r = s.post(f"{BASE}/api/admin/projects/site", json={"id": "afribayit", "statut": "brouillon"}, timeout=90)
check("dépublication d'une réalisation du site", r.ok and r.json().get("ok"), r.text[:120])

r = s.get(f"{BASE}/api/admin/projects", timeout=60)
apres = {p["id"]: p for p in r.json().get("projets", [])}
check("afribayit devient brouillon administré (origine site)",
      "afribayit" in apres and apres["afribayit"]["statut"] == "brouillon" and apres["afribayit"].get("origine") == "site"
      and apres["afribayit"].get("desktop", {}).get("data"))

r = requests.get(f"{BASE}/api/projects", timeout=60)
public = r.json()
check("site public : afribayit masqué (dépublié)", "afribayit" in public.get("statiquesMasques", []),
      f"statiquesMasques={public.get('statiquesMasques')}")

# 2b. Re-publication (via le flux admin normal)
r = s.post(f"{BASE}/api/admin/projects", json={"projet": {"id": "afribayit"}, "statut": "publie"}, timeout=90)
check("re-publication d'afribayit", r.ok and r.json().get("ok"))

r = requests.get(f"{BASE}/api/projects", timeout=60)
public = r.json()
check("site public : afribayit de retour (statiquesMasques vide)",
      "afribayit" not in public.get("statiquesMasques", []) and any(p["id"] == "afribayit" for p in public.get("projets", [])))

# 2c. Suppression définitive (cascade → supprimes.json)
r = s.delete(f"{BASE}/api/admin/projects", json={"id": "afribayit"}, timeout=60)
check("suppression définitive d'afribayit (cascade site)", r.ok and r.json().get("ok"))

r = requests.get(f"{BASE}/api/projects", timeout=60)
public = r.json()
check("site public : afribayit supprimé définitivement", "afribayit" in public.get("statiquesMasques", []))

# 2d. NETTOYAGE : retirer afribayit de portfolio-site/supprimes.json
#     (retour à l'état initial — le projet redevient la réalisation statique)
import os
token = os.environ.get("GITHUB_DOCS_TOKEN", "")
repo = "STEVECROWN01/SteveMarketing-Documents"
hdrs = {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"}
r = requests.get(f"https://api.github.com/repos/{repo}/contents/portfolio-site/supprimes.json?ref=main", headers=hdrs, timeout=30)
if r.status_code == 200:
    sha = r.json()["sha"]
    d = requests.delete(f"https://api.github.com/repos/{repo}/contents/portfolio-site/supprimes.json",
                        headers=hdrs, json={"message": "sonde volet 22 : nettoyage supprimes.json (état initial)", "sha": sha, "branch": "main"}, timeout=30)
    check("nettoyage supprimes.json", d.status_code in (200, 201), str(d.status_code))
else:
    check("nettoyage supprimes.json (déjà absent)", r.status_code == 404, str(r.status_code))
# le fichier portfolio/afribayit.json doit être absent
r = requests.get(f"https://api.github.com/repos/{repo}/contents/portfolio/afribayit.json?ref=main", headers=hdrs, timeout=30)
check("stockage propre : portfolio/afribayit.json absent", r.status_code == 404)
r = requests.get(f"{BASE}/api/projects", timeout=60)
check("site public : retour à l'état initial (afribayit statique visible)",
      "afribayit" not in r.json().get("statiquesMasques", []) and not any(p["id"] == "afribayit" for p in r.json().get("projets", [])))

# ---------- 3. Devis signé : vérification stricte à l'upload ----------
devis_test = {
    "docType": "devis", "id": "devis-d2699999", "numero": "D2699999", "numeroClient": 99999,
    "langue": "fr", "date": "2026-11-27",
    "client": {"nom": "CLIENT SONDE", "entreprise": "", "ville": "Cotonou", "pays": "Bénin",
               "telephone": "+229 97 00 00 00", "email": "sonde@exemple.fr"},
    "objet": "Sonde", "intro": "Introduction de la sonde.",
    "items": [{"id": "l1", "type": "Service", "designation": "Sonde",
               "description": "Vérification du contenu du devis signé.", "quantite": 1, "prixUnitaire": 1000}],
    "devise": "EUR", "delaiEstime": "02 à 03 semaines", "conditionsReglement": "À réception",
    "modePaiement": "Virement bancaire", "validiteJours": 15, "notes": "Note de la sonde.",
    "banque": {"titulaire": "TCHOGNON STEVENS AKPOVI", "iban": "MT33CFTE28904000000000006119777", "bic": "CFTEMTM1XXX"},
}
r = s.post(f"{BASE}/api/documents", json={"document": devis_test}, timeout=60)
check("enregistrement du devis de sonde", r.ok and r.json().get("ok"), r.text[:100])

r = s.post(f"{BASE}/api/documents/pdf", json={"document": devis_test, "enregistrer": False, "envoyerEmail": False}, timeout=120)
check("génération du PDF du devis de sonde", r.ok and r.content[:5] == b"%PDF-", f"{len(r.content) // 1024} Ko")

pdf_bon = base64.b64encode(r.content).decode()
r = s.post(f"{BASE}/api/documents/devis-d2699999/verifier-signature", json={"data": pdf_bon}, timeout=120)
data = r.json()
check("vérification stricte : le VRAI devis → valide", r.ok and data.get("ok") and data.get("valide") is True, str(data.get("manques"))[:200])

# un PDF ÉTRANGER (le devis de contrôle D2600001 — autre numéro) doit être REFUSÉ
with open("scripts/controle-volet22/devis-long.pdf", "rb") as f:
    pdf_etranger = base64.b64encode(f.read()).decode()
r = s.post(f"{BASE}/api/documents/devis-d2699999/verifier-signature", json={"data": pdf_etranger}, timeout=120)
data = r.json()
check("vérification stricte : un devis ÉTRANGER → invalide", r.ok and data.get("ok") and data.get("valide") is False, str(data.get("manques"))[:200])

# nettoyage du devis de sonde
r = s.delete(f"{BASE}/api/documents/devis-d2699999", timeout=60)
check("suppression du devis de sonde", r.ok and r.json().get("ok"))
r = requests.get(f"https://api.github.com/repos/{repo}/contents/documents/devis-d2699999.json?ref=main", headers=hdrs, timeout=30)
check("stockage propre : devis de sonde supprimé", r.status_code == 404)

# ---------- 4. Scraper (sur le site local) ----------
r = s.post(f"{BASE}/api/admin/projects/scrape", json={"url": "http://localhost:3000"}, timeout=120)
data = r.json()
check("scraper : réponse ok", r.ok and data.get("ok"), r.text[:160])
if data.get("ok"):
    check("scraper : nom/titre/description récupérés",
          bool(data.get("nom")) and bool(data.get("titre")) and bool(data.get("description")),
          f"nom={data.get('nom')!r} titre={data.get('titre')!r} desc={str(data.get('description'))[:60]!r}")
    check("scraper : captures desktop + mobile",
          bool(data.get("desktop", {}).get("data")) and bool(data.get("mobile", {}).get("data")),
          f"desktop {len(data.get('desktop', {}).get('data', '')) // 1024} Ko, mobile {len(data.get('mobile', {}).get('data', '')) // 1024} Ko")

print()
print("VERDICT :", "TOUT OK" if ok_global else "ÉCHECS À CORRIGER")
sys.exit(0 if ok_global else 1)
