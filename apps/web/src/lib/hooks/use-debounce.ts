import "client-only";
import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 500) {
  const [state, setState] = useState(value);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (timer) clearTimeout(timer);
    timer = setTimeout(() => setState(value), delay);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [value, delay]);

  return state;
}
