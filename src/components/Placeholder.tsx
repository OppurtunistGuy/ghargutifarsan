import { ImageIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from './ui/utils';

/** Visible marker for information the client has not supplied yet. Grep: PendingChip. */
export function PendingChip({ children = 'To be confirmed', className, tone = 'light' }: { children?: ReactNode; className?: string; tone?: 'light' | 'dark' }) {
  return <span className={cn(
    'inline-flex items-center rounded-full border border-dashed px-2.5 py-0.5 font-sans text-[0.8125rem] leading-snug font-medium',
    tone === 'light' ? 'border-saddle/60 bg-paper text-saddle' : 'border-band-ink/60 text-band-ink',
    className,
  )}>{children}</span>;
}

interface PhotoSpec { src: string; alt: string; width: number; height: number; focus?: string; srcSet?: string }

/**
 * Renders a supplied photo, or an honest placeholder describing the photo still needed.
 * Swap a placeholder for a real image in src/config/media.ts; no layout change is required.
 */
export function PhotoSlot({ photo, need, className, imgClassName, priority = false, sizes }: {
  photo: PhotoSpec | null;
  need: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  /** Rendered width hint for srcSet, e.g. "(min-width: 64rem) 56vw, 100vw". */
  sizes?: string;
}) {
  if (photo) {
    return <img src={photo.src} srcSet={photo.srcSet} sizes={photo.srcSet ? sizes ?? '100vw' : undefined} alt={photo.alt} width={photo.width} height={photo.height}
      loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} decoding="async"
      style={photo.focus ? { objectPosition: photo.focus } : undefined}
      className={cn('h-full w-full object-cover', className, imgClassName)} />;
  }
  return <div role="img" aria-label={`Photo to be supplied: ${need}`} data-placeholder="photo"
    className={cn('grid h-full w-full place-items-center bg-sand p-6 text-center', className)}>
    <div className="grid max-w-[18rem] justify-items-center gap-3 rounded-card border border-dashed border-saddle/45 px-5 py-6">
      <ImageIcon aria-hidden="true" size={26} strokeWidth={1.25} className="text-saddle" />
      <PendingChip>Photo to be supplied</PendingChip>
      <p className="text-[0.9375rem] leading-snug text-muted">{need}</p>
    </div>
  </div>;
}
