#!/usr/bin/env python3
"""Vignette Open Graph 1200×630 (20/11/2026) — correctif de l'aperçu
de partage intermittent.

DIAGNOSTIC (remonté par l'éditeur le 20/11) : l'aperçu de partage
s'affiche « parfois oui, parfois non » selon le réseau social et le
moment — le débogueur Facebook affiche l'image après un re-scrap, mais
le partage réel n'affiche rien. Trois causes conjointes :

1. RATIO CARRÉ 1:1 (1254×1254). Facebook et LinkedIn affichent les
   vignettes og:image au ratio 1,91:1 (recommandé officiellement
   1200×630) ; une image carrée est recadrée ou dégradée selon le
   placement, et WhatsApp recadre lui-même au carré. Les dimensions
   déclarées (og:image:width/height) étaient exactes (1254×1254), mais
   le format lui-même n'est pas celui que les plateformes attendent.
2. CACHES DES PLATEFORMES. Facebook/WhatsApp/LinkedIn cachent les
   données og PAR URL, sur des serveurs edge DIFFÉRENTS, pendant des
   semaines : le débogueur Facebook (bouton « Recycler ») ne rafraîchit
   que le cache DU serveur qui répond, pas tous — d'où l'intermittence
   (chaque partage peut tomber sur un edge différent). Le site a déjà
   connu ce piège le 16/11 (OG.png 1,9 Mo → OG.jpg) : la parade éprouvée
   est un NOUVEAU NOM DE FICHIER, qui force chaque plateforme à tout
   re-télécharger.
3. AUCUN CACHE HTTP SUR /assets/ (max-age=0, must-revalidate) : chaque
   requête d'image interroge l'origine ; combiné aux délais courts des
   scrapers, c'est un facteur d'échec aléatoire. Corrigé côté
   next.config.ts (Cache-Control 24 h sur /assets/).

COMPOSITION — le carré de l'éditeur est INTÉGRALEMENT PRÉSERVÉ (tout
recadrage 1,91:1 couperait soit le nom « Stevens Akpovi » en haut,
soit les trois icônes de services en bas — analyse VLM du 20/11 : le
contenu occupe toute la hauteur). Il est centré sur une toile
1200×630 au #1c1c1c du site, avec la grille discrète du langage
graphique et un halo beige (#c9baac) derrière le carré. Le recadrage
carré de WhatsApp tombe ainsi EXACTEMENT sur le visuel d'origine ;
Facebook et LinkedIn affichent la bande complète.

Source : public/assets/OG.png (PNG original de l'éditeur — jamais le
JPEG déjà compressé, convention du projet). L'ancien OG.jpg reste dans
le dépôt : d'anciens caches de plateformes pointent encore vers lui.
"""

from PIL import Image, ImageDraw, ImageFilter
import os

ROOT = os.path.join(os.path.dirname(__file__), "..")
SRC = os.path.join(ROOT, "public", "assets", "OG.png")
DST = os.path.join(ROOT, "public", "assets", "OG-2026-11-20.jpg")

W, H = 1200, 630
BG = (28, 28, 28)        # #1c1c1c — fond signature du site
GRID = (34, 34, 34)      # grille discrète (même pas que generate-og.py)
ACCENT = (201, 186, 172) # #c9baac — beige accent du site

# --- 1. Toile + grille discrète ---------------------------------------
img = Image.new("RGB", (W, H), BG)
grid = Image.new("RGB", (W, H), BG)
gdraw = ImageDraw.Draw(grid)
for x in range(0, W, 60):
    gdraw.line([(x, 0), (x, H)], fill=GRID, width=1)
for y in range(0, H, 60):
    gdraw.line([(0, y), (W, y)], fill=GRID, width=1)
img = Image.blend(img, grid, 0.5)

# --- 2. Halo beige derrière le carré ----------------------------------
CARRE = 630  # côté du carré de l'éditeur, pleine hauteur de la bande
x0 = (W - CARRE) // 2  # 285
y0 = (H - CARRE) // 2  # 0
halo = Image.new("RGBA", (W, H), (0, 0, 0, 0))
hdraw = ImageDraw.Draw(halo)
hdraw.ellipse(
    [x0 - 90, y0 - 60, x0 + CARRE + 90, y0 + CARRE + 60],
    fill=ACCENT + (26,),
)
halo = halo.filter(ImageFilter.GaussianBlur(45))
img = Image.alpha_composite(img.convert("RGBA"), halo).convert("RGB")

# --- 3. Carré de l'éditeur, complet, centré ----------------------------
src = Image.open(SRC).convert("RGB")
assert src.size == (1254, 1254), f"Source inattendue : {src.size}"
carre = src.resize((CARRE, CARRE), Image.LANCZOS)
img.paste(carre, (x0, y0))

# --- 4. Fondu des bords gauche/droit du carré vers la toile -------------
# (retour VLM du 20/11 : la couture droite, au niveau de la plante, était
# le seul point visible — fondu 30 px vers le #1c1c1c, alpha max 0,55 au
# bord exact ; les marges vides identifiées par l'analyse VLM de la
# source rendent ce fondu sans risque pour le contenu : nom, titre,
# icônes et portrait restent hors de la zone de fondu.)
import numpy as np

FONDU = 30
arr = np.asarray(img).astype(np.float32)
bg = np.array(BG, dtype=np.float32)
# bord gauche du carré : alpha décroissant de l'extérieur vers l'intérieur
alpha_g = np.linspace(0.55, 0.0, FONDU)[None, :, None]
arr[:, x0 : x0 + FONDU] = arr[:, x0 : x0 + FONDU] * (1 - alpha_g) + bg * alpha_g
# bord droit : miroir
alpha_d = np.linspace(0.0, 0.55, FONDU)[None, :, None]
arr[:, x0 + CARRE - FONDU : x0 + CARRE] = (
    arr[:, x0 + CARRE - FONDU : x0 + CARRE] * (1 - alpha_d) + bg * alpha_d
)
img = Image.fromarray(arr.round().astype(np.uint8))

# --- 5. Export JPEG léger ----------------------------------------------
img.save(DST, "JPEG", quality=85, optimize=True, progressive=True)

# --- Vérifications intégrées -------------------------------------------
taille = os.path.getsize(DST)
out = Image.open(DST)
rapport = {
    "fichier": os.path.relpath(DST, ROOT),
    "dimensions": out.size,
    "octets": taille,
    "ko": round(taille / 1024),
    "source": os.path.relpath(SRC, ROOT),
}
print("=== Vignette OG 1200×630 ===")
for k, v in rapport.items():
    print(f"  {k}: {v}")

ok = True
if out.size != (1200, 630):
    print(f"ERREUR : dimensions {out.size}, attendu 1200×630")
    ok = False
if taille > 300 * 1024:
    print(f"ERREUR : {taille / 1024:.0f} Ko, cible < 300 Ko (limite WhatsApp ~600 Ko, marge ~300 Ko)")
    ok = False

# Fidélité : le carré central doit rester proche de la source réduite
import numpy as np

a = np.asarray(src.resize((CARRE, CARRE), Image.LANCZOS), dtype=np.int16)
b = np.asarray(out.crop((x0, y0, x0 + CARRE, y0 + CARRE)), dtype=np.int16)
diff = float(np.abs(a - b).mean())
print(f"  fidélité du carré central (diff moy./canal) : {diff:.2f}/255")
if diff > 6:
    print("ERREUR : dérive visuelle du carré central")
    ok = False

print("\nRESULTAT:", "TOUT OK" if ok else "ECHEC")
raise SystemExit(0 if ok else 1)
