import { useSearchParams } from 'react-router-dom';
import { Container } from '../components/Container';
import { SectionHeading } from '../components/SectionHeading';
import { FilterPills } from '../components/FilterPills';
import { ProductCard } from '../components/ProductCard';
import { SampleNotice } from '../components/SampleNotice';
import { OrderBand } from '../components/OrderBand';
import { productsInCategories } from '../data/products';

const groups = [
  { id: 'laddu', label: 'Laddus', marathi: 'लाडू', items: productsInCategories(['laddu']) },
  { id: 'modak', label: 'Modak', marathi: 'मोदक', items: productsInCategories(['modak']) },
] as const;

type View = 'all' | (typeof groups)[number]['id'];
const views: readonly string[] = ['all', ...groups.map((group) => group.id)];

export function LaddusPage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get('type');
  const view: View = requested && views.includes(requested) ? requested as View : 'all';
  const shown = groups.filter((group) => view === 'all' || group.id === view);
  const options = [
    { id: 'all' as View, label: 'All Sweets', count: groups.reduce((sum, group) => sum + group.items.length, 0) },
    ...groups.map((group) => ({ id: group.id as View, label: group.label, count: group.items.length })),
  ];

  return <>
    <section className="paper-texture border-b border-line py-12 sm:py-16">
      <Container>
        <SectionHeading as="h1" marathi="आमचे खास लाडू आणि मोदक" description="Laddus for every season and modak for Ganpati Bappa, from our home kitchen." />
        <div className="mt-8"><FilterPills label="Show sweets" options={options} value={view} onChange={(next) => setParams(next === 'all' ? {} : { type: next }, { replace: true, preventScrollReset: true })} controls="sweets-grid" /></div>
      </Container>
    </section>
    <div id="sweets-grid" data-view={view}>
      {shown.map((group, index) => <section key={group.id} aria-labelledby={`${group.id}-title`} className={index === 0 ? 'pt-12 pb-section' : 'border-t border-line bg-sand/40 py-section'}>
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id={`${group.id}-title`} className="flex items-baseline gap-3 font-serif text-[1.75rem] font-medium">
              {group.label}<span lang="mr" className="font-marathi text-[1.375rem] font-bold text-maroon">{group.marathi}</span>
            </h2>
            <SampleNotice />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {group.items.map((item) => <ProductCard key={item.id} product={item} />)}
          </div>
        </Container>
      </section>)}
    </div>
    <OrderBand title="Every order begins with a little love." body="Add laddus and modak to your cart, then send the list on WhatsApp. We confirm prices, availability and delivery with you." />
  </>;
}
