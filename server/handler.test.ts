import { expect, test } from 'vitest';
import { createHmac } from 'node:crypto';
import { createApp } from './app';
import { MemoryStore } from './store';
import { parseWebhook, toGraphPayload, type Outbound, type Sender } from './whatsapp';

const SECRET = 'test-app-secret';
const ENV = {
  WHATSAPP_TOKEN: 'test-token',
  WHATSAPP_PHONE_NUMBER_ID: '123',
  WHATSAPP_APP_SECRET: SECRET,
  WHATSAPP_VERIFY_TOKEN: 'verify-me',
  WHATSAPP_OWNER_NUMBER: '+91 98111 11111',
  UPSTASH_REDIS_REST_URL: 'https://redis.test',
  UPSTASH_REDIS_REST_TOKEN: 'x',
};
const URL_ = 'https://example.test/api/whatsapp';

function app(env: Record<string, string | undefined> = ENV) {
  const sent: { to: string; m: Outbound }[] = [];
  const read: string[] = [];
  const sender: Sender = {
    async send(to, m) {
      sent.push({ to, m });
    },
    async template() {},
    async markRead(id) {
      read.push(id);
    },
  };
  return { ...createApp(env, { store: new MemoryStore(), sender }), sent, read };
}

const message = (id: string, body: string) => ({
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'waba',
      changes: [
        {
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: { phone_number_id: '123' },
            contacts: [{ wa_id: '919800000001', profile: { name: 'Asha' } }],
            messages: [{ id, from: '919800000001', timestamp: '1760000000', type: 'text', text: { body } }],
          },
        },
      ],
    },
  ],
});

function post(payload: unknown, secret = SECRET) {
  const raw = JSON.stringify(payload);
  const sig = `sha256=${createHmac('sha256', secret).update(raw).digest('hex')}`;
  return new Request(URL_, { method: 'POST', body: raw, headers: { 'content-type': 'application/json', 'x-hub-signature-256': sig } });
}

test('GET echoes the challenge only for the right verify token', async () => {
  const { handle } = app();
  const ok = await handle(new Request(`${URL_}?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=42`));
  expect(ok.status).toBe(200);
  expect(await ok.text()).toBe('42');
  const bad = await handle(new Request(`${URL_}?hub.mode=subscribe&hub.verify_token=nope&hub.challenge=42`));
  expect(bad.status).toBe(403);
});

test('POST rejects a missing or wrong signature', async () => {
  const { handle, sent } = app();
  const unsigned = await handle(new Request(URL_, { method: 'POST', body: JSON.stringify(message('a', 'hi')) }));
  expect(unsigned.status).toBe(401);
  expect((await handle(post(message('a', 'hi'), 'wrong-secret'))).status).toBe(401);
  expect(sent.length).toBe(0);
});

test('a signed message is answered once, even when Meta retries it', async () => {
  const { handle, sent, read } = app();
  expect((await handle(post(message('wamid.1', 'hi')))).status).toBe(200);
  expect((await handle(post(message('wamid.1', 'hi')))).status).toBe(200);
  expect(sent.length).toBe(1);
  expect(sent[0]?.to).toBe('919800000001');
  expect(sent[0]?.m.kind).toBe('list');
  expect(read).toEqual(['wamid.1']);
});

test('status-only notifications and junk are acknowledged without replies', async () => {
  const { handle, sent } = app();
  const statuses = { entry: [{ changes: [{ field: 'messages', value: { statuses: [{ id: 'x', status: 'read' }] } }] }] };
  expect((await handle(post(statuses))).status).toBe(200);
  const raw = 'not json';
  const sig = `sha256=${createHmac('sha256', SECRET).update(raw).digest('hex')}`;
  expect((await handle(new Request(URL_, { method: 'POST', body: raw, headers: { 'x-hub-signature-256': sig } }))).status).toBe(400);
  expect(sent.length).toBe(0);
});

test('a deployment without secrets refuses to process messages', async () => {
  const { handle, sent } = app({ WHATSAPP_VERIFY_TOKEN: 'verify-me' });
  expect((await handle(post(message('a', 'hi')))).status).toBe(503);
  expect(sent.length).toBe(0);
});

test('dry run accepts unsigned posts for local testing', async () => {
  const { handle, sent } = app({ WHATSAPP_DRY_RUN: '1' });
  const res = await handle(new Request(URL_, { method: 'POST', body: JSON.stringify(message('d1', 'hi')) }));
  expect(res.status).toBe(200);
  expect(sent.length).toBe(1);
});

test('webhook parsing covers taps, template buttons, locations and media', () => {
  const value = {
    contacts: [{ wa_id: '1', profile: { name: 'A' } }],
    messages: [
      { id: 'a', from: '1', type: 'interactive', interactive: { type: 'button_reply', button_reply: { id: 'menu:order', title: 'Order' } } },
      { id: 'b', from: '1', type: 'interactive', interactive: { type: 'list_reply', list_reply: { id: 'product:x', title: 'X' } } },
      { id: 'c', from: '1', type: 'button', button: { payload: 'menu', text: 'Menu' } },
      { id: 'd', from: '1', type: 'location', location: { latitude: 1, longitude: 2 } },
      { id: 'e', from: '1', type: 'image', image: { id: 'img' } },
    ],
  };
  const parsed = parseWebhook({ entry: [{ changes: [{ field: 'messages', value }] }] });
  expect(parsed.map((p) => [p.type, p.choice ?? p.rawType ?? p.location?.latitude, p.profileName])).toEqual([
    ['choice', 'menu:order', 'A'],
    ['choice', 'product:x', 'A'],
    ['choice', 'menu', 'A'],
    ['location', 1, 'A'],
    ['other', 'image', 'A'],
  ]);
});

test("Graph payloads respect WhatsApp's interactive limits", () => {
  const p = toGraphPayload('1', {
    kind: 'list',
    text: 'x',
    button: 'A very long list button label',
    rows: Array.from({ length: 12 }, (_, i) => ({ id: `r${i}`, title: 'A row title that is far too long', description: 'd'.repeat(100) })),
  }) as { interactive: { action: { button: string; sections: { rows: { title: string; description: string }[] }[] } } };
  const { button, sections } = p.interactive.action;
  expect(button.length <= 20).toBeTruthy();
  expect(sections[0]?.rows.length).toBe(10);
  expect(sections[0]?.rows.every((r) => r.title.length <= 24 && r.description.length <= 72)).toBeTruthy();

  const b = toGraphPayload('1', { kind: 'buttons', text: 'x', buttons: [1, 2, 3, 4].map((i) => ({ id: `b${i}`, title: 'Twenty one characters' })) }) as {
    interactive: { action: { buttons: { reply: { title: string } }[] } };
  };
  expect(b.interactive.action.buttons.length).toBe(3);
  expect(b.interactive.action.buttons.every((x) => x.reply.title.length <= 20)).toBeTruthy();
});
