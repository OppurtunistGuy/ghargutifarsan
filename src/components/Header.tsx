import { useEffect, useRef, useState } from 'react';
import { Menu, ShoppingCart, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { navigation } from '../config/navigation';
import { useCartStore, selectCartCount } from '../stores/cart';
import { useUiStore } from '../stores/ui';
import { Container } from './Container';
import { Brand } from './Brand';
import { Button } from './ui/button';

export function Header() {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const count = useCartStore(selectCartCount);
  const openBag = useUiStore((state) => state.openBag);

  useEffect(() => {
    if (!open) return;
    function dismiss(event: KeyboardEvent) {
      if (event.key === 'Escape') {
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

  return <header className="border-b border-line bg-paper/95">
    <Container className="flex min-h-[4.75rem] items-center justify-between gap-4">
      <Brand />
      <nav aria-label="Main navigation" className="hidden items-center gap-9 lg:flex">
        {navigation.map(({ to, label }) => <NavLink key={to} to={to} end className="nav-link">{label}</NavLink>)}
      </nav>
      <div className="flex items-center gap-1 sm:gap-2">
        <button type="button" onClick={openBag} aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`} aria-haspopup="dialog"
          className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-2 font-serif text-ink transition-colors hover:bg-sand sm:px-3">
          <span className="relative">
            <ShoppingCart size={22} aria-hidden="true" strokeWidth={1.5} />
            <span aria-hidden="true" data-cart-count className="absolute -top-2 -right-2.5 grid h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full bg-maroon px-1 font-sans text-[0.6875rem] leading-none font-semibold text-paper">{count}</span>
          </span>
          <span className="hidden sm:inline">Cart</span>
        </button>
        <Button ref={menuButton} variant="ghost" className="min-w-11 lg:hidden" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>
          {open ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
        </Button>
      </div>
    </Container>
    <nav id="mobile-navigation" aria-label="Mobile navigation" hidden={!open} className="border-t border-line bg-paper lg:hidden">
      <Container className="grid gap-1 py-3">
        {navigation.map(({ to, label }) => <NavLink key={to} to={to} end className="nav-link px-2" onClick={() => setOpen(false)}>{label}</NavLink>)}
      </Container>
    </nav>
  </header>;
}
