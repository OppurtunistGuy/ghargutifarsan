import { Link } from 'react-router-dom';
import { navigation } from '../config/navigation';
import { business } from '../config/business';
import { Container } from './Container';
import { Brand } from './Brand';
import { PendingChip } from './Placeholder';

export function Footer() {
  return <footer className="border-t border-line bg-paper">
    <Container className="grid gap-8 py-10 md:grid-cols-[1.2fr_2fr_1.2fr] md:items-center">
      <Brand />
      <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-7 gap-y-1 font-serif text-[0.9375rem] md:justify-center">
        {navigation.map(({ to, label }) => <Link key={to} to={to} className="footer-link hover:text-maroon">{label}</Link>)}
        <Link to="/cart" className="footer-link hover:text-maroon">Cart</Link>
      </nav>
      <div className="grid gap-2 text-[0.9375rem] text-muted md:justify-items-end md:text-right">
        <p lang="mr" className="font-marathi text-ink">अस्सल महाराष्ट्रीय चव</p>
        {business.instagramUrl
          ? <a href={business.instagramUrl} target="_blank" rel="noopener noreferrer" className="footer-link underline">Instagram <span className="sr-only">(opens in a new tab)</span></a>
          : <span className="inline-flex flex-wrap items-center gap-2 md:justify-end">Social links <PendingChip>To be added</PendingChip></span>}
      </div>
    </Container>
    <Container><div className="border-t border-line py-5 text-sm text-muted">© {new Date().getFullYear()} {business.name}</div></Container>
  </footer>;
}
