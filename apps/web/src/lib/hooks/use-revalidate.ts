import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { clientRequest } from "../utils";
import { Revalidate } from "~/app/api/revalidate/route";

type Payload = { tags: Array<string> };

export function useRevalidate() {
  const router = useRouter();

  const revalidate = useCallback(
    async (payload: Payload) => {
      const response = await clientRequest<Revalidate>("/api/revalidate", {
        method: "POST",
        superjson: false,
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.success) {
        console.error(response.error);

        return void router.push("/auth");
      }

      router.refresh();
    },
    [router],
  );

  const invalidate = useCallback(
    async (payload: Payload) => {
      const response = await clientRequest<Revalidate>("/api/revalidate", {
        method: "POST",
        superjson: false,
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.success) {
        console.error(response.error);

        return void router.push("/auth");
      }
    },
    [router],
  );

  return { revalidate, invalidate };
}
