import { useEffect, useRef, useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { navigation } from '../config/navigation';
import { useCartStore, selectCartCount } from '../stores/cart';
import { Container } from './Container';
import { Brand } from './Brand';
import { Button } from './ui/button';

export function Header() {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const count = useCartStore(selectCartCount);

  useEffect(() => {
    function dismiss(event: KeyboardEvent) {
      if (event.key === 'Escape' && open) {
        setOpen(false);
        menuButton.current?.focus();
      }
    }
    window.addEventListener('keydown', dismiss);
    return () => window.removeEventListener('keydown', dismiss);
  }, [open]);

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => { if (query.matches) setOpen(false); };
    query.addEventListener('change', closeOnDesktop);
    return () => query.removeEventListener('change', closeOnDesktop);
  }, []);

  return <header className="border-b border-line bg-paper">
    <Container className="flex min-h-28 items-center justify-between gap-4">
      <Brand />
      <nav aria-label="Main navigation" className="hidden items-center gap-7 lg:flex">
        {navigation.map(({ to, label }) => <NavLink key={to} to={to} end className="nav-link">{label}</NavLink>)}
      </nav>
      <div className="flex items-center gap-1 sm:gap-3">
        <Link to="/cart" aria-label={`Shopping bag, ${count} items`} className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-control text-brown hover:bg-parchment">
          <ShoppingBag size={21} aria-hidden="true" strokeWidth={1.5} />
          <span className="hidden text-base sm:inline">Bag</span><span className="text-sm">({count})</span>
        </Link>
        <Button ref={menuButton} variant="ghost" className="min-w-11 px-2 lg:hidden" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>
          {open ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
        </Button>
      </div>
    </Container>
    <nav id="mobile-navigation" aria-label="Mobile navigation" hidden={!open} className="border-t border-line bg-paper lg:hidden">
      <Container className="flex flex-col gap-1 py-4">
        {navigation.map(({ to, label }) => <NavLink key={to} to={to} end className="nav-link px-2" onClick={() => setOpen(false)}>{label}</NavLink>)}
      </Container>
    </nav>
  </header>;
}
