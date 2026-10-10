# WhatsApp assistant (Cloud API)

Customers message Gharguti Farsan on a **dedicated WhatsApp Business number**.
An automated assistant takes orders step by step, answers common questions from
the same catalogue and business configuration as the website, and hands the chat
to a person on request. The owner's **personal number is never shown to
customers**: it is a server secret that only receives alerts and sends commands.

```
customer ──WhatsApp──> business number ──webhook──> Vercel /api/whatsapp ──> Bot (server/bot.ts)
                                                              │                 │
                                             Upstash Redis <──┘                 └──> alerts to owner's personal number
```

## What the assistant does

| Customer action | Assistant |
|---|---|
| "hi", "menu", "namaskar" | Greeting and menu: Order now, Products and prices, Pickup and delivery, Timings and location, Talk to us |
| Order now | Category (Laddus, Modak, Chakli, Chivda, Sweet snacks, Savoury snacks, Festive specials), product, pack if there are several, quantity, add more, pickup or delivery (address or shared location), date, name, summary, Confirm |
| Names a product ("I want shev", "I want 3 besan laddu") | Goes straight to ordering it; a quantity in the message is used (a weight like "2 kg" is not, it asks) |
| Asks a question mid-order ("price of chakli?" while being asked for a date) | Answers it, then asks the pending order question again; the question is never stored as the answer |
| Asks a price ("price of chakli?") | Lists that category with descriptions and prices |
| Website cart "Send on WhatsApp" | Reads the cart message (items, packs, name, note) and asks only what is missing |
| Website contact form | The question goes straight to a person (handoff) |
| Timings, location, delivery questions | Answered from `src/config/business.ts`; `null` values are never guessed, it offers a person instead |
| Talk to us | Owner is alerted; the customer's messages go to the owner until `done` or the customer types `menu` (12 h max) |
| "cancel" | Clears the current order |

**Prices:** while `business.pricesConfirmed` is `false`, the assistant never
quotes the sample prices; it says "price to be confirmed". Once real prices are
entered and `pricesConfirmed` is `true`, it shows prices and an estimated total.

Confirmed orders get a reference like `K7Q2-1`, are stored for 90 days, and the
owner gets an alert. The customer is told the request is **not confirmed yet**
(availability, price and delivery are confirmed by the family).

Product names take priority over delivery words ("I want besan laddu delivered home" orders
laddus); questions about delivery or timings ("do you deliver chakli to Kothrud?") get those answers.
Messages from one customer are processed one at a time (a short Redis lock), so two quick taps
cannot overwrite each other.

### Owner commands

Sent from the owner's personal number to the business number:

```
reply K7Q2 Yes, Saturday works.      -> message to that customer (template if their 24 h window closed)
done K7Q2                            -> assistant takes over again
show K7Q2      (or show K7Q2-1)      -> order details
help                                 -> command list
```

## Try it locally (no Meta account)

```sh
npm run bot:chat
```

Type as the customer; numbers pick buttons and list rows; `/owner reply K7Q2 hi`
talks as the owner; `/loc` shares a location; `\n` in a line becomes a new line
(to paste a website cart message). `npm run bot:dev` serves the real webhook on
http://localhost:8787/api/whatsapp in dry-run mode (replies are printed).

Tests run with the rest of the unit tests (`npm test`): `server/bot.test.ts`
(conversations, including round trips through the website's own
`buildOrderMessage` and `buildEnquiryMessage`) and `server/handler.test.ts`
(verification, signatures, retries, payload limits).

## Going live

### 1. Meta (done by the client; needs their business details)

1. A **Meta Business portfolio** (business.facebook.com) for Gharguti Farsan.
2. **developers.facebook.com** > Create app > type *Business* > add the **WhatsApp** product.
3. **Add a phone number**: a new SIM or landline that is *not* on any WhatsApp
   or WhatsApp Business app (or remove it from the app first). Verify it by SMS
   or call. Set the display name (Meta reviews it).
4. **Permanent token**: Business settings > System users > add an admin system
   user > assign the app and the WhatsApp account > Generate token with
   `whatsapp_business_messaging` and `whatsapp_business_management`.
5. Note the **Phone number ID** (WhatsApp > API Setup) and the **App secret**
   (App settings > Basic).
6. Add a payment method in WhatsApp Manager. Business-initiated template
   messages are charged; replies inside a customer's 24 h window were free under
   Meta's pricing at the time of writing. Check the current rate card.
7. Recommended: an **owner alert template**. WhatsApp Manager > Message
   templates > Create: category *Utility*, name `order_alert`, language English,
   body: `Gharguti Farsan assistant: {{1}}. Reply here with show and the code for details.`
   Without it, alerts only reach the owner if they messaged the business number
   in the last 24 h (the assistant logs a warning).
8. Recommended: a **customer reply template**, for answering a customer more than
   24 h after their last message (WhatsApp refuses free-form messages then). Category
   *Utility*, name `order_update`, body: `Gharguti Farsan: {{1}}`. Without it, a late
   `reply` is not delivered and the owner is told so (with the customer's number to call).

### 2. Vercel

1. Import the repository. `vercel.json` sets the build (`npm run build:vercel`):
   Build Output API with the storefront as static files, client routes falling
   back to `index.html`, and the `/api/whatsapp` function in the Mumbai region.
2. Storage: Marketplace > **Upstash Redis** (free tier is enough), connected to
   the project. It sets `KV_REST_API_URL` / `KV_REST_API_TOKEN` (or the
   `UPSTASH_REDIS_REST_*` pair); either works.
3. Environment variables (Production):

| Variable | Value |
|---|---|
| `WHATSAPP_TOKEN` | System user token |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone number ID (not the number) |
| `WHATSAPP_APP_SECRET` | App secret (verifies Meta's signature on every webhook) |
| `WHATSAPP_VERIFY_TOKEN` | Any long random string you choose |
| `WHATSAPP_OWNER_NUMBER` | Owner's personal WhatsApp, international digits, e.g. `91XXXXXXXXXX` |
| `WHATSAPP_OWNER_TEMPLATE` | `order_alert` once approved (optional) |
| `WHATSAPP_OWNER_TEMPLATE_LANG` | Template language code, default `en` |
| `WHATSAPP_CUSTOMER_TEMPLATE` | `order_update` once approved (optional, recommended) |
| `WHATSAPP_CUSTOMER_TEMPLATE_LANG` | Template language code, default `en` |
| `VITE_WHATSAPP_NUMBER` | The **business** number, digits only with 91. Public: it switches on the website's WhatsApp buttons at build time |
| `WHATSAPP_GRAPH_VERSION` | Optional, default `v23.0`; use Meta's current version |

   Never set `WHATSAPP_DRY_RUN` on Vercel: it stops real sending and, without an
   app secret, the signature check. Until every required variable is set, the
   webhook answers 503 and sends nothing.
4. Deploy.

### 3. Connect the webhook

Meta app > WhatsApp > Configuration > Webhook: callback URL
`https://<your-domain>/api/whatsapp`, verify token = `WHATSAPP_VERIFY_TOKEN`,
then **subscribe to `messages`**. Send "hi" to the business number from another phone.

### 4. Website

Set `VITE_WHATSAPP_NUMBER` in Vercel (or `.env.local` locally; see `.env.example`) to
the **business** number, digits only with 91, and redeploy. That enables "Send on
WhatsApp" on the cart and contact pages; both open a chat with the assistant. The
number works for the buttons even before the assistant is live: messages then simply
arrive in the business WhatsApp. `tests/whatsapp-configured.spec.ts` checks the
buttons with a test number. Fill `orderingHours`, `address`,
`deliveryInformation` and `serviceArea` with confirmed details so the assistant
can answer them, and set `pricesConfirmed: true` once real prices are entered.

## Data and privacy

Stored in Redis (keys prefixed `farsan:`): chat state per customer (7 days),
order records and reference codes (90 days), processed message IDs (2 days).
No message content is logged except errors. The Meta app needs a privacy policy
URL; it should mention WhatsApp orders and this retention.

## Not built (yet)

- Free-text understanding beyond keywords and product names (an LLM could answer
  open questions, but it must be grounded in the catalogue so it cannot invent facts).
- Marathi replies (Marathi greetings and product names are recognised).
- Media forwarding to the owner (photos and voice notes are not relayed).
- Payments, order status updates, or a dashboard; the owner works from WhatsApp.
