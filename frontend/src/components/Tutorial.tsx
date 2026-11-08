import { useEffect, useRef, useState, type ReactNode } from "react";
import step1Light from "../assets/tutorial/step1-add-light.webp";
import step1Dark from "../assets/tutorial/step1-add.webp";
import step2Light from "../assets/tutorial/step2-pick-light.webp";
import step2Dark from "../assets/tutorial/step2-pick.webp";
import step3Light from "../assets/tutorial/step3-done-light.webp";
import step3Dark from "../assets/tutorial/step3-done.webp";
import step4Light from "../assets/tutorial/step4-history-light.webp";
import step4Dark from "../assets/tutorial/step4-history.webp";
import type { Theme } from "../hooks/useTheme";
import { AddListIcon, CheckCircleIcon, CloseIcon, DiceIcon, HistoryIcon } from "./icons";

// 画像は scripts/capture-tutorial.mjs で実際の画面から配色テーマごとに撮影している（UI を変えたら撮り直す）
type Step = {
  icon: ReactNode;
  title: string;
  body: string;
  image: Record<Theme, string>;
  imageAlt: string;
};

const STEPS: Step[] = [
  {
    icon: <AddListIcon size={20} />,
    image: { dark: step1Dark, light: step1Light },
    imageAlt: "「やりたいこと」タブの登録フォーム。グループを選び、内容を入力して「登録」を押す",
    title: "やりたいことを登録",
    body: "「やりたいこと」タブで入力して「登録」します。「勉強」「遊び」などのグループに分けておけます。",
  },
  {
    icon: <DiceIcon size={20} />,
    image: { dark: step2Dark, light: step2Light },
    imageAlt: "「決定」タブ。対象のチップを選んで「選出」を押すと、今日やることが表示される",
    title: "今日やることを決める",
    body: "「決定」タブで対象（すべて・グループ・おまかせ）を選んで「選出」。ピンとこなければ「再選出」で選び直せます。",
  },
  {
    icon: <CheckCircleIcon size={20} />,
    image: { dark: step3Dark, light: step3Light },
    imageAlt: "「今日やること」タグが付いた項目の「やった」ボタン",
    title: "やったら記録する",
    body: "取り組んだら「やりたいこと」タブで「やった」を押します。選出しただけでは完了になりません。",
  },
  {
    icon: <HistoryIcon size={20} />,
    image: { dark: step4Dark, light: step4Light },
    imageAlt: "「やったこと」タブの一覧と「やっぱやってなかった」ボタン",
    title: "振り返る・取り消す",
    body: "「やったこと」タブでこれまでの記録を確認できます。間違えたときは「やっぱやってなかった」で戻せます。",
  },
];

type Props = {
  theme: Theme;
  onClose: () => void;
};

/** 使い方のチュートリアル。表示中だけマウントする */
function Tutorial({ theme, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  // モーダルとして開く（フォーカス管理・Esc で閉じる・背面操作の無効化はブラウザに任せる）
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const close = () => dialogRef.current?.close();

  return (
    <dialog
      ref={dialogRef}
      className="tutorial"
      aria-labelledby="tutorial-title"
      onClose={onClose}
      onClick={(e) => {
        // 背景（ダイアログ外）クリックで閉じる
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="tutorial-inner">
        <div className="tutorial-head">
          <span className="muted small">
            使い方 {index + 1} / {STEPS.length}
          </span>
          <button type="button" className="icon-button" onClick={close} aria-label="閉じる">
            <CloseIcon size={22} />
          </button>
        </div>

        <div key={index} className="tutorial-step" aria-live="polite">
          <div className="tutorial-shot">
            <img src={step.image[theme]} alt={step.imageAlt} />
          </div>
          <h2 id="tutorial-title">
            <span className="tutorial-icon">{step.icon}</span>
            {step.title}
          </h2>
          <p>{step.body}</p>
        </div>

        <div className="dots" aria-hidden="true">
          {STEPS.map((s, i) => (
            <span key={s.title} className={i === index ? "dot is-active" : "dot"} />
          ))}
        </div>

        <div className="tutorial-foot">
          <button
            type="button"
            className="ghost"
            onClick={() => setIndex((i) => i - 1)}
            disabled={index === 0}
          >
            戻る
          </button>
          <button
            type="button"
            className="primary"
            onClick={() => (isLast ? close() : setIndex((i) => i + 1))}
          >
            {isLast ? "はじめる" : "次へ"}
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default Tutorial;
