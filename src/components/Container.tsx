import type { HTMLAttributes } from 'react';
import { cn } from './ui/utils';

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('page-container', className)} {...props} />;
}
