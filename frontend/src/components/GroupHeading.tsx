import { useState, type FormEvent } from "react";
import { validateGroupName, type Group } from "../lib/groups";
import { PencilIcon, TrashIcon } from "./icons";

type Props = {
  group: Group;
  groups: Group[];
  /** このグループの未完了件数 */
  count: number;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
};

type Mode =
  | { kind: "view" }
  | { kind: "editing"; name: string; error: string | null }
  | { kind: "confirming" }
  | { kind: "blocked"; reason: string };

/** 削除できない理由。削除できるなら null */
function removeBlockReason(groups: Group[], count: number): string | null {
  if (groups.length <= 1) return "グループは最低1つ必要です。";
  if (count > 0) return "未完了のやりたいことを別のグループに移すか、削除してから消せます。";
  return null;
}

/** 一覧のグループ見出し。その場で名前変更・削除ができる */
function GroupHeading({ group, groups, count, onRename, onRemove }: Props) {
  const [mode, setMode] = useState<Mode>({ kind: "view" });

  const handleRename = (e: FormEvent) => {
    e.preventDefault();
    if (mode.kind !== "editing") return;
    const result = validateGroupName(groups, mode.name, group.id);
    if (!result.ok) {
      setMode({ ...mode, error: result.error });
      return;
    }
    onRename(group.id, result.name);
    setMode({ kind: "view" });
  };

  const handleRemoveClick = () => {
    const reason = removeBlockReason(groups, count);
    setMode(reason ? { kind: "blocked", reason } : { kind: "confirming" });
  };

  if (mode.kind === "editing") {
    return (
      <div className="group-head">
        <form className="inline-form" onSubmit={handleRename} noValidate>
          <input
            type="text"
            value={mode.name}
            onChange={(e) => setMode({ ...mode, name: e.target.value, error: null })}
            onKeyDown={(e) => {
              if (e.key === "Escape") setMode({ kind: "view" });
            }}
            aria-label="グループ名"
            aria-invalid={mode.error !== null}
            autoFocus
          />
          <button type="button" className="ghost" onClick={() => setMode({ kind: "view" })}>
            キャンセル
          </button>
          <button type="submit" className="primary">
            保存
          </button>
        </form>
        {mode.error && (
          <p className="error" role="alert">
            {mode.error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="group-head">
      <div className="group-head-row">
        <h3 className="group-heading">
          {group.name}
          <span className="muted small">{count}件</span>
        </h3>
        {mode.kind === "confirming" ? (
          <div className="actions">
            <span className="confirm-text">グループを削除しますか？</span>
            <button type="button" className="ghost" onClick={() => setMode({ kind: "view" })}>
              キャンセル
            </button>
            <button
              type="button"
              className="danger"
              autoFocus
              onClick={() => {
                setMode({ kind: "view" });
                onRemove(group.id);
              }}
            >
              削除する
            </button>
          </div>
        ) : (
          <div className="actions">
            <button
              type="button"
              className="icon-button small-icon"
              aria-label={`「${group.name}」の名前を変更`}
              onClick={() => setMode({ kind: "editing", name: group.name, error: null })}
            >
              <PencilIcon size={18} />
            </button>
            <button
              type="button"
              className="icon-button small-icon"
              aria-label={`「${group.name}」を削除`}
              onClick={handleRemoveClick}
            >
              <TrashIcon size={18} />
            </button>
          </div>
        )}
      </div>
      {mode.kind === "blocked" && (
        <p className="note" role="status">
          {mode.reason}
          <button type="button" className="ghost" onClick={() => setMode({ kind: "view" })}>
            OK
          </button>
        </p>
      )}
    </div>
  );
}

export default GroupHeading;
