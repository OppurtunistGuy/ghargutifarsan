import type { ReactNode } from 'react';
import type { MediaSlot } from '../config/media';
import { Container } from './Container';
import { PhotoSlot } from './Placeholder';
import { cn } from './ui/utils';

interface KitchenStoryProps {
  slot: MediaSlot;
  labelledBy: string;
  children: ReactNode;
  /** Optional third column (claims list) on wide screens. */
  aside?: ReactNode;
  className?: string;
}

/** Photograph flush to the left edge with story copy beside it (both prototypes). */
export function KitchenStory({ slot, labelledBy, children, aside, className }: KitchenStoryProps) {
  return <section aria-labelledby={labelledBy} className={cn('relative bg-sand/60', className)}>
    <div className="lg:grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
      <div className="reveal aspect-[4/3] lg:aspect-auto lg:min-h-[30rem]">
        <PhotoSlot photo={slot.photo} need={slot.need} sizes="(min-width: 64rem) 43vw, 100vw" />
      </div>
      <Container className={cn('grid gap-10 py-12 lg:mx-0 lg:max-w-none lg:py-16 lg:pr-[max(var(--spacing-gutter),calc((100vw-78rem)/2+var(--spacing-gutter)))] lg:pl-12', aside && 'xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] xl:items-center')}>
        <div className="reveal grid content-center gap-5">{children}</div>
        {aside && <div className="reveal">{aside}</div>}
      </Container>
    </div>
  </section>;
}
