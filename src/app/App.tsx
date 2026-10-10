import { useEffect, useRef } from 'react';
import { BrowserRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { CartDrawer } from '../components/CartDrawer';
import { Toast } from '../components/Toast';
import { HomePage } from '../pages/HomePage';
import { FaralPage } from '../pages/FaralPage';
import { LaddusPage } from '../pages/LaddusPage';
import { StoryPage } from '../pages/StoryPage';
import { ContactPage } from '../pages/ContactPage';
import { CartPage } from '../pages/CartPage';
import { ProductPage } from '../pages/ProductPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { business } from '../config/business';
import { findProduct } from '../data/products';
import { useReveal } from './useReveal';

const pageMeta: Record<string, { title: string; description: string }> = {
  '/': { title: `${business.name} | Maharashtrian laddus, modak and faral`, description: 'Homemade Maharashtrian laddus, modak and festive faral from Gharguti Farsan. Order on WhatsApp.' },
  '/laddus': { title: `Laddus and Modak | ${business.name}`, description: 'Besan, rawa coconut, nachani and dink laddus, with ukadiche and other modak.' },
  '/faral': { title: `Faral | ${business.name}`, description: 'Traditional Maharashtrian faral: chakli, chivda, shankarpali, karanji, anarse and festive combos.' },
  '/our-story': { title: `Our Story | ${business.name}`, description: 'Gharguti means homemade. How our kitchen makes laddus, modak and faral, and how ordering works.' },
  '/contact': { title: `Contact | ${business.name}`, description: 'Send Gharguti Farsan an enquiry about orders, combos and functions.' },
  '/cart': { title: `Cart | ${business.name}`, description: 'Review your cart and send your order on WhatsApp.' },
};

function metaFor(pathname: string) {
  if (pageMeta[pathname]) return pageMeta[pathname];
  const product = pathname.startsWith('/products/') ? findProduct(pathname.slice('/products/'.length)) : undefined;
  if (product) return { title: `${product.name.en} | ${business.name}`, description: product.description ?? `${product.name.en} from ${business.name}.` };
  return { title: `Page not found | ${business.name}`, description: pageMeta['/']!.description };
}

function Layout() {
  const { pathname } = useLocation();
  const main = useRef<HTMLElement>(null);
  const previousPath = useRef(pathname);
  useReveal(pathname);

  useEffect(() => {
    const meta = metaFor(pathname);
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description);
    if (previousPath.current !== pathname) {
      window.scrollTo(0, 0);
      main.current?.focus({ preventScroll: true });
      previousPath.current = pathname;
    }
  }, [pathname]);

  return <div className="flex min-h-dvh flex-col">
    <a href="#main-content" className="fixed top-3 left-3 z-50 -translate-y-24 rounded-full bg-brown px-5 py-3 text-paper focus:translate-y-0">Skip to content</a>
    <AnnouncementBar />
    <Header key={pathname} />
    <main ref={main} id="main-content" tabIndex={-1} className="flex-1 focus:outline-none"><Outlet /></main>
    <Footer />
    <CartDrawer />
    <Toast />
  </div>;
}

export function App() {
  return <BrowserRouter><Routes><Route element={<Layout />}>
    <Route index element={<HomePage />} />
    <Route path="laddus" element={<LaddusPage />} />
    <Route path="faral" element={<FaralPage />} />
    <Route path="our-story" element={<StoryPage />} />
    <Route path="contact" element={<ContactPage />} />
    <Route path="cart" element={<CartPage />} />
    <Route path="products/:slug" element={<ProductPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Route></Routes></BrowserRouter>;
}
