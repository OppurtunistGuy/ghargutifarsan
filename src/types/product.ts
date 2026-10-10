export type ProductCategory = 'laddu' | 'chakli' | 'chivda' | 'sweet-snack' | 'savoury-snack' | 'festive-special';
export type Availability = 'unconfirmed' | 'available' | 'sold-out' | 'seasonal';

export interface ProductImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface ProductVariant {
  id: string;
  label: string;
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
  description: string | null;
  image: ProductImage | null;
  variants: readonly ProductVariant[];
  availability: Availability;
  ingredients: readonly string[] | null;
  allergenInformation: string | null;
  storageInformation: string | null;
  comboContents: readonly string[] | null;
}
