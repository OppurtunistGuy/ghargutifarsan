import { business, isWhatsAppConfigured } from '../config/business';
import { findProduct, findVariant, formatPrice } from '../data/products';
import type { Product, ProductVariant } from '../types/product';
import type { CartLine } from '../stores/cart';

export interface ResolvedLine {
  product: Product;
  variant: ProductVariant;
  quantity: number;
  /** Null when the variant has no confirmed price yet. */
  lineTotalPaise: number | null;
}

export interface BagSummary {
  lines: ResolvedLine[];
  itemCount: number;
  /** Sum of priced lines only. */
  estimatedTotalPaise: number;
  unpricedLineCount: number;
}

export function summarizeBag(lines: readonly CartLine[]): BagSummary {
  const resolved = lines.flatMap((line) => {
    const item = findProduct(line.productId);
    const option = item && findVariant(item, line.variantId);
    if (!item || !option) return [];
    const lineTotalPaise = option.pricePaise === null ? null : option.pricePaise * line.quantity;
    return [{ product: item, variant: option, quantity: line.quantity, lineTotalPaise }];
  });
  return {
    lines: resolved,
    itemCount: resolved.reduce((sum, line) => sum + line.quantity, 0),
    estimatedTotalPaise: resolved.reduce((sum, line) => sum + (line.lineTotalPaise ?? 0), 0),
    unpricedLineCount: resolved.filter((line) => line.lineTotalPaise === null).length,
  };
}

/** "₹345 / 500 g", or "Price to be confirmed". */
export function priceWithUnit(option: ProductVariant): string {
  if (option.pricePaise === null) return formatPrice(null);
  return option.label ? `${formatPrice(option.pricePaise)} / ${option.label}` : formatPrice(option.pricePaise);
}

export interface OrderDetails {
  name?: string;
  note?: string;
}

export function buildOrderMessage(summary: BagSummary, details: OrderDetails = {}): string {
  const rows = summary.lines.map(({ product, variant, quantity, lineTotalPaise }, index) => {
    const pack = variant.label ? ` (${variant.label})` : '';
    const price = lineTotalPaise === null ? 'price to be confirmed' : formatPrice(lineTotalPaise);
    return `${index + 1}. ${product.name.en}${pack} x ${quantity}: ${price}`;
  });
  const name = details.name?.trim();
  const note = details.note?.trim();
  const total = summary.unpricedLineCount > 0
    ? `Estimated total: ${formatPrice(summary.estimatedTotalPaise)} + ${summary.unpricedLineCount} item${summary.unpricedLineCount === 1 ? '' : 's'} to be priced`
    : `Estimated total: ${formatPrice(summary.estimatedTotalPaise)}`;
  return [
    `Namaskar ${business.name}, I would like to place an order:`,
    '',
    ...rows,
    '',
    total,
    'Please confirm prices, availability and delivery.',
    ...(name || note ? [''] : []),
    ...(name ? [`Name: ${name}`] : []),
    ...(note ? [`Note: ${note}`] : []),
  ].join('\n');
}

export function buildEnquiryMessage(name: string, message: string): string {
  return [`Namaskar ${business.name},`, '', message.trim(), '', `Name: ${name.trim()}`].join('\n');
}

/** Null until a valid business number is configured; callers must keep sending disabled. */
export function whatsappUrl(message: string, number: string | null = business.whatsappNumber): string | null {
  if (!isWhatsAppConfigured(number)) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
