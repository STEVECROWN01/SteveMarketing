"""Optimisation de la vignette Open Graph (16/11/2026).

Diagnostic : public/assets/OG.png fait 1,9 Mo — WhatsApp n'affiche pas
les aperçus de lien au-delà d'environ 600 Ko (l'image échoue
silencieusement). Facebook/LinkedIn recommandent aussi des images
légères.

Correctif : dérivé JPEG optimisé public/assets/OG.jpg (mêmes dimensions
1254×1254, qualité 88, progressif) — cible < 300 Ko pour rester très
large sous toutes les limites connues. La source PNG est conservée
intacte dans le dépôt (convention du projet : sources préservées).

Vérification intégrée : dimensions, poids, et différence pixel moyenne
avec l'original (doit rester faible — simple contrôle de non-régression
de la compression).
"""
from PIL import Image
import os

SRC = "public/assets/OG.png"
DST = "public/assets/OG.jpg"

src = Image.open(SRC)
print(f"Source  : {SRC} — {src.size[0]}x{src.size[1]} {src.mode}, "
      f"{os.path.getsize(SRC) / 1024:.0f} Ko")

rgb = src.convert("RGB")
rgb.save(DST, "JPEG", quality=88, optimize=True, progressive=True)

size_kb = os.path.getsize(DST) / 1024
out = Image.open(DST)
print(f"Dérivé  : {DST} — {out.size[0]}x{out.size[1]} {out.mode}, {size_kb:.0f} Ko")

# Contrôle de fidélité : différence moyenne par canal (0-255).
if src.size == out.size:
    a = src.convert("RGB")
    import numpy as np
    diff = np.asarray(a, dtype=np.int16) - np.asarray(out, dtype=np.int16)
    print(f"Diff moyenne avec la source : {abs(diff).mean():.2f}/255 "
          f"(max {abs(diff).max()})")

assert size_kb < 300, f"Trop lourd : {size_kb:.0f} Ko (cible < 300 Ko)"
assert out.size == (1254, 1254), f"Dimensions inattendues : {out.size}"
print("OK — vignette OG prête (< 300 Ko, 1254x1254).")
