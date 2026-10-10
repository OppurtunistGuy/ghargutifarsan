import type { ComponentPropsWithRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

// Selective shadcn/ui Button pattern; owned locally, with brand-specific tokens.
// Shape rule: page-level CTAs are pills; actions inside cards use the small control radius.
const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap font-serif font-medium transition-[background-color,color,border-color,translate] duration-200 active:translate-y-px disabled:pointer-events-none disabled:opacity-55 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'rounded-full border border-brown bg-brown px-7 text-paper hover:border-brown-hover hover:bg-brown-hover',
        outline: 'rounded-full border border-brown/70 bg-paper/60 px-7 text-brown hover:bg-sand',
        card: 'w-full gap-1.5 rounded-control bg-saddle px-2 text-[0.9rem] sm:gap-2 sm:px-4 sm:text-[0.95rem] text-paper hover:bg-brown',
        light: 'rounded-full border border-band-ink bg-band-ink px-7 text-band hover:bg-paper',
        ghost: 'rounded-control px-2 text-brown hover:bg-sand',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

type ButtonProps = ComponentPropsWithRef<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ asChild = false, variant, className, type = 'button', ...props }: ButtonProps) {
  const Component = asChild ? Slot : 'button';
  return <Component {...(!asChild ? { type } : {})} className={cn(buttonVariants({ variant }), className)} {...props} />;
}
