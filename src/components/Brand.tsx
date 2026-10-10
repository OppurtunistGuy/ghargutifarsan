import { Link } from 'react-router-dom';
import { business } from '../config/business';
import { cn } from './ui/utils';

// Text wordmark until the client supplies logo artwork (the prototypes show a lotus mark).
export function Brand({ light = false, className }: { light?: boolean; className?: string }) {
  return <Link to="/" className={cn('inline-flex flex-col py-1', light ? 'text-band-ink' : 'text-maroon', className)} aria-label={`${business.name}, home`}>
    <span lang="mr" className="font-marathi text-[1.625rem] leading-[1.25] font-bold sm:text-[1.875rem]">{business.marathiName}</span>
    <span aria-hidden="true" className={cn('font-serif text-[0.6875rem] font-semibold tracking-[0.24em] uppercase', light ? 'text-band-ink/85' : 'text-ink')}>{business.name}</span>
  </Link>;
}
