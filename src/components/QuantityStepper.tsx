import { Minus, Plus } from 'lucide-react';
import { MAX_QUANTITY } from '../stores/cart';
import { cn } from './ui/utils';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  size?: 'sm' | 'md';
}

export function QuantityStepper({ value, onChange, label, size = 'md' }: QuantityStepperProps) {
  const button = cn('grid place-items-center text-brown transition-colors hover:bg-sand disabled:opacity-40', size === 'sm' ? 'size-10' : 'size-11');
  return <div role="group" aria-label={`Quantity for ${label}`} className="inline-flex items-center rounded-full border border-line bg-paper">
    <button type="button" className={cn(button, 'rounded-l-full')} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label={`Decrease quantity of ${label}`}>
      <Minus aria-hidden="true" size={16} />
    </button>
    <output aria-live="polite" aria-label={`${label} quantity`} className={cn('text-center font-serif font-semibold tabular-nums', size === 'sm' ? 'w-7' : 'w-9')}>{value}</output>
    <button type="button" className={cn(button, 'rounded-r-full')} onClick={() => onChange(value + 1)} disabled={value >= MAX_QUANTITY} aria-label={`Increase quantity of ${label}`}>
      <Plus aria-hidden="true" size={16} />
    </button>
  </div>;
}
