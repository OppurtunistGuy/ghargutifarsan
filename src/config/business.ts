export interface BusinessConfig {
  name: string;
  marathiName: string;
  currency: 'INR';
  locale: 'en-IN';
  whatsappNumber: string | null;
  email: string | null;
  address: string | null;
  deliveryInformation: string | null;
  announcement: string | null;
  verifiedClaims: {
    fssaiNumber: string | null;
    googleReviewUrl: string | null;
    noPreservatives: boolean | null;
    smallBatch: boolean | null;
  };
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
  deliveryInformation: null,
  announcement: null,
  verifiedClaims: {
    fssaiNumber: null,
    googleReviewUrl: null,
    noPreservatives: null,
    smallBatch: null,
  },
};

export function isWhatsAppConfigured(number: string | null): boolean {
  // International format: digits only, including the country code, without '+'.
  return number !== null && /^[1-9]\d{7,14}$/.test(number);
}
