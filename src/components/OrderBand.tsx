import { Link } from 'react-router-dom';
import { ArrowRight, Gift, MapPin, MessageCircle, type LucideIcon } from 'lucide-react';
import { business } from '../config/business';
import { media } from '../config/media';
import { Container } from './Container';
import { PendingChip, PhotoSlot } from './Placeholder';
import { Button } from './ui/button';

interface OrderBandProps {
  title: string;
  body: string;
}

/**
 * Dark closing band from both prototypes. The CTA leads to the cart, where the WhatsApp message
 * is built; sending stays disabled there until a business number is configured.
 */
export function OrderBand({ title, body }: OrderBandProps) {
  const facts: { icon: LucideIcon; title: string; detail: string | null; pending: string }[] = [
    { icon: Gift, title: 'Gift packs', detail: 'Combos and hampers', pending: '' },
    { icon: MessageCircle, title: 'Order by message', detail: 'Confirmed on WhatsApp', pending: '' },
    { icon: MapPin, title: 'Delivery areas', detail: business.serviceArea, pending: 'To be confirmed' },
  ];
  return <section aria-labelledby="order-band-title" className="bg-band text-band-ink">
    <Container className="grid gap-8 py-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] md:items-center md:gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.15fr)_minmax(0,1.15fr)] lg:py-0">
      <div className="reveal overflow-hidden rounded-card md:aspect-[5/4] lg:my-0 lg:aspect-auto lg:h-full lg:rounded-none">
        <PhotoSlot photo={media.orderBand.photo} need={media.orderBand.need} className="aspect-[16/10] md:aspect-auto" />
      </div>
      <div className="reveal grid gap-4 lg:py-12">
        <h2 id="order-band-title" className="font-serif text-[1.75rem] leading-tight font-medium sm:text-[2.125rem]">{title}</h2>
        <p className="max-w-md text-band-ink/85">{body}</p>
        <div><Button asChild variant="light"><Link to="/cart"><MessageCircle aria-hidden="true" size={19} />Order on WhatsApp<ArrowRight aria-hidden="true" size={17} /></Link></Button></div>
      </div>
      <ul className="grid grid-cols-3 gap-2 md:col-span-2 lg:col-span-1 lg:py-12">
        {facts.map(({ icon: Icon, title: label, detail, pending }) => <li key={label} className="flex flex-col items-center gap-1.5 border-l border-band-ink/20 px-2 text-center first:border-l-0">
          <Icon aria-hidden="true" size={26} strokeWidth={1.3} className="text-gold" />
          <p className="font-serif text-[0.9375rem] leading-tight font-medium">{label}</p>
          {detail ? <p className="text-[0.8125rem] text-band-ink/75">{detail}</p> : <PendingChip tone="dark">{pending}</PendingChip>}
        </li>)}
      </ul>
    </Container>
  </section>;
}
