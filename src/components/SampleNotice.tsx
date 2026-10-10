import { business } from '../config/business';
import { PendingChip } from './Placeholder';

/** Shown beside catalogue grids while prices are still the prototype's sample prices. */
export function SampleNotice() {
  if (business.pricesConfirmed) return null;
  return <p className="flex flex-wrap items-center gap-2 text-[0.875rem] text-muted">
    <PendingChip>Sample prices</PendingChip>
    Final prices and pack sizes will be confirmed.
  </p>;
}
