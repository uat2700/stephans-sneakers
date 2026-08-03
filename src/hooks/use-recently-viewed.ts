import { useEffect, useState } from "react";

const STORAGE_KEY = "sc.recently-viewed.v1";
const LIMIT = 12;

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/**
 * Tracks recently viewed product ids in localStorage.
 * Pass a product id to record a view (excluded from the returned list).
 */
export function useRecentlyViewed(currentId?: string) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    const stored = read();
    setIds(stored.filter((id) => id !== currentId));
    if (!currentId) return;
    const next = [currentId, ...stored.filter((id) => id !== currentId)].slice(
      0,
      LIMIT,
    );
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, [currentId]);

  return ids;
}
