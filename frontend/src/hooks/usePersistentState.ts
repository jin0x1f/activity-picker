import { useEffect, useState } from "react";

/** localStorage に保存される state。別タブでの変更も反映する */
export function usePersistentState<T>(key: string, parse: (raw: string | null) => T) {
  const [value, setValue] = useState<T>(() => {
    try {
      return parse(localStorage.getItem(key));
    } catch {
      return parse(null);
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 保存できない環境（プライベートモード等）ではメモリ上のみで動作する
    }
  }, [key, value]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setValue(parse(e.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key, parse]);

  return [value, setValue] as const;
}
