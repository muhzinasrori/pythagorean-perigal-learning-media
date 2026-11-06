'use client';

import { useCallback, useRef, useSyncExternalStore } from 'react';

const EVENT_NAME = 'pythagoras-lab-store-change';

function readRaw(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, raw: string | null): void {
  try {
    if (raw === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, raw);
  } catch {
    // storage unavailable (private mode / quota) — in-memory only
  }
}

/**
 * localStorage-backed state built on useSyncExternalStore — the React-endorsed
 * way to subscribe to external stores. SSR-safe (server snapshot = fallback),
 * cross-tab aware via the `storage` event, no setState-in-effect.
 *
 * Best for primitive values (numbers, strings, booleans); object values are
 * compared by their JSON string so identity churn is avoided.
 */
export function useLocalStorage<T>(key: string, fallback: T): [T, (value: T | ((prev: T) => T)) => void] {
  const cacheRef = useRef<{ raw: string | null; value: T }>({ raw: null, value: fallback });

  const subscribe = useCallback(
    (onChange: () => void) => {
      window.addEventListener('storage', onChange);
      window.addEventListener(EVENT_NAME, onChange);
      return () => {
        window.removeEventListener('storage', onChange);
        window.removeEventListener(EVENT_NAME, onChange);
      };
    },
    [],
  );

  const getSnapshot = useCallback((): T => {
    const raw = readRaw(key);
    const cache = cacheRef.current;
    if (cache.raw === raw) return cache.value;
    let parsed: T = fallback;
    if (raw !== null) {
      try {
        parsed = JSON.parse(raw) as T;
      } catch {
        parsed = fallback;
      }
    }
    cacheRef.current = { raw, value: parsed };
    return parsed;
  }, [key, fallback]);

  const getServerSnapshot = useCallback((): T => fallback, [fallback]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (update: T | ((prev: T) => T)) => {
      const prev = getSnapshot();
      const next = typeof update === 'function' ? (update as (p: T) => T)(prev) : update;
      writeRaw(key, JSON.stringify(next));
      window.dispatchEvent(new Event(EVENT_NAME));
    },
    [key, getSnapshot],
  );

  return [value, setValue];
}
