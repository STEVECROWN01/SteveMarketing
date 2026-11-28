#!/usr/bin/env python3
"""VOLET 29 — retire TOUTE mention de « cloné sur GTmetrix /
RankFlow », de clé d'API ou d'abonnement des commentaires du code de
l'espace Audit et des outils de Scraping : plus jamais ces mots ne
doivent apparaître (demande de l'éditeur)."""

import re, pathlib

RACINE = pathlib.Path("src")

REMPLACEMENTS: list[tuple[str, str]] = [
    # --- audit/performance.ts ---
    (
        " * VOLET 28 (28/11/2026) — OUTIL « PERFORMANCE » DE L'AUDIT, cloné sur\n"
        " * GTmetrix (fonctionnement, barème et présentation) :\n",
        " * VOLET 28 (28/11/2026) — OUTIL « PERFORMANCE » DE L'AUDIT :\n",
    ),
    (" *  - NOTE GTmetrix : moyenne pondérée 60 %", " *  - NOTE GLOBALE : moyenne pondérée 60 %"),
    (" * DevTools — aucune clé d'API, aucun service externe.\n", " * DevTools, directement.\n"),
    ("/* --- audits de STRUCTURE (les recommandations GTmetrix) --- */", "/* --- audits de STRUCTURE (les recommandations) --- */"),
    ("/* --- note GTmetrix : 60 % performance + 40 % structure --- */", "/* --- note globale : 60 % performance + 40 % structure --- */"),
    # --- audit/seo.ts ---
    (
        " * VOLET 28 (28/11/2026) — OUTIL « SEO » DE L'AUDIT, cloné sur\n"
        " * RankFlow SEO (extension Chrome) : audit on-page en un clic, score\n",
        " * VOLET 28 (28/11/2026) — OUTIL « SEO » DE L'AUDIT : audit on-page\n"
        " * en un clic, score\n",
    ),
    (" * Barème RankFlow : A ≥ 90", " * Barème : A ≥ 90"),
    ("/* Barème RankFlow : A ≥ 90", "/* Barème : A ≥ 90"),
    (" * Analyse (source publique, sans clé) : balises", " * Analyse (source publique) : balises"),
    # --- audit/types.ts ---
    (
        " * Espace « Audit » du back-office, cloné sur les outils du marché\n"
        " * demandés par l'éditeur (sans clé d'API, sans abonnement) :\n",
        " * Espace « Audit » du back-office :\n",
    ),
    (" *  - PERFORMANCE (cloné sur GTmetrix) : note A-F", " *  - PERFORMANCE : note A-F"),
    (" *  - SEO (cloné sur RankFlow) : score sur 100", " *  - SEO : score sur 100"),
    ("/* ==================== PERFORMANCE (GTmetrix) ==================== */", "/* ==================== PERFORMANCE ==================== */"),
    ("/* ==================== SEO (RankFlow) ==================== */", "/* ==================== SEO ==================== */"),
    ("/** Un audit de structure (recommandation), comme GTmetrix. */", "/** Un audit de structure (recommandation). */"),
    ("  /** Note globale GTmetrix (60 % performance + 40 % structure). */", "  /** Note globale (60 % performance + 40 % structure). */"),
    ("/** Une famille de critères (comme RankFlow : balises, contenu…). */", "/** Une famille de critères (balises, contenu…). */"),
    (" * Note A-F (barème GTmetrix : A ≥ 90, B ≥ 80, C ≥ 70, D ≥ 60,", " * Note A-F (barème : A ≥ 90, B ≥ 80, C ≥ 70, D ≥ 60,"),
    # --- scraping/types.ts ---
    (
        " * Trois outils « clonés » sur les acteurs du marché (Google Maps,\n"
        " * Instagram, LinkedIn), SANS CLÉ D'API NI ABONNEMENT :\n",
        " * Trois outils de prospection (Google Maps, Instagram, LinkedIn) :\n",
    ),
    # --- scraping/google-maps.ts ---
    (
        " * PAR NICHE, cloné gratuitement sur le scraping de fiches\n"
        " * d'entreprises : données publiques OpenStreetMap (Nominatim —\n"
        " * aucune clé, aucune limite de paiement).\n",
        " * PAR NICHE : données publiques OpenStreetMap (Nominatim).\n",
    ),
    # --- scraping/instagram.ts ---
    (
        " * abonnés), cloné gratuitement sur les scrapers de pages Instagram.\n",
        " * abonnés) des pages d'entreprises Instagram.\n",
    ),
    (
        " *  - mots-clés / niche : découverte des comptes d'entreprises via les\n"
        " *    moteurs de recherche (chaîne gratuite — aucun compte, aucune\n"
        " *    clé), puis enrichissement de chaque profil ;\n",
        " *  - mots-clés / niche : découverte des comptes d'entreprises via les\n"
        " *    moteurs de recherche, puis enrichissement de chaque profil ;\n",
    ),
    # --- scraping/linkedin.ts ---
    (
        " * nombre d'employés, site web, type), cloné gratuitement sur les\n"
        " * scrapers de pages LinkedIn.\n",
        " * nombre d'employés, site web, type) des pages d'entreprises\n"
        " * LinkedIn.\n",
    ),
    # --- scraping/http.ts ---
    (
        " * décodage d'entités et timeout — aucune dépendance externe (fetch\n"
        " * global), aucune clé d'API.\n",
        " * décodage d'entités et timeout — aucune dépendance externe (fetch\n"
        " * global).\n",
    ),
    # --- scraping/moteurs.ts ---
    (
        " * VOLET 27 — chaîne de MOTEURS DE RECHERCHE gratuits (sans clé) pour\n",
        " * VOLET 27 — chaîne de MOTEURS DE RECHERCHE pour\n",
    ),
    # --- api/admin/audit/performance/route.ts ---
    (" * (cloné sur GTmetrix) : mesure la page dans un vrai Chrome (note", " * : mesure la page dans un vrai Chrome (note"),
    # --- api/admin/audit/seo/route.ts ---
    (
        " * VOLET 28 (28/11/2026) — OUTIL « SEO » DE L'ESPACE AUDIT (cloné sur\n"
        " * RankFlow SEO) : audit on-page en un clic — score sur 100, note\n",
        " * VOLET 28 (28/11/2026) — OUTIL « SEO » DE L'ESPACE AUDIT :\n"
        " * audit on-page en un clic — score sur 100, note\n",
    ),
    # --- api/translate/route.ts ---
    (" * Traduction via l'API publique MyMemory (gratuite, sans clé —", " * Traduction via l'API publique MyMemory (gratuite —"),
]

total = 0
for chemin in RACINE.rglob("*.ts"):
    texte = chemin.read_text(encoding="utf-8")
    original = texte
    for avant, apres in REMPLACEMENTS:
        texte = texte.replace(avant, apres)
    if texte != original:
        chemin.write_text(texte, encoding="utf-8")
        nb = sum(1 for avant, _ in REMPLACEMENTS if avant in original)
        print(f"{chemin} : {len(REMPLACEMENTS) and sum(original.count(avant) for avant, _ in REMPLACEMENTS)} remplacement(s)")
        total += 1

print(f"\n{total} fichier(s) mis à jour")
# Vérification : plus aucune occurrence
restants = []
for mot in ["cloné sur GTmetrix", "cloné sur RankFlow", "RankFlow", "GTmetrix",
            "aucune clé d'API", "sans clé d'API", "SANS CLÉ D'API", "aucune clé, aucune", "sans abonnement", "clonés »", "cloné gratuitement"]:
    for chemin in RACINE.rglob("*.ts"):
        if mot in chemin.read_text(encoding="utf-8"):
            for i, ligne in enumerate(chemin.read_text(encoding="utf-8").splitlines(), 1):
                if mot in ligne:
                    restants.append(f"{chemin}:{i}: {ligne.strip()[:90]}")
if restants:
    print("RESTANTS :")
    for r in restants:
        print(" ", r)
else:
    print("Aucune occurrence restante.")
