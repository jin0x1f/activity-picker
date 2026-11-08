// オフラインでも起動できるようにする Service Worker。
// ビルド時に vite.config.ts のプラグインが、先頭に PRECACHE（ビルド成果物の一覧）と VERSION を付けて dist/sw.js として出力する。
/* global PRECACHE, VERSION */

const CACHE_PREFIX = "kyou-nanisuru-";
const CACHE = `${CACHE_PREFIX}${VERSION}`;
const INDEX_URL = new URL("index.html", self.registration.scope).href;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

// 古いバージョンのキャッシュを消す
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  // ページ本体はネットワーク優先（更新をすぐ反映）、つながらなければキャッシュ
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(INDEX_URL).then((cached) => cached ?? Response.error()),
      ),
    );
    return;
  }

  // JS・CSS・画像はファイル名にハッシュが付くため、キャッシュ優先
  event.respondWith(caches.match(request).then((cached) => cached ?? fetch(request)));
});
