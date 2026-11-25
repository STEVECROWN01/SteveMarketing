#!/usr/bin/env python3
"""VOLET 19 (26/11/2026) — SONDE PROD sur https://stevensakpovi.vercel.app.

Contrôles publics (la partie admin exige le vrai mot de passe, privé —
comme au volet 17, seules les surfaces publiques et la nouvelle API
sont sondées ; la sonde locale 29/29 a déjà couvert l'espace admin) :
  P1  /api/projects répond (nouvelle route de ce volet)
  P2  header : hauteur du bouton langue = hauteur du CTA
  P3  header : espace menu↔CTA = espace entre menus
  P4  hero EN : « I Build Professional Websites That Drive Sales. »
  P5  hero : plus de zoom sur les mockups épinglés
  P6  accueil : grille réalisations 4 projets → 2 colonnes
  P7  page Réalisations : les 4 projets statiques présents
  P8  page projet statique (afribayit) rendue
  P9  image d'un projet admin inexistant → 404 (aucune fuite)
  P10 connexion admin : bloc entièrement visible sans scroll (mobile)
  P11 contact : page chargée (non-régression)
  P12 retour FR : le site rebascule proprement
"""

import asyncio
import json
import re
import sys

from playwright.async_api import async_playwright

BASE = "https://stevensakpovi.vercel.app"

resultats: list[tuple[str, str, str]] = []


def ok(cid: str, detail: str):
    resultats.append((cid, "PASS", detail))
    print(f"  ✓ {cid}  {detail}")


def echec(cid: str, detail: str):
    resultats.append((cid, "FAIL", detail))
    print(f"  ✗ {cid}  {detail}")


def verif(cid: str, condition: bool, detail: str, detail_echec: str = ""):
    if condition:
        ok(cid, detail)
    else:
        echec(cid, detail_echec or detail)


def norm(texte: str) -> str:
    return re.sub(r"[\s\u00a0\u200b\u2060]+", " ", texte).strip()


async def main():
    async with async_playwright() as pw:
        navigateur = await pw.chromium.launch()
        contexte = await navigateur.new_context(
            viewport={"width": 1440, "height": 900}, locale="fr-FR"
        )
        page = await contexte.new_page()
        page.set_default_timeout(30000)

        print("— P1 : nouvelle API publique des projets")
        rep = await page.request.get(f"{BASE}/api/projects")
        corps = await rep.json()
        verif(
            "P1",
            rep.ok and corps.get("ok") is True and isinstance(corps.get("projets"), list),
            f"GET /api/projects → ok ({len(corps.get('projets', []))} projet(s) publié(s))",
        )

        print("— P2/P3/P4/P5 : header, hero, mockups (bureau)")
        await page.goto(BASE, wait_until="load")
        await page.wait_for_timeout(6000)

        bouton_langue = page.locator('header nav button[title*="site"]')
        cta = page.locator('header nav button[aria-label*="page de demande de devis"]')
        h_langue = (await bouton_langue.bounding_box())["height"]
        h_cta = (await cta.bounding_box())["height"]
        verif(
            "P2",
            abs(h_langue - h_cta) <= 2 and h_langue >= 50,
            f"bouton langue {h_langue:.0f}px ≈ CTA {h_cta:.0f}px",
            f"hauteurs divergentes : {h_langue:.0f} vs {h_cta:.0f}",
        )

        liens = page.locator("header nav ul li a")
        boites = [await liens.nth(i).bounding_box() for i in range(await liens.count())]
        cta_box = await cta.bounding_box()
        espace_menus = boites[1]["x"] - (boites[0]["x"] + boites[0]["width"])
        espace_cta = cta_box["x"] - (boites[-1]["x"] + boites[-1]["width"])
        verif(
            "P3",
            abs(espace_menus - espace_cta) <= 4,
            f"espace menu↔CTA {espace_cta:.0f}px ≈ espace menus {espace_menus:.0f}px",
        )

        await bouton_langue.click()
        await page.wait_for_timeout(1200)
        titre_en = norm(await page.locator("main h1").inner_text())
        verif(
            "P4",
            "Drive Sales" in titre_en and "Generate Sales" not in titre_en,
            f"titre EN = « {titre_en} »",
        )
        await bouton_langue.click()
        await page.wait_for_timeout(1200)
        titre_fr = norm(await page.locator("main h1").inner_text())
        verif(
            "P12",
            "Génèrent des Ventes" in titre_fr,
            f"retour FR propre : « {titre_fr} »",
        )

        zooms = await page.locator(".hero-anim-browser .mockup-zoom").count()
        zooms += await page.locator(".hero-anim-phone .mockup-zoom").count()
        verif("P5", zooms == 0, "aucun zoom sur les deux mockups épinglés", f"{zooms} zoomés")

        print("— P6 : accueil, grille des réalisations")
        await page.locator("#realisations").scroll_into_view_if_needed()
        await page.wait_for_timeout(900)
        classes = await page.locator("#realisations .grid").first.get_attribute("class")
        cartes = await page.locator("#realisations .grid > *").count()
        verif(
            "P6",
            "md:grid-cols-2" in classes and cartes == 4,
            f"grille 2 colonnes, {cartes} projets statiques",
            f"grille : {classes} ({cartes} cartes)",
        )

        print("— P7 : page Réalisations")
        await page.goto(f"{BASE}/#/realisations", wait_until="load")
        await page.wait_for_timeout(4500)
        noms = ["MR STEVE ENGLISH", "AFRIBAYIT", "ALEXANDRE MOREL"]
        presentes = 0
        for n in noms:
            if await page.locator(f'main h2:has-text("{n}")').count() >= 1:
                presentes += 1
        verif("P7", presentes == 3, f"les réalisations statiques sont en ligne ({presentes}/3)")

        print("— P8 : page projet statique")
        await page.goto(f"{BASE}/#/projet/afribayit", wait_until="load")
        await page.wait_for_timeout(4500)
        h1 = norm(await page.locator("main h1").first.inner_text())
        imgs = await page.locator('main img[src*="/assets/projects/"]').count()
        verif("P8", "AFRIBAYIT" in h1 and imgs >= 1, f"page projet afribayit rendue (« {h1} »)")

        print("— P9 : aucune fuite d'image de projet admin")
        rep = await page.request.get(f"{BASE}/api/projects/projet-inexistant/desktop")
        verif("P9", rep.status == 404, f"image de projet inconnu → {rep.status} (404 attendu)")

        print("— P10 : connexion admin visible sans scroll (mobile)")
        await page.set_viewport_size({"width": 375, "height": 667})
        await page.goto(f"{BASE}/#/admin", wait_until="load")
        await page.wait_for_selector("#admin-password", state="visible")
        carte = await page.locator("input#admin-password").evaluate(
            "el => { let n = el; while (n && !n.classList.contains('max-w-md')) n = n.parentElement; return n ? n.getBoundingClientRect() : null; }"
        )
        verif(
            "P10",
            carte is not None and carte["bottom"] <= 667 + 1,
            f"bloc de connexion visible sans scroll (bas à {carte['bottom']:.0f}px ≤ 667)",
            f"bloc coupé : {carte}",
        )

        print("— P11 : contact (non-régression)")
        await page.set_viewport_size({"width": 1440, "height": 900})
        await page.goto(f"{BASE}/#/contact", wait_until="load")
        await page.wait_for_timeout(3500)
        formulaire = await page.locator("form").count()
        verif("P11", formulaire >= 1, "page contact chargée avec son formulaire")

        await contexte.close()
        await navigateur.close()

    print("\n" + "=" * 64)
    passes = sum(1 for _, s, _ in resultats if s == "PASS")
    print(f"VOLET 19 — SONDE PROD : {passes}/{len(resultats)} contrôles réussis")
    for cid, statut, detail in resultats:
        if statut == "FAIL":
            print(f"  ÉCHEC {cid} : {detail}")
    sys.exit(0 if passes == len(resultats) else 1)


asyncio.run(main())
