// public/icon.svg からホーム画面用・iOS アプリ用の PNG アイコンを書き出す。
// 使い方: npm run generate:icons（アイコンのデザインを変えたら実行する）
//   - Chrome の場所を変えるとき: CHROME_PATH=/path/to/chrome npm run generate:icons
// 依存パッケージは使わず、ヘッドレス Chrome のスクリーンショット機能で変換する。
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const CHROME =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = join(ROOT, "public");
// file は frontend/ からの相対パス
const OUTPUTS = [
  { file: "public/icon-192.png", size: 192 },
  { file: "public/icon-512.png", size: 512 },
  { file: "public/apple-touch-icon.png", size: 180 },
  // iOS アプリ（Capacitor）のアイコン。App Store の規定で透過不可のため、背景は不透明で書き出す
  { file: "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png", size: 1024, opaque: true },
];

const svg = await readFile(join(PUBLIC_DIR, "icon.svg"), "utf8");
const work = await mkdtemp(join(tmpdir(), "generate-icons-"));
try {
  for (const { file, size, opaque } of OUTPUTS) {
    const html = join(work, `${size}.html`);
    await writeFile(
      html,
      `<!doctype html><style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
    );
    await promisify(execFile)(CHROME, [
      "--headless=new",
      `--user-data-dir=${join(work, "profile")}`,
      "--hide-scrollbars",
      `--default-background-color=${opaque ? "08111fff" : "00000000"}`,
      `--window-size=${size},${size}`,
      `--screenshot=${join(ROOT, file)}`,
      `file://${html}`,
    ]);
    console.log(`saved ${file}`);
  }
} finally {
  await rm(work, { recursive: true, force: true });
}
