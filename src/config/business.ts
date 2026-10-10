export type ClaimId = 'fssai' | 'googleReviews' | 'noPreservatives' | 'smallBatch' | 'freshAfterOrder' | 'traditionalRecipes';

export interface Claim {
  title: string;
  /** Shown once confirmed. */
  detail: string;
  /** Shown in a placeholder chip until confirmed. */
  pendingLabel: string;
  confirmed: boolean;
}

export interface BusinessConfig {
  name: string;
  marathiName: string;
  currency: 'INR';
  locale: 'en-IN';
  /** Digits only, international format with country code and no '+', e.g. 9198xxxxxxxx. */
  whatsappNumber: string | null;
  email: string | null;
  address: string | null;
  serviceArea: string | null;
  deliveryInformation: string | null;
  orderingHours: string | null;
  instagramUrl: string | null;
  fssaiNumber: string | null;
  googleReviewUrl: string | null;
  /** False while catalogue prices are the prototype's sample prices. */
  pricesConfirmed: boolean;
  /** Short statements for the top bar. Keep them factual; no unverified claims. */
  announcement: readonly string[];
  claims: Record<ClaimId, Claim>;
}

// Populate only with approved business details. Public configuration: never put secrets here.
export const business: BusinessConfig = {
  name: 'Gharguti Farsan',
  marathiName: 'घरगुती फरसाण',
  currency: 'INR',
  locale: 'en-IN',
  whatsappNumber: null,
  email: null,
  address: null,
  serviceArea: null,
  deliveryInformation: null,
  orderingHours: null,
  instagramUrl: null,
  fssaiNumber: null,
  googleReviewUrl: null,
  pricesConfirmed: false,
  announcement: ['Homemade Maharashtrian sweets and faral', 'Laddus, modak and festive gift packs'],
  claims: {
    fssai: { title: 'FSSAI licence', detail: 'Registered food business', pendingLabel: 'Licence no. to add', confirmed: false },
    googleReviews: { title: 'Google reviews', detail: 'Read our reviews', pendingLabel: 'Listing link to add', confirmed: false },
    noPreservatives: { title: 'No preservatives', detail: 'Only natural ingredients', pendingLabel: 'To be confirmed', confirmed: false },
    smallBatch: { title: 'Small batches', detail: 'Made with care', pendingLabel: 'To be confirmed', confirmed: false },
    freshAfterOrder: { title: 'Fresh after order', detail: 'Made once you order', pendingLabel: 'To be confirmed', confirmed: false },
    traditionalRecipes: { title: 'Traditional recipes', detail: 'Passed through generations', pendingLabel: 'To be confirmed', confirmed: false },
  },
};

export function isWhatsAppConfigured(number: string | null): boolean {
  // International format: digits only, including the country code, without '+'.
  return number !== null && /^[1-9]\d{7,14}$/.test(number);
}
