export interface ComponentProduct {
  id: string;
  name: string;
  purchaseCost: number | any;
  currentStock: number;
}

export interface BundleItemInput {
  productId: string;
  quantity: number;
}

export interface ProductBundleWithItems {
  id: string;
  name: string;
  sku: string;
  pricingType: "FIXED" | "DYNAMIC_SUM";
  bundlePrice: number | any | null;
  bundleItems: Array<{
    id: string;
    productId: string;
    quantity: number;
    product: ComponentProduct;
  }>;
}

/**
 * Calculates live pricing for a bundle.
 * - FIXED: Uses fixed bundlePrice.
 * - DYNAMIC_SUM: Calculates sum of (component unit purchaseCost * component quantity).
 */
export function calculateBundlePrice(
  pricingType: "FIXED" | "DYNAMIC_SUM",
  fixedPrice: number | null | undefined,
  items: Array<{ quantity: number; product?: { purchaseCost: number | any } }>
): number {
  if (pricingType === "FIXED" && fixedPrice !== null && fixedPrice !== undefined) {
    return Number(fixedPrice);
  }
  return items.reduce((sum, item) => {
    const cost = item.product ? Number(item.product.purchaseCost) : 0;
    return sum + item.quantity * cost;
  }, 0);
}

/**
 * Calculates virtual stock available for a bundle.
 * Virtual Stock = min(floor(product.currentStock / component.quantity)) across all components.
 */
export function calculateBundleVirtualStock(
  items: Array<{ quantity: number; product: { currentStock: number } }>
): number {
  if (!items || items.length === 0) return 0;
  let minBundles = Infinity;
  for (const item of items) {
    const requiredPerBundle = item.quantity;
    if (requiredPerBundle <= 0) continue;
    const available = Math.floor((item.product?.currentStock || 0) / requiredPerBundle);
    if (available < minBundles) {
      minBundles = available;
    }
  }
  return minBundles === Infinity ? 0 : Math.max(0, minBundles);
}
