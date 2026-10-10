import { Link } from 'react-router-dom';
import { ArrowRight, CookingPot, Flower2, MessageCircle } from 'lucide-react';
import { Hero } from '../components/Hero';
import { TrustStrip } from '../components/TrustStrip';
import { SectionHeading } from '../components/SectionHeading';
import { ProductCard } from '../components/ProductCard';
import { KitchenStory } from '../components/KitchenStory';
import { OrderBand } from '../components/OrderBand';
import { Container } from '../components/Container';
import { Button } from '../components/ui/button';
import { SampleNotice } from '../components/SampleNotice';
import { findProduct } from '../data/products';
import { media } from '../config/media';
import type { Product } from '../types/product';

const pick = (...ids: string[]) => ids.map((id) => findProduct(id)).filter((item): item is Product => Boolean(item));

const featuredLaddus = pick('besan-laddu', 'rawa-coconut-laddu', 'nachani-laddu', 'dink-laddu');
const beyondLaddus = pick('ukadiche-modak', 'bhajani-chakli', 'poha-chivda');

function ViewAll({ to, children }: { to: string; children: string }) {
  return <Link to={to} className="group inline-flex min-h-11 items-center gap-2 border-b border-gold/70 font-serif text-[0.9375rem] font-medium text-brown hover:text-maroon">
    {children}<ArrowRight aria-hidden="true" size={16} className="transition-transform group-hover:translate-x-0.5" />
  </Link>;
}

export function HomePage() {
  return <>
    <Hero
      headline={['लहानपणीची चव,', 'पुन्हा एकदा.']}
      subhead="A little sweetness from a Maharashtrian home kitchen."
      body="Laddus, modak and festive faral with the taste you grew up with."
      slot={media.homeHero}
      actions={<>
        <Button asChild><Link to="/laddus">Explore Laddus<ArrowRight aria-hidden="true" size={17} /></Link></Button>
        <Button asChild variant="outline"><Link to="/faral">More Goodies</Link></Button>
      </>}
    />
    <TrustStrip items={['fssai', 'googleReviews', 'noPreservatives', 'smallBatch']} />

    <section aria-labelledby="laddus-title" className="py-section">
      <Container>
        <SectionHeading id="laddus-title" marathi="आमचे खास लाडू" description="The laddus every Maharashtrian home knows by heart." />
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <SampleNotice />
          <ViewAll to="/laddus">View all laddus</ViewAll>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {featuredLaddus.map((item) => <ProductCard key={item.id} product={item} />)}
        </div>
      </Container>
    </section>

    <KitchenStory slot={media.homeKitchen} labelledBy="story-title">
      <p className="font-serif text-[0.8125rem] font-semibold tracking-[0.2em] text-saddle uppercase">Our story</p>
      <h2 id="story-title" className="font-serif text-[2rem] leading-tight font-medium text-ink sm:text-[2.5rem]">From our kitchen,<br />with love.</h2>
      <p className="max-w-xl text-muted">Gharguti means homemade. Our laddus, modak and faral are made in our own kitchen, the way Maharashtrian homes make them for festivals, poojas and everyday tea.</p>
      <p lang="mr" className="font-hand text-[1.5rem] leading-snug text-maroon">परंपरेची चव, आजही तशीच...</p>
      <div><Button asChild variant="default"><Link to="/our-story">Our Story<ArrowRight aria-hidden="true" size={17} /></Link></Button></div>
      <ul className="mt-3 grid grid-cols-3 gap-3 border-t border-line pt-6">
        {[
          { icon: CookingPot, title: 'Home kitchen', detail: 'Made at home' },
          { icon: Flower2, title: 'Festive classics', detail: 'Laddus, modak, faral' },
          { icon: MessageCircle, title: 'Simple ordering', detail: 'Order by message' },
        ].map(({ icon: Icon, title, detail }) => <li key={title} className="grid justify-items-center gap-1 text-center">
          <Icon aria-hidden="true" size={28} strokeWidth={1.3} className="text-saddle" />
          <p className="font-serif text-[0.9375rem] leading-tight font-semibold">{title}</p>
          <p className="text-[0.8125rem] text-muted">{detail}</p>
        </li>)}
      </ul>
    </KitchenStory>

    <section aria-labelledby="beyond-title" className="paper-texture py-section">
      <Container>
        <SectionHeading id="beyond-title" marathi="फराळाचे खास पदार्थ" description="Beyond the laddus: modak and faral for every celebration." />
        <div className="mt-6 flex justify-end"><ViewAll to="/faral">View all faral</ViewAll></div>
        <div className="mt-4 grid gap-6 md:grid-cols-3">
          {beyondLaddus.map((item) => <ProductCard key={item.id} product={item} size="large" />)}
        </div>
      </Container>
    </section>

    <OrderBand title="Every order begins with a little love." body="Add your favourites to the cart and send the list to us on WhatsApp. We confirm prices, availability and delivery with you directly." />
  </>;
}
