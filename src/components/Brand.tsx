import { Link } from 'react-router-dom';
import { business } from '../config/business';

export function Brand({ light = false }: { light?: boolean }) {
  return <Link to="/" className={`inline-flex flex-col py-2 ${light ? 'text-cream' : 'text-maroon'}`} aria-label={`${business.name} — Home`}>
    <span lang="mr" className="text-3xl font-semibold leading-normal">{business.marathiName}</span>
    <span aria-hidden="true" className="font-editorial text-[0.6875rem] tracking-[0.12em] uppercase">{business.name}</span>
  </Link>;
}
