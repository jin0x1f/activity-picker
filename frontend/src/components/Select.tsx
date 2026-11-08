import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { CheckIcon, ChevronDownIcon } from "./icons";

export type SelectOption = { value: string; label: string };

type Props = {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  "aria-label": string;
  /** field: 入力欄と並ぶ大きさ / compact: 項目内の小さな切り替え */
  variant?: "field" | "compact";
  className?: string;
};

const MENU_GAP = 6;
const MENU_MAX_HEIGHT = 264;

/**
 * アプリのデザインに合わせたプルダウン（ネイティブ <select> の置き換え）。
 * WAI-ARIA の select-only combobox パターンに従い、フォーカスはボタンに残したまま
 * 矢印キー・Home/End・Enter/Space・Esc・文字入力で操作できる。
 */
function Select({
  value,
  options,
  onChange,
  "aria-label": ariaLabel,
  variant = "field",
  className,
}: Props) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const selected = options[selectedIndex];

  const openMenu = (index = selectedIndex) => {
    setActiveIndex(index);
    setOpen(true);
  };

  const closeMenu = () => setOpen(false);

  const choose = (index: number) => {
    const option = options[index];
    if (option && option.value !== value) onChange(option.value);
    closeMenu();
  };

  // 親の overflow に切られないよう fixed で配置し、下に入らなければ上に開く
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom - MENU_GAP;
      const above = rect.top - MENU_GAP;
      const openUp = below < Math.min(MENU_MAX_HEIGHT, 160) && above > below;
      setMenuStyle({
        left: Math.min(rect.left, window.innerWidth - 8 - Math.max(rect.width, 160)),
        minWidth: Math.max(rect.width, 160),
        maxHeight: Math.min(MENU_MAX_HEIGHT, (openUp ? above : below) - 8),
        ...(openUp
          ? { bottom: window.innerHeight - rect.top + MENU_GAP }
          : { top: rect.bottom + MENU_GAP }),
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  // 外側をクリック・タップしたら閉じる
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      closeMenu();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  // キーボード操作中の項目を見える位置に保つ
  useEffect(() => {
    if (!open) return;
    menuRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const last = options.length - 1;
    const move = (index: number) => {
      e.preventDefault();
      if (open) setActiveIndex(index);
      else openMenu(index);
    };

    switch (e.key) {
      case "ArrowDown":
        return move(open ? Math.min(activeIndex + 1, last) : selectedIndex);
      case "ArrowUp":
        return move(open ? Math.max(activeIndex - 1, 0) : selectedIndex);
      case "Home":
        return move(0);
      case "End":
        return move(last);
      case "Enter":
      case " ":
        e.preventDefault();
        if (open) choose(activeIndex);
        else openMenu();
        return;
      case "Escape":
        if (open) {
          // ダイアログ内で使っても、ダイアログごと閉じないようにする
          e.preventDefault();
          e.stopPropagation();
          closeMenu();
        }
        return;
      case "Tab":
        if (open) choose(activeIndex);
        return;
      default: {
        // 頭文字で項目に移動する
        if (e.key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey) return;
        const key = e.key.toLowerCase();
        const start = open ? activeIndex : selectedIndex;
        for (let i = 1; i <= options.length; i++) {
          const index = (start + i) % options.length;
          if (options[index].label.toLowerCase().startsWith(key)) return move(index);
        }
      }
    }
  };

  const listboxId = `${id}-listbox`;
  const optionId = (index: number) => `${id}-option-${index}`;

  return (
    <div className={["select", `select-${variant}`, className].filter(Boolean).join(" ")}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        className="select-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={open ? optionId(activeIndex) : undefined}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={handleKeyDown}
      >
        <span className="select-value">{selected?.label}</span>
        <ChevronDownIcon size={variant === "compact" ? 14 : 18} />
      </button>

      {open && (
        <ul
          ref={menuRef}
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className="select-menu"
          style={menuStyle}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            return (
              <li
                key={option.value}
                id={optionId(index)}
                role="option"
                aria-selected={isSelected}
                data-index={index}
                className={index === activeIndex ? "select-option is-active" : "select-option"}
                onPointerMove={() => setActiveIndex(index)}
                // ボタンからフォーカスを奪わない
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  choose(index);
                  triggerRef.current?.focus();
                }}
              >
                <span className="select-option-label">{option.label}</span>
                {isSelected && <CheckIcon size={16} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Select;
