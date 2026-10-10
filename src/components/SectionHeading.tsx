import type { ReactNode } from 'react';
import { cn } from './ui/utils';

interface SectionHeadingProps {
  marathi: string;
  /** English line under the Marathi title. */
  description?: ReactNode;
  as?: 'h1' | 'h2';
  id?: string;
  align?: 'center' | 'start';
  className?: string;
}

/** Marathi title flanked by the gold flourish, as in both prototypes. */
export function SectionHeading({ marathi, description, as: Heading = 'h2', id, align = 'center', className }: SectionHeadingProps) {
  const centered = align === 'center';
  return <div className={cn(centered && 'text-center', className)}>
    <div className={cn('flex items-center gap-3 sm:gap-4', centered ? 'justify-center' : 'justify-start')}>
      {centered && <span aria-hidden="true" className="ornament ornament--end" />}
      <Heading id={id} lang="mr" className="font-marathi text-[1.875rem] leading-[1.35] font-bold text-balance text-maroon sm:text-[2.375rem]">{marathi}</Heading>
      {centered && <span aria-hidden="true" className="ornament" />}
    </div>
    {description && <p className={cn('mt-2 font-serif text-[1rem] text-muted sm:text-[1.0625rem]', centered && 'mx-auto max-w-2xl')}>{description}</p>}
  </div>;
}
