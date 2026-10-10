import { describe, expect, it } from 'vitest';
import { business } from '../src/config/business';
import { products } from '../src/data/products';
import { buildEnquiryMessage, buildOrderMessage, summarizeBag } from '../src/lib/order';
import { Bot, CATEGORIES, MAX_QUANTITY, type Order } from './bot';
import { MemoryStore } from './store';
import type { Inbound, Outbound, Sender } from './whatsapp';

const CUSTOMER = '919800000001';
const OWNER = '919811111111';

function setup(opts: {
  template?: boolean;
  customerTemplate?: boolean;
  /** Simulates Meta refusing free-form messages to the customer (closed 24 h window). */
  refuseFreeForm?: () => boolean;
  pricesConfirmed?: boolean;
  facts?: Partial<typeof business>;
  now?: () => number;
} = {}) {
  const sent: { to: string; m: Outbound }[] = [];
  const templates: { to: string; name: string; params: string[] }[] = [];
  const sender: Sender = {
    async send(to, m) {
      if (to !== OWNER && opts.refuseFreeForm?.()) throw new Error('graph 400 131047 Re-engagement message');
      sent.push({ to, m });
    },
    async template(to, name, _language, params) {
      templates.push({ to, name, params });
    },
    async markRead() {},
  };
  const now = opts.now ?? (() => Date.UTC(2026, 9, 10, 6));
  const store = new MemoryStore(now);
  const bot = new Bot({
    store,
    sender,
    ownerNumber: OWNER,
    ownerTemplate: opts.template ? { name: 'order_alert', language: 'en' } : undefined,
    customerTemplate: opts.customerTemplate ? { name: 'order_update', language: 'en' } : undefined,
    now,
    log: () => {},
    business: { ...business, pricesConfirmed: opts.pricesConfirmed ?? false, ...opts.facts },
  });
  let seq = 0;
  const say = (text: string, from = CUSTOMER) => bot.receive({ id: `m${++seq}`, from, type: 'text', text });
  const tap = (choice: string, from = CUSTOMER) => bot.receive({ id: `m${++seq}`, from, type: 'choice', choice });
  const send = (m: Omit<Inbound, 'id'>) => bot.receive({ ...m, id: `m${++seq}` });
  const toCustomer = () => sent.filter((s) => s.to === CUSTOMER).map((s) => s.m);
  const toOwner = () => sent.filter((s) => s.to === OWNER).map((s) => s.m.text);
  const last = (back = 1) => toCustomer().at(-back) as Outbound;
  return { store, sent, templates, say, tap, send, toCustomer, toOwner, last };
}

const ids = (m: Outbound) => (m.kind === 'buttons' ? m.buttons.map((b) => b.id) : m.kind === 'list' ? m.rows.map((r) => r.id) : []);
const product = (id: string) => products.find((p) => p.id === id)!;

describe('catalogue fits WhatsApp', () => {
  it('every product has a browsing category and no category exceeds a 10-row list', () => {
    expect(CATEGORIES.length).toBeLessThanOrEqual(10);
    for (const p of products) expect(CATEGORIES.map((c) => c.id)).toContain(p.category);
    for (const c of CATEGORIES) expect(products.filter((p) => p.category === c.id).length).toBeLessThanOrEqual(10);
  });
});

describe('ordering', () => {
  it('greets with a menu that offers ordering, answers and a person', async () => {
    const t = setup();
    await t.say('Namaskar');
    expect(t.last().text).toContain('automated assistant');
    expect(ids(t.last())).toEqual(['menu:order', 'menu:products', 'menu:fulfilment', 'menu:visit', 'menu:human']);
  });

  it('takes an order by taps: category, product, quantity, pickup, date, name, confirm', async () => {
    const t = setup();
    await t.tap('menu:order');
    expect(ids(t.last())).toEqual(CATEGORIES.map((c) => `cat:${c.id}`));
    await t.tap('cat:chakli');
    expect(ids(t.last())).toEqual(['product:bhajani-chakli', 'product:kadboli']);
    await t.tap('product:bhajani-chakli');
    expect(t.last().text).toContain('Bhajani Chakli (500 g)');
    await t.say('0');
    expect(t.last().text).toContain(`1 to ${MAX_QUANTITY}`);
    await t.say('2');
    await t.tap('more:add');
    await t.tap('cat:modak');
    await t.tap('product:ukadiche-modak');
    await t.say('11');
    await t.tap('more:done');
    expect(ids(t.last())).toEqual(['ful:pickup', 'ful:delivery']);
    await t.tap('ful:pickup');
    await t.say('Sunday 10 am');
    await t.say('Asha');
    expect(ids(t.last())).toEqual(['confirm:yes', 'confirm:restart', 'confirm:cancel']);
    expect(t.last().text).toContain('Bhajani Chakli (500 g) x 2\nUkadiche Modak (piece) x 11');

    await t.tap('confirm:yes');
    const id = /request (\w{4}-1)/.exec(t.last().text)?.[1];
    expect(id).toBeTruthy();
    const order = await t.store.get<Order>(`order:${id}`);
    expect(order?.items.map((i) => [i.productId, i.variantId, i.qty])).toEqual([['bhajani-chakli', '500-g', 2], ['ukadiche-modak', 'piece', 11]]);
    expect(order?.customer).toBe(CUSTOMER);
    expect(t.toOwner().at(-1)).toContain(`New order ${id}`);

    // Tapping Confirm on the old message again must not place a second order.
    await t.tap('confirm:yes');
    expect(t.last(2).text).toContain('no order waiting');
  });

  it('asks which pack when a product has several', async () => {
    const t = setup();
    const multi = { ...product('besan-laddu'), variants: [product('besan-laddu').variants[0], { ...product('besan-laddu').variants[0], id: '1-kg', label: '1 kg' }] } as const;
    const bot = new Bot({ store: t.store, sender: { send: async (to, m) => void t.sent.push({ to, m }), template: async () => {}, markRead: async () => {} }, products: [multi], log: () => {} });
    await bot.receive({ id: 'a', from: CUSTOMER, type: 'choice', choice: 'product:besan-laddu' });
    expect(ids(t.last())).toEqual(['item:besan-laddu:500-g', 'item:besan-laddu:1-kg']);
    await bot.receive({ id: 'b', from: CUSTOMER, type: 'choice', choice: 'item:besan-laddu:1-kg' });
    expect(t.last().text).toContain('Besan Laddu (1 kg)');
  });

  it('delivery asks for an address and accepts a shared location', async () => {
    const t = setup();
    await t.say('I want shev');
    expect(t.last().text).toContain('How many Shev (250 g)');
    await t.say('3');
    await t.tap('more:done');
    await t.say('delivery please');
    expect(t.last().text).toContain('delivery address');
    await t.send({ from: CUSTOMER, type: 'location', location: { latitude: 18.52, longitude: 73.85 } });
    await t.say('tomorrow');
    await t.say('Ravi');
    expect(t.last().text).toMatch(/Delivery to: .*maps\.google\.com\/\?q=18\.52,73\.85/);
  });

  it('takes over the order message the website cart sends', async () => {
    const t = setup();
    const lines = [
      { productId: 'bhajani-chakli', variantId: '500-g', quantity: 2 },
      { productId: 'ukadiche-modak', variantId: 'piece', quantity: 11 },
      { productId: 'chivda-mix', variantId: 'standard', quantity: 1 },
    ];
    await t.say(buildOrderMessage(summarizeBag(lines), { name: 'Meera', note: 'Needed by Friday' }));
    const [ack, next] = t.toCustomer();
    expect(ack?.text).toContain('Bhajani Chakli (500 g) x 2\nUkadiche Modak (piece) x 11\nChivda Mix x 1');
    expect(ack?.text).toContain('Note: Needed by Friday');
    expect(ids(next as Outbound)).toEqual(['ful:pickup', 'ful:delivery']);
    await t.tap('ful:pickup');
    await t.say('Friday 9 am');
    // The name came with the message, so the next step is the confirmation.
    expect(t.last().text).toContain('Name: Meera');
  });

  it('passes the website contact form message to a person', async () => {
    const t = setup();
    await t.say(buildEnquiryMessage('Ravi', '50 return gift packs for a pooja'));
    expect(t.last().text).toContain('passed it to our team');
    expect(t.toOwner().at(-1)).toContain('50 return gift packs for a pooja');
    await t.say('How many days notice do you need?');
    expect(t.toOwner().at(-1)).toContain('How many days notice');
  });

  it('cancel clears the order; repeated confusion points to a person', async () => {
    const t = setup();
    await t.tap('product:karanji');
    await t.say('4');
    await t.say('cancel');
    expect(t.last(2).text).toContain('cleared your order');
    await t.tap('menu:order');
    expect(ids(t.last())[0]).toBe('cat:laddu');
    await t.say('asdf');
    await t.say('qwerty');
    expect(t.last(2).text).toContain('Tap Talk to us');
  });
});

describe('facts', () => {
  it('never quotes sample prices while prices are unconfirmed', async () => {
    const t = setup();
    await t.say('price of besan laddu?');
    const info = t.last(2).text;
    expect(info).toContain('Besan Laddu');
    expect(info).toContain('500 g, price to be confirmed');
    expect(info).not.toContain('₹');
    await t.tap('cat:laddu');
    expect(JSON.stringify(t.last())).not.toContain('₹');
  });

  it('quotes confirmed prices and totals', async () => {
    const t = setup({ pricesConfirmed: true });
    await t.tap('cat:chakli');
    expect(JSON.stringify(t.last())).toContain('₹345 / 500 g');
    await t.tap('product:bhajani-chakli');
    await t.say('2');
    await t.tap('more:done');
    await t.tap('ful:pickup');
    await t.say('Sunday');
    await t.say('Asha');
    expect(t.last().text).toContain('Estimated total: ₹690');
  });

  it('routes unknown timings and delivery to a person, and quotes them once configured', async () => {
    const t = setup();
    await t.say('what are your timings?');
    expect(t.toCustomer()[0]?.text).toContain('not published here yet');
    await t.say('do you deliver?');
    expect(t.last(2).text).toContain('not published pickup and delivery details');

    const known = setup({ facts: { orderingHours: 'Test hours', deliveryInformation: 'Test delivery' } });
    await known.say('timings?');
    expect(known.toCustomer()[0]?.text).toContain('Order timings: Test hours');
    await known.say('delivery?');
    expect(known.last(2).text).toContain('Delivery: Test delivery');
  });
});

describe('people', () => {
  it('hands the chat to the owner and back without exposing the owner number', async () => {
    const t = setup();
    await t.say('can I speak to a person');
    expect(t.last().text).toContain('a person will reply here');
    const code = /reply (\w{4}) your message/.exec(t.toOwner().at(-1) ?? '')?.[1] ?? '';
    expect(code).toHaveLength(4);

    const before = t.toCustomer().length;
    await t.say('Do you make sugar-free laddus?');
    expect(t.toCustomer()).toHaveLength(before);
    expect(t.toOwner().at(-1)).toContain('Do you make sugar-free laddus?');

    await t.say(`reply ${code} Yes, on order.`, OWNER);
    expect(t.last().text).toBe('Yes, on order.');
    await t.say(`done ${code.toLowerCase()}`, OWNER);
    await t.say('thanks');
    expect(t.toCustomer().length).toBeGreaterThan(before + 1);

    for (const s of t.sent.filter((x) => x.to !== OWNER)) expect(JSON.stringify(s.m)).not.toContain(OWNER);
  });

  it('menu ends a handoff from the customer side', async () => {
    const t = setup();
    await t.tap('menu:human');
    await t.say('menu');
    expect(t.last().kind).toBe('list');
    const alerts = t.toOwner().length;
    await t.say('chakli price?');
    expect(t.toOwner()).toHaveLength(alerts);
  });

  it('uses the alert template only when the owner has not written for a day', async () => {
    let clock = Date.UTC(2026, 9, 10, 6);
    const t = setup({ template: true, now: () => clock });
    await t.tap('menu:human');
    expect(t.templates).toHaveLength(1);
    expect(t.templates[0]?.params[0]).not.toContain('\n');
    await t.say('help', OWNER);
    await t.say('one more question');
    expect(t.templates).toHaveLength(1);
    expect(t.toOwner().at(-1)).toContain('one more question');
    // A day later (the 12 h handoff has lapsed too) a new request needs the template again.
    clock += 25 * 3600_000;
    await t.tap('menu:human');
    expect(t.templates).toHaveLength(2);
  });

  it('owner commands report unknown references and show orders', async () => {
    const t = setup();
    await t.say('reply ZZZZ hello', OWNER);
    expect(t.toOwner().at(-1)).toContain('do not know the reference ZZZZ');
    await t.say('anything', OWNER);
    expect(t.toOwner().at(-1)).toContain('Commands');

    await t.say(buildOrderMessage(summarizeBag([{ productId: 'anarse', variantId: '500-g', quantity: 1 }]), { name: 'Om' }));
    await t.tap('ful:pickup');
    await t.say('Diwali morning');
    await t.say('yes');
    const id = /request (\w{4}-1)/.exec(t.last().text)?.[1] ?? '';
    await t.say(`show ${id.slice(0, 4)}`, OWNER);
    expect(t.toOwner().at(-1)).toMatch(new RegExp(`Order ${id}[\\s\\S]*Anarse \\(500 g\\) x 1[\\s\\S]*Needed: Diwali morning`));
  });

  it('media gets a polite fallback', async () => {
    const t = setup();
    await t.say('hi');
    await t.send({ from: CUSTOMER, type: 'other', rawType: 'image' });
    expect(t.last(2).text).toContain('only read typed messages');
  });
});

describe('regressions', () => {
  const handoffCode = (t: ReturnType<typeof setup>) => /reply (\w{4}) your message/.exec(t.toOwner().join('\n'))?.[1] ?? '';

  it('tells the owner when a reply cannot be delivered after the 24 h window, and does not pretend it was sent', async () => {
    let clock = Date.UTC(2026, 9, 10, 6);
    const t = setup({ now: () => clock });
    await t.tap('menu:human');
    const code = handoffCode(t);
    const before = t.toCustomer().length;
    clock += 30 * 3600_000;
    await t.say(`reply ${code} Sorry for the delay, yes we can.`, OWNER);
    expect(t.toCustomer()).toHaveLength(before);
    expect(t.toOwner().at(-1)).toMatch(new RegExp(`Not delivered to ${code}[\\s\\S]*more than 24 hours[\\s\\S]*call \\+${CUSTOMER}`));
    // Not handed to a person: the customer's next message still reaches the assistant.
    await t.say('hi');
    expect(t.last().text).toContain('automated assistant');
  });

  it('sends a late owner reply through the approved template when one is configured', async () => {
    let clock = Date.UTC(2026, 9, 10, 6);
    const t = setup({ customerTemplate: true, now: () => clock });
    await t.tap('menu:human');
    const code = handoffCode(t);
    clock += 30 * 3600_000;
    await t.say(`reply ${code} Your order is ready.\nPickup after 5 pm.`, OWNER);
    expect(t.templates.at(-1)).toMatchObject({ to: CUSTOMER, name: 'order_update' });
    expect(t.templates.at(-1)?.params[0]).toBe('Your order is ready. Pickup after 5 pm.');
    expect(t.toOwner().at(-1)).toContain('as a template message');
  });

  it('falls back to the template when Meta refuses a free-form reply, and reports a refusal without one', async () => {
    let refuse = false;
    const t = setup({ customerTemplate: true, refuseFreeForm: () => refuse });
    await t.tap('menu:human');
    const code = handoffCode(t);
    refuse = true;
    await t.say(`reply ${code} Hello`, OWNER);
    expect(t.templates.at(-1)?.params[0]).toBe('Hello');

    let refuseU = false;
    const u = setup({ refuseFreeForm: () => refuseU });
    await u.tap('menu:human');
    refuseU = true;
    await u.say(`reply ${handoffCode(u)} Hello`, OWNER);
    expect(u.toOwner().at(-1)).toMatch(/Not delivered[\s\S]*WhatsApp refused the message \(graph 400 131047/);
  });

  it('answers a question asked mid-order and asks the pending step again instead of storing it', async () => {
    const t = setup();
    await t.tap('product:karanji');
    await t.say('2');
    await t.tap('more:done');
    await t.tap('ful:pickup');
    expect(t.last().text).toContain('When do you need it?');
    await t.say('price of chakli?');
    expect(t.last(2).text).toContain('Bhajani Chakli');
    expect(t.last().text).toContain('When do you need it?');
    await t.say('what are your timings?');
    expect(t.last(2).text).toContain('not published here yet');
    expect(t.last().text).toContain('When do you need it?');
    // A question that is really an answer ("can you do Saturday?") is still taken as the date.
    await t.say('Can you do Saturday?');
    expect(t.last().text).toContain('What name');
    await t.say('Meera');
    expect(t.last().text).toContain('Needed: Can you do Saturday?');
    expect(t.last().text).not.toContain('chakli');
  });

  it('asking for a person mid-order hands over instead of becoming the delivery address', async () => {
    const t = setup();
    await t.tap('product:shev');
    await t.say('1');
    await t.tap('more:done');
    await t.tap('ful:delivery');
    await t.say('can I talk to someone?');
    expect(t.last().text).toContain('a person will reply here');
    expect(t.toOwner().at(-1)).toContain('would like to talk to a person');
  });

  it('product names win over "home"; questions about delivery still get delivery answers', async () => {
    const t = setup();
    await t.say('hi');
    await t.say('I want besan laddu delivered home');
    expect(t.last().text).toContain('How many Besan Laddu (500 g)');

    const u = setup();
    await u.say('hi');
    await u.say('Do you have homemade chakli?');
    expect(ids(u.last())).toEqual(['product:bhajani-chakli', 'product:kadboli']);

    const v = setup();
    await v.say('hi');
    await v.say('Do you deliver chakli to Kothrud?');
    expect(v.last(2).text).toContain('not published pickup and delivery details');
  });

  it('understands quantities in requests and replies', async () => {
    const t = setup();
    await t.say('hi');
    await t.say('I want 3 besan laddu');
    expect(t.last().text).toContain('Besan Laddu (500 g) x 3');
    await t.tap('more:add');
    await t.tap('product:karanji');
    await t.say('2 packs');
    expect(t.last().text).toContain('Karanji (500 g) x 2');
    await t.tap('more:add');
    await t.tap('product:anarse');
    await t.say('four');
    expect(t.last().text).toContain('Anarse (500 g) x 4');
    await t.tap('more:add');
    await t.tap('product:shankarpali');
    await t.say('२');
    expect(t.last().text).toContain('Shankarpali (500 g) x 2');

    // A weight is not a pack count: ask rather than guess.
    const u = setup();
    await u.say('hi');
    await u.say('I want 2 kg shev');
    expect(u.last().text).toContain('How many Shev (250 g)');
  });

  it('uses the name typed in the website contact form in the owner alert', async () => {
    const t = setup();
    await t.send({ from: CUSTOMER, profileName: 'WA Profile', type: 'text', text: buildEnquiryMessage('Ravi Joshi', 'Do you take bulk orders?') });
    expect(t.toOwner().at(-1)).toContain(`Ravi Joshi (+${CUSTOMER}) sent a message`);
  });

  it('processes concurrent messages from one customer one at a time (no lost cart items)', async () => {
    const store = new MemoryStore(() => Date.UTC(2026, 9, 10, 6));
    // Slow reads widen the read-change-write window the way network round trips to Redis do.
    const get = store.get.bind(store);
    store.get = async <T,>(key: string) => {
      const value = await get<T>(key);
      await new Promise((resolve) => setTimeout(resolve, 15));
      return value;
    };
    const sender: Sender = { async send() {}, async template() {}, async markRead() {} };
    const bot = new Bot({ store, sender, ownerNumber: OWNER, log: () => {}, business: { ...business, pricesConfirmed: false } });
    await bot.receive({ id: 'a', from: CUSTOMER, type: 'text', text: 'hi' });
    await Promise.all([
      bot.receive({ id: 'b', from: CUSTOMER, type: 'text', text: 'I want 3 besan laddu' }),
      bot.receive({ id: 'c', from: CUSTOMER, type: 'text', text: 'I want 2 karanji' }),
    ]);
    const session = await get<{ cart: Record<string, number> }>(`session:${CUSTOMER}`);
    expect(session?.cart).toEqual({ 'besan-laddu:500-g': 3, 'karanji:500-g': 2 });
    expect(await get(`lock:${CUSTOMER}`)).toBeNull();
  });
});
