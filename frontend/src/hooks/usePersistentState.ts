import { useEffect, useState } from "react";
import { loadItem, saveItem } from "../storage";

/** localStorage（iOS アプリでは Preferences にも）に保存される state。別タブでの変更も反映する */
export function usePersistentState<T>(key: string, parse: (raw: string | null) => T) {
  const [value, setValue] = useState<T>(() => {
    try {
      return parse(loadItem(key));
    } catch {
      return parse(null);
    }
  });

  // 保存できない環境（プライベートモード等）ではメモリ上のみで動作する
  useEffect(() => saveItem(key, JSON.stringify(value)), [key, value]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setValue(parse(e.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key, parse]);

  return [value, setValue] as const;
}
