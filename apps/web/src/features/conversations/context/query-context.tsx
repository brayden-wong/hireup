"use client";

import type { PropsWithChildren } from "react";

import { useRef } from "react";

import {
  QueryClient,
  QueryClientProvider as ReactQueryClientProvider,
} from "@tanstack/react-query";

export const QueryClientProvider = ({ children }: PropsWithChildren) => {
  const client = useRef(
    new QueryClient({
      defaultOptions: {
        queries: { staleTime: 60 * 1000, refetchOnWindowFocus: false },
      },
    }),
  );

  return (
    <ReactQueryClientProvider client={client.current}>
      {children}
    </ReactQueryClientProvider>
  );
};
