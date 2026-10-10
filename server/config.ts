// Runtime configuration from environment variables. Secrets live only in the
// host's environment (Vercel project settings, or a local .env that git ignores),
// never in content/ or the built site.

export interface Config {
  /** Permanent System User token with whatsapp_business_messaging. */
  token?: string;
  /** Phone number ID of the dedicated business number (not the number itself). */
  phoneNumberId?: string;
  /** Meta app secret: webhook payloads are HMAC-signed with it. */
  appSecret?: string;
  /** Any string you choose; Meta echoes it when you register the webhook. */
  verifyToken?: string;
  /** The owner's own WhatsApp number, digits only. Receives alerts; customers never see it. */
  ownerNumber?: string;
  /** Approved utility template for order alerts when the owner's 24 h window is closed. */
  ownerTemplate?: { name: string; language: string };
  /** Approved utility template carrying the owner's reply when the customer's 24 h window is closed. */
  customerTemplate?: { name: string; language: string };
  graphVersion: string;
  /** Upstash Redis REST (Vercel Marketplace sets the KV_* or UPSTASH_* pair). */
  redis?: { url: string; token: string };
  /** Log outbound messages instead of calling Meta; allows unsigned webhooks. Local only. */
  dryRun: boolean;
}

type Env = Record<string, string | undefined>;

const digits = (v: string | undefined) => (v ? v.replace(/\D/g, '') || undefined : undefined);

export function readConfig(env: Env): Config {
  const redisUrl = env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL;
  const redisToken = env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN;
  const template = env.WHATSAPP_OWNER_TEMPLATE?.trim();
  const customerTemplate = env.WHATSAPP_CUSTOMER_TEMPLATE?.trim();
  return {
    token: env.WHATSAPP_TOKEN || undefined,
    phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID || undefined,
    appSecret: env.WHATSAPP_APP_SECRET || undefined,
    verifyToken: env.WHATSAPP_VERIFY_TOKEN || undefined,
    ownerNumber: digits(env.WHATSAPP_OWNER_NUMBER),
    ownerTemplate: template ? { name: template, language: env.WHATSAPP_OWNER_TEMPLATE_LANG || 'en' } : undefined,
    customerTemplate: customerTemplate
      ? { name: customerTemplate, language: env.WHATSAPP_CUSTOMER_TEMPLATE_LANG || 'en' }
      : undefined,
    graphVersion: env.WHATSAPP_GRAPH_VERSION || 'v23.0',
    redis: redisUrl && redisToken ? { url: redisUrl.replace(/\/$/, ''), token: redisToken } : undefined,
    dryRun: env.WHATSAPP_DRY_RUN === '1',
  };
}

/** What is missing before the webhook may process messages for real. */
export function missingForLive(c: Config): string[] {
  const missing: string[] = [];
  if (!c.token) missing.push('WHATSAPP_TOKEN');
  if (!c.phoneNumberId) missing.push('WHATSAPP_PHONE_NUMBER_ID');
  if (!c.appSecret) missing.push('WHATSAPP_APP_SECRET');
  if (!c.verifyToken) missing.push('WHATSAPP_VERIFY_TOKEN');
  if (!c.ownerNumber) missing.push('WHATSAPP_OWNER_NUMBER');
  if (!c.redis) missing.push('UPSTASH_REDIS_REST_URL/TOKEN (or KV_REST_API_URL/TOKEN)');
  return missing;
}
