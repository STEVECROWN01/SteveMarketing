#!/usr/bin/env python3
"""Favicon transparent — 14/11/2026 (complément 8) :
Le « Logo Favicon.png » (1254×1254) est un glyphe blanc posé sur un
fond noir. Le fond doit disparaître : le favicon servi devient un PNG
RGBA transparent.

Méthode (retrait propre d'un fond noir d'un contenu clair) :
1. alpha = max(R,G,B) du pixel — le fichier est un compositing du
   glyphe sur du noir pur, donc l'alpha de couverture est exactement
   la valeur du canal le plus clair (les bords anti-aliasés gardent
   ainsi leur dégradé de couverture, sans halo sombre).
2. Couleur dé-prémultipliée : RGB × 255/alpha → blanc pur à couverture
   partielle (rendu identique sur fond noir, propre sur fond clair).
3. Recadrage sur l'enveloppe du glyphe + marge 6 %, recentrage sur
   canevas carré transparent → le glyphe occupe ~88 % du canevas au
   lieu de ~48 % avant recadrage.
4. Rééchantillonnage 512×512 Lanczos, PNG optimisé.
"""
from PIL import Image
import numpy as np
import os
import hashlib

ROOT = "/home/z/my-project/public/assets"
SRC = os.path.join(ROOT, "Logo Favicon.png")
DST = os.path.join(ROOT, "favicon.png")

a = np.array(Image.open(SRC).convert("RGB")).astype(np.float64)
h, w, _ = a.shape

# 1. Alpha de couverture (glyph clair sur noir : alpha = canal max)
alpha = a.max(axis=2)

# 2. Dé-prémultiplication (alpha nul → couleur sans importance)
safe = alpha > 6
rgb = np.zeros_like(a)
rgb[safe] = a[safe] * 255.0 / alpha[safe][:, None]
rgb = np.clip(rgb, 0, 255)

out = np.dstack([rgb, alpha]).astype(np.uint8)

# 3. Recadrage sur l'enveloppe du glyphe + marge, puis canevas carré
ys, xs = np.where(out[:, :, 3] > 24)
x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
bw, bh = x1 - x0 + 1, y1 - y0 + 1
m = round(max(bw, bh) * 0.06)
x0m, y0m = max(0, x0 - m), max(0, y0 - m)
x1m, y1m = min(w, x1 + m + 1), min(h, y1 + m + 1)
crop = out[y0m:y1m, x0m:x1m]
ch, cw = crop.shape[:2]
side = max(cw, ch)
square = np.zeros((side, side, 4), dtype=np.uint8)
square[(side - ch) // 2 : (side - ch) // 2 + ch, (side - cw) // 2 : (side - cw) // 2 + cw] = crop

# 4. favicon 512×512
fav = Image.fromarray(square).resize((512, 512), Image.LANCZOS)
fav.save(DST, "PNG", optimize=True)

# --- Vérifications ---
f = np.array(Image.open(DST))
im_out = Image.open(DST)
print("favicon.png :", im_out.size, im_out.mode, os.path.getsize(DST) // 1024, "KB")
print("glyphe (bbox source) :", f"({x0},{y0})–({x1},{y1}) soit {bw}×{bh}px ; marge {m}px")
cov = (f[:, :, 3] > 128).mean() * 100
print("couverture opaque :", round(cov, 1), "% du canevas 512")
corners = [tuple(f[p][3] for p in [(3, 3), (3, -4), (-4, 3), (-4, -4)])]
print("alpha des 4 coins (0 attendu) :", corners[0])
print("md5 :", hashlib.md5(f.tobytes()).hexdigest()[:12])

# QA : recompositing sur noir → doit reproduire le recadrage carré de
# l'ORIGINAL avec les mêmes marges (et non l'image pleine, que le
# recadrage décale fatalement).
comp = np.array(im_out.convert("RGB"))
al = f[:, :, 3:4].astype(float) / 255.0
dark = (comp * al).astype(np.uint8)
ref_square = np.zeros((side, side, 3), dtype=np.uint8)
ref_crop = a[y0m:y1m, x0m:x1m].astype(np.uint8)
ref_square[(side - ch) // 2 : (side - ch) // 2 + ch, (side - cw) // 2 : (side - cw) // 2 + cw] = ref_crop
ref = np.array(
    Image.fromarray(ref_square).resize((512, 512), Image.LANCZOS)
).astype(int)
mask = f[:, :, 3] > 200
diff = np.abs(dark.astype(int) - ref)[mask]
print(
    "QA recompositing noir — diff moyenne sur le glyphe :",
    round(diff.mean(), 2),
    "/255 (attendu ≈ 0 : dé-prémultiplication exacte, resampling AA mis à part)",
)
