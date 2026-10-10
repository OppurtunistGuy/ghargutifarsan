import type { ReactNode } from 'react';
import type { MediaSlot } from '../config/media';
import { Container } from './Container';
import { PhotoSlot } from './Placeholder';

interface HeroProps {
  /** Each entry renders on its own line at desktop. */
  headline: readonly string[];
  subhead: string;
  body: string;
  actions: ReactNode;
  slot: MediaSlot;
}

/**
 * Split hero from both prototypes: Marathi headline on cream, food photograph bleeding to the
 * right edge and feathered into the page on its left side.
 */
export function Hero({ headline, subhead, body, actions, slot }: HeroProps) {
  return <section aria-labelledby="hero-title" className="paper-texture relative flex flex-col overflow-hidden lg:block">
    <div className="hero-media relative order-last aspect-[4/3] sm:aspect-[16/9] lg:absolute lg:inset-y-0 lg:right-0 lg:aspect-auto lg:w-[50%] xl:w-[56%]">
      <PhotoSlot priority photo={slot.photo} need={slot.need} sizes="(min-width: 80rem) 56vw, (min-width: 64rem) 50vw, 100vw" />
    </div>
    <Container className="relative grid pt-9 pb-10 sm:py-12 lg:min-h-[34rem] lg:items-center lg:py-16">
      <div className="hero-copy grid max-w-[34rem] gap-5 lg:max-w-[28rem] xl:max-w-[33rem]">
        <h1 id="hero-title" lang="mr" className="font-marathi text-[2.375rem] leading-[1.28] font-bold text-maroon sm:text-[3rem] lg:text-[2.625rem] xl:text-[3.5rem]">
          {headline.map((line, index) => <span key={line} className="block">{line}{index < headline.length - 1 ? ' ' : ''}</span>)}
        </h1>
        <p className="font-serif text-[1.25rem] leading-snug font-medium text-pretty text-ink sm:text-[1.4375rem] lg:text-[1.3125rem] xl:text-[1.4375rem]">{subhead}</p>
        <p className="max-w-[30rem] text-muted">{body}</p>
        <div className="mt-2 flex flex-wrap gap-3">{actions}</div>
      </div>
    </Container>
  </section>;
}
