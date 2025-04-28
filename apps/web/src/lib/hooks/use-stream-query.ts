import { useCallback, useEffect, useRef, useState } from "react";

type UseStreamQueryProps<TData, TVariables> = {
  queryFn: (variables: TVariables) => AsyncGenerator<TData>;
  args: TVariables;
  enabled?: boolean;
  onData: (chunk: TData) => void;
};

export function useStreamQuery<TData, TVariables>({
  args,
  onData,
  queryFn,
  enabled = true,
}: UseStreamQueryProps<TData, TVariables>) {
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const queryFnRef = useRef(queryFn);

  const fetchData = useCallback(
    async (variables: TVariables) => {
      setLoading(true);
      try {
        for await (const chunk of queryFnRef.current(variables)) {
          onData(chunk);
        }
      } catch (error) {
        if (error instanceof Error) setError(error);
        else setError(new Error(String(error)));
      } finally {
        setLoading(false);
      }
    },
    [queryFnRef],
  );

  useEffect(() => {
    if (!enabled) return;
    fetchData(args);
  }, [enabled, args, fetchData]);

  return { error, loading };
}
