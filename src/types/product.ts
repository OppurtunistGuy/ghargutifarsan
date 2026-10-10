export type ProductCategory =
  | 'laddu'
  | 'modak'
  | 'chakli'
  | 'chivda'
  | 'sweet-snack'
  | 'savoury-snack'
  | 'festive-special';

/** Which storefront page a product lives on. */
export type Collection = 'laddus' | 'faral';

export type Availability = 'unconfirmed' | 'available' | 'sold-out' | 'seasonal';

export interface ProductImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** CSS object-position, for photos whose subject sits off-centre in a cropped frame. */
  focus?: string;
}

export interface ProductVariant {
  id: string;
  /** Pack label shown after the price, e.g. "500 g", "piece", "box of 6". Null until confirmed. */
  label: string | null;
  weightGrams: number | null;
  /** Integer paise; null means awaiting confirmed pricing, never free. */
  pricePaise: number | null;
  availability: Availability;
}

export interface Product {
  id: string;
  slug: string;
  name: { en: string; mr: string };
  category: ProductCategory;
  collection: Collection;
  description: string | null;
  image: ProductImage | null;
  /** First entry is the default selection. Every product has at least one variant so it can be ordered. */
  variants: readonly [ProductVariant, ...ProductVariant[]];
  availability: Availability;
  ingredients: readonly string[] | null;
  allergenInformation: string | null;
  storageInformation: string | null;
  comboContents: readonly string[] | null;
}
