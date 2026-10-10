# Crops the client product sheet (assets-src/photos/product-sheet.webp) into one WebP per product.
# Tile bounds were measured from the sheet; re-measure if the client supplies a new sheet.
# Usage: python scripts/crop-product-sheet.py assets-src/photos/product-sheet.webp public/images/products
import sys, json
from PIL import Image, ImageFilter
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
rows = [(0,174),(224,376),(429,560),(604,723),(780,939)]
gaps = [[(269,271),(528,530),(765,767),(1020,1023),(1278,1279)],
        [(271,273),(529,533),(786,789),(1035,1038),(1284,1287)],
        [(272,275),(527,530),(781,784),(1036,1039),(1289,1291)],
        [(272,276),(530,534),(782,785),(1035,1038),(1286,1290)],
        [(265,269),(509,512),(767,770),(1007,1011),(1271,1275)]]
names = [
 ['besan-laddu','rawa-coconut-laddu','nachani-laddu','dink-laddu','shengdana-laddu','boondi-laddu'],
 ['ukadiche-modak','talniche-modak','khobare-modak','mawa-modak','dry-fruit-modak','kesar-modak'],
 ['bhajani-chakli','poha-chivda','shankarpali','karanji','anarse','shev'],
 ['bakarwadi','kadboli','chivda-mix','dal-chivda','kothimbir-vadi','thalipeeth-bhajani'],
 ['traditional-faral-combo','festive-gift-hamper','laddu-gift-pack','farsan-gift-box','return-gift-pack','festive-thali']]
meta = {}
for ri,(top,bot) in enumerate(rows):
    xs = [0] + [g for gap in gaps[ri] for g in gap] + [1535]
    for ci in range(6):
        l, r = xs[2*ci], xs[2*ci+1]
        box = (l + (0 if ci == 0 else 3), top + (0 if ri == 0 else 2), r - 2, bot - 2)
        tile = im.crop(box)
        w, h = tile.size
        tile = tile.resize((w*2, h*2), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
        name = names[ri][ci]
        tile.save(f'{out}/{name}.webp', 'WEBP', quality=84, method=6)
        meta[name] = [w*2, h*2]
print(json.dumps(meta))
