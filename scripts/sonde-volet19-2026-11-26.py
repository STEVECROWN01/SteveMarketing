#!/usr/bin/env python3
"""VOLET 19 (26/11/2026) — SONDE LOCALE du site sur :3100.

Contrôles (toutes les demandes de l'éditeur du 26/11/2026) :
  C1  header : hauteur du bouton de langue = hauteur du CTA (52 px)
  C2  header : espace menu↔CTA = espace entre les menus (~20 px)
  C3  hero EN : « I Build Professional Websites That Drive Sales. »
  C4  hero : plus d'effet zoom sur les deux mockups épinglés
  C5  connexion admin : bloc ENTIEREMENT visible sans scroll
      (mobile 375×667, tablette 768×1024, bureau 1440×900)
  C6  connexion réelle + back-office
  C7  rubrique « Portfolio du site » présente et fonctionnelle
  C8  API admin portfolio : liste (auth) OK
  C9  création d'un BROUILLON → invisible côté public
  C10 publication → visible côté public + image servie
  C11 accueil : le projet publié apparaît (5 projets → 2 colonnes)
  C12 page projet du projet admin (capture bureau, sans mobile)
  C13 page Réalisations : le projet apparaît
  C14 suppression → le projet disparaît du site
  C15 aperçu : pied « A4 · Mise à jour en temps réel » + navigation
      AU PIED + bouton PLEIN ÉCRAN dans l'entête (2 flèches obliques)
  C16 plein écran : ouvre en grand (fixed inset-0), Échap referme
  C17 devis : logo en-tête page 1 (hauteur ~17 mm) + total/TVA en
      gros avec POINTILLÉS + prix totalement à droite
  C18 devis : description DENSE → le tableau REMPLIT la page 1
      (multi-fragments) et en-tête compact sur la page 2
  C19 proposition : logo page 1 ~78,8 pt + filigrane ~353,4 pt
  C20 nettoyage : le projet de test est supprimé
"""

import asyncio
import base64
import io
import json
import re
import sys

from playwright.async_api import async_playwright

BASE = "http://127.0.0.1:3100"
MDP = "MotDePasseTest-Volet19"

resultats: list[tuple[str, str, str]] = []  # (id, statut, detail)


def ok(cid: str, detail: str = ""):
    resultats.append((cid, "PASS", detail))
    print(f"  ✓ C{cid}  {detail}")


def echec(cid: str, detail: str):
    resultats.append((cid, "FAIL", detail))
    print(f"  ✗ C{cid}  {detail}")


def verif(cid: str, condition: bool, detail: str, detail_echec: str = ""):
    if condition:
        ok(cid, detail)
    else:
        echec(cid, detail_echec or detail)


def image_test_base64() -> str:
    """Capture de test 640×400 (gris foncé), encodée en base64."""
    try:
        from PIL import Image

        im = Image.new("RGB", (640, 400), (44, 46, 58))
        tampon = io.BytesIO()
        im.save(tampon, format="PNG", optimize=True)
        return base64.b64encode(tampon.getvalue()).decode()
    except Exception:
        # PNG 1×1 minimal de secours
        return (
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNg"
            "YGBgAAAABQABh6FO1AAAAABJRU5ErkJggg=="
        )


DESCRIPTION_DENSE = (
    "<p><font size=\"5\"><b>Prestation complète et détaillée</b></font></p>"
    "<p>La prestation comprend la conception, la rédaction et le développement "
    "de l'ensemble des pages décrites ci-dessous, ainsi que la mise en ligne "
    "sur votre nom de domaine, avec un accompagnement complet.</p>"
    "<ul>"
    "<li>Analyse de votre activité et de vos objectifs commerciaux.</li>"
    "<li>Conception de l'architecture et du parcours des visiteurs.</li>"
    "<li>Design des pages sur mesure (aucun modèle générique).</li>"
    "<li>Rédaction professionnelle des contenus principaux.</li>"
    "<li>Développement au code pur, optimisé pour la vitesse.</li>"
    "<li>Optimisation SEO de base de chaque page.</li>"
    "<li>Compatibilité mobile, tablette et ordinateur.</li>"
    "<li>Mise en ligne et vérifications finales.</li>"
    "<li>Formation à la prise en main de votre espace.</li>"
    "</ul>"
    "<p><b>Ce qui est inclus :</b></p>"
    "<ul>"
    "<li>Formulaires de contact fonctionnels.</li>"
    "<li>Liens vers vos réseaux sociaux.</li>"
    "<li>Statistiques de visite de base.</li>"
    "</ul>"
    "<p>Le site vous est livré prêt à recevoir vos visiteurs, avec l'ensemble "
    "des accès nécessaires à son administration.</p>"
)


async def main():
    async with async_playwright() as pw:
        navigateur = await pw.chromium.launch()
        contexte = await navigateur.new_context(
            viewport={"width": 1440, "height": 900},
            locale="fr-FR",
        )
        page = await contexte.new_page()
        page.set_default_timeout(20000)

        # ------------------------------------------------------------------
        print("— C1/C2/C3/C4 : header, hero, mockups (bureau 1440×900)")
        await page.goto(BASE, wait_until="load")
        await page.wait_for_timeout(5000)

        bouton_langue = page.locator('header nav button[title*="site"]')
        cta = page.locator('header nav button[aria-label*="page de demande de devis"]')
        hauteur_langue = (await bouton_langue.bounding_box())["height"]
        hauteur_cta = (await cta.bounding_box())["height"]
        verif(
            "1",
            abs(hauteur_langue - hauteur_cta) <= 2 and hauteur_langue >= 50,
            f"bouton langue {hauteur_langue:.0f}px ≈ CTA {hauteur_cta:.0f}px (52px attendus)",
            f"hauteurs divergentes : langue {hauteur_langue:.0f}px, CTA {hauteur_cta:.0f}px",
        )

        liens = page.locator("header nav ul li a")
        boites = [await liens.nth(i).bounding_box() for i in range(await liens.count())]
        cta_box = await cta.bounding_box()
        espace_menus = boites[1]["x"] - (boites[0]["x"] + boites[0]["width"])
        espace_cta = cta_box["x"] - (boites[-1]["x"] + boites[-1]["width"])
        verif(
            "2",
            abs(espace_menus - espace_cta) <= 4,
            f"espace menu↔CTA {espace_cta:.0f}px ≈ espace entre menus {espace_menus:.0f}px",
            f"espace menu↔CTA {espace_cta:.0f}px ≠ espace menus {espace_menus:.0f}px",
        )

        await bouton_langue.click()
        await page.wait_for_timeout(900)
        titre_en = re.sub(
            r"[\s\u00a0\u200b\u2060]+",
            " ",
            await page.locator("main h1").inner_text(),
        ).strip()
        verif(
            "3",
            "Drive Sales" in titre_en and "Generate Sales" not in titre_en,
            f"titre EN = « {titre_en} »",
            f"titre EN inattendu : « {titre_en} »",
        )
        # retour en français pour la suite
        await bouton_langue.click()
        await page.wait_for_timeout(600)

        zooms = await page.locator(".hero-anim-browser .mockup-zoom").count()
        zooms += await page.locator(".hero-anim-phone .mockup-zoom").count()
        verif("4", zooms == 0, "aucun effet zoom sur les deux mockups épinglés", f"{zooms} mockups zoomés")

        # ------------------------------------------------------------------
        print("— C5 : connexion admin visible sans scroll (3 tailles)")
        for (l, h, nom) in [(375, 667, "mobile"), (768, 1024, "tablette"), (1440, 900, "bureau")]:
            await page.set_viewport_size({"width": l, "height": h})
            await page.goto(f"{BASE}/#/admin", wait_until="load")
            await page.wait_for_selector("#admin-password", state="visible")
            carte = await page.locator("input#admin-password").evaluate(
                "el => { let n = el; while (n && !n.classList.contains('max-w-md')) n = n.parentElement; return n ? n.getBoundingClientRect() : null; }"
            )
            scroll_h = await page.evaluate("document.scrollingElement.scrollHeight")
            visible = carte and carte["bottom"] <= h + 1
            verif(
                "5",
                visible,
                f"{nom} {l}×{h} : bloc jusqu'à y={carte['bottom']:.0f} ≤ {h}px (page {scroll_h}px)",
                f"{nom} : bloc dépasse (bas {carte['bottom']:.0f}px > {h}px)",
            )

        # ------------------------------------------------------------------
        print("— C6 : connexion réelle")
        await page.set_viewport_size({"width": 1440, "height": 900})
        await page.fill("#admin-password", MDP)
        await page.click('button[type="submit"]')
        await page.wait_for_selector("text=Back-office", timeout=20000)
        ok("6", "connexion réussie, back-office ouvert")

        # ------------------------------------------------------------------
        print("— C7 : rubrique Portfolio du site")
        await page.click('nav[aria-label="Sections du back-office"] button:has-text("Portfolio du site")')
        await page.wait_for_selector("text=Ajouter un projet", timeout=15000)
        ok("7", "rubrique « Portfolio du site » ouverte, bouton « Ajouter un projet » visible")

        # ------------------------------------------------------------------
        print("— C8 : API admin portfolio (auth)")
        data = await page.evaluate(
            "async () => { const r = await fetch('/api/admin/projects'); return { status: r.status, corps: await r.json() }; }"
        )
        verif("8", data["status"] == 200 and data["corps"].get("ok") is True,
              f"GET /api/admin/projects → ok (stockage : {data['corps'].get('stockageConfigure')})")

        # ------------------------------------------------------------------
        print("— C9 : création d'un BROUILLON (invisible côté public)")
        image = image_test_base64()
        corps_brouillon = {
            "projet": {
                "nom": "TEST VOLET19 PROJET",
                "categorie": "Site web de test",
                "description": "Projet de test du volet 19 — description de vérification.",
                "cta": "Voir Le Site",
                "url": "https://exemple-test.vercel.app",
                "desktop": {"data": image, "mime": "image/png", "largeur": 640, "hauteur": 400},
            },
            "statut": "brouillon",
        }
        data = await page.evaluate(
            """async (corps) => {
                 const r = await fetch('/api/admin/projects', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify(corps),
                 });
                 return { status: r.status, corps: await r.json() };
               }""",
            corps_brouillon,
        )
        id_projet = ((data["corps"] or {}).get("projet") or {}).get("id", "")
        verif("9a", data["status"] == 200 and data["corps"].get("ok") is True and id_projet,
              f"brouillon créé ({id_projet})",
              f"brouillon refusé : {json.dumps(data['corps'])[:200]}")

        pub = (await (await page.request.get(f"{BASE}/api/projects")).json()).get("projets", [])
        rep_img = await page.request.get(f"{BASE}/api/projects/{id_projet}/desktop")
        verif(
            "9b",
            all(p.get("id") != id_projet for p in pub) and rep_img.status == 404,
            "brouillon invisible côté public (liste et image)",
            "le brouillon fuit côté public !",
        )

        # ------------------------------------------------------------------
        print("— C10 : publication → visible côté public + image servie")
        data = await page.evaluate(
            """async (corps) => {
                 const r = await fetch('/api/admin/projects', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify(corps),
                 });
                 return { status: r.status, corps: await r.json() };
               }""",
            {"projet": {"id": id_projet}, "statut": "publie"},
        )
        verif("10a", data["status"] == 200 and data["corps"].get("ok") is True, "publication acceptée",
              f"publication refusée : {json.dumps(data['corps'])[:200]}")
        pub = (await (await page.request.get(f"{BASE}/api/projects")).json()).get("projets", [])
        rep_img = await page.request.get(f"{BASE}/api/projects/{id_projet}/desktop")
        entete = rep_img.headers.get("content-type", "")
        verif(
            "10b",
            any(p.get("id") == id_projet for p in pub) and rep_img.ok and entete.startswith("image/"),
            f"projet public ({len(pub)} publiés), image servie ({entete})",
        )

        # ------------------------------------------------------------------
        print("— C11 : accueil — le projet publié apparaît (grille 2 colonnes)")
        await page.goto(BASE, wait_until="load")
        await page.wait_for_timeout(4500)
        await page.locator("#realisations").scroll_into_view_if_needed()
        await page.wait_for_timeout(900)
        grille = page.locator("#realisations .grid")
        classes_grille = await grille.first.get_attribute("class")
        carte_test = await page.locator(f'#realisations a:has-text("TEST VOLET19 PROJET")').count()
        verif(
            "11",
            carte_test >= 1 and "md:grid-cols-2" in classes_grille,
            "projet visible sur l'accueil, grille 2 colonnes (5 projets)",
            f"grille : {classes_grille} — cartes test : {carte_test}",
        )

        # ------------------------------------------------------------------
        print("— C12 : page projet du projet admin")
        await page.goto(f"{BASE}/#/projet/{id_projet}", wait_until="load")
        await page.wait_for_timeout(4000)
        nom_page = re.sub(r"[\s\u00a0\u200b\u2060]+", " ", await page.locator("main h1").first.inner_text()).strip()
        try:
            await page.wait_for_selector('main img[src*="/api/projects/"]', timeout=15000)
            mockup_bureau = 1
        except Exception:
            mockup_bureau = 0
            diag = await page.evaluate(
                "() => ({ imgs: Array.from(document.querySelectorAll('main img')).map(i => i.getAttribute('src') || '').slice(0, 8),"
                " figures: document.querySelectorAll('main figure').length,"
                " scrollY: window.scrollY, hash: location.hash })"
            )
            print("     diagnostic C12 :", json.dumps(diag)[:500])
        verif(
            "12",
            "TEST VOLET19 PROJET" in nom_page and mockup_bureau >= 1,
            f"page projet rendue (« {nom_page} ») avec capture bureau",
        )

        # ------------------------------------------------------------------
        print("— C13 : page Réalisations — le projet apparaît")
        await page.goto(f"{BASE}/#/realisations", wait_until="load")
        await page.wait_for_timeout(4000)
        presente = await page.locator('main h2:has-text("TEST VOLET19 PROJET")').count()
        presente += await page.locator('main p:has-text("TEST VOLET19 PROJET")').count()
        verif("13", presente >= 1, "projet présent sur la page Réalisations")

        # ------------------------------------------------------------------
        print("— C15/C16 : aperçu — pied, navigation, plein écran (devis)")
        await page.goto(f"{BASE}/#/admin", wait_until="load")
        await page.wait_for_selector("text=Back-office")
        await page.click('nav[aria-label="Sections du back-office"] button:has-text("Devis")')
        await page.click('button:has-text("Créer un nouveau devis")')
        await page.wait_for_selector('iframe[title^="Aperçu du document"]', timeout=25000)
        await page.wait_for_timeout(5000)

        pied = page.locator("text=A4 · Mise à jour en temps réel").first
        verif("15a", await pied.count() >= 1, "pied : « A4 · Mise à jour en temps réel »")
        nav_pied = await page.locator('button[aria-label="Page précédente"]').count()
        nav_pied += await page.locator('button[aria-label="Page suivante"]').count()
        bouton_pl = page.locator('button[aria-label="Ouvrir l\'aperçu en plein écran"]')
        verif(
            "15b",
            nav_pied >= 2 and await bouton_pl.count() == 1,
            "navigation AU PIED + bouton plein écran dans l'entête",
            f"nav pied : {nav_pied}, bouton plein écran : {await bouton_pl.count()}",
        )
        icone = await bouton_pl.locator("svg").count()
        verif("15c", icone == 1, "icône du bouton plein écran présente (2 flèches obliques)")

        await bouton_pl.click()
        await page.wait_for_timeout(700)
        plein = await page.evaluate(
            "() => { const el = document.querySelector('[class*=fixed][class*=inset-0]');"
            " return el ? { cls: el.className, w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height } : null; }"
        )
        verif(
            "16a",
            plein is not None and plein["w"] >= 1430 and plein["h"] >= 880,
            f"plein écran ouvert ({plein['w']:.0f}×{plein['h']:.0f}px)",
        )
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(700)
        plein_apres = await page.evaluate(
            "() => document.querySelector('[class*=fixed][class*=inset-0][role=dialog]') === null"
        )
        verif("16b", plein_apres, "Échap referme le plein écran")

        # ------------------------------------------------------------------
        print("— C17 : devis — logo, total/TVA à pointillés")
        iframe_el = await page.query_selector('iframe[title^="Aperçu du document"]')
        cadre = await iframe_el.content_frame()
        hauteur_logo = await cadre.evaluate(
            "() => { const el = document.querySelector('.doc-logo'); return el ? el.getBoundingClientRect().height : 0; }"
        )
        verif(
            "17a",
            abs(hauteur_logo - 64) <= 6,
            f"logo page 1 : {hauteur_logo:.0f}px (~17 mm) — asset recadré",
            f"logo page 1 : {hauteur_logo}px",
        )
        lignes_total = await cadre.query_selector_all(".total-ligne")
        libelle = await lignes_total[0].query_selector(".total-libelle") if lignes_total else None
        taille = await libelle.evaluate("el => parseFloat(getComputedStyle(el).fontSize)") if libelle else 0
        pointilles = await cadre.query_selector_all(".total-pointilles")
        valeur = await lignes_total[0].query_selector(".total-valeur") if lignes_total else None
        boite_valeur = await valeur.bounding_box() if valeur else None
        boite_ligne = await lignes_total[0].bounding_box() if lignes_total else None
        a_droite = (
            boite_valeur
            and boite_ligne
            and (boite_ligne["x"] + boite_ligne["width"]) - (boite_valeur["x"] + boite_valeur["width"]) <= 4
        )
        tva = await lignes_total[1].query_selector(".total-libelle") if len(lignes_total) > 1 else None
        texte_tva = (await tva.inner_text()) if tva else ""
        verif(
            "17b",
            len(lignes_total) == 2 and taille >= 18 and len(pointilles) >= 2 and a_droite and texte_tva.strip() == "TVA",
            f"Total {taille:.0f}px (gros) + pointillés + prix à droite + ligne TVA",
            f"lignes={len(lignes_total)}, taille={taille}, pointillés={len(pointilles)}, à droite={a_droite}, tva={texte_tva!r}",
        )

        # ------------------------------------------------------------------
        print("— C18 : description dense → tableau remplit la page 1 + en-tête compact")
        editeur = page.locator('[contenteditable][aria-label="Description de la prestation"]')
        await editeur.wait_for(state="visible")
        await editeur.evaluate(
            """(el, html) => {
                 el.innerHTML = html;
                 const dt = new DataTransfer();
                 dt.setData('text/html', html);
                 el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
                 el.dispatchEvent(new Event('input', { bubbles: true }));
               }""",
            DESCRIPTION_DENSE,
        )
        await page.wait_for_timeout(6500)  # débounce 350 ms + pagination + polices

        pages = await cadre.evaluate("window.__pagesPc || 1")
        fragments_p1 = await cadre.evaluate(
            "() => document.querySelectorAll(\".ppage[data-page='1'] .svc-part\").length"
        )
        dernier_bas = await cadre.evaluate(
            """() => {
                 const els = document.querySelectorAll(".ppage[data-page='1'] .svc-part");
                 if (!els.length) return 0;
                 const r = els[els.length - 1].getBoundingClientRect();
                 const p = els[els.length - 1].closest('.ppage').getBoundingClientRect();
                 return r.bottom - p.top;
               }"""
        )
        verif(
            "18a",
            pages >= 2 and fragments_p1 >= 4 and dernier_bas >= 780,
            f"{pages} pages, {fragments_p1} fragments page 1, dernier à y={dernier_bas:.0f}px (page remplie)",
            f"pages={pages}, fragments p1={fragments_p1}, dernier bas={dernier_bas:.0f}",
        )
        await cadre.evaluate("window.postMessage({ type: 'aller-page', page: 2 }, '*')")
        await page.wait_for_timeout(400)
        mesures_n = await cadre.evaluate(
            """() => {
                 const img = document.querySelector(".ppage[data-page='2'] .entete-n .en-logo img");
                 const st = document.querySelector(".ppage[data-page='2'] .entete-n .en-surtitre");
                 return { hauteur: img ? img.getBoundingClientRect().height : 0,
                          surtitre: st ? st.textContent : '' };
               }"""
        )
        hauteur_logo_n = mesures_n["hauteur"]
        texte_surtitre = mesures_n["surtitre"]
        verif(
            "18b",
            hauteur_logo_n > 0 and abs(hauteur_logo_n - 43.5) <= 5 and "DEVIS" in texte_surtitre.upper(),
            f"en-tête compact page 2 : logo {hauteur_logo_n:.0f}px (~32,6 pt) + « {texte_surtitre} »",
            f"en-tête compact : {hauteur_logo_n}px, {texte_surtitre!r}",
        )

        # ------------------------------------------------------------------
        print("— C19 : proposition — logo page 1 et filigrane aux mesures de l'exemple")
        await page.click('nav[aria-label="Sections du back-office"] button:has-text("Propositions commerciales")')
        await page.click('button:has-text("Créer une nouvelle proposition")')
        await page.wait_for_selector('iframe[title^="Aperçu du document"]', timeout=25000)
        await page.wait_for_timeout(5500)
        iframe_el = await page.query_selector('iframe[title^="Aperçu du document"]')
        cadre = await iframe_el.content_frame()
        mesures_prop = await cadre.evaluate(
            """() => {
                 const logo = document.querySelector('.e1-logo img');
                 const wm = document.querySelector(".ppage[data-page='1'] .wm img");
                 const titre = document.querySelector('.e1-titre');
                 return {
                   logo: logo ? logo.getBoundingClientRect().height : 0,
                   wm: wm ? wm.getBoundingClientRect().height : 0,
                   titre: titre ? titre.getBoundingClientRect().height : 0,
                 };
               }"""
        )
        verif(
            "19a",
            abs(mesures_prop["logo"] - 105.1) <= 10,
            f"logo proposition page 1 : {mesures_prop['logo']:.0f}px (~78,8 pt, exemple : 78,8 pt ; titre {mesures_prop['titre']:.0f}px)",
            f"logo proposition : {mesures_prop}",
        )
        verif(
            "19b",
            abs(mesures_prop["wm"] - 471.2) <= 18,
            f"filigrane : {mesures_prop['wm']:.0f}px (~353,4 pt, exemple : 353,4 pt)",
            f"filigrane : {mesures_prop}",
        )

        # ------------------------------------------------------------------
        print("— C20 : nettoyage du projet de test")
        rep = await page.evaluate(
            """async (corps) => {
                 const r = await fetch('/api/admin/projects', {
                   method: 'DELETE',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify(corps),
                 });
                 return { status: r.status, corps: await r.json() };
               }""",
            {"id": id_projet},
        )
        pub = (await (await page.request.get(f"{BASE}/api/projects")).json()).get("projets", [])
        verif(
            "20",
            rep["status"] == 200 and rep["corps"].get("ok") is True and all(p.get("id") != id_projet for p in pub),
            "projet de test supprimé (public et stockage)",
        )

        await contexte.close()
        await navigateur.close()

    # ---- bilan ----
    print("\n" + "=" * 64)
    passes = sum(1 for _, s, _ in resultats if s == "PASS")
    print(f"VOLET 19 — SONDE LOCALE : {passes}/{len(resultats)} contrôles réussis")
    for cid, statut, detail in resultats:
        if statut == "FAIL":
            print(f"  ÉCHEC C{cid} : {detail}")
    sys.exit(0 if passes == len(resultats) else 1)


asyncio.run(main())
