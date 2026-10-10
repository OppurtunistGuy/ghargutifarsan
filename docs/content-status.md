# Content status: what is real, what is sample, what is missing

Every unconfirmed item on the site is visibly marked with a dashed "placeholder" chip
(`PendingChip`). Photo slots without a photo render a "Photo to be supplied" panel (`PhotoSlot`);
all slots are currently filled. Nothing below is invented.

Photo placement: Home hero = laddu rolling; Home kitchen story = besan in kadai; Faral hero = chakli
press; Faral "Made with love" = gift box packing; Our Story = modak filling. The WhatsApp band uses
the Festive Thali product photo. The supplied `Modak` subfolder was empty.

## Supplied by the client

| Item | Source | Where it lives |
| --- | --- | --- |
| 30 product photos and names (English and Marathi) | Product sheet, received 2026-10-10 (`assets-src/photos/product-sheet.webp`) | `public/images/products/*.webp`, `src/data/products.ts` |
| 5 editorial photos (laddu rolling, besan in kadai, chakli press, gift box packing, modak filling) | Received 2026-10-10 (`assets-src/photos/editorial/`) | `public/images/editorial/` (960 and 1600 px WebP), slots in `src/config/media.ts` |
| Page composition, palette, typography direction, section copy | Two approved prototypes (homepage, Faral page) | Components and pages |

The product sheet is 1536 x 1024, so each photo is only about 250 x 150 px. They were cropped and
upscaled 2x (`scripts/crop-product-sheet.py`), which looks acceptable on cards but soft on large
screens and the product page. Higher-resolution originals can replace the files one for one.

Marathi names follow the sheet, with obvious misspellings in the generated labels corrected
(for example पॅक, कोथिंबीर). Please have the family review them.

## Sample data (shown with a "Sample prices" chip)

Prices and pack sizes come from the approved prototypes and stay sample data until
`business.pricesConfirmed` is set to `true` in `src/config/business.ts`:

Besan ₹360, Rawa Coconut ₹260, Nachani ₹250, Dink ₹420 (500 g); Ukadiche Modak ₹35 per piece;
Bhajani Chakli ₹345, Poha Chivda ₹230, Shankarpali ₹260, Karanji ₹320, Anarse ₹380, Bakarwadi ₹340,
Kadboli ₹280 (500 g); Shev ₹200 (250 g); Traditional Faral Combo ₹999 (box of 6);
Festive Gift Hamper ₹1,499 (box).

The other 15 products have no price ("Price to be confirmed"). They can still be added to the cart;
the WhatsApp message lists them as "price to be confirmed".

Product descriptions are short sample copy describing the traditional dish. Replace them with the
family's own wording.

## Missing (placeholders on the site)

| Needed | Config location |
| --- | --- |
| Family story in their own words | `src/pages/StoryPage.tsx` |
| For the automated assistant only: Meta Business access, and the owner's personal number for alerts ([whatsapp-assistant.md](whatsapp-assistant.md)). The website's WhatsApp number (+91 81779 44699) was supplied on 2026-10-10 and is live in `business.ts`. | Secrets in Vercel environment variables |
| Email, kitchen location, delivery areas, order timings | `business.email`, `address`, `deliveryInformation` / `serviceArea`, `orderingHours` |
| FSSAI licence number | `business.fssaiNumber`, then `claims.fssai.confirmed` |
| Google listing link | `business.googleReviewUrl`, then `claims.googleReviews.confirmed` |
| Confirmation of: no preservatives, small batches, fresh after order, traditional recipes | `business.claims.*.confirmed` |
| Ingredients, allergens, storage per product | `src/data/products.ts` |
| Logo artwork (prototypes show a lotus mark) | `src/components/Brand.tsx` |
| Instagram or other social links | `business.instagramUrl` |

Setting a valid `whatsappNumber` automatically enables "Send on WhatsApp" on the cart page and the
contact form. Until then they compose the message and offer "Copy message" only.

## Deliberate differences from the prototypes

- The "Freshly made after your order" seal, "Bestseller" ribbon, "5.0 on Google", "5000+ families",
  "Pan India", "FSSAI Licensed" and "No preservatives" statements are unverified, so they are either
  omitted or shown as labelled placeholders.
- The lotus logo, line-art florals and the illustrated woman are not reproduced: no artwork files were
  supplied and redrawing them would invent brand assets. Section titles keep a small CSS flourish.
- Header search is omitted (no search feature to back it). "Track Order" and "FAQ" links are omitted
  (no such pages).
- The WhatsApp button uses the site's cream-on-brown instead of WhatsApp green, keeping one accent.
- Product grids show two columns on phones for faster browsing.
