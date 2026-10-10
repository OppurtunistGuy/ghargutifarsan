import type { ComponentPropsWithRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

// Selective shadcn/ui Button pattern; owned locally, with brand-specific tokens.
const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-5 py-2 text-base font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border border-brown bg-brown text-paper hover:bg-ink',
        outline: 'border border-brown bg-transparent text-brown hover:bg-parchment',
        ghost: 'text-brown hover:bg-parchment',
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
