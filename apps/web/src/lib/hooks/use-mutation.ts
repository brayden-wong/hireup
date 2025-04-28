import { useCallback, useState } from "react";

type MutationState<T, E extends Error> = {
  data: T | null;
  error: E | null;
  isLoading: boolean;
  isPending: boolean;
  isFetching: boolean;
};

type MutationFn<Variables, T> = (variables: Variables) => Promise<T>;

type MutationOptions<T, E extends Error, Variables> = {
  mutationFn: MutationFn<Variables, T>;
  onSuccess?: (data: T, variables: Variables) => any | Promise<any>;
  onError?: (error: E, variables: Variables) => any | Promise<any>;
  onSettled?: (
    data: T | null,
    error: E | null,
    variables: Variables,
  ) => void | Promise<void>;
};

export function useMutation<T, E extends Error, Variables>({
  mutationFn,
  ...options
}: MutationOptions<T, E, Variables>) {
  const [state, setState] = useState<MutationState<T, E>>({
    data: null,
    error: null,
    isPending: false,
    isLoading: false,
    isFetching: false,
  });

  const mutate = useCallback(
    async (
      variables: Variables,
      localOptions?: Omit<MutationOptions<T, E, Variables>, "mutationFn">,
    ) => {
      setState((prev) => ({
        ...prev,
        isPending: true,
        isLoading: true,
        isFetching: true,
      }));
      try {
        const data = await mutationFn(variables);
        setState({
          data,
          error: null,
          isPending: false,
          isLoading: false,
          isFetching: false,
        });

        void Promise.all([
          await Promise.resolve(options?.onSuccess?.(data, variables)),
          await Promise.resolve(localOptions?.onSuccess?.(data, variables)),
        ]);
      } catch (error) {
        setState({
          data: null,
          error:
            error instanceof Error
              ? (error as E)
              : (new Error(String(error)) as E),
          isPending: false,
          isLoading: false,
          isFetching: false,
        });

        void Promise.all([
          await Promise.resolve(
            options?.onError?.(
              error instanceof Error
                ? (error as E)
                : (new Error(String(error)) as E),
              variables,
            ),
          ),
          await Promise.resolve(
            localOptions?.onError?.(
              error instanceof Error
                ? (error as E)
                : (new Error(String(error)) as E),
              variables,
            ),
          ),
        ]);
      } finally {
        void Promise.all([
          await Promise.resolve(
            options?.onSettled?.(state.data, state.error, variables),
          ),
          await Promise.resolve(
            localOptions?.onSettled?.(state.data, state.error, variables),
          ),
        ]);
      }
    },
    [state.data, state.error, mutationFn, options],
  );

  return { mutate, ...state };
}
