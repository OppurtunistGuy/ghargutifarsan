import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, X } from 'lucide-react';
import { useCartStore } from '../stores/cart';
import { useUiStore } from '../stores/ui';
import { summarizeBag } from '../lib/order';
import { business } from '../config/business';
import { CartLines, CartTotals } from './CartLines';
import { Button } from './ui/button';

// Native <dialog> gives a focus trap, Escape to close and inert background without a dependency.
export function CartDrawer() {
  const dialog = useRef<HTMLDialogElement>(null);
  const open = useUiStore((state) => state.bagOpen);
  const closeBag = useUiStore((state) => state.closeBag);
  const lines = useCartStore((state) => state.lines);
  const summary = summarizeBag(lines);
  const { pathname } = useLocation();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  useEffect(() => { closeBag(); }, [pathname, closeBag]);

  return <dialog ref={dialog} aria-labelledby="cart-drawer-title" onClose={closeBag}
    onClick={(event) => { if (event.target === event.currentTarget) closeBag(); }}
    className="cart-drawer m-0 ml-auto h-dvh max-h-dvh w-full max-w-[26rem] bg-paper p-0 text-ink shadow-lift backdrop:bg-band/45">
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <h2 id="cart-drawer-title" className="font-serif text-[1.25rem] font-semibold">Your cart</h2>
        <button type="button" onClick={closeBag} aria-label="Close cart" className="grid size-11 place-items-center rounded-full hover:bg-sand">
          <X aria-hidden="true" size={22} />
        </button>
      </div>
      {summary.lines.length === 0
        ? <div className="grid flex-1 content-center justify-items-center gap-4 px-6 text-center">
          <ShoppingCart aria-hidden="true" size={34} strokeWidth={1.25} className="text-saddle" />
          <p lang="mr" className="font-marathi text-[1.375rem] font-bold text-maroon">तुमची पिशवी रिकामी आहे</p>
          <p className="text-muted">Your cart is empty. Add laddus, modak or faral to start an order.</p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Button asChild><Link to="/laddus">Explore Laddus</Link></Button>
            <Button asChild variant="outline"><Link to="/faral">Shop Faral</Link></Button>
          </div>
        </div>
        : <>
          <div className="flex-1 overflow-y-auto px-5"><CartLines compact summary={summary} onNavigate={closeBag} /></div>
          <div className="grid gap-4 border-t border-line bg-cream px-5 py-5">
            <CartTotals summary={summary} />
            {!business.pricesConfirmed && <p className="text-[0.8125rem] text-muted">Prices shown are samples. Final prices and availability are confirmed on WhatsApp.</p>}
            <Button asChild><Link to="/cart">Review order</Link></Button>
          </div>
        </>}
    </div>
  </dialog>;
}
