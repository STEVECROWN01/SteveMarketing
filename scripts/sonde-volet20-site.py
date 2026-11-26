#!/usr/bin/env python3
"""VOLET 20 — sonde locale du site public (serveur :3457).

Contrôles :
  1. accueil charge, grille réalisations rétrécie (plafonds 640/800) ;
  2. tous les CTA « calendly » portent la flèche OBLIQUE (ArrowUpRight) ;
  3. pages de devis DÉDIÉES par service (SEO / Meta Ads) : contenus,
     navigation depuis les pages services, meta description ;
  4. boutons « Demander un devis » des pages services → pages dédiées ;
  5. menu plein écran : bord droit « Autres liens » aligné sur le bord
     gauche du bouton switch bilingue ;
  6. page Méthode : titre + trait verticaux STICKY pendant le défilement.
"""
import asyncio
import json
import re
from playwright.async_api import async_playwright

BASE = "http://localhost:3457"
resultats = []


def ok(nom, cond, detail=""):
    resultats.append((nom, bool(cond), detail))
    print(("OK  " if cond else "FAIL") + f" {nom}" + (f" — {detail}" if detail else ""))


async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 1280, "height": 900})

        # ---------- 1. Accueil ----------
        page = await ctx.new_page()
        await page.goto(BASE + "/#accueil", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        ok("accueil charge", await page.title() != "")

        grille = await page.query_selector("#realisations .grid")
        if grille:
            box = await grille.bounding_box()
            ok("grille réalisations ≤ 800px (3 projets)", box and box["width"] <= 801,
               f"largeur={box['width'] if box else '?'}")
        else:
            ok("grille réalisations présente", False)

        # ---------- 2. Flèches obliques des CTA calendly (accueil) ----------
        fleches = await page.evaluate(
            """() => {
              const out = {up: 0, right: 0};
              document.querySelectorAll('a').forEach(a => {
                const href = a.getAttribute('href') || '';
                if (!href.includes('calendly.com')) return;
                // TOUTES les formes de l'ancre : la flèche oblique
                // (ArrowUpRight) porte le tracé « M7 17 17 7 ».
                const ds = Array.from(a.querySelectorAll('svg path')).map(p => p.getAttribute('d') || '');
                if (ds.some(d => d.includes('M7 17 17 7'))) out.up++;
                else if (ds.length) out.right++;
              });
              return out;
            }"""
        )
        ok("CTA calendly accueil → flèches obliques", fleches["up"] >= 2 and fleches["right"] == 0,
           json.dumps(fleches))

        # ---------- 3. Pages services → devis dédiés ----------
        for service, hash_page, marqueur in [
            ("referencement-seo", "devis-referencement-seo", "RÉFÉRENCEMENT SEO"),
            ("publicite-meta-ads", "devis-publicite-meta-ads", "PUBLICITÉ META ADS"),
        ]:
            await page.goto(f"{BASE}/#/{service}", wait_until="networkidle")
            await page.wait_for_timeout(1200)
            cible = await page.evaluate(
                """(hashPage) => {
                  const boutons = Array.from(document.querySelectorAll('a'));
                  const devis = boutons.filter(a => (a.textContent || '').includes('Demander Un Devis'));
                  return devis.map(a => a.getAttribute('href'));
                }""",
                hash_page,
            )
            ok(
                f"page {service} : boutons devis → #/{hash_page}",
                cible and all(h == f"#/{hash_page}" for h in cible) and len(cible) >= 2,
                f"{len(cible or [])} boutons → {cible[:2]}",
            )

        # Pages dédiées elles-mêmes
        for hash_page, marqueur in [
            ("devis-referencement-seo", "RÉFÉRENCEMENT SEO"),
            ("devis-publicite-meta-ads", "PUBLICITÉ META ADS"),
        ]:
            await page.goto(f"{BASE}/#/{hash_page}", wait_until="networkidle")
            await page.wait_for_timeout(1200)
            contenu = await page.content()
            ok(
                f"page dédiée #/{hash_page} : contenu adapté ({marqueur})",
                marqueur in contenu,
            )
            ok(
                f"page dédiée #/{hash_page} : question service (pas « refaire votre site »)",
                "référencement" in contenu.lower() or "publicités" in contenu.lower(),
            )
            # meta description adaptée
            desc = await page.evaluate(
                """() => (document.querySelector('meta[name="description"]') || {}).content || ''"""
            )
            ok(
                f"page #/{hash_page} : meta description dédiée",
                "devis de" in desc.lower(),
                desc[:70],
            )

        # ---------- 4. Menu plein écran : alignement Autres liens ----------
        await page.goto(BASE + "/#accueil", wait_until="networkidle")
        await page.wait_for_timeout(800)
        await page.click('button[aria-controls="menu-plein-ecran"]')
        await page.wait_for_timeout(1300)
        align = await page.evaluate(
            """() => {
              const menus = Array.from(document.querySelectorAll('#menu-plein-ecran nav'));
              const autres = menus.find(m => (m.getAttribute('aria-label') || '').includes('autres liens'));
              const switchBtn = document.querySelector('#menu-plein-ecran nav ~ div button, #menu-plein-ecran .absolute button');
              if (!autres || !switchBtn) return {err: 'introuvable'};
              const rA = autres.getBoundingClientRect();
              const rS = switchBtn.getBoundingClientRect();
              return {droiteAutres: rA.right, gaucheSwitch: rS.left};
            }"""
        )
        ok(
            "menu : bord droit « Autres liens » ↔ bord gauche du switch",
            "droiteAutres" in align and abs(align["droiteAutres"] - align["gaucheSwitch"]) <= 2,
            json.dumps(align),
        )
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(500)

        # ---------- 5. Méthode : titre vertical sticky ----------
        await page.goto(f"{BASE}/#methode", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        # Les accordéons OUVERTS en production rendent la colonne des
        # étapes plus haute que l'écran : on simule ces étapes ouvertes
        # (hauteur de liste étendue) puis on vérifie que le groupe
        # TITRE + TRAIT reste CALÉ (sticky à ~128 px) pendant le
        # défilement des étapes, et se libère à la fin de la section.
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
              window.scrollTo({top: window.scrollY + 600, behavior: 'instant'});
              await new Promise(r => setTimeout(r, 400));
              const pendant2 = Math.round(wrapper.getBoundingClientRect().top);
              window.scrollTo({top: window.scrollY + 1400, behavior: 'instant'});
              await new Promise(r => setTimeout(r, 400));
              const fin = Math.round(wrapper.getBoundingClientRect().top);
              return {avant, pendant, pendant2, fin};
            }"""
        )
        ok(
            "méthode : titre + trait calés pendant le défilement des étapes",
            "pendant" in sticky
            and sticky["avant"] > 400
            and abs(sticky["pendant"] - 128) <= 6
            and abs(sticky["pendant2"] - 128) <= 6
            and sticky["fin"] < 0,
            json.dumps(sticky),
        )

        # ---------- 6. Admin : logo + mention centrée (visuel basique) ----------
        await page.goto(f"{BASE}/#admin", wait_until="networkidle")
        await page.wait_for_timeout(1200)
        bloc = await page.query_selector("text=Bienvenue")
        ok("page admin (connexion) charge", bloc is not None)

        await browser.close()

    echecs = [r for r in resultats if not r[1]]
    print(f"\n==== {len(resultats) - len(echecs)}/{len(resultats)} contrôles réussis ====")
    for nom, _, detail in echecs:
        print(f"ÉCHEC : {nom} — {detail}")
    return 1 if echecs else 0


raise SystemExit(asyncio.run(main()))
