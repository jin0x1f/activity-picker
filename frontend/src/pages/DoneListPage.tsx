import type { Group } from "../lib/groups";
import type { Item } from "../lib/items";

type Props = {
  done: Item[];
  groups: Group[];
  onReopen: (id: string) => void;
};

const dateFormat = new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" });

function DoneListPage({ done, groups, onReopen }: Props) {
  const groupName = (id: string) => groups.find((g) => g.id === id)?.name;

  return (
    <section className="page">
      <div className="page-head">
        <h2>やったこと一覧</h2>
        {done.length > 0 && <span className="muted small">これまでに {done.length}件</span>}
      </div>

      {done.length === 0 ? (
        <div className="card empty">
          <p className="empty-title">まだやったことはありません</p>
          <p className="muted">やりたいこと一覧で「やった」にすると、ここに記録されます。</p>
        </div>
      ) : (
        <ul className="card list">
          {done.map((item) => (
            <li key={item.id} className="list-item">
              <div className="item-body">
                <span className="item-text">{item.text}</span>
                <div className="item-meta">
                  {/* グループ削除後の完了項目はグループ名を出さない */}
                  {groupName(item.groupId) && (
                    <span className="group-tag">{groupName(item.groupId)}</span>
                  )}
                  {item.completedAt && (
                    <time className="muted small" dateTime={item.completedAt}>
                      {dateFormat.format(new Date(item.completedAt))}
                    </time>
                  )}
                </div>
              </div>
              <div className="actions">
                <button type="button" className="ghost small" onClick={() => onReopen(item.id)}>
                  やっぱやってなかった
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default DoneListPage;
