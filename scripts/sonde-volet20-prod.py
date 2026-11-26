#!/usr/bin/env python3
"""VOLET 20 — sonde de PRODUCTION (stevensakpovi.vercel.app) : la
vérification publique du déploiement (les espaces admin et stockage
privé sont vérifiés par la sonde locale 35/35)."""
import asyncio
import json
from playwright.async_api import async_playwright

BASE = "https://stevensakpovi.vercel.app"
resultats = []


def ok(nom, cond, detail=""):
    resultats.append((nom, bool(cond), detail))
    print(("OK  " if cond else "FAIL") + f" {nom}" + (f" — {detail}" if detail else ""))


async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        page = await browser.new_page(viewport={"width": 1280, "height": 900})

        # accueil
        await page.goto(BASE + "/#accueil", wait_until="networkidle")
        await page.wait_for_timeout(1800)
        ok("accueil en ligne", await page.title() != "")

        # grille réalisations réduite
        grille = await page.query_selector("#realisations .grid")
        box = await grille.bounding_box() if grille else None
        ok("grille réalisations ≤ 800px", box and box["width"] <= 801, f"largeur={box['width'] if box else '?'}")

        # flèches obliques des CTA calendly
        fleches = await page.evaluate(
            """() => {
              const out = {up: 0, right: 0};
              document.querySelectorAll('a').forEach(a => {
                if (!(a.getAttribute('href') || '').includes('calendly.com')) return;
                const ds = Array.from(a.querySelectorAll('svg path')).map(p => p.getAttribute('d') || '');
                if (ds.some(d => d.includes('M7 17 17 7'))) out.up++;
                else if (ds.length) out.right++;
              });
              return out;
            }"""
        )
        ok("CTA calendly → flèches obliques", fleches["up"] >= 2 and fleches["right"] == 0, json.dumps(fleches))

        # pages devis dédiées
        for fragment, marqueur in [
            ("devis-referencement-seo", "RÉFÉRENCEMENT SEO"),
            ("devis-publicite-meta-ads", "PUBLICITÉ META ADS"),
        ]:
            await page.goto(f"{BASE}/#/{fragment}", wait_until="networkidle")
            await page.wait_for_timeout(1500)
            contenu = await page.content()
            ok(f"page #/{fragment} en ligne ({marqueur})", marqueur in contenu)

        # boutons devis des pages services → pages dédiées
        for service, fragment in [
            ("referencement-seo", "devis-referencement-seo"),
            ("publicite-meta-ads", "devis-publicite-meta-ads"),
        ]:
            await page.goto(f"{BASE}/#/{service}", wait_until="networkidle")
            await page.wait_for_timeout(1200)
            cibles = await page.evaluate(
                """() => Array.from(document.querySelectorAll('a'))
                     .filter(a => (a.textContent || '').includes('Demander Un Devis'))
                     .map(a => a.getAttribute('href'))"""
            )
            ok(
                f"page {service} : devis → #/{fragment}",
                cibles and all(c == f"#/{fragment}" for c in cibles),
                f"{len(cibles or [])} boutons",
            )

        # menu plein écran : alignement Autres liens ↔ switch
        await page.goto(BASE + "/#accueil", wait_until="networkidle")
        await page.wait_for_timeout(800)
        await page.click('button[aria-controls="menu-plein-ecran"]')
        await page.wait_for_timeout(1400)
        align = await page.evaluate(
            """() => {
              const menus = Array.from(document.querySelectorAll('#menu-plein-ecran nav'));
              const autres = menus.find(m => (m.getAttribute('aria-label') || '').includes('autres liens'));
              const switchBtn = document.querySelector('#menu-plein-ecran .absolute button');
              if (!autres || !switchBtn) return {err: true};
              return {
                droiteAutres: Math.round(autres.getBoundingClientRect().right),
                gaucheSwitch: Math.round(switchBtn.getBoundingClientRect().left),
              };
            }"""
        )
        ok(
            "menu : « Autres liens » aligné sur le switch bilingue",
            "err" not in align and abs(align["droiteAutres"] - align["gaucheSwitch"]) <= 2,
            json.dumps(align),
        )
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(400)

        # méthode : titre sticky (mécanique)
        await page.goto(f"{BASE}/#methode", wait_until="networkidle")
        await page.wait_for_timeout(1800)
        sticky = await page.evaluate(
            """async () => {
              const sec = document.getElementById('comment-je-travaille');
              if (!sec) return {err: 'section absente'};
              const wrapper = sec.querySelector('h2').parentElement;
              const ol = sec.querySelector('ol');
              ol.style.height = '2600px';
              await new Promise(r => setTimeout(r, 100));
              window.scrollTo({top: 0, behavior: 'instant'});
              await new Promise(r => setTimeout(r, 200));
              const avant = Math.round(wrapper.getBoundingClientRect().top);
              const cible = window.scrollY + sec.getBoundingClientRect().top + 900;
              window.scrollTo({top: cible, behavior: 'instant'});
              await new Promise(r => setTimeout(r, 400));
              const pendant = Math.round(wrapper.getBoundingClientRect().top);
              return {avant, pendant};
            }"""
        )
        ok(
            "méthode : titre + trait calés pendant le défilement",
            "pendant" in sticky and sticky["avant"] > 400 and abs(sticky["pendant"] - 128) <= 6,
            json.dumps(sticky),
        )

        # page de connexion admin accessible (sans révéler plus)
        await page.goto(BASE + "/#admin", wait_until="networkidle")
        await page.wait_for_timeout(1200)
        ok("page admin (connexion) en ligne", await page.query_selector("text=Bienvenue") is not None)

        # projets publics : les 4 projets statiques en place
        projets = await page.evaluate(
            """async () => {
              const r = await fetch('/api/projects');
              const j = await r.json().catch(() => null);
              return r.ok && j && j.ok ? j.projets.length : -1;
            }"""
        )
        ok("API /api/projects en ligne (aucun projet admin requis)", projets >= 0, f"{projets} projet(s) admin publié(s)")

        await browser.close()

    echecs = [r for r in resultats if not r[1]]
    print(f"\n==== {len(resultats) - len(echecs)}/{len(resultats)} contrôles production réussis ====")
    for nom, _, detail in echecs:
        print(f"ÉCHEC : {nom} — {detail}")
    return 1 if echecs else 0


raise SystemExit(asyncio.run(main()))
