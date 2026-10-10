import { cn } from './ui/utils';

interface FilterPillsProps<T extends string> {
  label: string;
  options: readonly { id: T; label: string; count: number }[];
  value: T;
  onChange: (value: T) => void;
  controls: string;
}

/** Toggle buttons (aria-pressed) that filter a product grid. Wraps on narrow screens so every option stays visible. */
export function FilterPills<T extends string>({ label, options, value, onChange, controls }: FilterPillsProps<T>) {
  return <div role="group" aria-label={label} className="relative">
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
      {options.map((option) => {
        const active = option.id === value;
        return <button key={option.id} type="button" aria-pressed={active} aria-controls={controls} onClick={() => onChange(option.id)}
          className={cn('min-h-11 rounded-full border px-4 font-serif text-[0.9375rem] font-medium whitespace-nowrap transition-colors sm:px-6',
            active ? 'border-brown bg-brown text-paper' : 'border-line bg-paper text-ink hover:border-saddle hover:bg-sand')}>
          {option.label}<span className="sr-only">, {option.count} products</span>
        </button>;
      })}
    </div>
  </div>;
}
