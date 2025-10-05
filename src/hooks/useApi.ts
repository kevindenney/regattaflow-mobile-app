import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/src/providers/AuthProvider';

// ============================================================================
// Generic API Hook
// ============================================================================

export interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  initialData?: T;
  enabled?: boolean;
}

export interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  mutate: (optimisticData?: T) => Promise<void>;
}

export function useApi<T>(
  apiFunction: () => Promise<{ data: T | null; error: Error | null; loading: boolean }>,
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  const { enabled = true, initialData = null, onSuccess, onError } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const result = await apiFunction();

      if (result.error) {
        setError(result.error);
        onError?.(result.error);
      } else {
        setData(result.data);
        onSuccess?.(result.data as T);
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [apiFunction, enabled, onSuccess, onError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const mutate = useCallback(async (optimisticData?: T) => {
    if (optimisticData) {
      setData(optimisticData);
    }
    await fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    mutate
  };
}

// ============================================================================
// Mutation Hook (for create, update, delete operations)
// ============================================================================

export interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
  onMutate?: (variables: TVariables) => void;
}

export interface UseMutationReturn<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<void>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  loading: boolean;
  error: Error | null;
  data: TData | null;
  reset: () => void;
}

export function useMutation<TData, TVariables>(
  mutationFunction: (variables: TVariables) => Promise<{ data: TData | null; error: Error | null; loading: boolean }>,
  options: UseMutationOptions<TData, TVariables> = {}
): UseMutationReturn<TData, TVariables> {
  const { onSuccess, onError, onMutate } = options;

  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (variables: TVariables) => {
    onMutate?.(variables);
    setLoading(true);
    setError(null);

    try {
      const result = await mutationFunction(variables);

      if (result.error) {
        setError(result.error);
        onError?.(result.error);
      } else {
        setData(result.data);
        onSuccess?.(result.data as TData);
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [mutationFunction, onSuccess, onError, onMutate]);

  const mutateAsync = useCallback(async (variables: TVariables): Promise<TData> => {
    onMutate?.(variables);
    setLoading(true);
    setError(null);

    try {
      const result = await mutationFunction(variables);

      if (result.error) {
        setError(result.error);
        onError?.(result.error);
        throw result.error;
      } else {
        setData(result.data);
        onSuccess?.(result.data as TData);
        return result.data as TData;
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [mutationFunction, onSuccess, onError, onMutate]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    mutate,
    mutateAsync,
    loading,
    error,
    data,
    reset
  };
}

// ============================================================================
// Paginated Query Hook
// ============================================================================

export interface UsePaginatedQueryOptions<T> {
  pageSize?: number;
  onSuccess?: (data: T[]) => void;
  onError?: (error: Error) => void;
}

export interface UsePaginatedQueryReturn<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  fetchMore: () => Promise<void>;
  refetch: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function usePaginatedQuery<T>(
  queryFunction: (page: number, pageSize: number) => Promise<{
    data: T[];
    count: number;
    hasMore: boolean;
  }>,
  options: UsePaginatedQueryOptions<T> = {}
): UsePaginatedQueryReturn<T> {
  const { pageSize = 20, onSuccess, onError } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const fetchData = useCallback(async (pageNum: number, append: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const result = await queryFunction(pageNum, pageSize);

      setData(prev => append ? [...prev, ...result.data] : result.data);
      setHasMore(result.hasMore);
      onSuccess?.(result.data);
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [queryFunction, pageSize, onSuccess, onError]);

  useEffect(() => {
    fetchData(1, false);
  }, [fetchData]);

  const fetchMore = useCallback(async () => {
    if (!hasMore || loading) return;

    const nextPage = page + 1;
    setPage(nextPage);
    await fetchData(nextPage, true);
  }, [hasMore, loading, page, fetchData]);

  const refetch = useCallback(async () => {
    setPage(1);
    await fetchData(1, false);
  }, [fetchData]);

  const refresh = useCallback(async () => {
    setPage(1);
    await fetchData(1, false);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    hasMore,
    fetchMore,
    refetch,
    refresh
  };
}

// ============================================================================
// Optimistic Update Hook
// ============================================================================

export interface UseOptimisticUpdateOptions<T> {
  rollbackOnError?: boolean;
}

export function useOptimisticUpdate<T>(
  initialData: T | null = null,
  options: UseOptimisticUpdateOptions<T> = {}
) {
  const { rollbackOnError = true } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [previousData, setPreviousData] = useState<T | null>(null);

  const update = useCallback(async (
    optimisticData: T,
    mutationFn: () => Promise<{ data: T | null; error: Error | null }>
  ) => {
    // Store current data for potential rollback
    setPreviousData(data);

    // Optimistically update
    setData(optimisticData);

    try {
      const result = await mutationFn();

      if (result.error) {
        if (rollbackOnError) {
          // Rollback on error
          setData(previousData);
        }
        throw result.error;
      } else {
        // Update with real data
        setData(result.data);
        return result.data;
      }
    } catch (error) {
      if (rollbackOnError) {
        setData(previousData);
      }
      throw error;
    }
  }, [data, previousData, rollbackOnError]);

  return {
    data,
    setData,
    update
  };
}

// ============================================================================
// Pull-to-Refresh Hook
// ============================================================================

export interface UsePullToRefreshReturn {
  refreshing: boolean;
  onRefresh: () => Promise<void>;
}

export function usePullToRefresh(
  refreshFunction: () => Promise<void>
): UsePullToRefreshReturn {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshFunction();
    } finally {
      setRefreshing(false);
    }
  }, [refreshFunction]);

  return {
    refreshing,
    onRefresh
  };
}
