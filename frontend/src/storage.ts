import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

/**
 * データの保存。画面側は同期的に読み書きできる localStorage を使い、
 * iOS アプリ（Capacitor）では同じ内容を Preferences（iOS の UserDefaults）にも書いておく。
 * WKWebView の localStorage は端末の空き容量が極端に少ないと OS に消されることがあるため、
 * 起動時に Preferences の内容を localStorage に戻してから画面を描画する（restoreNativeStorage）。
 */

// このアプリが保存するキーの共通の接頭辞（復元・移行の対象）
const KEY_PREFIX = "yaritaikoto.";

const isNative = Capacitor.isNativePlatform();

/** 保存された文字列を読む。読めない環境では null */
export function loadItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** 文字列を保存する。保存できない環境（プライベートモード等）では何もしない */
export function saveItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // メモリ上の state だけで動作する
  }
  if (isNative) Preferences.set({ key, value }).catch(() => {});
}

/**
 * iOS アプリの起動時に、Preferences の内容を localStorage に戻す。
 * Preferences が空（この仕組みを入れる前から使っていた場合）なら、逆に localStorage の内容を Preferences に移す
 */
export async function restoreNativeStorage() {
  if (!isNative) return;
  try {
    const keys = (await Preferences.keys()).keys.filter((k) => k.startsWith(KEY_PREFIX));
    if (keys.length > 0) {
      for (const key of keys) {
        const { value } = await Preferences.get({ key });
        if (value !== null) localStorage.setItem(key, value);
      }
      return;
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = key?.startsWith(KEY_PREFIX) ? localStorage.getItem(key) : null;
      if (key && value !== null) await Preferences.set({ key, value });
    }
  } catch {
    // 復元できなくても localStorage の内容で動く
  }
}
