# Assets

- `public/images/products/`: product photos cut from the client's product sheet (`assets-src/photos/product-sheet.webp`) by `scripts/crop-product-sheet.py`.
- `public/images/editorial/`: the client's editorial photos (`assets-src/photos/editorial/`), resized without cropping by `scripts/prepare-editorial.py`. Slots are configured in `src/config/media.ts`; an empty slot renders a labelled placeholder.

Do not substitute generated or unrelated stock photography. Typography is self-hosted (Mukta, Noto Serif, Noto Serif Devanagari, Kalam); licences are in `public/licenses/`.
