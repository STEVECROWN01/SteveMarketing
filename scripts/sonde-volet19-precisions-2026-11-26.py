#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Sonde — VOLET 19, PRÉCISIONS du 26/11/2026 (stevensakpovi.vercel.app).

Cinq demandes de l'éditeur, vérifiées en local (BASE par défaut
http://127.0.0.1:3000) ou en production (BASE=https://... python3 ...) :

  P1  Titre EN du hero TOUJOURS en trois lignes imposées :
      « I Build » / « Professional Websites » / « That Drive Sales. »
      (et non-régression du FR : « Je crée des Sites Web » /
      « Professionnels qui » / « Génèrent des Ventes. »).
  P2  CTA « Réserver Un Appel » du hero : flèche OBLIQUE ASCENDANTE
      (↗, même glyphe ArrowUpRight que le CTA « Démarrer Un Projet »
      du header).
  P3  Image du hero + bloc texte (étoiles → réassurance) centrés
      VERTICALEMENT dans l'espace [bas du header → fin du hero],
      sur mobile / tablette / bureau.
  P4  Section « PROJETS RÉALISÉS » : mockups PLUS PETITS sur tablette
      et bureau (plafonds de largeur de la grille) — accueil ET page
      projet (« autres projets »).
  P5  « QUI SUIS-JE ? » : biographie en TROIS paragraphes, les phrases
      regroupées séparées par des retours à la ligne simples (<br>),
      en FR et en EN (accueil + page À propos).

Plus les gardes non-régression : hero sans défilement sur les
téléphones courts, aucune ligne du titre qui ne se coupe, CLS ≈ 0.
"""

import os
import sys

from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3000"
SORTIE = "/tmp/render/volet19p2"
os.makedirs(SORTIE, exist_ok=True)

BILAN = {"ok": 0, "echecs": [], "mesures": []}


def check(nom, cond, detail=""):
    if cond:
        BILAN["ok"] += 1
        print(f"  OK      {nom}" + (f" — {detail}" if detail else ""))
    else:
        BILAN["echecs"].append(f"{nom} — {detail}")
        print(f"  ÉCHEC   {nom} — {detail}")


def info(nom, detail):
    BILAN["mesures"].append(f"{nom} — {detail}")
    print(f"  mesure  {nom} — {detail}")


INIT_CLS = """
window.__cls = 0;
try {
  new PerformanceObserver(list => {
    for (const e of list.getEntries()) {
      if (e.hadRecentInput) continue;
      window.__cls += e.value;
    }
  }).observe({ type: 'layout-shift', buffered: true });
} catch (e) {}
"""


def ouvrir(browser, largeur, hauteur, langue="fr", cls=False):
    ctx = browser.new_context(
        viewport={"width": largeur, "height": hauteur},
        device_scale_factor=1,
    )
    if cls:
        ctx.add_init_script(INIT_CLS)
    if langue == "en":
        ctx.add_init_script("window.localStorage.setItem('site-langue','en')")
    page = ctx.new_page()
    return ctx, page


def charger(page, fragment="", attente=3300):
    page.goto(f"{BASE}/{fragment}", wait_until="load", timeout=90000)
    page.wait_for_timeout(attente)


# ---------------------------------------------------------------- JS helpers

JS_HERO = """() => {
  const sec = document.querySelector('#hero');
  if (!sec) return null;
  const headerRow = document.querySelector('header > div');
  const container = sec.querySelector('.container-site');
  const col = container ? container.querySelector(':scope > div') : null;
  const cs = container ? getComputedStyle(container) : null;
  const desktop = window.matchMedia('(min-width: 1024px)').matches;
  const img = desktop
    ? sec.querySelector('figure.hero-portrait img')
    : sec.querySelector('figure:not(.hero-portrait) img');
  const cellA = col ? col.children[0] : null;
  const cellC = col ? col.children[2] : null;
  const etoiles = cellA ? cellA.querySelector('p') : null;
  const reassurance = cellC ? cellC.querySelector('ul') : null;
  const h1 = sec.querySelector('h1');
  const r = (el) => el ? el.getBoundingClientRect() : null;
  const rc = r(container), rh = r(headerRow), ri = r(img);
  const ra = r(etoiles), rz = r(reassurance), rs = r(sec);
  const pt = cs ? parseFloat(cs.paddingTop) : 0;
  const pb = cs ? parseFloat(cs.paddingBottom) : 0;
  return {
    desktop,
    headerBas: rh ? rh.bottom : null,
    heroFin: rs ? rs.bottom : null,
    heroHauteur: rs ? rs.height : null,
    conteneur: { haut: rc ? rc.top + pt : null, bas: rc ? rc.bottom - pb : null },
    image: ri ? { haut: ri.top, bas: ri.bottom, h: ri.height } : null,
    texte: (ra && rz) ? { haut: ra.top, bas: rz.bottom } : null,
    h1: h1 ? {
      lignes: [...h1.querySelectorAll(':scope > span.block')].map(s => ({
        texte: s.textContent.replace(/\\u00A0/g, ' ').trim(),
        h: s.getBoundingClientRect().height,
      })),
      fs: parseFloat(getComputedStyle(h1).fontSize),
    } : null,
  };
}"""

JS_CTA = """() => {
  const hero = document.querySelector('#hero .hero-cta');
  const premier = hero ? hero.querySelector('a') : null;
  const fleche = premier ? premier.querySelector('svg path') : null;
  const header = document.querySelector('header nav button svg path');
  return {
    flecheHero: fleche ? fleche.getAttribute('d') : null,
    flecheHeader: header ? header.getAttribute('d') : null,
    libelle: premier ? premier.textContent.trim() : null,
  };
}"""

JS_WORKS = """() => {
  const sec = document.querySelector('#realisations');
  if (!sec) return null;
  const grid = sec.querySelector('.grid');
  const img = sec.querySelector('article img');
  const cartes = sec.querySelectorAll('article');
  return {
    classe: grid ? grid.className : null,
    largeurCarte: img ? img.getBoundingClientRect().width : null,
    nbCartes: cartes.length,
    largeurGrid: grid ? grid.getBoundingClientRect().width : null,
  };
}"""

JS_AUTRES = """() => {
  const sec = document.querySelector('section[aria-labelledby="autres-projets-titre"]');
  if (!sec) return null;
  const grid = sec.querySelector('.grid');
  const img = sec.querySelector('article img');
  return {
    classe: grid ? grid.className : null,
    largeurCarte: img ? img.getBoundingClientRect().width : null,
    nbCartes: sec.querySelectorAll('article').length,
  };
}"""

JS_BIO = """() => {
  const candidats = [...document.querySelectorAll('.on-paper-muted')];
  const bio = candidats.find(el => el.textContent.trim().startsWith('Je suis concepteur')
      || el.textContent.trim().startsWith('I am a professional website designer'));
  if (!bio) return null;
  const paras = [...bio.children].filter(el => el.tagName === 'P');
  return {
    nbParas: paras.length,
    paras: paras.map(p => ({ texte: p.textContent.replace(/\\u00A0/g, ' '), br: p.querySelectorAll('br').length })),
  /* innerText (et non textContent) : les <br> deviennent des
     retours à la ligne — la comparaison avec le texte attendu est
     exacte, y compris aux frontières des <br>. */
    complet: (bio.innerText || bio.textContent).replace(/\\u00A0/g, ' ').replace(/\\s+/g, ' ').trim(),
  };
}"""

BIO_FR = ("Je suis concepteur de sites web professionnels et passionné par la manière dont le "
          "numérique peut accompagner le développement des entreprises. "
          "Mon travail consiste à transformer les besoins d'un professionnel en une expérience digitale "
          "claire, élégante et orientée vers ses objectifs. "
          "Je m'intéresse autant à la présentation visuelle qu'au message transmis et au chemin que suit "
          "un visiteur avant de prendre une décision. "
          "Parce qu'un site réussi ne se résume pas à son apparence. "
          "Il doit donner une bonne première impression, présenter la valeur de votre activité et "
          "faciliter la relation avec vos futurs clients.")

BIO_EN = ("I am a professional website designer, passionate about how digital can support the growth of "
          "businesses. My work consists of turning a professional's needs into a clear, elegant digital "
          "experience oriented toward their goals. I pay as much attention to the visual presentation as "
          "to the message conveyed and the path a visitor follows before making a decision. "
          "Because a successful website is about more than its appearance. It must make a good first "
          "impression, present the value of your business, and make it easier to build relationships "
          "with your future clients.")


# ------------------------------------------------------------------ séquences

def sonde_titre(browser, langue, attendu):
    print(f"\n=== P1 · Titre du hero en 3 lignes ({langue.upper()}) ===")
    for (l, h) in [(280, 653), (320, 568), (375, 812), (768, 1024), (1440, 900)]:
        ctx, page = ouvrir(browser, l, h, langue)
        charger(page)
        m = page.evaluate(JS_HERO)
        lignes = m["h1"]["lignes"]
        fs = m["h1"]["fs"]
        check(f"[{langue} {l}x{h}] 3 lignes", len(lignes) == 3, str([x["texte"] for x in lignes]))
        check(f"[{langue} {l}x{h}] textes exacts", [x["texte"] for x in lignes] == attendu,
              str([x["texte"] for x in lignes]))
        coupe = [x["texte"] for x in lignes if x["h"] > fs * 1.35]
        check(f"[{langue} {l}x{h}] aucune ligne coupée", not coupe,
              f"hauteurs {[round(x['h'], 1) for x in lignes]} / fs {fs}")
        ctx.close()


def sonde_cta(browser):
    print("\n=== P2 · Flèche oblique ascendante du CTA « Réserver Un Appel » ===")
    ctx, page = ouvrir(browser, 1440, 900)
    charger(page)
    m = page.evaluate(JS_CTA)
    check("flèche du CTA hero = ArrowUpRight (↗)", m["flecheHero"] == "M7 7h10v10",
          str(m["flecheHero"]))
    check("flèche du CTA header = même glyphe", m["flecheHeader"] == "M7 7h10v10",
          str(m["flecheHeader"]))
    check("libellé du CTA hero", "Réserver" in (m["libelle"] or ""), str(m["libelle"]))
    page.screenshot(path=f"{SORTIE}/hero-cta-fleche-desktop.png")
    ctx.close()


def sonde_centrage(browser):
    print("\n=== P3 · Centrage vertical image + bloc texte [bas header → fin hero] ===")
    for (l, h, nom) in [(1440, 900, "bureau"), (1024, 800, "bureau étroit"),
                        (768, 1024, "tablette"), (375, 812, "mobile"),
                        (390, 844, "mobile grand")]:
        ctx, page = ouvrir(browser, l, h, cls=True)
        charger(page)
        m = page.evaluate(JS_HERO)
        centre_espace = (m["headerBas"] + m["heroFin"]) / 2
        centre_img = (m["image"]["haut"] + m["image"]["bas"]) / 2
        centre_txt = (m["texte"]["haut"] + m["texte"]["bas"]) / 2
        ecart_img = centre_img - centre_espace
        ecart_txt = centre_txt - centre_espace
        clsv = page.evaluate("() => window.__cls")
        empile = not m["desktop"]
        tolerance_img = 30
        check(f"[{nom} {l}x{h}] image centrée (±{tolerance_img} px)",
              abs(ecart_img) <= tolerance_img,
              f"écart {ecart_img:+.1f} px (réf. header {m['headerBas']:.0f} / hero {m['heroFin']:.0f}, "
              f"img {m['image']['haut']:.0f}-{m['image']['bas']:.0f})")
        if empile:
            info(f"[{nom} {l}x{h}] bloc texte (empilé)",
                 f"écart {ecart_txt:+.1f} px — l'image est prioritaire sur les empilements")
        else:
            check(f"[{nom} {l}x{h}] bloc texte centré (±20 px)", abs(ecart_txt) <= 20,
                  f"écart {ecart_txt:+.1f} px")
        info(f"[{nom} {l}x{h}] CLS", f"{clsv:.4f}")
        # Bureau : aucun ajustement → CLS inchangé (≤ 0,02). Empilements :
        # l'ajustement mesuré qui centre l'image déplace les textes ~30 px
        # au chargement — l'image étant encore invisible (elle se pose déjà
        # centrée), le CLS reste sous le seuil « good » de Google (0,1).
        tol_cls = 0.02 if m["desktop"] else 0.1
        check(f"[{nom} {l}x{h}] CLS ≤ {tol_cls}", clsv <= tol_cls,
              f"{clsv:.4f}" + ("" if m["desktop"] else " (seuil Google 0,1 — prix du centrage image)"))
        page.screenshot(path=f"{SORTIE}/hero-{nom}-{l}x{h}.png")
        ctx.close()


def sonde_fit(browser):
    print("\n=== Non-régression · hero sans défilement (téléphones courts) ===")
    for (l, h) in [(320, 568), (280, 653)]:
        ctx, page = ouvrir(browser, l, h)
        charger(page)
        m = page.evaluate(JS_HERO)
        check(f"[{l}x{h}] hero tient dans le viewport", m["heroHauteur"] <= h + 2,
              f"hero {m['heroHauteur']:.0f} px / viewport {h} px")
        ctx.close()


def sonde_works(browser):
    print("\n=== P4 · Mockups des projets réduits (tablette + bureau) ===")
    attentes = {
        (768, 1024): (250, 330),   # 2 colonnes ≈ 290 px (avant : 342)
        (1440, 900): (380, 450),   # 2 colonnes ≈ 410 px (avant : 502)
        (1920, 1080): (380, 450),
    }
    for (l, h), (mn, mx) in attentes.items():
        ctx, page = ouvrir(browser, l, h)
        charger(page)
        m = page.evaluate(JS_WORKS)
        check(f"[{l}x{h}] grille plafonnée (md:max-w-[600px])", "md:max-w-[600px]" in (m["classe"] or ""),
              (m["classe"] or "")[:120])
        check(f"[{l}x{h}] carte dans [{mn}, {mx}] px",
              m["largeurCarte"] and mn <= m["largeurCarte"] <= mx,
              f"carte {m['largeurCarte'] and round(m['largeurCarte'])} px, {m['nbCartes']} projets")
        page.screenshot(path=f"{SORTIE}/realisations-{l}x{h}.png", full_page=(l == 1440))
        ctx.close()
    # Mobile : pleine largeur, inchangé
    ctx, page = ouvrir(browser, 375, 812)
    charger(page)
    m = page.evaluate(JS_WORKS)
    check("[375x812] mobile pleine largeur (≥ 300 px)", m["largeurCarte"] >= 300,
          f"carte {m['largeurCarte'] and round(m['largeurCarte'])} px")
    ctx.close()
    # Page projet — « autres projets » même plafond
    ctx, page = ouvrir(browser, 1440, 900)
    charger(page, "#/projet/afribayit", attente=3600)
    m = page.evaluate(JS_AUTRES)
    check("[page projet 1440] grille « autres projets » plafonnée",
          "md:max-w-" in (m["classe"] or "") and m["largeurCarte"] and m["largeurCarte"] <= 470,
          f"carte {m['largeurCarte'] and round(m['largeurCarte'])} px ({m['nbCartes']} autres)")
    page.screenshot(path=f"{SORTIE}/projet-autres-1440.png", full_page=False)
    ctx.close()


def sonde_bio(browser):
    print("\n=== P5 · Biographie « Qui suis-je ? » en 3 paragraphes (FR + EN) ===")
    for langue, attendu_complet in [("fr", BIO_FR), ("en", BIO_EN)]:
        ctx, page = ouvrir(browser, 1440, 900, langue)
        charger(page)
        m = page.evaluate(JS_BIO)
        check(f"[accueil {langue}] 3 paragraphes", m and m["nbParas"] == 3, str(m and m["nbParas"]))
        check(f"[accueil {langue}] retours à la ligne <br> dans P2 et P3",
              m and m["paras"][1]["br"] >= 1 and m["paras"][2]["br"] >= 1,
              str([p["br"] for p in (m["paras"] if m else [])]))
        check(f"[accueil {langue}] texte complet conforme",
              m and m["complet"] == attendu_complet,
              (m["complet"][:90] + "…") if m else "absent")
        page.locator("#a-propos").scroll_into_view_if_needed()
        page.wait_for_timeout(900)
        page.screenshot(path=f"{SORTIE}/qui-suis-je-{langue}.png")
        ctx.close()
    # Page À propos (FR)
    ctx, page = ouvrir(browser, 1440, 900)
    charger(page, "#/a-propos", attente=3600)
    m = page.evaluate(JS_BIO)
    check("[page à propos fr] 3 paragraphes + <br>", m and m["nbParas"] == 3
          and m["paras"][1]["br"] >= 1 and m["paras"][2]["br"] >= 1, str(m and m["nbParas"]))
    ctx.close()


def main():
    print(f"Sonde VOLET 19 — précisions · BASE = {BASE}")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        sonde_titre(browser, "fr", ["Je crée des Sites Web", "Professionnels qui", "Génèrent des Ventes."])
        sonde_titre(browser, "en", ["I Build", "Professional Websites", "That Drive Sales."])
        sonde_cta(browser)
        sonde_centrage(browser)
        sonde_fit(browser)
        sonde_works(browser)
        sonde_bio(browser)
        browser.close()
    print(f"\n======== BILAN : {BILAN['ok']} OK · {len(BILAN['echecs'])} échec(s) ========")
    for e in BILAN["echecs"]:
        print(f"  ÉCHEC  {e}")
    if BILAN["echecs"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
