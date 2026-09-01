/**
 * Shey's Bakery Bundle Pricing Engine
 * 
 * Rules:
 * - Bundle variants: 'Box of 10', 'Box of 15', and 'Box of 20'
 * - Pricing is calculated by multiplying single-piece base price by the number of pieces (10, 15, or 20)
 *   and applying an automatic 10% bundle discount.
 * - Single item or non-bundle variants use standard base unit price.
 */

export interface BundleDetails {
  isBundle: boolean;
  pieces: number;
  discountPercent: number;
  baseUnitPrice: number;
  rawMultipliedPrice: number;
  bundlePrice: number;
  savings: number;
  label: string;
}

export function isBundleVariant(variant?: string): boolean {
  if (!variant) return false;
  const clean = variant.trim().toLowerCase();
  return clean.includes('box of 10') || clean.includes('box of 15') || clean.includes('box of 20') ||
         clean === '10' || clean === '15' || clean === '20';
}

export function getBundleDetails(basePrice: number, variant?: string): BundleDetails {
  const safeBase = typeof basePrice === 'number' && !isNaN(basePrice) ? basePrice : 0;
  
  if (!variant) {
    return {
      isBundle: false,
      pieces: 1,
      discountPercent: 0,
      baseUnitPrice: safeBase,
      rawMultipliedPrice: safeBase,
      bundlePrice: safeBase,
      savings: 0,
      label: 'Single'
    };
  }

  const clean = variant.trim().toLowerCase();
  let pieces = 0;

  if (clean.includes('box of 10') || clean === '10' || clean === 'box of 10s') {
    pieces = 10;
  } else if (clean.includes('box of 15') || clean === '15' || clean === 'box of 15s') {
    pieces = 15;
  } else if (clean.includes('box of 20') || clean === '20' || clean === 'box of 20s') {
    pieces = 20;
  }

  if (pieces === 10 || pieces === 15 || pieces === 20) {
    const rawMultipliedPrice = Math.round(safeBase * pieces * 100) / 100;
    const discountPercent = 10; // 10% bundle discount
    const bundlePrice = Math.round(rawMultipliedPrice * 0.90 * 100) / 100;
    const savings = Math.round((rawMultipliedPrice - bundlePrice) * 100) / 100;

    return {
      isBundle: true,
      pieces,
      discountPercent,
      baseUnitPrice: safeBase,
      rawMultipliedPrice,
      bundlePrice,
      savings,
      label: `Box of ${pieces}`
    };
  }

  return {
    isBundle: false,
    pieces: 1,
    discountPercent: 0,
    baseUnitPrice: safeBase,
    rawMultipliedPrice: safeBase,
    bundlePrice: safeBase,
    savings: 0,
    label: variant
  };
}

export function getCalculatedPrice(basePrice: number, variant?: string): number {
  return getBundleDetails(basePrice, variant).bundlePrice;
}

export function formatPhp(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
