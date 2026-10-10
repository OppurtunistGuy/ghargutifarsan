import type { Availability, Collection, Product, ProductCategory, ProductImage, ProductVariant } from '../types/product';

/*
  Catalogue source of truth. Every page, the bag and the WhatsApp message read from here.

  Provenance (see docs/content-status.md):
  - Names and photos come from the client's product sheet (assets-src/photos/product-sheet.webp).
  - Prices and pack sizes come from the approved prototypes and are SAMPLE DATA until the client
    confirms them (business.pricesConfirmed). Products the prototypes did not price stay null.
  - Descriptions are short sample copy describing the traditional dish; ingredients, allergens and
    storage stay null until the client supplies them. Availability stays 'unconfirmed'.
*/

// Photo pixel sizes after the 2x crop in scripts/crop-product-sheet.py.
const photoSizes = {
  'besan-laddu': [534, 344], 'rawa-coconut-laddu': [504, 344], 'nachani-laddu': [460, 344], 'dink-laddu': [496, 344],
  'shengdana-laddu': [500, 344], 'boondi-laddu': [502, 344], 'ukadiche-modak': [538, 296], 'talniche-modak': [502, 296],
  'khobare-modak': [496, 296], 'mawa-modak': [482, 296], 'dry-fruit-modak': [482, 296], 'kesar-modak': [486, 296],
  'bhajani-chakli': [540, 254], 'poha-chivda': [494, 254], 'shankarpali': [492, 254], karanji: [494, 254],
  anarse: [490, 254], shev: [478, 254], bakarwadi: [540, 230], kadboli: [498, 230], 'chivda-mix': [486, 230],
  'dal-chivda': [490, 230], 'kothimbir-vadi': [486, 230], 'thalipeeth-bhajani': [480, 230],
  'traditional-faral-combo': [526, 310], 'festive-gift-hamper': [470, 310], 'laddu-gift-pack': [500, 310],
  'farsan-gift-box': [464, 310], 'return-gift-pack': [510, 310], 'festive-thali': [510, 310],
} as const satisfies Record<string, readonly [number, number]>;

type PhotoId = keyof typeof photoSizes;

function photo(id: PhotoId, alt: string, focus?: string): ProductImage {
  const [width, height] = photoSizes[id];
  return { src: `/images/products/${id}.webp`, alt, width, height, focus };
}

const unconfirmed: Availability = 'unconfirmed';

function variant(label: string | null, rupees: number | null, weightGrams: number | null = null): ProductVariant {
  const id = label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : 'standard';
  return { id, label, weightGrams, pricePaise: rupees === null ? null : rupees * 100, availability: unconfirmed };
}

const pending = variant(null, null);

interface Seed {
  id: PhotoId;
  en: string;
  mr: string;
  category: ProductCategory;
  description: string;
  alt: string;
  focus?: string;
  variants?: readonly [ProductVariant, ...ProductVariant[]];
  comboContents?: readonly string[];
}

function product(seed: Seed): Product {
  const collection: Collection = seed.category === 'laddu' || seed.category === 'modak' ? 'laddus' : 'faral';
  return {
    id: seed.id, slug: seed.id, name: { en: seed.en, mr: seed.mr }, category: seed.category, collection,
    description: seed.description, image: photo(seed.id, seed.alt, seed.focus),
    variants: seed.variants ?? [pending], availability: unconfirmed,
    ingredients: null, allergenInformation: null, storageInformation: null, comboContents: seed.comboContents ?? null,
  };
}

// Row-one photos are framed tight to the top of the plate, so keep their tops in view.
const top = 'center 30%';

export const products: readonly Product[] = [
  // Laddus
  product({ id: 'besan-laddu', en: 'Besan Laddu', mr: 'बेसन लाडू', category: 'laddu', focus: top, alt: 'Besan laddus topped with sliced almonds on a brass plate', description: 'The classic roasted gram flour laddu, rich and full of flavour.', variants: [variant('500 g', 360, 500)] }),
  product({ id: 'rawa-coconut-laddu', en: 'Rawa Coconut Laddu', mr: 'रवा नारळ लाडू', category: 'laddu', focus: top, alt: 'White rawa coconut laddus on a brass plate', description: 'A delicate blend of roasted rava and coconut. Light and soft.', variants: [variant('500 g', 260, 500)] }),
  product({ id: 'nachani-laddu', en: 'Nachani Laddu', mr: 'नाचणी लाडू', category: 'laddu', focus: top, alt: 'Dark nachani laddus on a brass plate', description: 'Wholesome laddus made with nachani (ragi) flour.', variants: [variant('500 g', 250, 500)] }),
  product({ id: 'dink-laddu', en: 'Dink Laddu', mr: 'डिंक लाडू', category: 'laddu', focus: top, alt: 'Dink laddus studded with dry fruit on a brass plate', description: 'The traditional winter laddu with edible gum and dry fruits.', variants: [variant('500 g', 420, 500)] }),
  product({ id: 'shengdana-laddu', en: 'Shengdana Laddu', mr: 'शेंगदाणा लाडू', category: 'laddu', focus: top, alt: 'Peanut laddus on a brass plate', description: 'Roasted peanuts bound with jaggery, a fasting-day favourite.' }),
  product({ id: 'boondi-laddu', en: 'Boondi Laddu', mr: 'बुंदी लाडू', category: 'laddu', focus: top, alt: 'Orange boondi laddus topped with pistachio on a brass plate', description: 'Tiny fried gram flour pearls soaked in syrup and pressed into laddus.' }),

  // Modak
  product({ id: 'ukadiche-modak', en: 'Ukadiche Modak', mr: 'उकडीचे मोदक', category: 'modak', alt: 'Steamed white ukadiche modak on a banana leaf in a brass plate', description: 'Steamed rice flour modak with a coconut and jaggery filling.', variants: [variant('piece', 35)] }),
  product({ id: 'talniche-modak', en: 'Talniche Modak', mr: 'तळणीचे मोदक', category: 'modak', alt: 'Golden fried modak on a brass plate', description: 'Fried modak with a crisp shell and sweet coconut filling.' }),
  product({ id: 'khobare-modak', en: 'Khobare Modak', mr: 'खोबरे मोदक', category: 'modak', alt: 'Glossy dark coconut modak on a brass plate', description: 'Coconut modak cooked with jaggery until glossy.' }),
  product({ id: 'mawa-modak', en: 'Mawa Modak', mr: 'मावा मोदक', category: 'modak', alt: 'White mawa modak topped with pistachio on a brass plate', description: 'Soft milk mawa shaped into modak.' }),
  product({ id: 'dry-fruit-modak', en: 'Dry Fruit Modak', mr: 'ड्राय फ्रूट मोदक', category: 'modak', alt: 'Modak packed with dry fruits on a brass plate', description: 'Modak made from dates and chopped dry fruits.' }),
  product({ id: 'kesar-modak', en: 'Kesar Modak', mr: 'केसर मोदक', category: 'modak', alt: 'Saffron yellow modak on a brass plate', description: 'Saffron flavoured modak with a golden colour.' }),

  // Faral
  product({ id: 'bhajani-chakli', en: 'Bhajani Chakli', mr: 'भाजणी चकली', category: 'chakli', alt: 'Spiral bhajani chakli stacked in a brass plate', description: 'Crisp spirals made from roasted multigrain bhajani.', variants: [variant('500 g', 345, 500)] }),
  product({ id: 'poha-chivda', en: 'Poha Chivda', mr: 'पोहा चिवडा', category: 'chivda', alt: 'Poha chivda with cashews and curry leaves in a brass bowl', description: 'Light and crunchy flattened rice chivda, balanced with spices.', variants: [variant('500 g', 230, 500)] }),
  product({ id: 'shankarpali', en: 'Shankarpali', mr: 'शंकरपाळी', category: 'sweet-snack', alt: 'Diamond-cut shankarpali in a brass bowl', description: 'Sweet, crisp diamond-cut bites that melt in the mouth.', variants: [variant('500 g', 260, 500)] }),
  product({ id: 'karanji', en: 'Karanji', mr: 'करंजी', category: 'sweet-snack', alt: 'Crimped karanji in a brass plate', description: 'Festive crescent pastries with a sweet coconut filling.', variants: [variant('500 g', 320, 500)] }),
  product({ id: 'anarse', en: 'Anarse', mr: 'अनरसे', category: 'sweet-snack', alt: 'Anarse coated with poppy seeds in a brass plate', description: 'The Diwali sweet made with rice and jaggery, coated in poppy seeds.', variants: [variant('500 g', 380, 500)] }),
  product({ id: 'shev', en: 'Shev', mr: 'शेव', category: 'savoury-snack', alt: 'A heap of thin golden shev in a brass bowl', description: 'Thin, crisp gram flour shev, perfect with tea.', variants: [variant('250 g', 200, 250)] }),
  product({ id: 'bakarwadi', en: 'Bakarwadi', mr: 'बाकरवडी', category: 'savoury-snack', alt: 'Spiral bakarwadi in a brass plate', description: 'Crisp spirals with a sweet and spicy stuffing.', variants: [variant('500 g', 340, 500)] }),
  product({ id: 'kadboli', en: 'Kadboli', mr: 'कडबोळी', category: 'chakli', alt: 'Kadboli in a brass bowl', description: 'Hand-shaped rings of spiced flour, fried crisp.', variants: [variant('500 g', 280, 500)] }),
  product({ id: 'chivda-mix', en: 'Chivda Mix', mr: 'चिवडा मिक्स', category: 'chivda', alt: 'Mixed chivda with peanuts and curry leaves in a brass plate', description: 'A festive mix of chivda, peanuts and crunchy bits.' }),
  product({ id: 'dal-chivda', en: 'Dal Chivda', mr: 'डाळ चिवडा', category: 'chivda', alt: 'Dal chivda in a brass plate', description: 'Crunchy fried dal tossed with spices.' }),
  product({ id: 'kothimbir-vadi', en: 'Kothimbir Vadi', mr: 'कोथिंबीर वडी', category: 'savoury-snack', alt: 'Kothimbir vadi squares with coriander in a brass plate', description: 'Coriander and gram flour squares, steamed and fried.' }),
  product({ id: 'thalipeeth-bhajani', en: 'Thalipeeth Bhajani', mr: 'थालीपीठ भाजणी', category: 'savoury-snack', alt: 'Thalipeeth made from bhajani flour on a brass plate', description: 'Roasted multigrain flour for making thalipeeth at home.' }),

  // Festive specials
  product({ id: 'traditional-faral-combo', en: 'Traditional Faral Combo', mr: 'पारंपरिक फराळ कॉम्बो', category: 'festive-special', alt: 'A wooden box with compartments of assorted faral', description: 'A curated box of traditional faral for gifting or celebrating with family.', variants: [variant('box of 6', 999)], comboContents: ['Chakli', 'Chivda', 'Shankarpali', 'Anarse', 'Shev', 'Kadboli'] }),
  product({ id: 'festive-gift-hamper', en: 'Festive Gift Hamper', mr: 'उत्सव भेट पॅक', category: 'festive-special', alt: 'A red festive gift hamper filled with sweets and faral', description: 'An assortment of our sweets and faral in a festive gift box.', variants: [variant('box', 1499)] }),
  product({ id: 'laddu-gift-pack', en: 'Laddu Gift Pack', mr: 'लाडू गिफ्ट पॅक', category: 'festive-special', alt: 'Glass jars of laddus and shankarpali with labels', description: 'Assorted laddus packed in jars for gifting.' }),
  product({ id: 'farsan-gift-box', en: 'Farsan Gift Box', mr: 'फराळ गिफ्ट बॉक्स', category: 'festive-special', alt: 'A red gift box with compartments of farsan', description: 'A box of savoury farsan in separate compartments.' }),
  product({ id: 'return-gift-pack', en: 'Return Gift Pack', mr: 'रिटर्न गिफ्ट पॅक', category: 'festive-special', alt: 'Small wrapped gift packs with tags', description: 'Small packs for return gifts at poojas and functions.' }),
  product({ id: 'festive-thali', en: 'Festive Thali', mr: 'उत्सवी ताट', category: 'festive-special', alt: 'A brass thali with chakli, chivda, laddus and other faral', description: 'A thali of chakli, chivda, laddus and more for the festive table.' }),
];

export const faralFilters = [
  { id: 'all', label: 'All Faral', categories: ['chakli', 'chivda', 'sweet-snack', 'savoury-snack'] },
  { id: 'chakli', label: 'Chakli', categories: ['chakli'] },
  { id: 'chivda', label: 'Chivda', categories: ['chivda'] },
  { id: 'sweet', label: 'Sweet Snacks', categories: ['sweet-snack'] },
  { id: 'savoury', label: 'Savoury Snacks', categories: ['savoury-snack'] },
  { id: 'festive', label: 'Festive Specials', categories: ['festive-special'] },
] as const satisfies readonly { id: string; label: string; categories: readonly ProductCategory[] }[];

export type FaralFilterId = (typeof faralFilters)[number]['id'];

export function productsInCategories(categories: readonly ProductCategory[]): Product[] {
  return products.filter((item) => categories.includes(item.category));
}

export function findProduct(slug: string): Product | undefined {
  return products.find((item) => item.slug === slug);
}

export function findVariant(item: Product, variantId: string): ProductVariant | undefined {
  return item.variants.find((option) => option.id === variantId);
}

export function formatPrice(pricePaise: number | null): string {
  if (pricePaise === null) return 'Price to be confirmed';
  const whole = pricePaise % 100 === 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2,
  }).format(pricePaise / 100);
}
