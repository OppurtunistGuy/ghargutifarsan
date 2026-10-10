import type { Product, ProductCategory } from '../types/product';

// Product names come from the supplied requirements. Remaining details await approval.
function pendingProduct(id: string, en: string, mr: string, category: ProductCategory): Product {
  return {
    id, slug: id, name: { en, mr }, category,
    description: null, image: null, variants: [], availability: 'unconfirmed',
    ingredients: null, allergenInformation: null, storageInformation: null, comboContents: null,
  };
}

export const products: readonly Product[] = [
  pendingProduct('bhajani-chakli', 'Bhajani Chakli', 'भाजणी चकली', 'chakli'),
  pendingProduct('poha-chivda', 'Poha Chivda', 'पोहे चिवडा', 'chivda'),
  pendingProduct('shankarpali', 'Shankarpali', 'शंकरपाळी', 'sweet-snack'),
  pendingProduct('karanji', 'Karanji', 'करंजी', 'sweet-snack'),
  pendingProduct('anarse', 'Anarse', 'अनारसे', 'sweet-snack'),
  pendingProduct('shev', 'Shev', 'शेव', 'savoury-snack'),
  pendingProduct('kadboli', 'Kadboli', 'कडबोळी', 'savoury-snack'),
  pendingProduct('bakarwadi', 'Bakarwadi', 'बाकरवडी', 'savoury-snack'),
  pendingProduct('traditional-faral-combo', 'Traditional Faral Combo', 'पारंपरिक फराळ संच', 'festive-special'),
  pendingProduct('festive-gift-hamper', 'Festive Gift Hamper', 'सणाचा भेट संच', 'festive-special'),
];

export function findProduct(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export function formatPrice(pricePaise: number | null): string {
  return pricePaise === null ? 'Price to be confirmed' : new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2,
  }).format(pricePaise / 100);
}
