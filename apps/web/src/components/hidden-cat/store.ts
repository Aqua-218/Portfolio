import { useSyncExternalStore } from "react";

// 隠し猫が見つかったか。おやすみの写真とフッターの一言で共有する
let found = false;
const listeners = new Set<() => void>();

export function setFound(): void {
  found = true;
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useFound(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => found,
    () => false,
  );
}
