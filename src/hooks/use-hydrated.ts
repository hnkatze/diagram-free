import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * True only once the client has hydrated. Differing server/client snapshots let React
 * flip this after hydration without a setState-in-effect, so SSR markup never mismatches.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
