import type { CapacitorConfig } from '@capacitor/cli'

// iOS アプリとして包むための設定（npm run ios で dist/ を ios/ にコピーして Xcode を開く）
const config: CapacitorConfig = {
  // Bundle ID。App Store に登録すると変更できない。所有している jin0x1f.github.io（GitHub アカウント）を逆順にしたもの
  // 変える場合は Xcode の PRODUCT_BUNDLE_IDENTIFIER も合わせる
  appId: 'io.github.jin0x1f.kyounanisuru',
  // ホーム画面のアイコン下に出る名前（Info.plist の CFBundleDisplayName）。長いと省略されるため PWA の short_name と同じ短い名前にする。
  // App Store での表示名は App Store Connect で別に決める（例: 「きょう、なにする？」）
  appName: 'なにする？',
  webDir: 'dist',
  ios: {
    // WebView の背景（起動直後・スクロールの端で見える色）。index.css の既定テーマ --bg と同じ
    backgroundColor: '#08111f',
  },
}

export default config
