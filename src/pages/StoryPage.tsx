import { Link } from 'react-router-dom';
import { ArrowRight, MessageCircle, ShoppingCart, Truck } from 'lucide-react';
import { Container } from '../components/Container';
import { SectionHeading } from '../components/SectionHeading';
import { PendingChip, PhotoSlot } from '../components/Placeholder';
import { Button } from '../components/ui/button';
import { findProduct } from '../data/products';
import { media } from '../config/media';
import type { Product } from '../types/product';

const calendar = [
  { festival: 'दिवाळी', en: 'Diwali', items: ['bhajani-chakli', 'karanji', 'anarse'] },
  { festival: 'गणेशोत्सव', en: 'Ganeshotsav', items: ['ukadiche-modak', 'kesar-modak', 'mawa-modak'] },
  { festival: 'भेट आणि समारंभ', en: 'Gifts and functions', items: ['festive-gift-hamper', 'return-gift-pack', 'laddu-gift-pack'] },
] as const;

const steps = [
  { icon: ShoppingCart, title: 'Choose', body: 'Add laddus, modak or faral to your cart.' },
  { icon: MessageCircle, title: 'Send on WhatsApp', body: 'Your cart becomes a ready-to-send order message.' },
  { icon: Truck, title: 'We confirm', body: 'We reply with final prices, availability and delivery.' },
];

export function StoryPage() {
  return <>
    <section className="paper-texture border-b border-line">
      <Container className="grid gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
        <div className="grid gap-5">
          <h1 lang="mr" className="font-marathi text-[2.375rem] leading-[1.3] font-bold text-maroon sm:text-[3rem]">आमची गोष्ट</h1>
          <p className="font-serif text-[1.5rem] leading-snug font-medium">From our kitchen, with love.</p>
          <p className="max-w-xl text-muted">Gharguti means homemade. We make Maharashtrian laddus, modak and faral in our own kitchen, for festivals, poojas and everyday tea.</p>
          <div className="grid max-w-xl justify-items-start gap-2 rounded-card border border-dashed border-saddle/45 bg-paper/70 p-4">
            <PendingChip>Family story to be supplied</PendingChip>
            <p className="text-[0.9375rem] text-muted">How Gharguti Farsan began, who cooks, and the recipes the family is proud of, in their own words.</p>
          </div>
        </div>
        <div className="aspect-[4/3] overflow-hidden rounded-card border border-line">
          <PhotoSlot priority photo={media.storyFamily.photo} need={media.storyFamily.need} sizes="(min-width: 64rem) 37rem, 100vw" />
        </div>
      </Container>
    </section>

    <section aria-labelledby="calendar-title" className="py-section">
      <Container>
        <SectionHeading id="calendar-title" marathi="सणासुदीचा फराळ" description="What our kitchen makes through the festive year." />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {calendar.map(({ festival, en, items }) => {
            const picks = items.map((id) => findProduct(id)).filter((item): item is Product => Boolean(item));
            return <article key={en} className="reveal overflow-hidden rounded-card border border-line bg-paper">
              <div className="grid grid-cols-3 gap-px bg-line">
                {picks.map((item) => <Link key={item.id} to={`/products/${item.slug}`} className="aspect-square overflow-hidden bg-sand" aria-label={item.name.en}>
                  {item.image && <img src={item.image.src} alt="" width={item.image.width} height={item.image.height} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />}
                </Link>)}
              </div>
              <div className="p-5">
                <h3 className="font-serif text-[1.1875rem] font-semibold">{en} <span lang="mr" className="font-marathi text-maroon">{festival}</span></h3>
                <p className="mt-1 text-[0.9375rem] text-muted">{picks.map((item) => item.name.en).join(', ')}</p>
              </div>
            </article>;
          })}
        </div>
      </Container>
    </section>

    <section aria-labelledby="how-title" className="bg-band py-section text-band-ink">
      <Container>
        <h2 id="how-title" className="font-serif text-[1.875rem] font-medium sm:text-[2.25rem]">How ordering works</h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, body }, index) => <li key={title} className="grid gap-2 border-t border-band-ink/25 pt-5">
            <Icon aria-hidden="true" size={28} strokeWidth={1.3} className="text-gold" />
            <h3 className="font-serif text-[1.1875rem] font-medium"><span className="sr-only">Step {index + 1}: </span>{title}</h3>
            <p className="text-band-ink/80">{body}</p>
          </li>)}
        </ol>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild variant="light"><Link to="/faral">Shop Faral<ArrowRight aria-hidden="true" size={17} /></Link></Button>
          <Button asChild variant="light" className="border-band-ink/60 bg-transparent text-band-ink hover:bg-white/10"><Link to="/contact">Contact</Link></Button>
        </div>
      </Container>
    </section>
  </>;
}
