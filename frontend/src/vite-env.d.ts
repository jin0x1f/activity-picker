/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** AdMob のバナー広告ユニット ID（iOS）。未設定ならテスト広告（src/ads.ts） */
  readonly VITE_ADMOB_IOS_BANNER_ID?: string;
  /** "1" ならテスト広告を出す（npm run ios:test） */
  readonly VITE_ADMOB_TEST?: string;
}
