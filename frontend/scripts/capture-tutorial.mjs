// チュートリアル用の画面画像を撮り直すスクリプト。
// 使い方: 別ターミナルで `npm run dev` を起動しておき、`npm run capture:tutorial`
//   - 開発サーバーの URL を変えるとき: npm run capture:tutorial -- http://localhost:5174/
//   - Chrome の場所を変えるとき: CHROME_PATH=/path/to/chrome npm run capture:tutorial
// 依存パッケージは使わず、Chrome DevTools Protocol を Node 標準の WebSocket で直接操作する。
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE_URL = process.argv[2] ?? "http://localhost:5173/";
const CHROME =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "../src/assets/tutorial");
const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 2 };

// 撮影用のサンプルデータ（localStorage のキー・形式は src/lib と同じ）
const now = Date.parse("2026-11-08T09:00:00+09:00");
const iso = (minutesAgo) => new Date(now - minutesAgo * 60_000).toISOString();
const todo = (id, text, groupId) => ({
  id,
  text,
  groupId,
  status: "todo",
  createdAt: iso(600),
  completedAt: null,
});
const done = (id, text, groupId, minutesAgo) => ({
  id,
  text,
  groupId,
  status: "done",
  createdAt: iso(5000),
  completedAt: iso(minutesAgo),
});
const SEED = {
  "yaritaikoto.groups.v1": [
    { id: "study", name: "勉強" },
    { id: "play", name: "遊び" },
  ],
  "yaritaikoto.items.v1": [
    todo("t1", "英単語を30個覚える", "study"),
    todo("t2", "TypeScript の本を1章読む", "study"),
    todo("t3", "映画を観る", "play"),
    todo("t4", "近所のカフェを開拓する", "play"),
    done("d1", "ジョギング 3km", "play", 60 * 20),
    done("d2", "部屋の片付け", "play", 60 * 46),
    done("d3", "数学の問題集を5問", "study", 60 * 70),
  ],
  "yaritaikoto.tutorialSeen.v1": "1",
};

// 画像内で操作箇所を示す枠と、撮影を安定させるためのアニメーション無効化
const CAPTURE_CSS = `
  *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }
  .tut-hl { outline: 3px solid #9fcaf6 !important; outline-offset: 4px; box-shadow: 0 0 0 10px rgba(159, 202, 246, 0.25) !important; }
  .tut-hl:not(button) { border-radius: 16px; }
`;

// 配色テーマ（localStorage のキー・形式は src/hooks/useTheme.ts と同じ）
const THEME_KEY = "yaritaikoto.theme.v1";
const THEMES = ["dark", "light"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launchChrome() {
  const profile = await mkdtemp(join(tmpdir(), "capture-tutorial-"));
  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--hide-scrollbars",
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  // ポートは Chrome が DevToolsActivePort に書き出す
  let port;
  for (let i = 0; i < 100 && !port; i++) {
    await sleep(100);
    port = await readFile(join(profile, "DevToolsActivePort"), "utf8")
      .then((s) => s.split("\n")[0])
      .catch(() => undefined);
  }
  if (!port) throw new Error(`Chrome を起動できませんでした: ${CHROME}`);
  const close = async () => {
    chrome.kill();
    await sleep(300);
    await rm(profile, { recursive: true, force: true });
  };
  return { port, close };
}

async function connect(port) {
  const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json());
  const page = targets.find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  let nextId = 1;
  const pending = new Map();
  const listeners = new Map();
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    } else if (msg.method) {
      listeners.get(msg.method)?.forEach((fn) => fn(msg.params));
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  const once = (method) =>
    new Promise((resolve) => {
      const fns = listeners.get(method) ?? [];
      const fn = (params) => {
        listeners.set(
          method,
          listeners.get(method).filter((f) => f !== fn),
        );
        resolve(params);
      };
      listeners.set(method, [...fns, fn]);
    });
  return { send, once, close: () => ws.close() };
}

/** theme の配色で 4 枚撮る。白背景（light）は `-light` 付きのファイル名で保存する */
async function captureAll(theme) {
  const chrome = await launchChrome();
  const cdp = await connect(chrome.port);
  const { send } = cdp;

  // ページ内で式を評価して値を返す
  const evaluate = async (fn, ...args) => {
    const { result, exceptionDetails } = await send("Runtime.evaluate", {
      expression: `(${fn})(...${JSON.stringify(args)})`,
      awaitPromise: true,
      returnByValue: true,
    });
    if (exceptionDetails) {
      throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
    }
    return result.value;
  };

  const clickButton = (text) =>
    evaluate((text) => {
      const button = [...document.querySelectorAll("button")].find(
        (b) => b.textContent.trim().startsWith(text) && !b.disabled,
      );
      if (!button) throw new Error(`ボタンが見つかりません: ${text}`);
      button.click();
    }, text);

  const goTo = (tab) =>
    evaluate((tab) => {
      const button = [...document.querySelectorAll(".nav-button")].find((b) =>
        b.querySelector(".nav-label").textContent.includes(tab),
      );
      button.click();
    }, tab);

  // React の制御コンポーネントに反映させるため、ネイティブの setter で値を入れて input を発火する
  const setAddInput = (value) =>
    evaluate((value) => {
      const input = document.querySelector('.add-form input[type="text"]');
      const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
      setValue.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, value);

  /** highlight に枠を付け、from の上端から until の下端までを撮る */
  const capture = async (name, { highlight, from, until, padding = 16 }) => {
    const { top, bottom } = await evaluate(
      (highlight, from, until) => {
        document.querySelectorAll(".tut-hl").forEach((el) => el.classList.remove("tut-hl"));
        for (const selector of highlight) {
          const el = document.querySelector(selector);
          if (!el) throw new Error(`要素が見つかりません: ${selector}`);
          el.classList.add("tut-hl");
        }
        window.scrollTo(0, 0);
        const rect = (selector) => {
          const el = document.querySelector(selector);
          if (!el) throw new Error(`要素が見つかりません: ${selector}`);
          return el.getBoundingClientRect();
        };
        return { top: rect(from).top, bottom: rect(until).bottom };
      },
      highlight,
      from,
      until,
    );
    const y = Math.max(0, Math.floor(top - padding));
    await sleep(150);
    const { data } = await send("Page.captureScreenshot", {
      format: "webp",
      quality: 88,
      captureBeyondViewport: true,
      clip: { x: 0, y, width: VIEWPORT.width, height: Math.ceil(bottom + padding) - y, scale: 1 },
    });
    const suffix = theme === "light" ? "-light" : "";
    const file = join(OUT_DIR, `${name}${suffix}.webp`);
    await writeFile(file, Buffer.from(data, "base64"));
    console.log(`saved ${file}`);
  };

  try {
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", { ...VIEWPORT, mobile: true });
    await send("Page.addScriptToEvaluateOnNewDocument", {
      source: `
        (() => {
          const seed = ${JSON.stringify({ ...SEED, [THEME_KEY]: JSON.stringify(theme) })};
          for (const [key, value] of Object.entries(seed)) {
            localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
          }
          // 選出結果を毎回同じにする（候補の先頭が選ばれる）
          Math.random = () => 0;
          document.addEventListener("DOMContentLoaded", () => {
            const style = document.createElement("style");
            style.textContent = ${JSON.stringify(CAPTURE_CSS)};
            document.head.append(style);
          });
        })();
      `,
    });

    const loaded = cdp.once("Page.loadEventFired");
    await send("Page.navigate", { url: BASE_URL });
    await loaded;
    await evaluate(async () => {
      for (let i = 0; i < 50 && !document.querySelector(".nav-button"); i++) {
        await new Promise((r) => setTimeout(r, 100));
      }
      await document.fonts.ready;
    });
    await mkdir(OUT_DIR, { recursive: true });

    // 1. 登録: 入力途中のフォームを示す
    await goTo("やりたいこと");
    await sleep(100);
    await setAddInput("ギターを練習する");
    await sleep(100);
    await capture("step1-add", {
      highlight: [".card:has(> .add-form)"],
      from: ".nav",
      until: ".card:has(> .add-form)",
    });

    // 入力欄を戻してから次へ
    await setAddInput("");

    // 2. 選出: 対象のチップと選出ボタン
    await goTo("決定");
    await sleep(100);
    await clickButton("選出");
    await sleep(150);
    await capture("step2-pick", {
      highlight: [".target", ".stack button.primary"],
      from: ".page-head",
      until: ".stack button.primary",
      padding: 12,
    });

    // 3. やった: 選出された項目の「やった」ボタン
    await goTo("やりたいこと");
    await sleep(100);
    await capture("step3-done", {
      highlight: [".list-item.is-picked button.check"],
      from: ".group-section",
      until: ".group-section",
    });

    // 4. 振り返り: やったこと一覧と「やっぱやってなかった」
    await goTo("やったこと");
    await sleep(100);
    await capture("step4-history", {
      highlight: [".list .list-item:first-child button"],
      from: ".nav",
      until: ".list .list-item:nth-child(2)",
    });
  } finally {
    cdp.close();
    await chrome.close();
  }
}

async function main() {
  for (const theme of THEMES) await captureAll(theme);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
