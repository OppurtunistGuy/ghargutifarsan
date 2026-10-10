import type { ProductImage } from '../types/product';

/*
  Editorial photographs. `photo: null` renders a labelled placeholder describing what is needed.
  To fill a slot, place the file in public/images/ and set { src, alt, width, height }.
*/
export interface MediaSlot { photo: ProductImage | null; need: string }

type SlotId = 'homeHero' | 'faralHero' | 'homeKitchen' | 'faralKitchen' | 'storyFamily' | 'orderBand';

export const media: Record<SlotId, MediaSlot> = {
  homeHero: { photo: null, need: 'Laddus on a brass plate, warm light. Landscape, at least 1600 px wide.' },
  faralHero: { photo: null, need: 'Chakli, chivda, shankarpali and karanji in brass bowls. Landscape, at least 1600 px wide.' },
  homeKitchen: { photo: null, need: 'Hands rolling laddus in the home kitchen. At least 1200 px wide.' },
  faralKitchen: { photo: null, need: 'Hands shaping chakli in the home kitchen. At least 1200 px wide.' },
  storyFamily: { photo: null, need: 'The family or the kitchen at work, as they would like to be shown.' },
  orderBand: {
    photo: { src: '/images/products/festive-thali.webp', alt: 'A brass thali of chakli, chivda, laddus and other faral', width: 510, height: 310 },
    need: 'A festive plate of faral.',
  },
};
