import { useState } from "react";
import "./App.css";
import { HelpIcon, MoonIcon, SunIcon } from "./components/icons";
import Nav, { type Screen } from "./components/Nav";
import Tutorial from "./components/Tutorial";
import { useGroups } from "./hooks/useGroups";
import { useItems } from "./hooks/useItems";
import { useTheme } from "./hooks/useTheme";
import { useTutorial } from "./hooks/useTutorial";
import { doneItems, reconcileItems, todoItems, type PickTarget } from "./lib/items";
import DecidePage from "./pages/DecidePage";
import DoneListPage from "./pages/DoneListPage";
import TodoListPage from "./pages/TodoListPage";

function App() {
  const [screen, setScreen] = useState<Screen>("decide");
  // 選出結果と選出対象は画面を切り替えても保持する（保存はしない）
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [target, setTarget] = useState<PickTarget>({ kind: "all" });
  const tutorial = useTutorial();
  const theme = useTheme();
  const isDark = theme.theme === "dark";
  const themeLabel = isDark ? "白背景に切り替える" : "暗い背景に切り替える";
  const groupStore = useGroups();
  const itemStore = useItems();
  const { groups } = groupStore;

  const items = reconcileItems(itemStore.items, groups);
  const todos = todoItems(items);
  const done = doneItems(items);
  // 選出後に完了・削除された項目は選出結果として扱わない
  const picked = todos.find((item) => item.id === pickedId) ?? null;
  // 選択中のグループが削除されたら「すべて」に戻す
  const currentTarget: PickTarget =
    target.kind === "group" && !groups.some((g) => g.id === target.groupId)
      ? { kind: "all" }
      : target;

  const clearPickIf = (id: string) => {
    if (id === pickedId) setPickedId(null);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-row">
          <h1 className="app-title">きょう、なにする？</h1>
          <div className="header-actions">
            <button
              type="button"
              className="icon-button"
              onClick={theme.toggle}
              aria-label={themeLabel}
              title={themeLabel}
            >
              {isDark ? <SunIcon size={24} /> : <MoonIcon size={24} />}
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={tutorial.show}
              aria-label="使い方を見る"
              aria-haspopup="dialog"
            >
              <HelpIcon size={26} />
            </button>
          </div>
        </div>
        <Nav
          current={screen}
          counts={{ todo: todos.length, done: done.length }}
          onChange={setScreen}
        />
      </header>
      <main>
        {screen === "decide" && (
          <DecidePage
            items={items}
            groups={groups}
            target={currentTarget}
            picked={picked}
            onTargetChange={setTarget}
            onPick={setPickedId}
            onGoToTodo={() => setScreen("todo")}
          />
        )}
        {screen === "todo" && (
          <TodoListPage
            todos={todos}
            groups={groups}
            pickedId={picked?.id ?? null}
            onAdd={itemStore.add}
            onMove={itemStore.move}
            onRemove={(id) => {
              clearPickIf(id);
              itemStore.remove(id);
            }}
            onComplete={(id) => {
              clearPickIf(id);
              itemStore.complete(id);
            }}
            onAddGroup={groupStore.add}
            onRenameGroup={groupStore.rename}
            onRemoveGroup={groupStore.remove}
          />
        )}
        {screen === "done" && (
          <DoneListPage done={done} groups={groups} onReopen={itemStore.reopen} />
        )}
      </main>
      {tutorial.open && <Tutorial theme={theme.theme} onClose={tutorial.close} />}
    </div>
  );
}

export default App;
