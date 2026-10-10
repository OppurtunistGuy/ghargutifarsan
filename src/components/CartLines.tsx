import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { formatPrice } from '../data/products';
import type { BagSummary } from '../lib/order';
import { useCartStore } from '../stores/cart';
import { QuantityStepper } from './QuantityStepper';
import { PhotoSlot } from './Placeholder';
import { cn } from './ui/utils';

/** Shared by the cart drawer and the cart page so quantity and removal behave identically. */
export function CartLines({ summary, onNavigate, compact = false }: { summary: BagSummary; onNavigate?: () => void; compact?: boolean }) {
  const setQuantity = useCartStore((state) => state.setQuantity);
  const remove = useCartStore((state) => state.remove);
  return <ul className="divide-y divide-line" aria-label="Items in your cart">
    {summary.lines.map(({ product, variant, quantity, lineTotalPaise }) => <li key={`${product.id}:${variant.id}`} data-cart-line={product.id}
      className={cn('grid grid-cols-[4.5rem_1fr] gap-x-4 gap-y-3 py-4', !compact && 'sm:grid-cols-[6rem_1fr_auto] sm:items-center')}>
      <div className={cn('aspect-square overflow-hidden rounded-control bg-sand', !compact && 'sm:row-span-1')}>
        <PhotoSlot photo={product.image} need={product.name.en} />
      </div>
      <div className="min-w-0">
        <p className="font-serif leading-snug font-semibold">
          <Link to={`/products/${product.slug}`} onClick={onNavigate} className="hover:text-maroon">{product.name.en}</Link>
        </p>
        <p lang="mr" className="font-marathi text-[0.9375rem] text-maroon">{product.name.mr}</p>
        <p className="text-[0.875rem] text-muted">
          {variant.pricePaise === null ? 'Price to be confirmed' : `${formatPrice(variant.pricePaise)}${variant.label ? ` / ${variant.label}` : ''}`}
        </p>
      </div>
      <div className={cn('col-span-2 flex items-center justify-between gap-3', !compact && 'sm:col-span-1 sm:justify-end sm:gap-5')}>
        <QuantityStepper size="sm" value={quantity} label={product.name.en} onChange={(next) => setQuantity(product.id, variant.id, next)} />
        <p className="min-w-[4.5rem] text-right font-serif font-semibold tabular-nums">{lineTotalPaise === null ? <span className="font-sans text-[0.8125rem] font-normal text-muted">To be priced</span> : formatPrice(lineTotalPaise)}</p>
        <button type="button" onClick={() => remove(product.id, variant.id)} aria-label={`Remove ${product.name.en} from cart`}
          className="grid size-11 place-items-center rounded-full text-muted transition-colors hover:bg-sand hover:text-maroon">
          <Trash2 aria-hidden="true" size={18} strokeWidth={1.5} />
        </button>
      </div>
    </li>)}
  </ul>;
}

export function CartTotals({ summary }: { summary: BagSummary }) {
  return <div className="grid gap-1">
    <div className="flex items-baseline justify-between gap-4 font-serif">
      <span className="text-[1.0625rem]">Estimated subtotal</span>
      <span data-cart-subtotal className="text-[1.375rem] font-bold tabular-nums">{formatPrice(summary.estimatedTotalPaise)}</span>
    </div>
    {summary.unpricedLineCount > 0 && <p className="text-[0.875rem] text-muted">Plus {summary.unpricedLineCount} {summary.unpricedLineCount === 1 ? 'item' : 'items'} to be priced when we confirm your order.</p>}
  </div>;
}
