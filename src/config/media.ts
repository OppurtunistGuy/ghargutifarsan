import type { ProductImage } from '../types/product';

/*
  Editorial photographs. `photo: null` renders a labelled placeholder describing what is needed.
  To fill a slot, place the file in public/images/ and set { src, alt, width, height }.
*/
export interface MediaSlot { photo: ProductImage | null; need: string }

type SlotId = 'homeHero' | 'faralHero' | 'homeKitchen' | 'faralKitchen' | 'storyFamily' | 'orderBand';

// Client-supplied editorial photos (assets-src/photos/editorial), resized by scripts/prepare-editorial.py.
function editorial(slug: string, alt: string, focus?: string, height = 900): ProductImage {
  return {
    src: `/images/editorial/${slug}-1600.webp`,
    srcSet: `/images/editorial/${slug}-960.webp 960w, /images/editorial/${slug}-1600.webp 1600w`,
    alt, width: 1600, height, focus,
  };
}

export const media: Record<SlotId, MediaSlot> = {
  homeHero: {
    photo: editorial('laddu-hands', 'Hands rolling a besan laddu over a brass plate of laddu mixture, with finished laddus beside it', 'center 40%'),
    need: 'Laddus on a brass plate, warm light. Landscape, at least 1600 px wide.',
  },
  faralHero: {
    photo: editorial('chakli-press', 'Chakli being pressed by hand onto a banana leaf in a brass thali, surrounded by bowls of faral', 'center 45%'),
    need: 'Chakli, chivda, shankarpali and karanji in brass bowls. Landscape, at least 1600 px wide.',
  },
  homeKitchen: {
    photo: editorial('besan-kadai', 'Besan being roasted in an iron kadai over a wood fire, stirred with a wooden spatula', 'center', 893),
    need: 'Hands rolling laddus in the home kitchen. At least 1200 px wide.',
  },
  faralKitchen: {
    photo: editorial('gift-box', 'Hands packing laddus and chakli into a golden festive gift box', '60% center'),
    need: 'Hands shaping chakli in the home kitchen. At least 1200 px wide.',
  },
  storyFamily: {
    photo: editorial('modak-filling', 'Ukadiche modak on a banana leaf beside a brass bowl of coconut and jaggery filling being mixed by hand'),
    need: 'The family or the kitchen at work, as they would like to be shown.',
  },
  orderBand: {
    photo: { src: '/images/products/festive-thali.webp', alt: 'A brass thali of chakli, chivda, laddus and other faral', width: 510, height: 310 },
    need: 'A festive plate of faral.',
  },
};
