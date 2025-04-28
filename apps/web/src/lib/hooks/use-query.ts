import "client-only";

import { useCallback, useEffect, useRef, useState } from "react";

type UseQueryProps<TData, TVariables> = {
  queryFn: (variables: TVariables) => Promise<TData>;
  args: TVariables;
  enabled?: boolean;
};

type UseQueryNoArgsProps<TData> = {
  queryFn: () => Promise<TData>;
  args?: undefined;
  enabled?: boolean;
};

export function useQuery<TData>(props: UseQueryNoArgsProps<TData>): {
  data: TData | null;
  error: Error | null;
  loading: boolean;
  refetch: () => Promise<void>;
};
export function useQuery<TData, TVariables>(
  props: UseQueryProps<TData, TVariables>,
): {
  data: TData | null;
  error: Error | null;
  loading: boolean;
  refetch: (variables: TVariables) => Promise<void>;
};
export function useQuery<TData, TVariables>(
  props: UseQueryNoArgsProps<TData> | UseQueryProps<TData, TVariables>,
): {
  data: TData | null;
  error: Error | null;
  loading: boolean;
  refetch: (variables?: TVariables) => Promise<void>;
} {
  const { args, queryFn, enabled = true } = props;
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const queryFnRef = useRef(queryFn);

  const fetchData = useCallback(
    async (variables?: TVariables) => {
      setLoading(true);
      try {
        const response = (await queryFnRef.current(
          variables as TVariables,
        )) as TData;

        setData(response);
        setError(null);
      } catch (error) {
        if (error instanceof Error) setError(error);
        else setError(new Error(String(error)));
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [queryFnRef],
  );

  useEffect(() => {
    queryFnRef.current = queryFn;
  }, [queryFn]);

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;
    const fetch = async () => {
      try {
        // Check if queryFn expects arguments
        if (args) {
          await fetchData(args);
        } else {
          await fetchData();
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetch();

    return () => {
      isMounted = false;
    };
  }, [enabled, fetchData, props.args]);

  return { data, error, loading, refetch: fetchData };
}
