import { useState } from "react";

const SEEN_KEY = "yaritaikoto.tutorialSeen.v1";

function hasSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // 保存できない環境では、次回起動時にも表示される
  }
}

/** チュートリアルの表示状態。初回起動時は自動で開き、閉じたら既読にする */
export function useTutorial() {
  const [open, setOpen] = useState(() => !hasSeen());

  return {
    open,
    show: () => setOpen(true),
    close: () => {
      markSeen();
      setOpen(false);
    },
  };
}
