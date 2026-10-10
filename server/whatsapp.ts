// WhatsApp Cloud API: webhook parsing and signature check (inbound), and the
// Graph API messages endpoint (outbound). Only the fields the bot uses.

import { createHmac, timingSafeEqual } from 'node:crypto';

/** A message the bot wants to send, independent of the Graph API shape. */
export type Outbound =
  | { kind: 'text'; text: string }
  | { kind: 'buttons'; text: string; buttons: Choice[] }
  | { kind: 'list'; text: string; button: string; rows: (Choice & { description?: string })[] };

export interface Choice {
  id: string;
  title: string;
}

/** An incoming customer or owner message, normalised. */
export interface Inbound {
  id: string;
  from: string;
  /** WhatsApp profile name, if the sender shares one. */
  profileName?: string;
  type: 'text' | 'choice' | 'location' | 'other';
  text?: string;
  /** Reply button / list row id the person tapped. */
  choice?: string;
  location?: { latitude: number; longitude: number; name?: string; address?: string };
  /** For "other": the WhatsApp message type (image, audio, sticker...). */
  rawType?: string;
}

export interface Sender {
  send(to: string, message: Outbound): Promise<void>;
  /** Business-initiated message outside the 24 h window; needs a template approved by Meta. */
  template(to: string, name: string, language: string, params: string[]): Promise<void>;
  markRead(messageId: string): Promise<void>;
}

// Graph API limits for interactive messages; longer strings are rejected, so trim.
const LIMIT = { text: 4096, body: 1024, button: 20, rowTitle: 24, rowDesc: 72, listButton: 20, buttons: 3, rows: 10 };
const cut = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n - 1)}…`);

export function toGraphPayload(to: string, m: Outbound): Record<string, unknown> {
  const base = { messaging_product: 'whatsapp', recipient_type: 'individual', to };
  if (m.kind === 'text') return { ...base, type: 'text', text: { body: cut(m.text, LIMIT.text), preview_url: false } };
  if (m.kind === 'buttons') {
    return {
      ...base,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: cut(m.text, LIMIT.body) },
        action: {
          buttons: m.buttons
            .slice(0, LIMIT.buttons)
            .map((b) => ({ type: 'reply', reply: { id: b.id, title: cut(b.title, LIMIT.button) } })),
        },
      },
    };
  }
  return {
    ...base,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: cut(m.text, LIMIT.body) },
      action: {
        button: cut(m.button, LIMIT.listButton),
        sections: [
          {
            rows: m.rows.slice(0, LIMIT.rows).map((r) => ({
              id: r.id,
              title: cut(r.title, LIMIT.rowTitle),
              ...(r.description ? { description: cut(r.description, LIMIT.rowDesc) } : {}),
            })),
          },
        ],
      },
    },
  };
}

/** Template parameters may not contain newlines, tabs or runs of 4+ spaces. */
export const templateSafe = (s: string) => cut(s.replace(/\s+/g, ' ').trim(), 1000);

export function graphSender(opts: { token: string; phoneNumberId: string; version: string }): Sender {
  const url = `https://graph.facebook.com/${opts.version}/${opts.phoneNumberId}/messages`;
  async function post(body: Record<string, unknown>) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${opts.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: { code?: number; message?: string } };
      throw new Error(`graph ${res.status} ${err.error?.code ?? ''} ${err.error?.message ?? ''}`.trim());
    }
  }
  return {
    send: (to, m) => post(toGraphPayload(to, m)),
    template: (to, name, language, params) =>
      post({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name,
          language: { code: language },
          components: params.length
            ? [{ type: 'body', parameters: params.map((text) => ({ type: 'text', text: templateSafe(text) })) }]
            : [],
        },
      }),
    markRead: (id) => post({ messaging_product: 'whatsapp', status: 'read', message_id: id }),
  };
}

/** Meta signs the raw body: X-Hub-Signature-256: sha256=<hex HMAC with the app secret>. */
export function verifySignature(rawBody: string, header: string | null, appSecret: string): boolean {
  if (!header?.startsWith('sha256=')) return false;
  const expected = createHmac('sha256', appSecret).update(rawBody, 'utf8').digest();
  const given = Buffer.from(header.slice(7), 'hex');
  return given.length === expected.length && timingSafeEqual(given, expected);
}

interface WebhookMessage {
  id: string;
  from: string;
  type: string;
  text?: { body: string };
  interactive?: { button_reply?: { id: string }; list_reply?: { id: string } };
  button?: { payload?: string; text?: string };
  location?: { latitude: number; longitude: number; name?: string; address?: string };
}

/** Extracts messages from a webhook payload; delivery/read statuses are ignored. */
export function parseWebhook(payload: unknown): Inbound[] {
  const out: Inbound[] = [];
  const entries = (payload as { entry?: unknown[] })?.entry;
  if (!Array.isArray(entries)) return out;
  for (const entry of entries as { changes?: { field?: string; value?: Record<string, unknown> }[] }[]) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'messages' || !change.value) continue;
      const contacts = (change.value.contacts ?? []) as { wa_id: string; profile?: { name?: string } }[];
      for (const m of (change.value.messages ?? []) as WebhookMessage[]) {
        const profileName = contacts.find((c) => c.wa_id === m.from)?.profile?.name;
        const base = { id: m.id, from: m.from, profileName };
        const tapped = m.interactive?.button_reply?.id ?? m.interactive?.list_reply?.id ?? m.button?.payload;
        if (m.type === 'text' && m.text) out.push({ ...base, type: 'text', text: m.text.body });
        else if (tapped) out.push({ ...base, type: 'choice', choice: tapped });
        else if (m.type === 'button' && m.button?.text) out.push({ ...base, type: 'text', text: m.button.text });
        else if (m.type === 'location' && m.location) out.push({ ...base, type: 'location', location: m.location });
        else out.push({ ...base, type: 'other', rawType: m.type });
      }
    }
  }
  return out;
}
