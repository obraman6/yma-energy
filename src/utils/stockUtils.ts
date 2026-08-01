export type StockStatusType = 'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK';

export interface StockStatusInfo {
  status: StockStatusType;
  labelEn: string;
  labelSw: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
}

/**
 * Returns calculated Stock Status based on product stock quantity vs low_stock_threshold (defaults to 5)
 * Rules:
 * 1. Out of Stock: stock === 0 -> Red badge, "Out of Stock"
 * 2. Low Stock: 0 < stock <= lowStockThreshold -> Orange badge, "Low Stock"
 * 3. In Stock: stock > lowStockThreshold -> Green badge, "In Stock"
 */
export function getStockStatus(stock: number, lowStockThreshold: number = 5): StockStatusInfo {
  const threshold = lowStockThreshold ?? 5;

  if (stock <= 0) {
    return {
      status: 'OUT_OF_STOCK',
      labelEn: 'Out of Stock',
      labelSw: 'Bidhaa Imeisha',
      badgeBg: 'bg-rose-500/10 dark:bg-rose-950/60',
      badgeText: 'text-rose-600 dark:text-rose-400',
      badgeBorder: 'border-rose-300 dark:border-rose-800',
      dotColor: 'bg-rose-500',
    };
  }

  if (stock <= threshold) {
    return {
      status: 'LOW_STOCK',
      labelEn: `Low Stock (${stock})`,
      labelSw: `Stock Inakaribia Kuisha (${stock})`,
      badgeBg: 'bg-amber-500/10 dark:bg-amber-950/60',
      badgeText: 'text-amber-600 dark:text-amber-400',
      badgeBorder: 'border-amber-300 dark:border-amber-800',
      dotColor: 'bg-amber-500',
    };
  }

  return {
    status: 'IN_STOCK',
    labelEn: 'In Stock',
    labelSw: 'In Stock',
    badgeBg: 'bg-emerald-500/10 dark:bg-emerald-950/60',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
    badgeBorder: 'border-emerald-300 dark:border-emerald-800',
    dotColor: 'bg-emerald-500',
  };
}
