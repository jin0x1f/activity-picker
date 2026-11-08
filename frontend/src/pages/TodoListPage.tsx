import { useRef, useState, type FormEvent } from "react";
import AddGroupForm from "../components/AddGroupForm";
import GroupHeading from "../components/GroupHeading";
import Select from "../components/Select";
import type { Group } from "../lib/groups";
import { normalizeText, type Item } from "../lib/items";

type Props = {
  todos: Item[];
  groups: Group[];
  pickedId: string | null;
  onAdd: (text: string, groupId: string) => void;
  onMove: (id: string, groupId: string) => void;
  onRemove: (id: string) => void;
  onComplete: (id: string) => void;
  onAddGroup: (name: string) => void;
  onRenameGroup: (id: string, name: string) => void;
  onRemoveGroup: (id: string) => void;
};

function TodoListPage({
  todos,
  groups,
  pickedId,
  onAdd,
  onMove,
  onRemove,
  onComplete,
  onAddGroup,
  onRenameGroup,
  onRemoveGroup,
}: Props) {
  const [input, setInput] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0].id);
  const [error, setError] = useState<string | null>(null);
  // 削除は誤タップ防止のため、確認を挟む2段階操作にする
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 選択中のグループが削除された場合は先頭のグループに登録する
  const groupId = groups.some((g) => g.id === selectedGroupId) ? selectedGroupId : groups[0].id;

  const groupOptions = groups.map((g) => ({ value: g.id, label: g.name }));

  const todosByGroup = groups.map((group) => ({
    group,
    items: todos.filter((item) => item.groupId === group.id),
  }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = normalizeText(input);
    if (text === null) {
      setError("やりたいことを入力してください。");
    } else {
      onAdd(text, groupId);
      setInput("");
      setError(null);
    }
    inputRef.current?.focus();
  };

  return (
    <section className="page">
      <div className="page-head">
        <h2>やりたいこと一覧</h2>
        <span className="muted small">未完了 {todos.length}件</span>
      </div>

      <div className="card">
        <form className="add-form wrap" onSubmit={handleSubmit} noValidate>
          <Select
            className="add-form-group"
            value={groupId}
            options={groupOptions}
            onChange={setSelectedGroupId}
            aria-label="登録するグループ"
          />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (error) setError(null);
            }}
            placeholder="例: 映画を観る"
            aria-label="やりたいこと"
            aria-invalid={error !== null}
            aria-describedby={error ? "add-error" : undefined}
            enterKeyHint="done"
          />
          <button type="submit" className="primary">
            登録
          </button>
        </form>
        {error && (
          <p id="add-error" className="error" role="alert">
            {error}
          </p>
        )}
      </div>

      {todos.length === 0 && (
        <div className="card empty">
          <p className="empty-title">まだ登録されていません</p>
          <p className="muted">上の入力欄から、やりたいことを追加しましょう。</p>
        </div>
      )}

      {todosByGroup.map(({ group, items }) => (
        <section key={group.id} className="group-section" aria-label={group.name}>
          <GroupHeading
            group={group}
            groups={groups}
            count={items.length}
            onRename={onRenameGroup}
            onRemove={onRemoveGroup}
          />
          {items.length === 0 ? (
            <p className="muted small group-empty">このグループにはまだありません。</p>
          ) : (
            <ul className="card list">
              {items.map((item) => {
                const isPicked = item.id === pickedId;
                const isConfirming = item.id === confirmingId;
                return (
                  <li
                    key={item.id}
                    className={[
                      "list-item",
                      isPicked && "is-picked",
                      isConfirming && "is-confirming",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <div className="item-body">
                      {isPicked && <span className="tag">今日やること</span>}
                      <span className="item-text">{item.text}</span>
                      {groups.length > 1 && (
                        <Select
                          variant="compact"
                          className="move-select"
                          value={item.groupId}
                          options={groupOptions}
                          onChange={(groupId) => onMove(item.id, groupId)}
                          aria-label={`「${item.text}」のグループ`}
                        />
                      )}
                    </div>
                    {isConfirming ? (
                      <div className="actions">
                        <span className="confirm-text">削除しますか？</span>
                        <button
                          type="button"
                          className="ghost"
                          onClick={() => setConfirmingId(null)}
                        >
                          キャンセル
                        </button>
                        <button
                          type="button"
                          className="danger"
                          autoFocus
                          onClick={() => {
                            setConfirmingId(null);
                            onRemove(item.id);
                          }}
                        >
                          削除する
                        </button>
                      </div>
                    ) : (
                      <div className="actions">
                        <button
                          type="button"
                          className="outline check"
                          onClick={() => onComplete(item.id)}
                        >
                          やった
                        </button>
                        <button
                          type="button"
                          className="ghost"
                          onClick={() => setConfirmingId(item.id)}
                        >
                          削除
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ))}

      <AddGroupForm groups={groups} onAdd={onAddGroup} />
    </section>
  );
}

export default TodoListPage;
