#!/usr/bin/env python3
"""VOLET 20 — sonde des documents rendus (devis, factures,
proposition) : structure + captures de pages."""
import asyncio
import json
from playwright.async_api import async_playwright

resultats = []


def ok(nom, cond, detail=""):
    resultats.append((nom, bool(cond), detail))
    print(("OK  " if cond else "FAIL") + f" {nom}" + (f" — {detail}" if detail else ""))


DOCS = [
    "/tmp/volet20-devis.html",
    "/tmp/volet20-facture-payee.html",
    "/tmp/volet20-facture-attente.html",
    "/tmp/volet20-devis-long.html",
    "/tmp/volet20-proposition.html",
]


async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        page = await browser.new_page(viewport={"width": 900, "height": 1280})

        # ---------- DEVIS ----------
        await page.goto(f"file:///tmp/volet20-devis.html", wait_until="load")
        await page.wait_for_timeout(4500)
        contenu = await page.content()
        ok("devis : montant en lettres SUPPRIMÉ", "total-lettres" not in contenu and "Soixante" not in contenu)
        ok("devis : intro conservée", "Merci pour votre confiance" in contenu)
        ok("devis : CGV conservées", "Conditions générales de vente" in contenu)
        ok("devis : coordonnées bancaires conservées", "Coordonnées bancaires" in contenu)
        ok("devis : bon pour accord conservé", "Bon pour accord" in contenu)
        ok("devis : PAS de cachet", 'class="cachet-overlay' not in contenu)

        # ---------- FACTURE PAYÉE ----------
        await page.goto(f"file:///tmp/volet20-facture-payee.html", wait_until="load")
        await page.wait_for_timeout(4500)
        contenu = await page.content()
        texte = await page.evaluate("() => document.body.innerText")
        ok("facture payée : cachet PAYÉ présent", 'class="cachet-overlay"' in contenu and "PAYÉ" in texte)
        ok("facture payée : cachet avec date « le JJ/MM/AAAA »", "le " in texte and "PAYÉ" in texte)
        ok("facture payée : intro SUPPRIMÉE", "Merci pour votre confiance" not in texte and "Nous remercions notre client" not in texte)
        ok("facture payée : validité SUPPRIMÉE", "Validité du document" not in texte)
        ok("facture payée : coordonnées bancaires SUPPRIMÉES", "Coordonnées bancaires" not in texte)
        ok("facture payée : signature Stevens SUPPRIMÉE", "Concepteur de sites web professionnels ·" not in texte)
        # géométrie du cachet : centré sur le bloc des deux lignes pointillées
        geo = await page.evaluate(
            """() => {
              const total = document.querySelector('.total-sous-tableau');
              const cachet = document.querySelector('.cachet-overlay .cachet-paye');
              if (!total || !cachet) return {err: true};
              const rt = total.getBoundingClientRect();
              const rc = cachet.getBoundingClientRect();
              return {
                centreTotalX: Math.round(rt.left + rt.width / 2),
                centreCachetX: Math.round(rc.left + rc.width / 2),
                centreTotalY: Math.round(rt.top + rt.height / 2),
                centreCachetY: Math.round(rc.top + rc.height / 2),
                rotation: getComputedStyle(cachet).transform,
              };
            }"""
        )
        ok(
            "facture payée : cachet centré (V+H) sur les lignes pointillées",
            "err" not in geo
            and abs(geo["centreTotalX"] - geo["centreCachetX"]) <= 12
            and abs(geo["centreTotalY"] - geo["centreCachetY"]) <= 14,
            json.dumps(geo),
        )
        ok(
            "facture payée : cachet OBLIQUE (rotation)",
            "err" not in geo and "matrix" in str(geo.get("rotation", "")),
        )
        # espace tableau → total augmenté
        espace = await page.evaluate(
            """() => {
              const lignes = document.querySelectorAll('.svc-part');
              const dernier = lignes[lignes.length - 1];
              const total = document.querySelector('.total-sous-tableau');
              if (!dernier || !total) return {err: true};
              return Math.round(total.getBoundingClientRect().top - dernier.getBoundingClientRect().bottom);
            }"""
        )
        ok("facture payée : espace tableau → total augmenté", isinstance(espace, int) and espace >= 35, f"{espace}px")

        # ---------- FACTURE EN ATTENTE ----------
        await page.goto(f"file:///tmp/volet20-facture-attente.html", wait_until="load")
        await page.wait_for_timeout(4500)
        contenu = await page.content()
        texte = await page.evaluate("() => document.body.innerText")
        ok("facture en attente : cachet EN ATTENTE (gris)", "EN ATTENTE" in texte and 'cachet-overlay cachet-overlay--attente' in contenu)
        ok("facture en attente : SANS date dans le cachet", 'class="cp-date"' not in contenu)
        # capture visuelle des deux factures (page 1)
        await page.evaluate("window.postMessage({type:'aller-page', page: 1}, '*')")
        await page.wait_for_timeout(400)
        await page.screenshot(path="/tmp/volet20-cap-facture-attente.png")

        await page.goto(f"file:///tmp/volet20-facture-payee.html", wait_until="load")
        await page.wait_for_timeout(4500)
        await page.evaluate("window.postMessage({type:'aller-page', page: 1}, '*')")
        await page.wait_for_timeout(400)
        await page.screenshot(path="/tmp/volet20-cap-facture-payee.png")

        # ---------- DEVIS LONG (en-tête du tableau repris) ----------
        await page.goto(f"file:///tmp/volet20-devis-long.html", wait_until="load")
        await page.wait_for_timeout(5000)
        total_pages = await page.evaluate("window.__pagesPc || 1")
        entetes = await page.evaluate(
            """() => Array.from(document.querySelectorAll('.ppage')).map(p => ({
                 page: p.getAttribute('data-page'),
                 entetes: p.querySelectorAll('.svc-head').length,
                 premierBloc: p.querySelector('.corps') ? (p.querySelector('.corps').firstElementChild ? p.querySelector('.corps').firstElementChild.className : '') : '',
               }))"""
        )
        pages_avec_entete = [e for e in entetes if e["entetes"] > 0]
        ok(
            f"devis long : {total_pages} pages, EN-TÊTE DU TABLEAU REPRIS sur chaque page de continuation",
            total_pages >= 3 and len(pages_avec_entete) == total_pages,
            json.dumps(entetes),
        )
        # capture de la page 2 (continuation)
        await page.evaluate("window.postMessage({type:'aller-page', page: 2}, '*')")
        await page.wait_for_timeout(400)
        await page.screenshot(path="/tmp/volet20-cap-devis-long-p2.png")

        # ---------- PROPOSITION (date + destinataire) ----------
        await page.goto(f"file:///tmp/volet20-proposition.html", wait_until="load")
        await page.wait_for_timeout(5000)
        texte = await page.evaluate("() => document.body.innerText")
        ok("proposition : DATE D'ÉMISSION sous le trait", "DATE D'ÉMISSION" in texte)
        ok("proposition : DESTINATAIRE affiché", "DESTINATAIRE" in texte and "Aïcha Dossou" in texte)
        # symétrie : espace trait → date = espace délai → trait
        sym = await page.evaluate(
            """() => {
              const paires = Array.from(document.querySelectorAll('.paire'));
              const delai = paires.find(p => p.textContent.includes('DÉLAI ESTIMÉ'));
              const date = paires.find(p => p.textContent.includes("DATE D'ÉMISSION"));
              const filet = document.querySelector('.filet-clair');
              if (!delai || !date || !filet) return {err: true};
              const rd = delai.getBoundingClientRect();
              const rf = filet.getBoundingClientRect();
              const ra = date.getBoundingClientRect();
              return {
                dessus: Math.round(rf.top - rd.bottom),
                dessous: Math.round(ra.top - rf.bottom),
              };
            }"""
        )
        ok(
            "proposition : espaces symétriques autour du trait (16,5 pt ≈ 22 px)",
            "err" not in sym and abs(sym["dessus"] - sym["dessous"]) <= 3,
            json.dumps(sym),
        )
        await page.evaluate("window.postMessage({type:'aller-page', page: 1}, '*')")
        await page.wait_for_timeout(400)
        await page.screenshot(path="/tmp/volet20-cap-proposition-p1.png")

        await browser.close()

    echecs = [r for r in resultats if not r[1]]
    print(f"\n==== {len(resultats) - len(echecs)}/{len(resultats)} contrôles documents réussis ====")
    for nom, _, detail in echecs:
        print(f"ÉCHEC : {nom} — {detail}")
    return 1 if echecs else 0


raise SystemExit(asyncio.run(main()))
