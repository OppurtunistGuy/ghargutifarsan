import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Clock3, CookingPot, Leaf, ScrollText, type LucideIcon } from 'lucide-react';
import { Hero } from '../components/Hero';
import { TrustStrip } from '../components/TrustStrip';
import { SectionHeading } from '../components/SectionHeading';
import { ProductCard, ProductPrice } from '../components/ProductCard';
import { FilterPills } from '../components/FilterPills';
import { KitchenStory } from '../components/KitchenStory';
import { OrderBand } from '../components/OrderBand';
import { Container } from '../components/Container';
import { SampleNotice } from '../components/SampleNotice';
import { PendingChip, PhotoSlot } from '../components/Placeholder';
import { Button } from '../components/ui/button';
import { faralFilters, findProduct, productsInCategories, type FaralFilterId } from '../data/products';
import { business, type ClaimId } from '../config/business';
import { media } from '../config/media';
import type { Product } from '../types/product';

const filterIds = faralFilters.map((filter) => filter.id) as readonly string[];
const isFilter = (value: string | null): value is FaralFilterId => value !== null && filterIds.includes(value);

const festiveFeatured = ['traditional-faral-combo', 'festive-gift-hamper'].map((id) => findProduct(id)).filter((item): item is Product => Boolean(item));

function scrollToId(id: string) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}

function FestiveCard({ product }: { product: Product }) {
  const href = `/products/${product.slug}`;
  return <article data-product={product.id} className="reveal group flex flex-col overflow-hidden rounded-card border border-line bg-paper shadow-card">
    <Link to={href} tabIndex={-1} aria-hidden="true" className="block aspect-[16/9] overflow-hidden bg-sand">
      <PhotoSlot photo={product.image} need={`${product.name.en} photo`} imgClassName="transition-transform duration-500 group-hover:scale-[1.04]" />
    </Link>
    <div className="flex flex-1 flex-col gap-2 p-5">
      <h3 className="font-serif text-[1.1875rem] font-semibold"><Link to={href} className="hover:text-maroon">{product.name.en}</Link></h3>
      <p className="text-[0.9375rem] text-muted">
        {product.comboContents ? product.comboContents.join(', ') : product.description}
      </p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
        <ProductPrice product={product} />
        <Button asChild variant="card" className="w-auto px-5"><Link to={href} aria-label={`View details of ${product.name.en}`}>View Details</Link></Button>
      </div>
    </div>
  </article>;
}

const claimIcons: Partial<Record<ClaimId, LucideIcon>> = { traditionalRecipes: ScrollText, smallBatch: CookingPot, noPreservatives: Leaf, freshAfterOrder: Clock3 };

function ClaimList({ ids }: { ids: readonly ClaimId[] }) {
  return <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1" aria-label="How our faral is made">
    {ids.map((id) => {
      const claim = business.claims[id];
      const Icon = claimIcons[id] ?? Leaf;
      return <li key={id} data-claim={id} data-confirmed={claim.confirmed} className="flex items-start gap-3">
        <Icon aria-hidden="true" size={26} strokeWidth={1.3} className="mt-0.5 shrink-0 text-saddle" />
        <div className="grid justify-items-start gap-1">
          <p className="font-serif text-[1rem] font-semibold text-maroon">{claim.title}</p>
          {claim.confirmed ? <p className="text-[0.875rem] text-muted">{claim.detail}</p> : <PendingChip>{claim.pendingLabel}</PendingChip>}
        </div>
      </li>;
    })}
  </ul>;
}

export function FaralPage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get('filter');
  const active: FaralFilterId = isFilter(requested) ? requested : 'all';
  const filter = faralFilters.find((option) => option.id === active) ?? faralFilters[0];
  const visible = productsInCategories(filter.categories);
  const options = faralFilters.map((option) => ({ id: option.id, label: option.label, count: productsInCategories(option.categories).length }));

  const choose = (next: FaralFilterId) => setParams(next === 'all' ? {} : { filter: next }, { replace: true, preventScrollReset: true });

  return <>
    <Hero
      headline={['सणांची चव,', 'घरगुती फराळाची परंपरा.']}
      subhead="Traditional Maharashtrian faral, made at home."
      body="Crisp chakli, chivda, karanji, shankarpali and more, for festive mornings and family visits."
      slot={media.faralHero}
      actions={<>
        <Button onClick={() => scrollToId('collection')}>Shop Faral<ArrowRight aria-hidden="true" size={17} /></Button>
        <Button variant="outline" onClick={() => scrollToId('festive')}>View Festive Specials</Button>
      </>}
    />
    <TrustStrip items={['fssai', 'googleReviews', 'noPreservatives', 'smallBatch', 'freshAfterOrder']} />

    <section id="collection" aria-labelledby="collection-title" className="scroll-mt-4 py-section">
      <Container>
        <SectionHeading id="collection-title" marathi="आपला पारंपरिक फराळ" description="Traditional Maharashtrian snacks for Diwali, guests and everyday tea." />
        <div className="mt-8"><FilterPills label="Filter faral" options={options} value={active} onChange={choose} controls="faral-grid" /></div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="font-serif text-[0.9375rem] text-muted">Showing {visible.length} {filter.label === 'All Faral' ? 'faral items' : filter.label.toLowerCase()}</p>
          <SampleNotice />
        </div>
        <div id="faral-grid" data-filter={active} className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {visible.map((item) => <ProductCard key={item.id} product={item} />)}
        </div>
      </Container>
    </section>

    <section id="festive" aria-labelledby="festive-title" className="paper-texture scroll-mt-4 border-t border-line py-section">
      <Container className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,2fr)] lg:items-center">
        <div className="reveal grid justify-items-start gap-4">
          <h2 id="festive-title" lang="mr" className="font-marathi text-[2rem] leading-[1.35] font-bold text-balance text-maroon sm:text-[2.375rem]">सणासाठी खास फराळ भेट</h2>
          <p className="font-serif text-[1.25rem] font-medium">Festive Specials &amp; Combo Boxes</p>
          <p className="max-w-sm text-muted">Assortments of traditional faral for gifting or celebrating with family.</p>
          <Button variant="outline" className="mt-2" onClick={() => { choose('festive'); scrollToId('collection'); }}>View All Combos<ArrowRight aria-hidden="true" size={17} /></Button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {festiveFeatured.map((item) => <FestiveCard key={item.id} product={item} />)}
        </div>
      </Container>
    </section>

    <KitchenStory slot={media.faralKitchen} labelledBy="made-title" aside={<ClaimList ids={['traditionalRecipes', 'smallBatch', 'noPreservatives', 'freshAfterOrder']} />}>
      <p className="font-serif text-[0.8125rem] font-semibold tracking-[0.2em] text-saddle uppercase">Made with love</p>
      <h2 id="made-title" lang="mr" className="font-marathi text-[1.75rem] leading-[1.4] font-bold text-balance text-maroon sm:text-[2.125rem]">आमच्या घरगुती स्वयंपाकघरातून, थेट तुमच्या घरी.</h2>
      <p className="max-w-xl text-muted">Our faral is made in our home kitchen, then packed for your festive table, your guests and your gifts.</p>
      <div><Button asChild variant="outline"><Link to="/our-story">Our Story<ArrowRight aria-hidden="true" size={17} /></Link></Button></div>
    </KitchenStory>

    <OrderBand title="Place your festive orders on WhatsApp." body="Choose your faral and combos, then send the list on WhatsApp. We confirm prices, availability and delivery with you." />
  </>;
}
