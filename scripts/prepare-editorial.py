# Converts the client's editorial photos (assets-src/photos/editorial/*.png) into responsive WebP.
# No crop or grade: the images are only resized, so their content stays exactly as supplied.
# Usage: python scripts/prepare-editorial.py assets-src/photos/editorial public/images/editorial
import sys, json
from pathlib import Path
from PIL import Image

SLUGS = {
    'Golden Hands Crafting Festive Laddus.png': 'laddu-hands',
    'Festive Golden Sweet in Iron Kadai.png': 'besan-kadai',
    'Festive Chakli Making in Brass Glow.png': 'chakli-press',
    'Festive Indian Mithai Gift Box.png': 'gift-box',
    'Festive Modaks and Coconut-Jaggery Filling.png': 'modak-filling',
}
WIDTHS = (960, 1600)

src, out = Path(sys.argv[1]), Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
meta = {}
for name, slug in SLUGS.items():
    im = Image.open(src / name).convert('RGB')
    for width in WIDTHS:
        height = round(im.height * width / im.width)
        im.resize((width, height), Image.LANCZOS).save(out / f'{slug}-{width}.webp', 'WEBP', quality=80, method=6)
    meta[slug] = [WIDTHS[-1], round(im.height * WIDTHS[-1] / im.width)]
print(json.dumps(meta))
