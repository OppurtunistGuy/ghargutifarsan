import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Container } from '../components/Container';
import { PendingChip, PhotoSlot } from '../components/Placeholder';
import { QuantityStepper } from '../components/QuantityStepper';
import { AddToCartButton } from '../components/AddToCartButton';
import { ProductCard } from '../components/ProductCard';
import { SampleNotice } from '../components/SampleNotice';
import { findProduct, formatPrice, products } from '../data/products';
import { cn } from '../components/ui/utils';
import type { Availability, Product } from '../types/product';
import { NotFoundPage } from './NotFoundPage';

const availabilityText: Record<Exclude<Availability, 'unconfirmed'>, string> = {
  available: 'Available to order', 'sold-out': 'Sold out', seasonal: 'Seasonal',
};

function Detail({ title, value }: { title: string; value: string | readonly string[] | null }) {
  return <div className="grid gap-1.5 border-t border-line py-4 sm:grid-cols-[9rem_1fr] sm:gap-4">
    <dt className="font-serif font-semibold">{title}</dt>
    <dd className="m-0 text-muted">
      {value === null ? <PendingChip>To be supplied</PendingChip> : Array.isArray(value) ? value.join(', ') : value}
    </dd>
  </div>;
}

function related(product: Product): Product[] {
  return products.filter((item) => item.id !== product.id && item.category === product.category)
    .concat(products.filter((item) => item.id !== product.id && item.category !== product.category && item.collection === product.collection))
    .slice(0, 4);
}

export function ProductPage() {
  const { slug } = useParams();
  const product = slug ? findProduct(slug) : undefined;
  if (!product) return <NotFoundPage />;
  return <ProductView key={product.id} product={product} />;
}

function ProductView({ product }: { product: Product }) {
  const [variantId, setVariantId] = useState(product.variants[0].id);
  const [quantity, setQuantity] = useState(1);
  const variant = product.variants.find((option) => option.id === variantId) ?? product.variants[0];
  const back = product.collection === 'laddus' ? { to: '/laddus', label: 'Laddus & Modak' } : { to: '/faral', label: 'Faral' };

  return <>
    <Container className="py-8 sm:py-12">
      <Link to={back.to} className="inline-flex min-h-11 items-center gap-2 font-serif text-[0.9375rem] text-brown hover:text-maroon">
        <ArrowLeft aria-hidden="true" size={16} />Back to {back.label}
      </Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14">
        <div className="aspect-[4/3] overflow-hidden rounded-card border border-line bg-sand shadow-card lg:sticky lg:top-6 lg:self-start">
          <PhotoSlot priority photo={product.image} need={`${product.name.en} photo`} />
        </div>
        <div className="grid content-start gap-6">
          <div>
            <h1 className="font-serif text-[2rem] leading-tight font-semibold sm:text-[2.5rem]">{product.name.en}</h1>
            <p lang="mr" className="mt-1 font-marathi text-[1.5rem] font-bold text-maroon">{product.name.mr}</p>
          </div>
          {product.description && <p className="max-w-prose text-[1.0625rem] text-muted">{product.description}</p>}

          <div className="grid gap-2">
            <p className="font-serif" data-product-price>
              <span className="text-[1.75rem] font-bold">{formatPrice(variant.pricePaise)}</span>
              {variant.pricePaise !== null && variant.label && <span className="text-muted"> / {variant.label}</span>}
            </p>
            <SampleNotice />
          </div>

          {product.variants.length > 1 && <fieldset className="grid gap-2">
            <legend className="mb-2 font-serif font-semibold">Pack size</legend>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((option) => <label key={option.id} className={cn('inline-flex min-h-11 cursor-pointer items-center rounded-full border px-5 font-serif has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-maroon',
                option.id === variant.id ? 'border-brown bg-brown text-paper' : 'border-line bg-paper hover:bg-sand')}>
                <input type="radio" name="variant" value={option.id} checked={option.id === variant.id} onChange={() => setVariantId(option.id)} className="sr-only" />
                {option.label ?? 'Standard'}
              </label>)}
            </div>
          </fieldset>}

          <div className="flex flex-wrap items-center gap-3">
            <QuantityStepper value={quantity} onChange={setQuantity} label={product.name.en} />
            <AddToCartButton product={product} variantId={variant.id} quantity={quantity} variant="default" className="flex-1 sm:flex-none" />
          </div>

          <p className="flex flex-wrap items-center gap-2 text-[0.9375rem]">
            <span className="font-serif font-semibold">Availability:</span>
            {product.availability === 'unconfirmed' ? <PendingChip>Confirmed when you order</PendingChip> : availabilityText[product.availability]}
          </p>

          <dl className="m-0 border-b border-line">
            {product.comboContents && <Detail title="In the box" value={product.comboContents} />}
            <Detail title="Pack size" value={variant.label} />
            <Detail title="Ingredients" value={product.ingredients} />
            <Detail title="Allergens" value={product.allergenInformation} />
            <Detail title="Storage" value={product.storageInformation} />
          </dl>
        </div>
      </div>
    </Container>

    <section aria-labelledby="related-title" className="border-t border-line bg-sand/40 py-section">
      <Container>
        <h2 id="related-title" className="font-serif text-[1.625rem] font-medium">You may also like</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {related(product).map((item) => <ProductCard key={item.id} product={item} />)}
        </div>
      </Container>
    </section>
  </>;
}
