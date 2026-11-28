#!/usr/bin/env python3
"""E2E API — VOLET 28 : espace « Audit » (3 outils) + non-régression scraping.

Sondes (serveur standalone port 3100) :
  1. les trois routes d'audit refusent sans session (401) ;
  2. connexion admin, puis chaque outil analyse une VRAIE page
     (performance avec un vrai Chrome, SEO, audit complet) ;
  3. les réponses portent les champs attendus (notes, vitals, familles, axes) ;
  4. non-régression : le scraping Google Maps répond avec le mot-clé
     de niche du fichier de prospection.
"""
import json
import time
import urllib.request
import urllib.error
import http.cookiejar

BASE = "http://localhost:3100"
PASSWORD = "MotDePasseTest-Volet28"
resultats = []


def verifie(nom, condition, detail=""):
    resultats.append((nom, bool(condition), detail))
    print(f"  {'OK ' if condition else 'ÉCHOUÉ'} {nom}" + (f" — {detail}" if detail and not condition else ""))


def requete(methode, chemin, corps=None, cookies=None, timeout=90):
    url = BASE + chemin
    data = json.dumps(corps).encode() if corps is not None else None
    req = urllib.request.Request(url, data=data, method=methode)
    if data:
        req.add_header("Content-Type", "application/json")
    if cookies:
        req.add_header("Cookie", cookies)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")


print("=== 1. Protection des routes d'audit (sans session) ===")
for outil in ("performance", "seo", "design"):
    code, _ = requete("POST", f"/api/admin/audit/{outil}", {"url": "https://example.com"})
    verifie(f"POST /api/admin/audit/{outil} sans session → 401", code == 401, f"reçu {code}")

print("=== 2. Connexion admin ===")
code, corps = requete("POST", "/api/admin/login", {"password": PASSWORD})
verifie("connexion admin", code == 200 and json.loads(corps).get("ok"), f"HTTP {code}")
cookie = None
try:
    cookie = json.loads(corps).get("cookie") or ""
except Exception:
    pass
if not cookie:
    # le cookie peut venir des en-têtes Set-Cookie : reconnexion via opener
    import urllib.request as uq

    cj = http.cookiejar.CookieJar()
    opener = uq.build_opener(uq.HTTPCookieProcessor(cj))
    req = uq.Request(BASE + "/api/admin/login", data=json.dumps({"password": PASSWORD}).encode(), method="POST")
    req.add_header("Content-Type", "application/json")
    with opener.open(req, timeout=30) as r:
        corps = r.read().decode()
    cookie = "; ".join(f"{c.name}={c.value}" for c in cj)
verifie("cookie de session obtenu", bool(cookie))

CIBLE = "https://example.com"

print("=== 3. Outil PERFORMANCE (vrai Chrome) ===")
t0 = time.time()
code, corps = requete("POST", "/api/admin/audit/performance", {"url": CIBLE}, cookies=cookie)
duree = time.time() - t0
verifie("HTTP 200", code == 200, f"reçu {code}: {corps[:160]}")
perf = json.loads(corps) if code == 200 else {}
if perf.get("ok"):
    verifie("note A-F présente", perf.get("note") in list("ABCDEF"), str(perf.get("note")))
    verifie("scores Performance et Structure", isinstance(perf.get("scorePerformance"), int) and isinstance(perf.get("scoreStructure"), int))
    codes = {v["code"] for v in perf.get("vitals", [])}
    verifie("Web Vitals LCP/TBT/CLS/FCP/SI", {"lcp", "tbt", "cls", "fcp", "si"} <= codes, str(codes))
    verifie("détails de la page (poids, requêtes, types)", perf.get("poidsTotal", 0) > 0 and perf.get("nbRequetes", 0) >= 1 and len(perf.get("detailsTypes", [])) >= 1)
    verifie("cascade des requêtes", isinstance(perf.get("cascade"), list) and len(perf["cascade"]) >= 1)
    print(f"      note {perf.get('note')} · perf {perf.get('scorePerformance')} · structure {perf.get('scoreStructure')} · {perf.get('nbRequetes')} requêtes · {duree:.1f}s")

print("=== 4. Outil SEO (RankFlow) ===")
code, corps = requete("POST", "/api/admin/audit/seo", {"url": CIBLE}, cookies=cookie)
verifie("HTTP 200", code == 200, f"reçu {code}: {corps[:160]}")
seo = json.loads(corps) if code == 200 else {}
if seo.get("ok"):
    verifie("score sur 100 + note + verdict", 0 <= seo.get("score", -1) <= 100 and seo.get("note") in list("ABCDEF") and seo.get("verdict") in ("Excellent", "Bon", "Correct", "Médiocre", "Mauvais"))
    familles = seo.get("familles", [])
    noms = {f["nom"] for f in familles}
    verifie("familles de critères (RankFlow)", len(familles) >= 4, str(noms))
    noms_criteres = [c["libelle"] for f in familles for c in f["criteres"]]
    verifie("au moins 15 critères vérifiés", len(noms_criteres) >= 15, f"{len(noms_criteres)}")
    verifie("plan d'action", isinstance(seo.get("plan"), list))
    verifie("aperçu (titre + description)", bool(seo.get("apercu", {}).get("titre")))
    print(f"      score {seo.get('score')}/100 {seo.get('note')} · {seo.get('verdict')} · {len(noms_criteres)} critères")

print("=== 5. Outil AUDIT COMPLET (design…) ===")
code, corps = requete("POST", "/api/admin/audit/design", {"url": CIBLE}, cookies=cookie)
verifie("HTTP 200", code == 200, f"reçu {code}: {corps[:160]}")
design = json.loads(corps) if code == 200 else {}
if design.get("ok"):
    verifie("score global /100 + note", 0 <= design.get("scoreGlobal", -1) <= 100 and design.get("note") in list("ABCDEF"))
    axes = {a["nom"] for a in design.get("axes", [])}
    verifie("axes Design / Structure / Copywriting / Conversion", axes == {"Design", "Structure", "Copywriting", "Conversion"}, str(axes))
    verifie("capture d'écran (data URL JPEG)", str(design.get("capture", "")).startswith("data:image/jpeg;base64,"))
    verifie("points forts et améliorations", isinstance(design.get("forces"), list) and isinstance(design.get("ameliorations"), list))
    print(f"      {design.get('scoreGlobal')}/100 {design.get('note')} · axes : " + ", ".join(f"{a['nom']} {a['score']}" for a in design.get("axes", [])))

print("=== 6. URL invalide refusée ===")
code, _ = requete("POST", "/api/admin/audit/seo", {"url": "pas-une-url"}, cookies=cookie)
verifie("URL invalide → 422", code == 422, f"reçu {code}")

print("=== 7. Non-régression scraping (mot-clé de niche du fichier) ===")
code, corps = requete("POST", "/api/admin/scraping/google-maps", {"niche": "paysagiste", "lieu": "Paris, France", "filtreSite": "tous"}, cookies=cookie, timeout=120)
verifie("scraping Google Maps répond", code == 200, f"reçu {code}: {corps[:160]}")
gm = json.loads(corps) if code == 200 else {}
if gm.get("ok"):
    print(f"      {len(gm.get('entreprises', []))} entreprises · {gm.get('sansSiteWeb')} sans site web")

print()
echecs = [r for r in resultats if not r[1]]
print(f"RÉSULTAT : {len(resultats) - len(echecs)}/{len(resultats)} contrôles réussis")
for nom, _, detail in echecs:
    print(f"  ÉCHEC : {nom} ({detail})")
exit(0 if not echecs else 1)
