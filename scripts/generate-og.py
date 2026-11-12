#!/usr/bin/env python3
"""Génère l'image Open Graph (1200x630) : fond sombre #1c1c1c,
titre beige #c9baac, portrait professionnel à droite."""
from PIL import Image, ImageDraw, ImageFont
import os

ASSETS = "/home/z/my-project/public/assets"
OUT = "/home/z/my-project/public/og-image.jpg"

W, H = 1200, 630
BG = (28, 28, 28)          # #1c1c1c
ACCENT = (201, 186, 172)   # #c9baac
WHITE = (255, 255, 255)
GRAY = (201, 201, 201)     # #c9c9c9

# Polices disponibles
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_TTF = FONT_BOLD if os.path.exists(FONT_BOLD) else None
FONT_RTTF = FONT_REG if os.path.exists(FONT_REG) else FONT_TTF

img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

# Grille discrète
grid = Image.new("RGB", (W, H), BG)
gdraw = ImageDraw.Draw(grid)
for x in range(0, W, 60):
    gdraw.line([(x, 0), (x, H)], fill=(34, 34, 34), width=1)
for y in range(0, H, 60):
    gdraw.line([(0, y), (W, y)], fill=(34, 34, 34), width=1)
img = Image.blend(img, grid, 0.5)
draw = ImageDraw.Draw(img)

# Halo beige derrière le portrait
halo = Image.new("RGBA", (W, H), (0, 0, 0, 0))
hdraw = ImageDraw.Draw(halo)
hdraw.ellipse([700, 80, 1280, 560], fill=ACCENT + (38,))
img = Image.alpha_composite(img.convert("RGBA"), halo).convert("RGB")
draw = ImageDraw.Draw(img)

# Portrait (recadré vertical, à droite)
portrait = Image.open(os.path.join(ASSETS, "stevens-akpovi-portrait.png")).convert("RGB")
# Recadrage 3:4 centré haut
pw = 360
ph = 480
ratio = portrait.width / portrait.height
if ratio > 0.75:
    nh = portrait.height
    nw = round(nh * 0.75)
    left = (portrait.width - nw) // 2
    portrait = portrait.crop((left, 0, left + nw, nh))
else:
    nw = portrait.width
    nh = round(nw / 0.75)
    top = 0
    portrait = portrait.crop((0, top, nw, top + nh))
portrait = portrait.resize((pw, ph), Image.LANCZOS)

# Bloc beige décalé derrière le portrait
draw.rounded_rectangle([818, 78, 1182, 542], radius=28, outline=None, fill=ACCENT)
img.paste(portrait, (800, 60))

# Rayure beige fine verticale
draw.rectangle([76, 96, 82, 200], fill=ACCENT)

if FONT_TTF:
    f_eyebrow = ImageFont.truetype(FONT_RTTF or FONT_TTF, 22)
    f_title = ImageFont.truetype(FONT_TTF, 64)
    f_sub = ImageFont.truetype(FONT_RTTF or FONT_TTF, 30)
    f_name = ImageFont.truetype(FONT_TTF, 34)

    # Surtitre
    draw.text((106, 100), "CONCEPTION DE SITES WEB PROFESSIONNELS", font=f_eyebrow, fill=ACCENT)

    # Titre (retours à la ligne manuels)
    lines = ["Je crée des sites web", "qui génèrent", "des ventes."]
    y = 150
    for line in lines:
        draw.text((106, y), line, font=f_title, fill=WHITE)
        y += 78

    # Sous-texte
    draw.text((106, y + 18), "Stratégie · Design · Conversion", font=f_sub, fill=GRAY)

    # Nom + mention
    draw.text((106, 520), "Stevens Akpovi", font=f_name, fill=ACCENT)
    draw.text((106, 566), "Copywriting inclus · SEO de base inclus · À distance", font=f_eyebrow, fill=GRAY)
else:
    draw.text((106, 150), "Je crée des sites web", fill=WHITE)
    draw.text((106, 210), "qui génèrent des ventes.", fill=WHITE)
    draw.text((106, 300), "Stevens Akpovi", fill=ACCENT)

img.save(OUT, "JPEG", quality=88, optimize=True)
print("OG image :", OUT, os.path.getsize(OUT) // 1024, "KB")
