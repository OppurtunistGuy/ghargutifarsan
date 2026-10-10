import { useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { useUiStore } from '../stores/ui';

/** Add-to-cart confirmation. The live region always exists so screen readers hear every update. */
export function Toast() {
  const notice = useUiStore((state) => state.notice);
  const dismiss = useUiStore((state) => state.dismissNotice);
  const openBag = useUiStore((state) => state.openBag);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(dismiss, 4000);
    return () => window.clearTimeout(timer);
  }, [notice, dismiss]);

  return <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
    {notice && <div key={notice.id} className="toast-in pointer-events-auto flex max-w-md items-center gap-3 rounded-full bg-band py-2 pr-2 pl-4 text-[0.9375rem] text-band-ink shadow-lift">
      <Check aria-hidden="true" size={18} className="shrink-0 text-gold" />
      <span>{notice.message}</span>
      <button type="button" onClick={openBag} className="min-h-10 rounded-full bg-band-ink px-4 font-serif font-medium text-band hover:bg-paper">View cart</button>
      <button type="button" onClick={dismiss} aria-label="Dismiss" className="grid size-10 place-items-center rounded-full hover:bg-white/10"><X aria-hidden="true" size={16} /></button>
    </div>}
  </div>;
}
