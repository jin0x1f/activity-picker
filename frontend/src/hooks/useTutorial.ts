import { useState } from "react";
import { loadItem, saveItem } from "../storage";

const SEEN_KEY = "yaritaikoto.tutorialSeen.v1";

// 保存できない環境では、次回起動時にも表示される
const hasSeen = () => loadItem(SEEN_KEY) === "1";
const markSeen = () => saveItem(SEEN_KEY, "1");

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
