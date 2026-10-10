import { Link } from 'react-router-dom';
import { business } from '../config/business';
import { Container } from './Container';

export function AnnouncementBar() {
  return <div className="bg-band text-[0.8125rem] text-band-ink">
    <Container className="flex min-h-9 items-center justify-between gap-6">
      <ul className="flex min-w-0 items-center gap-4 overflow-hidden" aria-label="About us">
        {business.announcement.map((item, index) => <li key={item} className={index > 0 ? 'hidden items-center gap-4 md:flex' : 'truncate'}>
          {index > 0 && <span aria-hidden="true" className="size-1 rotate-45 bg-gold" />}{item}
        </li>)}
      </ul>
      <nav aria-label="Quick links" className="hidden shrink-0 items-center gap-5 sm:flex">
        <Link to="/our-story" className="hover:underline underline-offset-4">Our Story</Link>
        <Link to="/contact" className="hover:underline underline-offset-4">Contact</Link>
      </nav>
    </Container>
  </div>;
}
