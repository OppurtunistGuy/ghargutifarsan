import { Link } from 'react-router-dom';
import type { Product } from '../types/product';
import { formatPrice } from '../data/products';
import { AddToCartButton } from './AddToCartButton';
import { PhotoSlot } from './Placeholder';
import { cn } from './ui/utils';

export function ProductPrice({ product, className }: { product: Product; className?: string }) {
  const option = product.variants[0];
  if (option.pricePaise === null) return <p className={cn('text-[0.9375rem] text-muted', className)}>{formatPrice(null)}</p>;
  return <p className={cn('font-serif text-ink', className)}>
    <span className="text-[1.125rem] font-bold sm:text-[1.3125rem]">{formatPrice(option.pricePaise)}</span>
    {option.label && <span className="text-[0.875rem] text-muted sm:text-[0.9375rem]"> / {option.label}</span>}
  </p>;
}

export function ProductCard({ product, size = 'default', headingLevel = 3 }: { product: Product; size?: 'default' | 'large'; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const href = `/products/${product.slug}`;
  return <article data-product={product.id} className="reveal group flex flex-col overflow-hidden rounded-card border border-line bg-paper shadow-card transition-[box-shadow,translate] duration-300 hover:-translate-y-0.5 hover:shadow-lift">
    <Link to={href} tabIndex={-1} aria-hidden="true" className={cn('block overflow-hidden bg-sand', size === 'large' ? 'aspect-[16/9]' : 'aspect-[16/10]')}>
      <PhotoSlot photo={product.image} need={`${product.name.en} photo`} imgClassName="transition-transform duration-500 ease-out group-hover:scale-[1.04]" />
    </Link>
    <div className="flex flex-1 flex-col gap-2.5 p-3 sm:gap-3 sm:p-5">
      <div>
        <Heading className="font-serif text-[1rem] leading-snug font-semibold text-ink sm:text-[1.125rem]">
          <Link to={href} className="hover:text-maroon focus-visible:outline-offset-2">{product.name.en}</Link>
        </Heading>
        <p lang="mr" className="font-marathi text-[0.9375rem] font-semibold text-maroon sm:text-[1rem]">{product.name.mr}</p>
      </div>
      {product.description && <p className="line-clamp-2 text-[0.875rem] leading-relaxed text-muted sm:text-[0.9375rem]">{product.description}</p>}
      <div className="mt-auto grid gap-3 pt-1">
        <ProductPrice product={product} />
        <AddToCartButton product={product} />
      </div>
    </div>
  </article>;
}
