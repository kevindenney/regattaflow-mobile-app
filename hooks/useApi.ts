import { useState, useEffect, useCallback, useRef } from 'react';
import { createLogger } from '@/lib/utils/logger';

type ApiEnvelope<T> = {
  data: T | null;
  error?: Error | null;
  loading?: boolean;
};

type ApiResult<T> = T | ApiEnvelope<T | null> | null | undefined;

const normalizeApiResult = <T,>(result: ApiResult<T>): { data: T | null; error: Error | null } => {
  if (result === null || result === undefined) {
    return { data: null, error: null };
  }

  if (typeof result === 'object' && 'data' in result) {
    const envelope = result as ApiEnvelope<T | null>;
    return {
      data: envelope.data ?? null,
      error: envelope.error ?? null,
    };
  }

  return { data: result as T, error: null };
};

// ============================================================================
// Generic API Hook
// ============================================================================

export interface UseApiOptions<T> {
  onSuccess?: (data: T | null) => void;
  onError?: (error: Error) => void;
  initialData?: T | null;
  enabled?: boolean;
}

export interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  mutate: (optimisticData?: T | null) => Promise<void>;
}

const logger = createLogger('useApi');

export function useApi<T>(
  apiFunction: () => Promise<ApiResult<T>>,
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  const { enabled = true, initialData = null, onSuccess, onError } = options;

  const [data, setData] = useState<T | null>(initialData ?? null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<Error | null>(null);
  
  // Use refs to avoid triggering re-renders when callbacks change
  const apiRef = useRef(apiFunction);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    apiRef.current = apiFunction;
  }, [apiFunction]);
  
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);
  
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const fetchData = useCallback(async () => {
    logger.debug('fetchData called', { enabled });

    if (!enabled) {
      logger.debug('Skipping fetch - not enabled');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      logger.debug('Calling API function...');
      const result = await apiRef.current();
      logger.debug('API result metadata:', { hasResult: !!result });

      const normalized = normalizeApiResult<T>(result);
      logger.debug('Normalized result:', { hasData: !!normalized.data, hasError: !!normalized.error });

      if (normalized.error) {
        logger.error('Error in result:', normalized.error);
        setError(normalized.error);
        onErrorRef.current?.(normalized.error);
      }

      setData(normalized.data);
      onSuccessRef.current?.(normalized.data);
    } catch (err) {
      const typedError = err as Error;
      logger.error('Exception caught:', typedError);
      setError(typedError);
      onErrorRef.current?.(typedError);
    } finally {
      setLoading(false);
    }
  }, [enabled]); // Removed onError, onSuccess - using refs instead

  useEffect(() => {
    logger.debug('useEffect triggered', { enabled, hasFetched: hasFetchedRef.current });
    if (enabled && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      logger.debug('Triggering fetchData from useEffect');
      fetchData();
    } else if (!enabled) {
      hasFetchedRef.current = false;
      logger.debug('Skipping fetchData - not enabled');
    }
  }, [enabled, fetchData]);

  const mutate = useCallback(
    async (optimisticData?: T | null) => {
      if (optimisticData !== undefined) {
        setData(optimisticData);
      }
      await fetchData();
    },
    [fetchData]
  );

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    mutate,
  };
}

// ============================================================================
// Mutation Hook (for create, update, delete operations)
// ============================================================================

export interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData | null) => void;
  onError?: (error: Error) => void;
  onMutate?: (variables: TVariables) => void;
}

export interface UseMutationReturn<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<void>;
  mutateAsync: (variables: TVariables) => Promise<TData | null>;
  loading: boolean;
  error: Error | null;
  data: TData | null;
  reset: () => void;
}

export function useMutation<TData, TVariables>(
  mutationFunction: (variables: TVariables) => Promise<ApiResult<TData>>,
  options: UseMutationOptions<TData, TVariables> = {}
): UseMutationReturn<TData, TVariables> {
  const { onSuccess, onError, onMutate } = options;

  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (variables: TVariables, throwOnError: boolean): Promise<TData | null> => {
      onMutate?.(variables);
      setLoading(true);
      setError(null);

      try {
        const result = await mutationFunction(variables);
        const normalized = normalizeApiResult<TData>(result);

        if (normalized.error) {
          setError(normalized.error);
          onError?.(normalized.error);
          if (throwOnError) {
            throw normalized.error;
          }
        }

        setData(normalized.data);
        onSuccess?.(normalized.data);
        return normalized.data;
      } catch (err) {
        const typedError = err as Error;
        setError(typedError);
        onError?.(typedError);
        if (throwOnError) {
          throw typedError;
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [mutationFunction, onError, onMutate, onSuccess]
  );

  const mutate = useCallback(
    async (variables: TVariables) => {
      await execute(variables, false);
    },
    [execute]
  );

  const mutateAsync = useCallback(
    async (variables: TVariables) => execute(variables, true),
    [execute]
  );

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
    reset,
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

  const fetchData = useCallback(
    async (pageNum: number, append: boolean = false) => {
      setLoading(true);
      setError(null);

      try {
        const result = await queryFunction(pageNum, pageSize);

        setData(prev => (append ? [...prev, ...result.data] : result.data));
        setHasMore(result.hasMore);
        onSuccess?.(result.data);
      } catch (err) {
        const typedError = err as Error;
        setError(typedError);
        onError?.(typedError);
      } finally {
        setLoading(false);
      }
    },
    [onError, onSuccess, pageSize, queryFunction]
  );

  useEffect(() => {
    fetchData(1, false);
  }, [fetchData]);

  const fetchMore = useCallback(async () => {
    if (!hasMore || loading) return;

    const nextPage = page + 1;
    setPage(nextPage);
    await fetchData(nextPage, true);
  }, [fetchData, hasMore, loading, page]);

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
    refresh,
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

  const update = useCallback(
    async (optimisticData: T, mutationFn: () => Promise<ApiResult<T>>) => {
      setPreviousData(data);
      setData(optimisticData);

      try {
        const result = await mutationFn();
        const normalized = normalizeApiResult<T>(result);

        if (normalized.error) {
          if (rollbackOnError) {
            setData(previousData);
          }
          throw normalized.error;
        }

        setData(normalized.data);
        return normalized.data;
      } catch (err) {
        if (rollbackOnError) {
          setData(previousData);
        }
        throw err;
      }
    },
    [data, previousData, rollbackOnError]
  );

  return {
    data,
    setData,
    update,
  };
}

// ============================================================================
// Pull-to-Refresh Hook
// ============================================================================

export interface UsePullToRefreshReturn {
  refreshing: boolean;
  onRefresh: () => Promise<void>;
}

export function usePullToRefresh(refreshFunction: () => Promise<void>): UsePullToRefreshReturn {
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
    onRefresh,
  };
}
