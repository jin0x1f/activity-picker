/** スマホのホーム画面に追加して使うための設定（本番ビルドのみ） */

/** オフラインでも起動できるよう Service Worker を登録する */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // 登録できなくても通常どおり動く（オフライン起動ができないだけ）
    });
  });
}

/**
 * ホーム画面から起動しているときは、ストレージの自動削除を避けるよう永続化を要求する。
 * ブラウザで開いているとき（Firefox では許可ダイアログが出る）は要求しない
 */
export function requestPersistentStorage() {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone) navigator.storage?.persist?.().catch(() => {});
}
