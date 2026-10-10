import { useEffect, useState } from 'react';

/** Clipboard copy with a short-lived status for button feedback. */
export function useCopy() {
  const [copied, setCopied] = useState<'idle' | 'done' | 'failed'>('idle');
  useEffect(() => {
    if (copied === 'idle') return;
    const timer = window.setTimeout(() => setCopied('idle'), 2500);
    return () => window.clearTimeout(timer);
  }, [copied]);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied('done');
    } catch {
      setCopied('failed');
    }
  };
  return { copied, copy };
}
