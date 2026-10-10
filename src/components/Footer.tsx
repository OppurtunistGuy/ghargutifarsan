import { Link } from 'react-router-dom';
import { navigation } from '../config/navigation';
import { business } from '../config/business';
import { Container } from './Container';
import { Brand } from './Brand';

export function Footer() {
  return <footer className="bg-brown text-cream">
    <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
      <div><Brand light /><p className="mt-4 max-w-xs text-base">Maharashtrian sweets &amp; Faral.<br /><span lang="mr">घरगुती चवीची परंपरा.</span></p></div>
      <div><h2 className="font-editorial text-xl">Explore</h2><nav aria-label="Footer navigation" className="mt-3 grid grid-cols-2 gap-x-5 text-base">
        {navigation.map(({ to, label }) => <Link key={to} to={to} className="footer-link">{label}</Link>)}
      </nav></div>
      <div><h2 className="font-editorial text-xl">Stay in touch</h2>
        {business.email ? <a className="footer-link mt-3 text-base break-all" href={`mailto:${business.email}`}>{business.email}</a> : <p className="mt-4 max-w-xs text-base">Contact details will be shared here once confirmed.</p>}
        <Link to="/contact" className="footer-link mt-1 text-base underline">Contact information</Link>
      </div>
    </Container>
    <Container><div className="border-t border-cream/25 py-5 text-sm">© {new Date().getFullYear()} {business.name}.</div></Container>
  </footer>;
}
