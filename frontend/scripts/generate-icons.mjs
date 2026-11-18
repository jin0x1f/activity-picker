// public/icon.svg からホーム画面用・iOS アプリ用の PNG アイコンと、iOS アプリの起動画面を書き出す。
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
// file は frontend/ からの相対パス。size はアイコンの大きさ、canvas は画像全体の大きさ（省略時は size と同じ）
const SPLASH_DIR = "ios/App/App/Assets.xcassets/Splash.imageset";
const SPLASH = { size: 560, canvas: 2732, opaque: true };
const OUTPUTS = [
  { file: "public/icon-192.png", size: 192 },
  { file: "public/icon-512.png", size: 512 },
  { file: "public/apple-touch-icon.png", size: 180 },
  // iOS アプリ（Capacitor）のアイコン。App Store の規定で透過不可のため、背景は不透明で書き出す
  { file: "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png", size: 1024, opaque: true },
  // iOS アプリの起動画面（背景色の正方形の中央にアイコン）。画面いっぱいに拡大して中央を切り出して表示される
  ...["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"].map((name) => ({
    file: `${SPLASH_DIR}/${name}`,
    ...SPLASH,
  })),
];

const svg = await readFile(join(PUBLIC_DIR, "icon.svg"), "utf8");
const work = await mkdtemp(join(tmpdir(), "generate-icons-"));
try {
  for (const { file, size, canvas = size, opaque } of OUTPUTS) {
    const html = join(work, `${size}-${canvas}.html`);
    await writeFile(
      html,
      `<!doctype html><style>html,body{margin:0;height:100%}body{display:grid;place-items:center}` +
        `svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
    );
    await promisify(execFile)(CHROME, [
      "--headless=new",
      `--user-data-dir=${join(work, "profile")}`,
      "--hide-scrollbars",
      `--default-background-color=${opaque ? "08111fff" : "00000000"}`,
      `--window-size=${canvas},${canvas}`,
      `--screenshot=${join(ROOT, file)}`,
      `file://${html}`,
    ]);
    console.log(`saved ${file}`);
  }
} finally {
  await rm(work, { recursive: true, force: true });
}
