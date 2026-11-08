import { useEffect } from "react";
import { usePersistentState } from "./usePersistentState";

export type Theme = "dark" | "light";

// index.html の初期化スクリプトと同じキー・形式（JSON 文字列）
const THEME_KEY = "yaritaikoto.theme.v1";

// スマホのステータスバーの色（index.css の --bg と同じ。index.html の初期化スクリプトにも同じ値がある）
const THEME_COLORS: Record<Theme, string> = { dark: "#08111f", light: "#f3f5f8" };

function parseTheme(raw: string | null): Theme {
  try {
    return raw !== null && JSON.parse(raw) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

/** 配色テーマ（暗いネイビー / 白背景）。localStorage に保存し、<html data-theme> に反映する */
export function useTheme() {
  const [theme, setTheme] = usePersistentState<Theme>(THEME_KEY, parseTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
  }, [theme]);

  return {
    theme,
    toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
  };
}
