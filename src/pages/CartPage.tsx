import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, MessageCircle, ShoppingCart } from 'lucide-react';
import { Container } from '../components/Container';
import { SectionHeading } from '../components/SectionHeading';
import { CartLines, CartTotals } from '../components/CartLines';
import { PendingChip } from '../components/Placeholder';
import { Button } from '../components/ui/button';
import { useCartStore } from '../stores/cart';
import { buildOrderMessage, summarizeBag, whatsappUrl } from '../lib/order';
import { business } from '../config/business';
import { useCopy } from '../lib/useCopy';
import { fieldClass } from '../components/ui/field';

export function CartPage() {
  const lines = useCartStore((state) => state.lines);
  const clear = useCartStore((state) => state.clear);
  const summary = summarizeBag(lines);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const { copied, copy } = useCopy();
  const ids = { name: useId(), note: useId(), preview: useId(), status: useId() };

  if (summary.lines.length === 0) {
    return <Container className="py-section text-center">
      <ShoppingCart size={36} strokeWidth={1.2} aria-hidden="true" className="mx-auto mb-5 text-saddle" />
      <SectionHeading as="h1" marathi="तुमची पिशवी रिकामी आहे" description="Your cart is empty. Add laddus, modak or faral to start an order." />
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild><Link to="/laddus">Explore Laddus</Link></Button>
        <Button asChild variant="outline"><Link to="/faral">Shop Faral</Link></Button>
      </div>
    </Container>;
  }

  const message = buildOrderMessage(summary, { name, note });
  const sendUrl = whatsappUrl(message);

  return <Container className="py-10 sm:py-14">
    <SectionHeading as="h1" align="start" marathi="तुमची ऑर्डर" description="Review your cart, then send the order to us on WhatsApp." />
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
      <section aria-labelledby="cart-items-title" className="rounded-card border border-line bg-paper px-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 border-b border-line py-3">
          <h2 id="cart-items-title" className="font-serif text-[1.25rem] font-semibold">{summary.itemCount} {summary.itemCount === 1 ? 'item' : 'items'}</h2>
          <button type="button" onClick={clear} className="min-h-11 px-2 text-[0.9375rem] text-muted underline-offset-4 hover:text-maroon hover:underline">Clear cart</button>
        </div>
        <CartLines summary={summary} />
        <div className="border-t border-line py-5"><CartTotals summary={summary} /></div>
      </section>

      <section aria-labelledby="checkout-title" className="grid gap-5 rounded-card border border-line bg-sand/60 p-5 sm:p-6 lg:sticky lg:top-6">
        <h2 id="checkout-title" className="font-serif text-[1.375rem] font-semibold">Order on WhatsApp</h2>
        <p className="text-[0.9375rem] text-muted">
          {business.pricesConfirmed ? 'Prices' : 'Prices shown are samples. Final prices'}, availability and delivery are confirmed with you on WhatsApp before you pay.
        </p>
        <div className="grid gap-2">
          <label htmlFor={ids.name} className="font-serif font-medium">Your name <span className="font-sans text-[0.875rem] font-normal text-muted">(optional)</span></label>
          <input id={ids.name} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={80} className={fieldClass} />
        </div>
        <div className="grid gap-2">
          <label htmlFor={ids.note} className="font-serif font-medium">Note for us <span className="font-sans text-[0.875rem] font-normal text-muted">(optional)</span></label>
          <textarea id={ids.note} value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={500} aria-describedby={`${ids.note}-hint`} className={fieldClass} />
          <p id={`${ids.note}-hint`} className="text-[0.8125rem] text-muted">For example, the date you need it or your area for delivery.</p>
        </div>
        <div className="grid gap-2">
          <h3 id={ids.preview} className="font-serif font-medium">Your message</h3>
          <pre aria-labelledby={ids.preview} data-order-message className="max-h-64 overflow-auto rounded-control border border-line bg-paper p-3.5 font-sans text-[0.875rem] leading-relaxed whitespace-pre-wrap">{message}</pre>
        </div>
        <div className="grid gap-3">
          {sendUrl
            ? <Button asChild><a href={sendUrl} target="_blank" rel="noopener noreferrer"><MessageCircle aria-hidden="true" size={19} />Send on WhatsApp<span className="sr-only"> (opens in a new tab)</span></a></Button>
            : <>
              <Button disabled aria-describedby={ids.status}><MessageCircle aria-hidden="true" size={19} />Send on WhatsApp</Button>
              <p id={ids.status} className="flex flex-wrap items-center justify-center gap-2 text-center text-[0.8125rem] text-muted"><PendingChip>WhatsApp number to be added</PendingChip>Sending opens once the business number is set.</p>
            </>}
          <Button variant="outline" onClick={() => copy(message)}>
            {copied === 'done' ? <Check aria-hidden="true" size={18} /> : <Copy aria-hidden="true" size={18} />}
            {copied === 'done' ? 'Message copied' : 'Copy message'}
          </Button>
          <p role="status" className="min-h-5 text-center text-[0.8125rem] text-muted">{copied === 'failed' ? 'Copying is not available here. Select the message above and copy it.' : ''}</p>
        </div>
      </section>
    </div>
  </Container>;
}
