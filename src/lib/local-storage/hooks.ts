"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { readStorage, writeStorage } from "@/lib/local-storage/store";

export function useLocalStorage<T>(
  key: string,
  fallback: T,
): [T, (value: T) => void, boolean] {
  const fallbackJson = useMemo(() => JSON.stringify(fallback), [fallback]);
  const subscribe = useCallback((onStoreChange: () => void) => {
    window.addEventListener("storage", onStoreChange);
    window.addEventListener("hane-dinner:storage", onStoreChange);
    return () => {
      window.removeEventListener("storage", onStoreChange);
      window.removeEventListener("hane-dinner:storage", onStoreChange);
    };
  }, []);
  const getSnapshot = useCallback(
    () => window.localStorage.getItem(key) ?? fallbackJson,
    [fallbackJson, key],
  );
  const serialized = useSyncExternalStore(subscribe, getSnapshot, () => fallbackJson);
  const value = useMemo(() => {
    try {
      return JSON.parse(serialized) as T;
    } catch {
      return readStorage(key, fallback);
    }
  }, [fallback, key, serialized]);
  const update = useCallback(
    (nextValue: T): void => writeStorage(key, nextValue),
    [key],
  );

  return [value, update, true];
}
