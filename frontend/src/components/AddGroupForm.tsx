import { useState, type FormEvent } from "react";
import { validateGroupName, type Group } from "../lib/groups";
import { PlusIcon } from "./icons";

type Props = {
  groups: Group[];
  onAdd: (name: string) => void;
};

/** 一覧の末尾に置く「グループを追加」。押すとその場で入力欄に変わる */
function AddGroupForm({ groups, onAdd }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const cancel = () => {
    setEditing(false);
    setName("");
    setError(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = validateGroupName(groups, name);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onAdd(result.name);
    cancel();
  };

  if (!editing) {
    return (
      <button type="button" className="add-group" onClick={() => setEditing(true)}>
        <PlusIcon size={18} />
        グループを追加
      </button>
    );
  }

  return (
    <div className="card add-group-form">
      <form className="inline-form" onSubmit={handleSubmit} noValidate>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") cancel();
          }}
          placeholder="例: 運動"
          aria-label="新しいグループ名"
          aria-invalid={error !== null}
          autoFocus
        />
        <button type="button" className="ghost" onClick={cancel}>
          キャンセル
        </button>
        <button type="submit" className="primary">
          追加
        </button>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default AddGroupForm;
