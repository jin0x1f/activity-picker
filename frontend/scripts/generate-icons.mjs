// public/icon.svg からホーム画面用の PNG アイコンを書き出す。
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
const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), "../public");
const OUTPUTS = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
];

const svg = await readFile(join(PUBLIC_DIR, "icon.svg"), "utf8");
const work = await mkdtemp(join(tmpdir(), "generate-icons-"));
try {
  for (const { file, size } of OUTPUTS) {
    const html = join(work, `${size}.html`);
    await writeFile(
      html,
      `<!doctype html><style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
    );
    await promisify(execFile)(CHROME, [
      "--headless=new",
      `--user-data-dir=${join(work, "profile")}`,
      "--hide-scrollbars",
      "--default-background-color=00000000",
      `--window-size=${size},${size}`,
      `--screenshot=${join(PUBLIC_DIR, file)}`,
      `file://${html}`,
    ]);
    console.log(`saved public/${file}`);
  }
} finally {
  await rm(work, { recursive: true, force: true });
}
