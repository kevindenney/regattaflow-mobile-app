/**
 * useSailProducts - Hook for fetching sail product catalog
 *
 * Fetches known sail models from the sail_products table,
 * filtered by boat class and sail type.
 *
 * Groups results by sailmaker for easy UI rendering.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useSailProducts');

// =============================================================================
// Types
// =============================================================================

export interface SailProduct {
  id: string;
  boat_class_id: string | null;
  boat_class_name: string;
  sailmaker: string;
  sail_type: string;
  model_name: string;
  description: string | null;
  optimal_wind_range_min: number | null;
  optimal_wind_range_max: number | null;
  material: string | null;
  construction_type: string | null;
  weight_category: string | null;
}

export interface SailmakerGroup {
  sailmaker: string;
  products: SailProduct[];
}

export interface UseSailProductsReturn {
  /** All products for this class/type */
  products: SailProduct[];
  /** Products grouped by sailmaker */
  grouped: SailmakerGroup[];
  /** Unique sailmakers that have products for this class/type */
  sailmakers: string[];
  /** Products filtered to a specific sailmaker */
  getProductsBySailmaker: (sailmaker: string) => SailProduct[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refetch data */
  refetch: () => void;
}

// =============================================================================
// Common Sailmakers (fallback when no products in catalog)
// =============================================================================

export const COMMON_SAILMAKERS = [
  'North Sails',
  'Quantum',
  'Petticrows',
  'Doyle',
  'UK Sailmakers',
  'Ullman Sails',
  'Hyde Sails',
  'Banks Sails',
  'Elvstrom',
  'Haarstick',
] as const;

// =============================================================================
// Hook Implementation
// =============================================================================

export function useSailProducts(
  boatClassName: string | null | undefined,
  sailType: string | null | undefined
): UseSailProductsReturn {
  const [products, setProducts] = useState<SailProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch products from database
  const fetchProducts = useCallback(async () => {
    // Skip fetch if no class name provided
    if (!boatClassName) {
      setProducts([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('sail_products')
        .select('*')
        .eq('is_active', true)
        .ilike('boat_class_name', boatClassName);

      // Filter by sail type if provided
      if (sailType) {
        query = query.eq('sail_type', sailType);
      }

      // Order by sailmaker, then model name
      query = query.order('sailmaker').order('model_name');

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setProducts(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sail products';
      logger.error('Failed to fetch sail products:', err);
      setError(message);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [boatClassName, sailType]);

  // Fetch on mount and when parameters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Group products by sailmaker
  const grouped = useMemo((): SailmakerGroup[] => {
    const groups = new Map<string, SailProduct[]>();

    for (const product of products) {
      const existing = groups.get(product.sailmaker);
      if (existing) {
        existing.push(product);
      } else {
        groups.set(product.sailmaker, [product]);
      }
    }

    return Array.from(groups.entries()).map(([sailmaker, prods]) => ({
      sailmaker,
      products: prods,
    }));
  }, [products]);

  // Extract unique sailmakers
  const sailmakers = useMemo((): string[] => {
    return grouped.map((g) => g.sailmaker);
  }, [grouped]);

  // Filter products by sailmaker
  const getProductsBySailmaker = useCallback(
    (sailmaker: string): SailProduct[] => {
      return products.filter((p) => p.sailmaker === sailmaker);
    },
    [products]
  );

  return {
    products,
    grouped,
    sailmakers,
    getProductsBySailmaker,
    isLoading,
    error,
    refetch: fetchProducts,
  };
}

// =============================================================================
// Utility: Format wind range for display
// =============================================================================

export function formatWindRange(
  min: number | null | undefined,
  max: number | null | undefined
): string {
  if (min == null && max == null) return '';
  if (min == null) return `0-${max} kts`;
  if (max == null) return `${min}+ kts`;
  return `${min}-${max} kts`;
}

// =============================================================================
// Utility: Get weight category label
// =============================================================================

export function getWeightCategoryLabel(category: string | null | undefined): string {
  switch (category) {
    case 'light':
      return 'Light air';
    case 'medium':
      return 'Medium';
    case 'heavy':
      return 'Heavy air';
    case 'allround':
      return 'All-round';
    default:
      return '';
  }
}
