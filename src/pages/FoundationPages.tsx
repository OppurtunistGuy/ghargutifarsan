import { Link, useParams } from 'react-router-dom';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { Container } from '../components/Container';
import { SectionHeading } from '../components/SectionHeading';
import { Button } from '../components/ui/button';
import { business, isWhatsAppConfigured } from '../config/business';
import { findProduct } from '../data/products';

const pageCopy = {
  home: { marathi: 'घरगुती फरसाण', english: 'Maharashtrian sweets & Faral', description: 'Welcome to Gharguti Farsan. Our sweets and Faral collections are being prepared for you.' },
  laddus: { marathi: 'आपले लाडू', english: 'Our laddus', description: 'Our laddu collection will be shared here once the products and their details are confirmed.' },
  faral: { marathi: 'आपला पारंपरिक फराळ', english: 'Traditional Faral', description: 'Explore our Faral collection here soon. Product photographs, pack sizes and prices are awaiting confirmation.' },
  story: { marathi: 'आमची गोष्ट', english: 'Our story', description: 'The story behind Gharguti Farsan will be shared here in the family’s own words.' },
} as const;

export function FoundationPage({ page }: { page: keyof typeof pageCopy }) {
  const copy = pageCopy[page];
  return <Container className="py-section text-center">
    <div className="mx-auto max-w-3xl py-5 sm:py-9">
      <SectionHeading as="h1" {...copy} />
      {page === 'home' ? <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Button asChild><Link to="/laddus">Explore laddus <ArrowRight size={17} aria-hidden="true" /></Link></Button>
        <Button asChild variant="outline"><Link to="/faral">Explore Faral <ArrowRight size={17} aria-hidden="true" /></Link></Button>
      </div> : <div className="mt-9"><Button asChild variant="outline"><Link to="/">Back to home</Link></Button></div>}
      <p className="mx-auto mt-10 max-w-md border-t border-line pt-5 text-sm text-muted">Ordering will open once product availability and business contact details are confirmed.</p>
    </div>
  </Container>;
}

export function ContactPage() {
  const whatsappReady = isWhatsAppConfigured(business.whatsappNumber);
  return <Container className="py-section text-center">
    <SectionHeading as="h1" marathi="संपर्क" english="Contact" description="Get in touch with Gharguti Farsan." />
    <div className="mx-auto mt-8 max-w-lg space-y-4">
      {business.email && <a href={`mailto:${business.email}`} className="footer-link text-brown underline">{business.email}</a>}
      {business.address && <address className="not-italic">{business.address}</address>}
      {business.deliveryInformation && <p>{business.deliveryInformation}</p>}
      {whatsappReady ? <Button asChild><a href={`https://wa.me/${business.whatsappNumber}`} target="_blank" rel="noopener noreferrer">Contact on WhatsApp <span className="sr-only">(opens in a new tab)</span></a></Button> : <p className="text-muted">Our contact details and WhatsApp ordering will be available once confirmed.</p>}
      <div className="pt-4"><Button asChild variant="outline"><Link to="/">Back to home</Link></Button></div>
    </div>
  </Container>;
}

export function CartPage() {
  return <Container className="py-section text-center">
    <ShoppingBag size={32} strokeWidth={1.25} aria-hidden="true" className="mx-auto mb-6 text-brown" />
    <SectionHeading as="h1" marathi="आपली पिशवी" english="Your shopping bag" description="Your bag is empty. Shopping will open once our collections are ready." />
    <div className="mt-8"><Button asChild variant="outline"><Link to="/faral">Explore Faral</Link></Button></div>
  </Container>;
}

export function ProductPage() {
  const { slug } = useParams();
  const product = slug ? findProduct(slug) : undefined;
  if (!product) return <NotFoundPage />;
  return <Container className="py-section text-center">
    <SectionHeading as="h1" marathi={product.name.mr} english={product.name.en} description="Product details, photographs, pricing and availability will be shared once confirmed." />
    <div className="mt-8"><Button asChild variant="outline"><Link to="/faral">Back to Faral</Link></Button></div>
  </Container>;
}

export function NotFoundPage() {
  return <Container className="py-section text-center">
    <SectionHeading as="h1" marathi="हे पान सापडले नाही" english="Page not found" description="The page you’re looking for isn’t available. You can return to the homepage." />
    <div className="mt-8"><Button asChild><Link to="/">Back to home</Link></Button></div>
  </Container>;
}
