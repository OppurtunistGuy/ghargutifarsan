import { useEffect, useState } from 'react';
import { Check, ShoppingCart } from 'lucide-react';
import { Button } from './ui/button';
import { useCartStore } from '../stores/cart';
import { useUiStore } from '../stores/ui';
import type { Product } from '../types/product';

interface AddToCartButtonProps {
  product: Product;
  variantId?: string;
  quantity?: number;
  variant?: 'card' | 'default';
  className?: string;
}

export function AddToCartButton({ product, variantId, quantity = 1, variant = 'card', className }: AddToCartButtonProps) {
  const add = useCartStore((state) => state.add);
  const notify = useUiStore((state) => state.notify);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 1600);
    return () => window.clearTimeout(timer);
  }, [added]);

  const sold = product.availability === 'sold-out';
  return <Button variant={variant} className={className} disabled={sold}
    aria-label={sold ? `${product.name.en} is sold out` : `Add ${product.name.en} to cart`}
    onClick={() => {
      add(product.id, variantId ?? product.variants[0].id, quantity);
      notify(`${quantity > 1 ? `${quantity} x ` : ''}${product.name.en} added to your cart`);
      setAdded(true);
    }}>
    {added ? <Check aria-hidden="true" size={18} /> : <ShoppingCart aria-hidden="true" size={18} strokeWidth={1.75} />}
    {sold ? 'Sold out' : added ? 'Added' : 'Add to Cart'}
  </Button>;
}
