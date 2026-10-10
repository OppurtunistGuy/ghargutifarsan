import { useEffect, useRef } from 'react';
import { BrowserRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { FoundationPage, ContactPage, CartPage, ProductPage, NotFoundPage } from '../pages/FoundationPages';
import { navigation } from '../config/navigation';
import { business } from '../config/business';

function Layout() {
  const { pathname } = useLocation();
  const main = useRef<HTMLElement>(null);
  const previousPath = useRef(pathname);

  useEffect(() => {
    const title = navigation.find((item) => item.to === pathname)?.label
      ?? (pathname === '/cart' ? 'Shopping bag' : pathname.startsWith('/products/') ? 'Product' : 'Page not found');
    document.title = `${title} | ${business.name}`;
    if (previousPath.current !== pathname) {
      window.scrollTo(0, 0);
      main.current?.focus();
      previousPath.current = pathname;
    }
  }, [pathname]);

  return <div className="flex min-h-dvh flex-col">
    <a href="#main-content" className="fixed top-3 left-3 z-50 -translate-y-24 rounded-control bg-brown px-5 py-3 text-paper focus:translate-y-0">Skip to content</a>
    <Header key={pathname} />
    <main ref={main} id="main-content" tabIndex={-1} className="flex-1 focus:outline-none"><Outlet /></main>
    <Footer />
  </div>;
}

export function App() {
  return <BrowserRouter><Routes><Route element={<Layout />}>
    <Route index element={<FoundationPage page="home" />} />
    <Route path="laddus" element={<FoundationPage page="laddus" />} />
    <Route path="faral" element={<FoundationPage page="faral" />} />
    <Route path="our-story" element={<FoundationPage page="story" />} />
    <Route path="contact" element={<ContactPage />} />
    <Route path="cart" element={<CartPage />} />
    <Route path="products/:slug" element={<ProductPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Route></Routes></BrowserRouter>;
}
