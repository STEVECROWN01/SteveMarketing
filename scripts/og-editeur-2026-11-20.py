#!/usr/bin/env python3
"""Dérivation JPEG optimisée de la vignette de l'éditeur (20/11/2026,
deuxième itération du correctif de l'aperçu de partage).

L'ÉDITEUR A FOURNI SA PROPRE VIGNETTE AU BON RATIO — commit 919d8f4
(« Add files via upload ») puis 1f463a8 (renommage) :
public/assets/OG-image.png, 1733×908 (ratio 1,909 ≈ 1,91:1 attendu par
Facebook/LinkedIn), composition paysage : portrait à gauche, logo et
nom en haut à droite, accroche « Des Sites Web Professionnels qui
vendent », trois icônes de services en bas à droite.

POURQUOI NE PAS LA SERVIR TELLE QUELLE : le PNG pèse 1 823 Ko. WhatsApp
n'affiche pas les aperçus au-delà d'environ 600 Ko (l'image échoue
silencieusement — incident documenté le 16/11 avec le OG.png de 1,9 Mo,
cause première des aperçus manquants). Servir ce PNG réintroduirait
exactement le défaut que le volet 9 vient de corriger.

CORRECTIF : dérivé JPEG optimisé public/assets/OG-2026-11-20-v2.jpg —
1200×630 (dimensions canoniques Open Graph ; homothétie 1733×908 →
1200×630, écart de ratio 0,2 %, imperceptible, AUCUN recadrage — le
VLM note que les icônes sont proches des bords : rien n'est coupé),
qualité 85, progressif, optimisé. Source = le PNG de l'éditeur (fichier
sans perte, jamais un JPEG re-compressé — convention du projet). Le PNG
source reste dans le dépôt.

NOUVEAU NOM DATÉ (-v2) : OG-2026-11-20.jpg (la première correction du
jour, carré centré) vient d'être scrapé par les plateformes ; un nom
nouveau force chaque edge à re-télécharger la version de l'éditeur.
"""

from PIL import Image
import os

ROOT = os.path.join(os.path.dirname(__file__), "..")
SRC = os.path.join(ROOT, "public", "assets", "OG-image.png")
DST = os.path.join(ROOT, "public", "assets", "OG-2026-11-20-v2.jpg")

W, H = 1200, 630

src = Image.open(SRC).convert("RGB")
assert src.size == (1733, 908), f"Source inattendue : {src.size}"

img = src.resize((W, H), Image.LANCZOS)
img.save(DST, "JPEG", quality=85, optimize=True, progressive=True)

# --- Vérifications intégrées -------------------------------------------
taille = os.path.getsize(DST)
out = Image.open(DST)
print("=== Vignette OG de l'éditeur — dérivé JPEG ===")
print(f"  source : public/assets/OG-image.png ({os.path.getsize(SRC) / 1024:.0f} Ko, PNG sans perte)")
print(f"  dérivé : public/assets/OG-2026-11-20-v2.jpg")
print(f"  dimensions : {out.size} | poids : {taille} octets ({taille / 1024:.0f} Ko)")

ok = True
if out.size != (W, H):
    print(f"ERREUR : dimensions {out.size}, attendu {W}×{H}")
    ok = False
if taille > 300 * 1024:
    print(f"ERREUR : {taille / 1024:.0f} Ko, cible < 300 Ko (limite WhatsApp ~600 Ko)")
    ok = False

# Fidélité par rapport à la source réduite (contrôle de compression)
import numpy as np

a = np.asarray(src.resize((W, H), Image.LANCZOS), dtype=np.int16)
b = np.asarray(out, dtype=np.int16)
diff = float(np.abs(a - b).mean())
print(f"  fidélité (diff moy./canal vs source) : {diff:.2f}/255")
if diff > 8:
    print("ERREUR : dérive visuelle excessive")
    ok = False

print("\nRESULTAT:", "TOUT OK" if ok else "ECHEC")
raise SystemExit(0 if ok else 1)
