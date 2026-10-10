import { useEffect } from 'react';

/**
 * Fades `.reveal` elements in as they enter the viewport. Content stays visible without JS or
 * with reduced motion: the hidden state only applies under `.js-reveal` (see index.css).
 * Re-scans on route change and when filters swap the grid (MutationObserver).
 */
export function useReveal(routeKey: string) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const root = document.documentElement;
    root.classList.add('js-reveal');
    const intersection = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          intersection.unobserve(entry.target);
        }
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    const scan = () => document.querySelectorAll('.reveal:not(.is-visible)').forEach((element) => intersection.observe(element));
    scan();
    const mutations = new MutationObserver(scan);
    mutations.observe(document.getElementById('main-content') ?? document.body, { childList: true, subtree: true });
    return () => {
      intersection.disconnect();
      mutations.disconnect();
    };
  }, [routeKey]);
}
