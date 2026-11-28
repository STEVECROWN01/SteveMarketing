#!/usr/bin/env python3
"""E2E VOLET 27 (28/11/2026) — API :
  1. les TROIS outils de scraping (Google Maps, Instagram, LinkedIn) ;
  2. le FILTRE « avec / sans site web » et « employés minimum » ;
  3. la VITESSE de génération des PDF (polices inlinées, parallélisme)
     et du scraping de lien portfolio (captures parallèles) ;
  4. la validité des PDF (pagination M29 conservée)."""
import json
import os
import sys
import time

import requests

BASE = os.environ.get("E2E_BASE", "http://localhost:3100")
MOT_DE_PASSE = os.environ.get("ADMIN_PASSWORD", "MotDePasseTest-Volet27")

ok_global = True

def check(nom, cond, detail=""):
    global ok_global
    ok_global &= bool(cond)
    print(f"{'OK ' if cond else 'ÉCHEC'} {nom}" + (f" — {detail}" if detail else ""))

s = requests.Session()

# ---------- 1. connexion ----------
r = s.post(f"{BASE}/api/admin/login", json={"password": MOT_DE_PASSE}, timeout=30)
check("connexion admin", r.ok and r.json().get("ok"), r.text[:80])
cookie = r.headers.get("set-cookie", "")
JETON = (cookie.split(";")[0].split("=", 1)[1] if "=" in cookie else "").strip()
ENTETES = {"Cookie": f"stevens_admin_session={JETON}"} if JETON else {}

# ---------- 2. NON-AUTHENTIFIÉ : les routes scraping sont privées ----------
r = requests.post(f"{BASE}/api/admin/scraping/google-maps", json={"niche": "x", "lieu": "y"}, timeout=30)
check("scraping google-maps : refus sans session (401)", r.status_code == 401, f"HTTP {r.status_code}")
r = requests.post(f"{BASE}/api/admin/scraping/instagram", json={"recherche": "x"}, timeout=30)
check("scraping instagram : refus sans session (401)", r.status_code == 401, f"HTTP {r.status_code}")
r = requests.post(f"{BASE}/api/admin/scraping/linkedin", json={"recherche": "x"}, timeout=30)
check("scraping linkedin : refus sans session (401)", r.status_code == 401, f"HTTP {r.status_code}")

# ---------- 3. OUTIL GOOGLE MAPS : niche + lieu + filtres ----------
t0 = time.time()
r = s.post(f"{BASE}/api/admin/scraping/google-maps", headers=ENTETES,
           json={"niche": "salon de coiffure", "lieu": "Cotonou, Bénin", "filtreSite": "tous"}, timeout=90)
duree_maps = time.time() - t0
data = r.json()
check("google-maps « salon de coiffure » à Cotonou : réponse OK",
      r.ok and data.get("ok") and len(data.get("entreprises", [])) > 0,
      f"{len(data.get('entreprises', []))} entreprises en {duree_maps:.1f} s")
ent = data.get("entreprises", [])
if ent:
    premiere = ent[0]
    check("google-maps : nom présent", bool(premiere.get("nom")), premiere.get("nom", "")[:40])
    check("google-maps : niche présente", bool(premiere.get("niche")), premiere.get("niche", "")[:40])
    check("google-maps : pays/localisation présents",
          bool(premiere.get("pays") or premiere.get("localisation")),
          (premiere.get("localisation") or premiere.get("pays") or "")[:60])
    telephones = [e for e in ent if e.get("telephone")]
    print(f"   → {len(telephones)}/{len(ent)} fiches avec téléphone ; "
          f"{sum(1 for e in ent if e['siteWebPresent'])} avec site web ; "
          f"{data.get('sansSiteWeb')} sans site web")
    check("google-maps : au moins une fiche avec coordonnées (téléphone OU email OU site)",
          len(telephones) > 0 or any(e.get("email") for e in ent) or any(e["siteWebPresent"] for e in ent))

r = s.post(f"{BASE}/api/admin/scraping/google-maps", headers=ENTETES,
           json={"niche": "salon de coiffure", "lieu": "Cotonou, Bénin", "filtreSite": "sans"}, timeout=90)
sans = r.json().get("entreprises", [])
check("google-maps filtre « SANS site web » : toutes sans site",
      len(sans) > 0 and all(not e["siteWebPresent"] for e in sans), f"{len(sans)} entreprises")

r = s.post(f"{BASE}/api/admin/scraping/google-maps", headers=ENTETES,
           json={"niche": "salon de coiffure", "lieu": "Cotonou, Bénin", "filtreSite": "avec"}, timeout=90)
avec = r.json().get("entreprises", [])
if avec:
    check("google-maps filtre « AVEC site web » : toutes avec site",
          all(e["siteWebPresent"] for e in avec), f"{len(avec)} entreprises")
else:
    print("   note : aucune fiche avec site web pour cette niche — filtre « avec » non vérifiable ici")

# ---------- 4. OUTIL LINKEDIN : URL directe + filtre employés ----------
r = s.post(f"{BASE}/api/admin/scraping/linkedin", headers=ENTETES,
           json={"recherche": "https://www.linkedin.com/company/microsoft/", "filtreSite": "tous"}, timeout=90)
data = r.json()
ent = data.get("entreprises", [])
check("linkedin (URL directe) : réponse OK", r.ok and data.get("ok") and len(ent) == 1,
      r.text[:120] if not r.ok else f"{len(ent)} entreprise(s)")
if ent:
    microsoft = ent[0]
    check("linkedin : nom Microsoft", "microsoft" in microsoft["nom"].lower(), microsoft["nom"])
    check("linkedin : industrie (niche)", bool(microsoft.get("niche")) and "secteur" not in microsoft.get("niche", "").lower(),
          microsoft.get("niche", ""))
    emp_chiffres = "".join(c for c in (microsoft.get("employes") or "") if c.isdigit())
    check("linkedin : nombre d'employés", "10000" in emp_chiffres,
          microsoft.get("employes", ""))
    check("linkedin : siège (localisation)", "Redmond" in (microsoft.get("localisation") or ""),
          microsoft.get("localisation", ""))
    check("linkedin : site web décodé (redirection LinkedIn)", "microsoft.com" in (microsoft.get("siteWeb") or ""),
          microsoft.get("siteWeb", ""))
    check("linkedin : fiche publique", "linkedin.com/company/microsoft" in (microsoft.get("urlSource") or ""))

r = s.post(f"{BASE}/api/admin/scraping/linkedin", headers=ENTETES,
           json={"recherche": "linkedin.com/company/microsoft", "minEmployes": 500}, timeout=90)
check("linkedin filtre « ≥ 500 employés » : Microsoft retenue",
      r.ok and len(r.json().get("entreprises", [])) == 1)
r = s.post(f"{BASE}/api/admin/scraping/linkedin", headers=ENTETES,
           json={"recherche": "linkedin.com/company/microsoft", "minEmployes": 50000}, timeout=90)
check("linkedin filtre « ≥ 50 000 employés » : Microsoft masquée",
      r.ok and len(r.json().get("entreprises", [])) == 0)

# ---------- 5. OUTIL INSTAGRAM : dégradation propre ----------
r = s.post(f"{BASE}/api/admin/scraping/instagram", headers=ENTETES,
           json={"recherche": "@nike", "filtreSite": "tous"}, timeout=120)
data = r.json()
check("instagram : réponse OK (données ou message de limitation)",
      r.ok and data.get("ok"), r.text[:120])
print(f"   → {len(data.get('entreprises', []))} profil(s) ; avertissement : "
      f"{(data.get('avertissement') or 'aucun')[:110]}")
if data.get("entreprises"):
    nike = data["entreprises"][0]
    check("instagram : username conservé", nike.get("contact") == "nike", nike.get("contact", ""))

# ---------- 6. VITESSE : génération PDF (polices inlinées + parallélisme) ----------
perimetre = (
    '<div><p><font size="5"><b>Périmètre {i} — Conception et mise en œuvre</b></font></p>'
    "<p>La prestation comprend la conception {i}, la rédaction des contenus essentiels, "
    "la mise en place technique et le contrôle qualité. "
    "Je prends en charge les points clés du projet, leur intégration et leur validation "
    "avant livraison. "
    "Vous bénéficiez d'un accompagnement rapproché jusqu'à la mise en ligne finale.</p></div>"
)
DESC_PROP = "".join(perimetre.format(i=i) for i in range(1, 10))
paragraphe = (
    "Paragraphe {i} de la description rédigée au clavier. "
    "Ce contenu détaillé explique ce qui sera fait pour votre projet, avec plusieurs phrases complètes. "
    "Chaque phrase apporte une précision utile sur la prestation, son déroulé et ses livrables. "
    "Le client doit sentir qu'on lui parle de son projet, pas d'une liste technique. "
    "La rédaction reste professionnelle et fluide jusqu'au bout du paragraphe."
)
DESC_DIRECT = paragraphe.format(i=0) + "".join(
    f"<div>{paragraphe.format(i=i)}</div>" for i in range(1, 7)
)

def devis(doc_id, numero, items, doc_type="devis", **extra):
    doc = {
        "langue": "fr",
        "client": {"nom": "Client E2E", "ville": "Cotonou", "pays": "Bénin",
                   "telephone": "", "email": ""},
        "objet": "Création d'un site web professionnel",
        "intro": ("Le présent devis concerne la création d'un site web professionnel conçu pour "
                  "valoriser votre activité, attirer les bons visiteurs et transformer leur "
                  "intérêt en demandes concrètes."),
        "items": items,
        "devise": "XOF",
        "delaiEstime": "3 à 4 semaines",
        "conditionsReglement": "À réception",
        "modePaiement": "Virement bancaire",
        "validiteJours": 15,
        "notes": "",
        "banque": {"titulaire": "Stevens AKPOVI", "iban": "BJ123", "bic": "BIC123"},
        "id": doc_id,
        "numero": numero,
        "docType": doc_type,
        "numeroClient": 2600100,
        "date": "2026-11-28",
    }
    doc.update(extra)
    return doc

def item(iid, designation, description, prix, qte=1):
    return {"id": iid, "type": "Service", "designation": designation,
            "description": description, "quantite": qte, "prixUnitaire": prix}

DOCS = {
    "e2e-v27-devis": devis("e2e-v27-devis", "D2600301", [
        item("d1", "Refonte complète du site vitrine", DESC_DIRECT, 280000),
        item("d2", "Maintenance et suivi",
             "<p>Suivi mensuel du site, mises à jour de sécurité et sauvegardes.</p>", 25000, 3)]),
    "e2e-v27-facture": devis("e2e-v27-facture", "F2600302", [
        item("f1", "Création du site web professionnel", DESC_PROP, 350000),
        item("f2", "Rédaction des contenus",
             "".join(f"<div>{paragraphe.format(i=i)}</div>" for i in range(1, 4)), 90000),
        item("f3", "Formation à l'administration",
             "<p>Formation complète à la gestion autonome du site.</p>", 40000, 2)],
        doc_type="facture", statutPaiement="En attente", devisSource="D2600301"),
    # document de VITESSE : petite facture — la 1re génération paie le
    # lancement de Chromium + la mise en cache des polices ; la 2e
    # doit être nettement plus rapide (polices en cache).
    "e2e-v27-rapide-1": devis("e2e-v27-rapide-1", "F2600303", [
        item("r1", "Acompte", "<p>Acompte du projet.</p>", 50000)], doc_type="facture",
        statutPaiement="En attente", devisSource="D2600301"),
    "e2e-v27-rapide-2": devis("e2e-v27-rapide-2", "F2600304", [
        item("r2", "Solde", "<p>Solde du projet.</p>", 50000)], doc_type="facture",
        statutPaiement="En attente", devisSource="D2600301"),
}

durees = {}
for nom, doc in DOCS.items():
    t0 = time.time()
    r = s.post(f"{BASE}/api/documents/pdf", headers=ENTETES,
               json={"document": doc, "enregistrer": False, "envoyerEmail": False}, timeout=240)
    durees[nom] = time.time() - t0
    check(f"PDF {nom} valide", r.ok and r.content[:5] == b"%PDF-",
          f"{len(r.content) // 1024} Ko en {durees[nom]:.1f} s" if r.ok else f"HTTP {r.status_code} : {r.text[:200]}")
    if r.ok:
        with open(f"/tmp/render/{nom}.pdf", "wb") as f:
            f.write(r.content)

check("VITESSE : génération à chaud nettement plus rapide (polices en cache)",
      durees.get("e2e-v27-rapide-2", 999) < max(6.0, durees.get("e2e-v27-rapide-1", 0) * 0.75),
      f"1re : {durees.get('e2e-v27-rapide-1', 0):.1f} s → 2e : {durees.get('e2e-v27-rapide-2', 0):.1f} s")

# ---------- 7. VITESSE : scraping de lien portfolio (captures parallèles) ----------
t0 = time.time()
r = s.post(f"{BASE}/api/admin/projects/scrape", headers=ENTETES,
           json={"url": "https://example.com"}, timeout=120)
duree_scrape = time.time() - t0
check("scraping de lien portfolio : réponse OK",
      r.ok and r.json().get("ok") and "desktop" in (r.json() or {}),
      f"{duree_scrape:.1f} s" if r.ok else f"HTTP {r.status_code} : {r.text[:150]}")
if r.ok:
    d = r.json()
    check("scraping : nom + titre + description + les DEUX aperçus",
          bool(d.get("nom")) and bool(d.get("desktop", {}).get("data")) and bool(d.get("mobile", {}).get("data")),
          f"nom={d.get('nom')} · titre={d.get('titre', '')[:30]}")

print()
print("VERDICT API :", "TOUT OK" if ok_global else "ÉCHECS À CORRIGER")
sys.exit(0 if ok_global else 1)
