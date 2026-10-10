// The WhatsApp assistant on Gharguti Farsan's dedicated business number.
// Customers order and get answers here; the owner's own number is a server
// secret that only receives alerts and sends commands, so customers never see it.
//
// Facts come only from src/data/products.ts and src/config/business.ts, the
// same sources as the website. Anything null is passed to the team rather than
// answered, and sample prices are never quoted (business.pricesConfirmed).

import { business as siteBusiness, type BusinessConfig } from '../src/config/business.ts';
import { formatPrice, products as siteProducts } from '../src/data/products.ts';
import type { Product, ProductCategory, ProductVariant } from '../src/types/product.ts';
import type { Store } from './store.ts';
import type { Choice, Inbound, Outbound, Sender } from './whatsapp.ts';

export const MAX_QUANTITY = 99;

/** Browsing order and labels for the category lists (WhatsApp lists hold at most 10 rows). */
export const CATEGORIES: readonly { id: ProductCategory; label: string }[] = [
  { id: 'laddu', label: 'Laddus' },
  { id: 'modak', label: 'Modak' },
  { id: 'chakli', label: 'Chakli' },
  { id: 'chivda', label: 'Chivda' },
  { id: 'sweet-snack', label: 'Sweet snacks' },
  { id: 'savoury-snack', label: 'Savoury snacks' },
  { id: 'festive-special', label: 'Festive specials' },
];

type Step = 'idle' | 'qty' | 'more' | 'fulfilment' | 'address' | 'date' | 'name' | 'confirm';

export interface Session {
  step: Step;
  /** "productId:variantId" -> quantity. */
  cart: Record<string, number>;
  /** Item whose quantity is being asked for. */
  pending?: string;
  fulfilment?: 'pickup' | 'delivery';
  address?: string;
  date?: string;
  name?: string;
  note?: string;
  profileName?: string;
  /** Short reference the owner uses in commands ("reply K7Q2 ..."). */
  code?: string;
  orders: number;
  misses: number;
  /** While set and in the future, a person is handling the chat and the assistant stays quiet. */
  humanUntil?: number;
  /** When the customer last wrote: free-form replies are only allowed within 24 h of it. */
  lastSeenAt?: number;
}

export interface OrderLine {
  productId: string;
  variantId: string;
  name: string;
  pack: string | null;
  qty: number;
}

export interface Order {
  id: string;
  customer: string;
  name: string;
  items: OrderLine[];
  fulfilment: 'pickup' | 'delivery';
  address?: string;
  date: string;
  note?: string;
  createdAt: string;
}

export interface BotDeps {
  store: Store;
  sender: Sender;
  ownerNumber?: string;
  ownerTemplate?: { name: string; language: string };
  /** Approved template for owner replies after the customer's 24 h window has closed. */
  customerTemplate?: { name: string; language: string };
  now?: () => number;
  log?: (...args: unknown[]) => void;
  products?: readonly Product[];
  business?: BusinessConfig;
}

const DAY = 86_400;
const TTL = { session: 7 * DAY, ref: 90 * DAY, order: 90 * DAY, ownerSeen: 2 * DAY };
const HANDOFF_MS = 12 * 3600_000;
/** Free-form messages reach a person only inside 24 h of their last message to the number (with an hour's margin). */
const OWNER_WINDOW_MS = 23 * 3600_000;
const CUSTOMER_WINDOW_MS = OWNER_WINDOW_MS;
/** Per-customer lock: Vercel runs webhook calls in parallel, and two taps must not overwrite each other's state. */
const LOCK = { ttlSeconds: 20, attempts: 80, waitMs: 100 };
/** Steps of an order in progress; a question asked during one is answered and the step is asked again. */
const ORDER_STEPS: ReadonlySet<Step> = new Set(['qty', 'more', 'fulfilment', 'address', 'date', 'name', 'confirm']);
/** A message that reads as a question rather than an answer to the step being asked. */
const QUESTION_START = /^(what|when|where|which|how|do|does|did|can|could|is|are|will|kya|price|rate|cost|talk to|speak to|call me|i want to talk|menu card)\b/;
const NUMBER_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, dozen: 12 };
const UNIT_WORDS = /\b(kg|kgs|kilo|kilos|g|gm|gms|gram|grams|ml|litre|liter)\b/;
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const MENU_WORDS = new Set(['menu', 'start', 'hi', 'hii', 'hello', 'hey', 'namaskar', 'namaste', 'नमस्कार', 'नमस्ते']);
const CANCEL_WORDS = new Set(['cancel', 'stop', 'reset']);

// Devanagari digits read as ASCII so "२" works like "2".
const norm = (s: string) => s.trim().toLowerCase().replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x966)).replace(/[.!?]+$/, '');
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const button = (id: string, title: string): Choice => ({ id, title });
const fresh = (): Session => ({ step: 'idle', cart: {}, orders: 0, misses: 0 });

export class Bot {
  private store: Store;
  private sender: Sender;
  private ownerNumber?: string;
  private ownerTemplate?: { name: string; language: string };
  private customerTemplate?: { name: string; language: string };
  private now: () => number;
  private log: (...args: unknown[]) => void;
  private products: readonly Product[];
  private business: BusinessConfig;

  constructor(deps: BotDeps) {
    this.store = deps.store;
    this.sender = deps.sender;
    this.ownerNumber = deps.ownerNumber;
    this.ownerTemplate = deps.ownerTemplate;
    this.customerTemplate = deps.customerTemplate;
    this.now = deps.now ?? Date.now;
    this.log = deps.log ?? console.error;
    this.products = deps.products ?? siteProducts;
    this.business = deps.business ?? siteBusiness;
  }

  async receive(m: Inbound): Promise<void> {
    if (this.ownerNumber && m.from === this.ownerNumber) return this.owner(m);
    return this.withLock(m.from, () => this.customer(m));
  }

  /**
   * Serialises work on one customer's session across concurrent webhook calls (read, change, write).
   * If the lock cannot be taken in time (a crashed holder), the work runs anyway rather than be dropped.
   */
  private async withLock<T>(customer: string, work: () => Promise<T>): Promise<T> {
    const key = `lock:${customer}`;
    let held = false;
    for (let attempt = 0; attempt < LOCK.attempts && !held; attempt++) {
      held = await this.store.setIfAbsent(key, 1, LOCK.ttlSeconds);
      if (!held) await sleep(LOCK.waitMs);
    }
    if (!held) this.log(`${key} still held after waiting; continuing without it`);
    try {
      return await work();
    } finally {
      if (held) await this.store.del(key).catch((err) => this.log('unlock failed', err));
    }
  }

  // ---------------------------------------------------------------- customer

  private async customer(m: Inbound): Promise<void> {
    const key = `session:${m.from}`;
    const saved = await this.store.get<Session>(key);
    const s = saved ?? fresh();
    if (m.profileName) s.profileName = m.profileName;
    s.lastSeenAt = this.now();
    const out: Outbound[] = [];
    const reply = (msg: Outbound) => void out.push(msg);

    const handing = s.humanUntil !== undefined && s.humanUntil > this.now();
    const wantsMenu = m.choice === 'menu' || (m.type === 'text' && MENU_WORDS.has(norm(m.text ?? '')));
    if (handing && !wantsMenu) {
      await this.forward(s, m);
    } else {
      if (handing) delete s.humanUntil;
      await this.route(s, m, reply, !saved);
    }

    await this.store.set(key, s, TTL.session);
    for (const msg of out) await this.sender.send(m.from, msg);
  }

  private async route(s: Session, m: Inbound, reply: (o: Outbound) => void, firstContact: boolean): Promise<void> {
    if (m.type === 'choice' && m.choice) return this.choose(s, m, m.choice, reply);

    if (m.type === 'location' && m.location) {
      if (s.step === 'address') {
        const l = m.location;
        s.address = [l.name, l.address].filter(Boolean).join(', ') || `Shared location ${l.latitude}, ${l.longitude}`;
        s.address += ` (map: https://maps.google.com/?q=${l.latitude},${l.longitude})`;
        return this.advance(s, reply);
      }
      reply(this.menu(false));
      return;
    }

    if (m.type !== 'text' || m.text === undefined) {
      reply({ kind: 'text', text: 'Sorry, I can only read typed messages and button taps. To send photos or voice notes, tap Talk to us first.' });
      reply(s.step === 'idle' ? this.menu(false) : this.prompt(s));
      return;
    }

    const text = m.text.trim();
    const w = norm(text);

    if (CANCEL_WORDS.has(w)) {
      this.clearOrder(s);
      reply({ kind: 'text', text: 'Okay, I have cleared your order.' });
      reply(this.menu(false));
      return;
    }
    if (MENU_WORDS.has(w)) {
      s.step = 'idle';
      s.misses = 0;
      reply(this.menu(true));
      return;
    }

    // The website's cart sends its order as text; take it over as the cart.
    const web = this.parseWebOrder(text);
    if (web) {
      this.clearOrder(s);
      Object.assign(s, web);
      reply({ kind: 'text', text: `Thank you! You would like:\n${this.itemLines(s).join('\n')}${s.note ? `\nNote: ${s.note}` : ''}` });
      return this.advance(s, reply);
    }

    // The website's contact form: a question for a person, not the assistant.
    if (text.toLowerCase().startsWith(`namaskar ${this.business.name.toLowerCase()},`)) {
      await this.handoff(s, m, reply, text);
      return;
    }

    if (await this.stepText(s, m, text, w, reply)) {
      s.misses = 0;
      return;
    }

    const intent = this.intent(w, this.isQuestion(text, w));
    if (intent) {
      const step = s.step;
      const resuming = ORDER_STEPS.has(step);
      await this.choose(s, m, intent, reply, { midOrder: resuming, quantity: this.quantityIn(w) });
      // Answered a question in the middle of an order: ask the pending step again.
      if (resuming && s.step === step && s.humanUntil === undefined) reply(this.prompt(s));
      return;
    }

    if (firstContact) {
      reply(this.menu(true));
      return;
    }
    s.misses += 1;
    reply({
      kind: 'text',
      text:
        s.misses >= 2
          ? 'Sorry, I am an automated assistant and did not understand that. Tap Talk to us in the menu and a person from our team will reply.'
          : 'Sorry, I did not understand that.',
    });
    reply(s.step === 'idle' || s.misses >= 2 ? this.menu(false) : this.prompt(s));
  }

  /** Free text that answers the question the assistant just asked. Returns true when consumed. */
  private async stepText(s: Session, m: Inbound, text: string, w: string, reply: (o: Outbound) => void): Promise<boolean> {
    // "price of chakli?" while being asked for a date is a question, not the date.
    if (this.isAside(text, w)) return false;
    switch (s.step) {
      case 'qty': {
        const n = this.parseQuantity(w);
        if (!(n >= 1 && n <= MAX_QUANTITY) || !s.pending) {
          reply({ kind: 'text', text: `Please reply with a number from 1 to ${MAX_QUANTITY}.` });
          return true;
        }
        s.cart[s.pending] = n;
        delete s.pending;
        s.step = 'more';
        reply(this.moreButtons(s));
        return true;
      }
      case 'address':
        if (text.length < 5) return false;
        s.address = text.slice(0, 300);
        this.advance(s, reply);
        return true;
      case 'date':
        s.date = text.slice(0, 100);
        this.advance(s, reply);
        return true;
      case 'name':
        s.name = text.slice(0, 60);
        this.advance(s, reply);
        return true;
      case 'more':
        if (/^(no|done|continue|next|that'?s all)$/.test(w)) await this.choose(s, m, 'more:done', reply);
        else if (/^(yes|add|more|add more)$/.test(w)) await this.choose(s, m, 'more:add', reply);
        else return false;
        return true;
      case 'fulfilment':
        if (/pick|collect/.test(w)) await this.choose(s, m, 'ful:pickup', reply);
        else if (/deliver|home/.test(w)) await this.choose(s, m, 'ful:delivery', reply);
        else return false;
        return true;
      case 'confirm':
        if (!/^(yes|confirm|ok|okay|done)$/.test(w)) return false;
        await this.choose(s, m, 'confirm:yes', reply);
        return true;
      default:
        return false;
    }
  }

  /**
   * Keyword intent. Product names win over delivery and timing words ("I want besan laddu
   * delivered home" orders laddus), except in questions ("do you deliver chakli to Kothrud?").
   */
  private intent(w: string, question = false): string | null {
    if (/\b(talk|speak)\b|\bperson\b|\bhuman\b|\bagent\b|\bowner\b|call me/.test(w)) return 'menu:human';
    const named = this.matchProduct(w);
    const category = named?.category ?? CATEGORIES.find((c) => w.includes(c.label.toLowerCase().replace(/s$/, '')) || w.includes(c.id))?.id;
    if (/price|\brates?\b|\bcost|kimat|किंमत|how much|\bproducts?\b|menu card|\blist\b|varieties|\bitems\b/.test(w)) {
      return category ? `browse:${category}` : 'menu:products';
    }
    // "home" is deliberately absent: "homemade" is in the brand name and in customers' messages.
    const delivery = /deliver|pick ?up|\bcollect|courier|parcel|home delivery/.test(w);
    const visit = /\b(hours?|open|opening|close|closing|timings?|time)\b|वेळ|\bwhere\b|address|location|\bmap\b|पत्ता/.test(w);
    if (question && delivery) return 'menu:fulfilment';
    if (question && visit) return 'menu:visit';
    // A product named in the text ("chakli", "besan laddu") goes straight to ordering it.
    if (named) return `product:${named.id}`;
    if (category) return `cat:${category}`;
    if (delivery) return 'menu:fulfilment';
    if (visit) return 'menu:visit';
    if (/order|book|buy|want|need|faral|फराळ|sweet|snack/.test(w)) return 'menu:order';
    return null;
  }

  private isQuestion(text: string, w: string): boolean {
    return text.includes('?') || QUESTION_START.test(w);
  }

  /** A question or a request for a person, asked while the assistant waits for an order detail. */
  private isAside(text: string, w: string): boolean {
    if (!this.isQuestion(text, w)) return false;
    const intent = this.intent(w, true);
    return intent !== null && (intent === 'menu:human' || intent === 'menu:products' || intent === 'menu:visit' || intent === 'menu:fulfilment' || intent.startsWith('browse:'));
  }

  /** "3", "3 packs", "x3", "three": the quantity the customer typed, or NaN. */
  private parseQuantity(w: string): number {
    const word = NUMBER_WORDS[w.replace(/\s+(packs?|pcs|pieces?|boxes?|nos?)$/, '')];
    if (word) return word;
    const digits = /^(?:x\s*)?(\d{1,4})\s*(?:x|packs?|pcs|pieces?|boxes?|nos?)?$/.exec(w)?.[1];
    return digits ? Number(digits) : NaN;
  }

  /** A single unit-free number in an order request ("I want 3 besan laddu"), used as the quantity. */
  private quantityIn(w: string): number | undefined {
    if (UNIT_WORDS.test(w)) return undefined;
    const numbers = (w.match(/\b\d{1,4}\b/g) ?? []).map(Number);
    const words = w.split(/\s+/).map((x) => NUMBER_WORDS[x]).filter((x): x is number => x !== undefined);
    const all = [...numbers, ...words];
    const [only] = all;
    return all.length === 1 && only !== undefined && only >= 1 && only <= MAX_QUANTITY ? only : undefined;
  }

  private matchProduct(w: string): Product | undefined {
    if (w.length < 3) return undefined;
    // Longest name first, so "dal chivda" wins over "chivda".
    return [...this.products]
      .sort((a, b) => b.name.en.length - a.name.en.length)
      .find((p) => w.includes(p.name.en.toLowerCase()) || w.includes(p.name.mr));
  }

  private async choose(
    s: Session,
    m: Inbound,
    id: string,
    reply: (o: Outbound) => void,
    opts: { midOrder?: boolean; quantity?: number } = {},
  ): Promise<void> {
    s.misses = 0;
    // Mid-order, answers skip the "Anything else?" buttons: the pending order question follows instead.
    const followUp = (o: Outbound) => {
      if (!opts.midOrder) reply(o);
    };
    const [kind = '', arg = '', arg2 = ''] = id.split(':');
    if (id === 'menu') {
      s.step = 'idle';
      reply(this.menu(false));
    } else if (id === 'menu:order') {
      if (Object.keys(s.cart).length) {
        s.step = 'more';
        reply(this.moreButtons(s));
      } else {
        reply(this.categoryList('cat', 'What would you like to order?'));
      }
    } else if (id === 'menu:products') {
      reply(this.categoryList('browse', 'Which products would you like to see?'));
    } else if (id === 'menu:fulfilment') {
      reply({ kind: 'text', text: this.fulfilmentInfo() });
      followUp({ kind: 'buttons', text: 'Anything else?', buttons: [button('menu:order', 'Order now'), button('menu:human', 'Talk to us'), button('menu', 'Main menu')] });
    } else if (id === 'menu:visit') {
      reply({ kind: 'text', text: this.visitInfo() });
      followUp({ kind: 'buttons', text: 'Anything else?', buttons: [button('menu:order', 'Order now'), button('menu:human', 'Talk to us'), button('menu', 'Main menu')] });
    } else if (id === 'menu:human') {
      await this.handoff(s, m, reply);
    } else if (kind === 'browse') {
      reply({ kind: 'text', text: this.categoryInfo(arg as ProductCategory) });
      followUp({
        kind: 'buttons',
        text: 'Would you like to order?',
        buttons: [button(`cat:${arg}`, 'Order from these'), button('menu:products', 'Other products'), button('menu', 'Main menu')],
      });
    } else if (kind === 'cat') {
      reply(this.productList(arg as ProductCategory));
    } else if (kind === 'product') {
      const p = this.product(arg);
      if (!p) return reply(this.categoryList('cat', 'What would you like to order?'));
      if (p.variants.length > 1) {
        reply({
          kind: 'list',
          text: `Which pack of ${p.name.en}?`,
          button: 'Choose pack',
          rows: p.variants.map((v) => ({ id: `item:${p.id}:${v.id}`, title: v.label ?? 'Standard', description: this.priceText(v) })),
        });
      } else if (opts.quantity) {
        // "I want 3 besan laddu": the quantity came with the request.
        s.cart[`${p.id}:${p.variants[0].id}`] = opts.quantity;
        delete s.pending;
        s.step = 'more';
        reply(this.moreButtons(s));
      } else {
        this.askQuantity(s, p, p.variants[0], reply);
      }
    } else if (kind === 'item') {
      const p = this.product(arg);
      const v = p?.variants.find((x) => x.id === arg2);
      if (!p || !v) return reply(this.categoryList('cat', 'What would you like to order?'));
      this.askQuantity(s, p, v, reply);
    } else if (id === 'more:add') {
      reply(this.categoryList('cat', 'What else would you like?'));
    } else if (id === 'more:done') {
      this.advance(s, reply);
    } else if (id === 'ful:pickup' || id === 'ful:delivery') {
      s.fulfilment = id === 'ful:pickup' ? 'pickup' : 'delivery';
      if (s.fulfilment === 'pickup') delete s.address;
      this.advance(s, reply);
    } else if (id === 'confirm:yes') {
      if (s.step !== 'confirm') {
        reply({ kind: 'text', text: 'There is no order waiting for confirmation.' });
        reply(this.menu(false));
      } else {
        await this.placeOrder(s, m, reply);
      }
    } else if (id === 'confirm:restart') {
      this.clearOrder(s);
      reply(this.categoryList('cat', 'Okay, let us start again. What would you like to order?'));
    } else if (id === 'confirm:cancel') {
      this.clearOrder(s);
      reply({ kind: 'text', text: 'Okay, I have cancelled this order.' });
      reply(this.menu(false));
    } else {
      reply(this.menu(false));
    }
  }

  private askQuantity(s: Session, p: Product, v: ProductVariant, reply: (o: Outbound) => void): void {
    s.pending = `${p.id}:${v.id}`;
    s.step = 'qty';
    const pack = v.label ? ` (${v.label})` : '';
    reply({ kind: 'text', text: `How many ${p.name.en}${pack} would you like? Reply with a number from 1 to ${MAX_QUANTITY}.` });
  }

  /** Asks for whatever the order still needs, ending at the confirmation. */
  private advance(s: Session, reply: (o: Outbound) => void): void {
    if (!Object.keys(s.cart).length) {
      s.step = 'idle';
      reply(this.categoryList('cat', 'What would you like to order?'));
      return;
    }
    if (!s.fulfilment) s.step = 'fulfilment';
    else if (s.fulfilment === 'delivery' && !s.address) s.step = 'address';
    else if (!s.date) s.step = 'date';
    else if (!s.name) s.step = 'name';
    else s.step = 'confirm';
    reply(this.prompt(s));
  }

  /** The question for the current step (also used to re-ask). */
  private prompt(s: Session): Outbound {
    const b = this.business;
    switch (s.step) {
      case 'qty':
        return { kind: 'text', text: `How many would you like? Reply with a number from 1 to ${MAX_QUANTITY}.` };
      case 'more':
        return this.moreButtons(s);
      case 'fulfilment':
        return {
          kind: 'buttons',
          text: `Pickup or delivery?${b.deliveryInformation ? '' : '\nDelivery depends on your area; our team will confirm it.'}`,
          buttons: [button('ful:pickup', 'Pickup'), button('ful:delivery', 'Delivery')],
        };
      case 'address':
        return { kind: 'text', text: 'Please type the delivery address, or share your location with the attach button.' };
      case 'date':
        return { kind: 'text', text: 'When do you need it? Please write the date and time, for example 15 Oct, 11 am.' };
      case 'name':
        return { kind: 'text', text: 'What name should we put the order under?' };
      case 'confirm':
        return {
          kind: 'buttons',
          text: `Please check your order:\n${this.summary(s).join('\n')}`,
          buttons: [button('confirm:yes', 'Confirm order'), button('confirm:restart', 'Start over'), button('confirm:cancel', 'Cancel')],
        };
      default:
        return this.menu(false);
    }
  }

  private async placeOrder(s: Session, m: Inbound, reply: (o: Outbound) => void): Promise<void> {
    const code = await this.ensureCode(s, m.from);
    s.orders += 1;
    const order: Order = {
      id: `${code}-${s.orders}`,
      customer: m.from,
      name: s.name ?? s.profileName ?? 'Customer',
      items: this.lines(s).map(({ product, variant, qty }) => ({
        productId: product.id, variantId: variant.id, name: product.name.en, pack: variant.label, qty,
      })),
      fulfilment: s.fulfilment ?? 'pickup',
      address: s.address,
      date: s.date ?? '',
      note: s.note,
      createdAt: new Date(this.now()).toISOString(),
    };
    await this.store.set(`order:${order.id}`, order, TTL.order);

    reply({
      kind: 'text',
      text:
        `Thank you, ${order.name}. Your order request ${order.id} has been sent to our team.\n` +
        `It is not confirmed yet: we will reply here to confirm ${this.allPriced(s) ? 'availability' : 'availability and the price'}.\n\n` +
        'Type menu any time to see the options again.',
    });
    this.clearOrder(s);

    const lines = this.orderLines(order);
    await this.notifyOwner(
      [`New order ${order.id}`, `${order.name} (+${order.customer})`, ...lines, `Reply to the customer: reply ${code} your message`].join('\n'),
      `${order.id}: ${order.name}, ${lines.join(', ')}`,
    );
  }

  private async handoff(s: Session, m: Inbound, reply: (o: Outbound) => void, firstMessage?: string): Promise<void> {
    const code = await this.ensureCode(s, m.from);
    // The website contact form ends with "Name: ..."; prefer it to the WhatsApp profile name.
    const formName = firstMessage ? /^\s*Name:\s*(\S.*)$/im.exec(firstMessage)?.[1]?.trim() : undefined;
    if (formName) s.name = formName.slice(0, 60);
    s.humanUntil = this.now() + HANDOFF_MS;
    s.step = 'idle';
    reply({
      kind: 'text',
      text: firstMessage
        ? 'Thank you for your message. I have passed it to our team and a person will reply here. Type menu to see what I can do in the meantime.'
        : 'Okay, I have let our team know and a person will reply here. You can keep writing: your messages go straight to them. Type menu to come back to me.',
    });
    const who = this.label(s, m.from);
    const asked = firstMessage ? `${who} sent a message:\n${firstMessage}` : `${who} would like to talk to a person.`;
    await this.notifyOwner(
      `${asked}\nReply with: reply ${code} your message\nWhen finished: done ${code}`,
      `${code}: ${firstMessage ? `${who} sent a message: ${firstMessage}` : `${who} would like to talk to a person`}`,
    );
  }

  /** During a handoff, customer messages go to the owner instead of the assistant. */
  private async forward(s: Session, m: Inbound): Promise<void> {
    const code = await this.ensureCode(s, m.from);
    const content =
      m.type === 'text'
        ? (m.text ?? '')
        : m.type === 'location' && m.location
          ? `[location: https://maps.google.com/?q=${m.location.latitude},${m.location.longitude}]`
          : m.type === 'choice'
            ? `[tapped ${m.choice}]`
            : `[sent a ${m.rawType ?? 'message'}; media is not forwarded]`;
    await this.notifyOwner(`${code} ${this.label(s, m.from)}:\n${content}`, `${code} ${this.label(s, m.from)}: ${content}`);
  }

  // ------------------------------------------------------------------- owner

  private async owner(m: Inbound): Promise<void> {
    await this.store.set('owner:lastSeen', this.now(), TTL.ownerSeen);
    const say = (text: string) => this.sender.send(m.from, { kind: 'text', text });
    const text = m.type === 'text' ? (m.text ?? '').trim() : '';

    const replyCmd = /^reply\s+([a-z0-9]{4})\s+([\s\S]+)$/i.exec(text);
    if (replyCmd?.[1] && replyCmd[2]) {
      const code = replyCmd[1].toUpperCase();
      const customer = await this.store.get<string>(`ref:${code}`);
      if (!customer) return say(`I do not know the reference ${code}.`);
      const delivered = await this.replyToCustomer(customer, replyCmd[2].trim());
      if (!delivered.ok) {
        return say(
          `Not delivered to ${code}. ${delivered.reason}\n` +
            `To reach them now, call +${customer} (this shows your own number), or wait until they write to the business number again.`,
        );
      }
      // The customer's answer should reach the owner, not the assistant.
      await this.withLock(customer, async () => {
        const s = (await this.store.get<Session>(`session:${customer}`)) ?? fresh();
        s.humanUntil = this.now() + HANDOFF_MS;
        await this.store.set(`session:${customer}`, s, TTL.session);
      });
      const how = delivered.viaTemplate ? ' as a template message (their 24-hour window had closed)' : '';
      return say(`Sent to ${code}${how}. Their replies come to you until you send: done ${code}`);
    }

    const doneCmd = /^done\s+([a-z0-9]{4})$/i.exec(text);
    if (doneCmd?.[1]) {
      const code = doneCmd[1].toUpperCase();
      const customer = await this.store.get<string>(`ref:${code}`);
      if (!customer) return say(`I do not know the reference ${code}.`);
      await this.withLock(customer, async () => {
        const s = await this.store.get<Session>(`session:${customer}`);
        if (s) {
          delete s.humanUntil;
          await this.store.set(`session:${customer}`, s, TTL.session);
        }
      });
      return say(`The assistant is back on for ${code}.`);
    }

    const showCmd = /^show\s+([a-z0-9]{4})(?:-(\d+))?$/i.exec(text);
    if (showCmd?.[1]) {
      const code = showCmd[1].toUpperCase();
      let n = showCmd[2] ? Number(showCmd[2]) : 0;
      if (!n) {
        const customer = await this.store.get<string>(`ref:${code}`);
        n = customer ? ((await this.store.get<Session>(`session:${customer}`))?.orders ?? 0) : 0;
      }
      const order = n ? await this.store.get<Order>(`order:${code}-${n}`) : null;
      if (!order) return say(`No order found for ${code}${showCmd[2] ? `-${showCmd[2]}` : ''}.`);
      return say([`Order ${order.id} (${order.createdAt.slice(0, 16).replace('T', ' ')} UTC)`, `${order.name} (+${order.customer})`, ...this.orderLines(order)].join('\n'));
    }

    return say(
      [
        'Commands (send them from this number):',
        'reply CODE your message: answer a customer',
        'done CODE: hand the chat back to the assistant',
        'show CODE or show CODE-1: see an order',
      ].join('\n'),
    );
  }

  /**
   * WhatsApp accepts free-form messages only within 24 h of the customer's last message.
   * Outside it (or when Meta rejects the text), an approved template is the only way through.
   */
  private async replyToCustomer(customer: string, message: string): Promise<{ ok: true; viaTemplate: boolean } | { ok: false; reason: string }> {
    const s = await this.store.get<Session>(`session:${customer}`);
    const knownClosed = s?.lastSeenAt !== undefined && this.now() - s.lastSeenAt >= CUSTOMER_WINDOW_MS;
    let failure = '';
    if (!knownClosed) {
      try {
        await this.sender.send(customer, { kind: 'text', text: message });
        return { ok: true, viaTemplate: false };
      } catch (err) {
        failure = err instanceof Error ? err.message : String(err);
        this.log('reply to customer failed', err);
      }
    }
    const windowNote = knownClosed
      ? 'Their last message was more than 24 hours ago, so WhatsApp only allows an approved template.'
      : `WhatsApp refused the message${failure ? ` (${failure})` : ''}.`;
    if (!this.customerTemplate) return { ok: false, reason: `${windowNote} No customer reply template is set up (WHATSAPP_CUSTOMER_TEMPLATE).` };
    try {
      // Template parameters cannot carry line breaks.
      await this.sender.template(customer, this.customerTemplate.name, this.customerTemplate.language, [message.replace(/\s+/g, ' ').trim()]);
      return { ok: true, viaTemplate: true };
    } catch (err) {
      this.log('reply template failed', err);
      return { ok: false, reason: `${windowNote} The template was also refused (${err instanceof Error ? err.message : String(err)}).` };
    }
  }

  private async notifyOwner(text: string, oneLine: string): Promise<void> {
    if (!this.ownerNumber) {
      this.log('owner alert not sent: WHATSAPP_OWNER_NUMBER is not set');
      return;
    }
    try {
      const seen = await this.store.get<number>('owner:lastSeen');
      const windowOpen = seen !== null && this.now() - seen < OWNER_WINDOW_MS;
      if (!windowOpen && this.ownerTemplate) {
        await this.sender.template(this.ownerNumber, this.ownerTemplate.name, this.ownerTemplate.language, [oneLine]);
      } else {
        // Without a template this only arrives if the owner wrote to the number in the last 24 h.
        if (!windowOpen) this.log('owner window closed and no WHATSAPP_OWNER_TEMPLATE; alert may not be delivered');
        await this.sender.send(this.ownerNumber, { kind: 'text', text });
      }
    } catch (err) {
      this.log('owner alert failed', err);
    }
  }

  // ---------------------------------------------------------------- helpers

  private async ensureCode(s: Session, customer: string): Promise<string> {
    if (s.code) {
      await this.store.set(`ref:${s.code}`, customer, TTL.ref);
      return s.code;
    }
    for (;;) {
      let code = '';
      for (let i = 0; i < 4; i++) code += CODE_ALPHABET.charAt(Math.floor(Math.random() * CODE_ALPHABET.length));
      if (await this.store.setIfAbsent(`ref:${code}`, customer, TTL.ref)) return (s.code = code);
    }
  }

  private clearOrder(s: Session): void {
    s.cart = {};
    s.step = 'idle';
    for (const k of ['pending', 'fulfilment', 'address', 'date', 'name', 'note'] as const) delete s[k];
  }

  private product(id: string): Product | undefined {
    return this.products.find((p) => p.id === id);
  }

  /** Cart entries resolved against the catalogue; items removed from it are dropped. */
  private lines(s: Session): { product: Product; variant: ProductVariant; qty: number }[] {
    return Object.entries(s.cart).flatMap(([key, qty]) => {
      const [productId = '', variantId = ''] = key.split(':');
      const product = this.product(productId);
      const variant = product?.variants.find((v) => v.id === variantId);
      return product && variant ? [{ product, variant, qty }] : [];
    });
  }

  /** Sample prices are never quoted: only confirmed prices reach customers. */
  private priceText(v: ProductVariant): string {
    if (!this.business.pricesConfirmed || v.pricePaise === null) return v.label ? `${v.label}, price to be confirmed` : 'Price to be confirmed';
    return v.label ? `${formatPrice(v.pricePaise)} / ${v.label}` : formatPrice(v.pricePaise);
  }

  private allPriced(s: Session): boolean {
    return this.business.pricesConfirmed && this.lines(s).every((l) => l.variant.pricePaise !== null);
  }

  private label(s: Session, from: string): string {
    return `${s.name ?? s.profileName ?? 'Customer'} (+${from})`;
  }

  private itemLines(s: Session): string[] {
    return this.lines(s).map(({ product, variant, qty }) => `${product.name.en}${variant.label ? ` (${variant.label})` : ''} x ${qty}`);
  }

  private summary(s: Session): string[] {
    const lines = [...this.itemLines(s)];
    lines.push(s.fulfilment === 'delivery' ? `Delivery to: ${s.address}` : 'Pickup');
    lines.push(`Needed: ${s.date}`, `Name: ${s.name}`);
    if (s.note) lines.push(`Note: ${s.note}`);
    if (this.allPriced(s)) {
      const total = this.lines(s).reduce((n, l) => n + (l.variant.pricePaise ?? 0) * l.qty, 0);
      lines.push(`Estimated total: ${formatPrice(total)}`);
    } else {
      lines.push('Price: our team will confirm it.');
    }
    return lines;
  }

  private orderLines(o: Order): string[] {
    return [
      ...o.items.map((i) => `${i.name}${i.pack ? ` (${i.pack})` : ''} x ${i.qty}`),
      o.fulfilment === 'delivery' ? `Delivery to: ${o.address}` : 'Pickup',
      `Needed: ${o.date}`,
      ...(o.note ? [`Note: ${o.note}`] : []),
    ];
  }

  /**
   * Reads the message built by src/lib/order.ts (buildOrderMessage):
   * "1. Bhajani Chakli (500 g) x 2: ₹690", then optional "Name:" and "Note:" lines.
   */
  private parseWebOrder(text: string): Pick<Session, 'cart' | 'name' | 'note'> | null {
    const cart: Record<string, number> = {};
    const found: Pick<Session, 'name' | 'note'> = {};
    for (const line of text.split(/\r?\n/)) {
      const item = /^\s*\d+\.\s+(.+?)(?:\s+\(([^)]+)\))?\s+x\s*(\d{1,4})\s*(?::.*)?$/i.exec(line);
      if (item?.[1] && item[3]) {
        const name = item[1].trim().toLowerCase();
        const p = this.products.find((x) => x.name.en.toLowerCase() === name);
        const v = p && (item[2] ? p.variants.find((x) => x.label?.toLowerCase() === item[2]?.toLowerCase()) : p.variants[0]);
        const qty = Math.min(MAX_QUANTITY, Number(item[3]));
        if (p && v && qty > 0) cart[`${p.id}:${v.id}`] = qty;
        continue;
      }
      const field = /^\s*(Name|Note):\s*(\S.*)$/i.exec(line);
      if (field?.[1] && field[2]) {
        if (field[1].toLowerCase() === 'name') found.name = field[2].trim().slice(0, 60);
        else found.note = field[2].trim().slice(0, 300);
      }
    }
    return Object.keys(cart).length ? { cart, ...found } : null;
  }

  // ------------------------------------------------------------------ copy

  private menu(greet: boolean): Outbound {
    const b = this.business;
    return {
      kind: 'list',
      text: greet
        ? `Namaskar! This is ${b.name} (${b.marathiName}). I am an automated assistant: I can take your order and answer common questions. A person from our team is one tap away.`
        : 'What would you like to do?',
      button: 'Menu',
      rows: [
        { id: 'menu:order', title: 'Order now', description: 'Laddus, modak, faral and gift packs' },
        { id: 'menu:products', title: 'Products and prices' },
        { id: 'menu:fulfilment', title: 'Pickup and delivery' },
        { id: 'menu:visit', title: 'Timings and location' },
        { id: 'menu:human', title: 'Talk to us', description: 'A person from our team replies here' },
      ],
    };
  }

  private categoryList(prefix: 'cat' | 'browse', text: string): Outbound {
    return {
      kind: 'list',
      text,
      button: 'Choose',
      rows: CATEGORIES.filter((c) => this.products.some((p) => p.category === c.id)).map((c) => ({
        id: `${prefix}:${c.id}`,
        title: c.label,
        description: this.products.filter((p) => p.category === c.id).map((p) => p.name.en).join(', '),
      })),
    };
  }

  private productList(category: ProductCategory): Outbound {
    const label = CATEGORIES.find((c) => c.id === category)?.label ?? 'Products';
    return {
      kind: 'list',
      text: `${label}: which would you like?`,
      button: 'Choose',
      rows: this.products
        .filter((p) => p.category === category)
        .map((p) => ({
          id: `product:${p.id}`,
          title: p.name.en,
          description: `${p.name.mr}, ${p.variants.length > 1 ? `${p.variants.length} packs` : this.priceText(p.variants[0])}`,
        })),
    };
  }

  private moreButtons(s: Session): Outbound {
    return {
      kind: 'buttons',
      text: `Your order so far:\n${this.itemLines(s).join('\n')}\n\nAdd something else?`,
      buttons: [button('more:add', 'Add another item'), button('more:done', 'Continue')],
    };
  }

  private categoryInfo(category: ProductCategory): string {
    const label = CATEGORIES.find((c) => c.id === category)?.label ?? 'Products';
    const items = this.products
      .filter((p) => p.category === category)
      .map((p) => {
        const prices = p.variants.map((v) => this.priceText(v)).join('; ');
        return `*${p.name.en}* (${p.name.mr})${p.description ? `\n${p.description}` : ''}\n${prices}`;
      });
    const note = this.business.pricesConfirmed ? '' : '\n\nOur team confirms prices when you order.';
    return `${label}:\n\n${items.join('\n\n')}${note}`;
  }

  private fulfilmentInfo(): string {
    const b = this.business;
    if (!b.deliveryInformation && !b.serviceArea) {
      return 'We have not published pickup and delivery details yet. Tap Talk to us and our team will answer.';
    }
    return [
      b.deliveryInformation ? `Delivery: ${b.deliveryInformation}` : '',
      b.serviceArea ? `Areas we serve: ${b.serviceArea}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  private visitInfo(): string {
    const b = this.business;
    if (!b.orderingHours && !b.address) {
      return 'Our timings and location are not published here yet; tap Talk to us and our team will answer.';
    }
    return [
      b.address ? `Kitchen: ${b.address}` : 'Location: please ask our team.',
      b.orderingHours ? `Order timings: ${b.orderingHours}` : 'Order timings: please ask our team.',
    ].join('\n');
  }
}
