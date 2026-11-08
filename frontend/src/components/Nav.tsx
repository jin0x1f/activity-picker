export type Screen = "decide" | "todo" | "done";

const LABELS: Record<Screen, string> = {
  decide: "決定",
  todo: "やりたいこと",
  done: "やったこと",
};

type Props = {
  current: Screen;
  counts: Partial<Record<Screen, number>>;
  onChange: (screen: Screen) => void;
};

function Nav({ current, counts, onChange }: Props) {
  return (
    <nav className="nav" aria-label="画面切り替え">
      {(Object.keys(LABELS) as Screen[]).map((screen) => {
        const count = counts[screen];
        return (
          <button
            key={screen}
            type="button"
            className="nav-button"
            aria-current={screen === current ? "page" : undefined}
            onClick={() => onChange(screen)}
          >
            <span className="nav-label">{LABELS[screen]}</span>
            {count !== undefined && (
              <span className="badge" aria-label={`${count}件`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

export default Nav;
