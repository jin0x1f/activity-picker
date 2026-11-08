import { useState } from "react";
import type { Group } from "../lib/groups";
import {
  candidates,
  pickForTarget,
  todoItems,
  type Item,
  type PickTarget,
} from "../lib/items";

type Props = {
  items: Item[];
  groups: Group[];
  target: PickTarget;
  picked: Item | null;
  onTargetChange: (target: PickTarget) => void;
  onPick: (id: string | null) => void;
  onGoToTodo: () => void;
};

function Intro() {
  return (
    <div className="card intro">
      <p className="intro-title">迷ったら、運に任せよう。</p>
      <p>登録したやりたいことから、今日やることをランダムに1つ決めるアプリです。</p>
    </div>
  );
}

function isSameTarget(a: PickTarget, b: PickTarget): boolean {
  if (a.kind === "group" && b.kind === "group") return a.groupId === b.groupId;
  return a.kind === b.kind;
}

function DecidePage({
  items,
  groups,
  target,
  picked,
  onTargetChange,
  onPick,
  onGoToTodo,
}: Props) {
  // 同じ項目が再選出されても、選び直したことが分かるようアニメーションを再生する
  const [pickCount, setPickCount] = useState(0);

  const todos = todoItems(items);
  const targetCount = candidates(items, target).length;
  const pickedGroup = groups.find((g) => g.id === picked?.groupId);

  const pick = () => {
    onPick(pickForTarget(items, target)?.id ?? null);
    setPickCount((n) => n + 1);
  };

  if (todos.length === 0) {
    return (
      <section className="page">
        <Intro />
        <div className="page-head">
          <h2>今日やること</h2>
        </div>
        <div className="card empty">
          <p className="empty-title">未完了のやりたいことがありません</p>
          <p className="muted">まずはやりたいことを登録しましょう。</p>
          <button type="button" className="primary" onClick={onGoToTodo}>
            やりたいことを登録する
          </button>
        </div>
      </section>
    );
  }

  const options: { target: PickTarget; label: string; count: number }[] = [
    { target: { kind: "all" }, label: "すべて", count: todos.length },
    ...groups.map((g) => ({
      target: { kind: "group", groupId: g.id } as PickTarget,
      label: g.name,
      count: candidates(items, { kind: "group", groupId: g.id }).length,
    })),
  ];

  return (
    <section className="page">
      <Intro />
      <div className="page-head">
        <h2>今日やること</h2>
      </div>

      <div className="target" role="radiogroup" aria-label="選出の対象">
        {options.map((option) => {
          const selected = isSameTarget(option.target, target);
          return (
            <button
              key={option.target.kind === "group" ? option.target.groupId : option.target.kind}
              type="button"
              role="radio"
              aria-checked={selected}
              className="chip"
              onClick={() => onTargetChange(option.target)}
            >
              {option.label}
              <span className="chip-count">{option.count}</span>
            </button>
          );
        })}
      </div>

      <div className="card result" aria-live="polite">
        {picked ? (
          <div key={pickCount} className="result-body">
            <span className="result-label">今日はこれ</span>
            {pickedGroup && <span className="group-tag large">{pickedGroup.name}</span>}
            <p className="result-text">{picked.text}</p>
          </div>
        ) : (
          <>
            <span className="result-placeholder" aria-hidden="true">
              ?
            </span>
            <p className="muted">「選出」を押すと、やりたいことから1つ選びます。</p>
          </>
        )}
      </div>

      <div className="stack">
        {targetCount === 0 ? (
          <p className="muted small center">
            このグループには未完了のやりたいことがありません。
          </p>
        ) : (
          <p className="muted small center">{targetCount}件の中から選びます</p>
        )}
        <button type="button" className="primary" onClick={pick} disabled={targetCount === 0}>
          {picked ? "再選出" : "選出"}
        </button>
        {picked && (
          <button type="button" className="ghost" onClick={onGoToTodo}>
            取り組んだら一覧で「やった」にする →
          </button>
        )}
      </div>
    </section>
  );
}

export default DecidePage;
