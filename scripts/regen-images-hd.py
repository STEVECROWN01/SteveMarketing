#!/usr/bin/env python3
"""Régénération HAUTE QUALITÉ des images du site — correctif netteté
(demande de l'éditeur, 14/11/2026 : « les images épinglées et autres ne
sont pas aussi nettes que les originales, mobile/desktop »).

Causes corrigées :
  1. Dérivés WebP sur-comprimés (qualité 82-84 dans les anciens
     scripts) -> régénération q90 (photos) / q95 (captures de sites,
     où le texte doit rester crisp).
  2. Captures mobiles 390px affichées jusqu'à ~716px réels sur écrans
     Retina (upscaling navigateur = flou) -> dérivés @2x réels (780px)
     re-capturés depuis les sites en ligne (scripts/recapture-projects-2x.js).
  3. Captures desktop 1440px affichées jusqu'à ~1656px réels sur la
     page projet -> dérivés @2x 1920px.
  4. Logos dérivés en 220px -> 440px (net jusqu'aux écrans 3x).

Les sources PNG ne sont PAS modifiées ; seuls les dérivés servis par
le site sont remplacés. Politique de qualité à conserver pour tout
futur ajout d'image (ne plus repasser en q82-84).
"""
import os
import shutil
from PIL import Image

A = "/home/z/my-project/public/assets"
P = os.path.join(A, "projects")
S = os.path.join(P, "sources")
CAP = "/tmp/captures"

def save_webp(im, dst, quality):
    im.save(dst, "WEBP", quality=quality, method=6)
    kb = round(os.path.getsize(dst) / 1024)
    print(f"  -> {os.path.basename(dst):44s} {im.size} q{quality} {kb:5d}KB")

def from_png(src_name, dst_name, max_w, quality):
    src = os.path.join(A, src_name)
    im = Image.open(src)
    if im.mode != "RGB":
        im = im.convert("RGB")
    if im.width > max_w:
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
    save_webp(im, os.path.join(A, dst_name), quality)

print("== 1. Photos / illustrations (qualité 90) ==")
PHOTOS = {
    # (source, dérivé, largeur max, qualité)
    "stevens-akpovi-portrait.png": ("stevens-akpovi-portrait.webp", 1024),
    "APROPOS-PORTRAIT.png": ("apropos-portrait.webp", 1024),
    "stevens-akpovi-workspace.png": ("stevens-akpovi-workspace.webp", 1536),
    "problem-no-website.png": ("problem-no-website.webp", 1024),
    "problem-ineffective-website.png": ("problem-ineffective-website.webp", 1280),
    "benefit-business-growth.png": ("benefit-business-growth.webp", 1280),
    "stevens-strategy-work.png": ("stevens-strategy-work.webp", 1280),
}
for src_name, (dst_name, max_w) in PHOTOS.items():
    from_png(src_name, dst_name, max_w, 90)

# workspace-mobile : la source PNG a été supprimée du dépôt — restaurée
# depuis l'historique git (8dde2b6^) dans /tmp.
ws_mobile_src = "/tmp/workspace-mobile-src.png"
im = Image.open(ws_mobile_src)
if im.mode != "RGB":
    im = im.convert("RGB")
if im.width > 1280:
    im = im.resize((1280, round(im.height * 1280 / im.width)), Image.LANCZOS)
save_webp(im, os.path.join(A, "stevens-akpovi-workspace-mobile.webp"), 90)

print("== 2. Captures projets (qualité 95 + dérivés @2x) ==")
CAPTURES = ["mrsteveenglish", "prelaunch", "afribayit"]
for name in CAPTURES:
    # --- desktop : 1x depuis le raw 1440, 2x depuis la capture 2880 ---
    raw_d = os.path.join(S, f"raw-{name}-desktop.png")
    im = Image.open(raw_d)
    if im.mode != "RGB":
        im = im.convert("RGB")
    save_webp(im, os.path.join(P, f"{name}-desktop.webp"), 95)

    cap_d = os.path.join(CAP, f"{name}-desktop.png")  # 2880x1800
    im2 = Image.open(cap_d)
    if im2.mode != "RGB":
        im2 = im2.convert("RGB")
    im2 = im2.resize((1920, round(im2.height * 1920 / im2.width)), Image.LANCZOS)
    save_webp(im2, os.path.join(P, f"{name}-desktop@2x.webp"), 95)
    # source brute 2x archivée à côté des autres sources
    shutil.copy(cap_d, os.path.join(S, f"raw2x-{name}-desktop.png"))

    # --- mobile : 1x depuis le raw 390, 2x depuis la capture 780 ---
    raw_m = os.path.join(S, f"raw-{name}-mobile.png")
    im = Image.open(raw_m)
    if im.mode != "RGB":
        im = im.convert("RGB")
    save_webp(im, os.path.join(P, f"{name}-mobile.webp"), 95)

    cap_m = os.path.join(CAP, f"{name}-mobile.png")  # 780x1688
    im2 = Image.open(cap_m)
    if im2.mode != "RGB":
        im2 = im2.convert("RGB")
    save_webp(im2, os.path.join(P, f"{name}-mobile@2x.webp"), 95)
    shutil.copy(cap_m, os.path.join(S, f"raw2x-{name}-mobile.png"))

print("== 3. Logos (440px — nets jusqu'aux écrans 3x) ==")
for src_name, dst_name in [("Logo blanc.png", "logo-blanc.png"), ("Logo noir.png", "logo-noir.png")]:
    im = Image.open(os.path.join(A, src_name))
    if im.mode not in ("RGB", "RGBA"):
        im = im.convert("RGBA")
    if im.width > 440:
        im = im.resize((440, round(im.height * 440 / im.width)), Image.LANCZOS)
    im.save(os.path.join(A, dst_name), "PNG", optimize=True)
    kb = round(os.path.getsize(os.path.join(A, dst_name)) / 1024)
    print(f"  -> {dst_name:44s} {im.size} PNG  {kb:5d}KB")

print("== Vérification : tous les dérivés référencés existent ==")
expected = [
    "stevens-akpovi-portrait.webp", "apropos-portrait.webp",
    "stevens-akpovi-workspace.webp", "stevens-akpovi-workspace-mobile.webp",
    "problem-no-website.webp", "problem-ineffective-website.webp",
    "benefit-business-growth.webp", "stevens-strategy-work.webp",
    "logo-blanc.png", "logo-noir.png",
] + [
    f"{n}-{k}.webp" for n in CAPTURES for k in ("desktop", "desktop@2x", "mobile", "mobile@2x")
]
missing = [f for f in expected if not os.path.exists(os.path.join(A, "projects", f) if "@" in f or f.startswith(("mrsteve", "prelaunch", "afribayit")) else os.path.join(A, f))]
for f in expected:
    path = os.path.join(P, f) if f.startswith(("mrsteve", "prelaunch", "afribayit")) else os.path.join(A, f)
    ok = os.path.exists(path)
    print(f"  {'OK ' if ok else 'MANQUE'} {f}")
print("TERMINÉ" if not missing else f"MANQUANTS: {missing}")
