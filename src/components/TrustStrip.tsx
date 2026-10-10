import { Clock3, CookingPot, Leaf, ShieldCheck, Star, type LucideIcon } from 'lucide-react';
import { business, type ClaimId } from '../config/business';
import { Container } from './Container';
import { PendingChip } from './Placeholder';
import { cn } from './ui/utils';

const icons: Partial<Record<ClaimId, LucideIcon>> = {
  fssai: ShieldCheck, googleReviews: Star, noPreservatives: Leaf, smallBatch: CookingPot, freshAfterOrder: Clock3,
};

/** Trust claims render as labelled placeholders until confirmed in src/config/business.ts. */
export function TrustStrip({ items }: { items: readonly ClaimId[] }) {
  return <section aria-label="Our promises" className="border-y border-line bg-paper">
    <Container>
      <ul className={cn('grid grid-cols-2 gap-y-6 py-6 sm:py-7', items.length === 5 ? 'md:grid-cols-5' : 'md:grid-cols-4')}>
        {items.map((id, index) => {
          const claim = business.claims[id];
          const Icon = icons[id] ?? Leaf;
          return <li key={id} data-claim={id} data-confirmed={claim.confirmed}
            className={cn('flex flex-col items-center gap-1.5 px-3 text-center md:border-l md:border-line md:first:border-l-0',
              items.length % 2 === 1 && index === items.length - 1 && 'col-span-2 md:col-span-1')}>
            <Icon aria-hidden="true" size={28} strokeWidth={1.4} className="mb-1 text-saddle" />
            <p className="font-serif text-[1rem] leading-tight font-semibold">{claim.title}</p>
            {claim.confirmed ? <p className="text-[0.875rem] text-muted">{claim.detail}</p> : <PendingChip>{claim.pendingLabel}</PendingChip>}
          </li>;
        })}
      </ul>
    </Container>
  </section>;
}
