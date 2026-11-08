import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_GROUPS,
  LEGACY_GROUP_ID,
  addGroup,
  parseGroups,
  removeGroup,
  renameGroup,
  validateGroupName,
  type Group,
} from "./groups.ts";
import {
  addItem,
  candidates,
  groupsWithTodos,
  moveItem,
  pickForTarget,
  reconcileItems,
  completeItem,
  doneItems,
  normalizeText,
  parseItems,
  pickRandom,
  removeItem,
  todoItems,
  reopenItem,
  type Item,
} from "./items.ts";

function setup(...texts: string[]): Item[] {
  return texts.reduce<Item[]>((items, text) => addItem(items, text, "play"), []);
}

/** "study:英語" のように「グループID:内容」で項目を作る */
function setupGrouped(...specs: string[]): Item[] {
  return specs.reduce<Item[]>((items, spec) => {
    const [groupId, text] = spec.split(":");
    return addItem(items, text, groupId);
  }, []);
}

test("空・空白のみの入力は登録対象にならない", () => {
  assert.equal(normalizeText(""), null);
  assert.equal(normalizeText("   　\n"), null);
  assert.equal(normalizeText("  映画  "), "映画");
});

test("登録すると未完了一覧に表示される", () => {
  const items = setup("映画");
  assert.equal(todoItems(items).length, 1);
  assert.equal(todoItems(items)[0].text, "映画");
  assert.equal(doneItems(items).length, 0);
});

test("IDは一意", () => {
  const items = setup("a", "b", "c");
  assert.equal(new Set(items.map((i) => i.id)).size, 3);
});

test("選出は未完了項目からのみ、選出しても状態は変わらない", () => {
  let items = setup("a", "b", "c");
  items = completeItem(items, items[0].id);
  for (let i = 0; i < 100; i++) {
    const picked = pickRandom(items);
    assert.ok(picked);
    assert.equal(picked.status, "todo");
  }
  assert.equal(todoItems(items).length, 2);
});

test("選出は各項目が等確率（random の値域に対して均等に割り当てる）", () => {
  const items = setup("a", "b", "c", "d");
  const picks = [0, 0.24, 0.25, 0.49, 0.5, 0.74, 0.75, 0.999].map(
    (r) => pickRandom(items, () => r)?.text,
  );
  assert.deepEqual(picks, ["a", "a", "b", "b", "c", "c", "d", "d"]);
});

test("未完了が0件なら選出結果は null", () => {
  assert.equal(pickRandom([]), null);
  let items = setup("a");
  items = completeItem(items, items[0].id);
  assert.equal(pickRandom(items), null);
});

test("やった で完了一覧に移り、完了日時が記録される", () => {
  let items = setup("a");
  const now = new Date("2026-11-08T10:00:00Z");
  items = completeItem(items, items[0].id, now);
  assert.equal(todoItems(items).length, 0);
  assert.equal(doneItems(items).length, 1);
  assert.equal(doneItems(items)[0].completedAt, now.toISOString());
});

test("やっぱやってなかった で未完了に戻り、完了日時がクリアされる", () => {
  let items = setup("a");
  items = completeItem(items, items[0].id);
  items = reopenItem(items, items[0].id);
  assert.equal(todoItems(items).length, 1);
  assert.equal(items[0].completedAt, null);
});

test("削除は未完了項目のみ", () => {
  let items = setup("a", "b");
  items = completeItem(items, items[1].id);
  items = removeItem(items, items[0].id);
  items = removeItem(items, items[0].id); // 完了済みの b は消えない
  assert.deepEqual(items.map((i) => i.text), ["b"]);
});

test("完了一覧は完了日時の新しい順", () => {
  let items = setup("a", "b");
  items = completeItem(items, items[0].id, new Date("2026-01-01"));
  items = completeItem(items, items[1].id, new Date("2026-02-01"));
  assert.deepEqual(doneItems(items).map((i) => i.text), ["b", "a"]);
});

test("保存データの読み込み: 正常値は復元し、壊れたデータは無視する", () => {
  const items = setup("a");
  assert.deepEqual(parseItems(JSON.stringify(items)), items);
  assert.deepEqual(parseItems(null), []);
  assert.deepEqual(parseItems("{broken"), []);
  assert.deepEqual(parseItems(JSON.stringify({ a: 1 })), []);
  assert.deepEqual(parseItems(JSON.stringify([...items, { id: 1 }])), items);
});

// ---------- グループ ----------

test("旧データ（groupId なし）は「遊び」に移行される", () => {
  const legacy = [
    { id: "x", text: "映画", status: "todo", createdAt: "2026-01-01T00:00:00Z", completedAt: null },
  ];
  const [item] = parseItems(JSON.stringify(legacy));
  assert.equal(item.groupId, LEGACY_GROUP_ID);
  assert.equal(DEFAULT_GROUPS.find((g) => g.id === LEGACY_GROUP_ID)?.name, "遊び");
});

test("グループの読み込み: 未保存・壊れたデータ・0件なら初期グループ（勉強・遊び）", () => {
  assert.deepEqual(parseGroups(null), DEFAULT_GROUPS);
  assert.deepEqual(parseGroups("{broken"), DEFAULT_GROUPS);
  assert.deepEqual(parseGroups("[]"), DEFAULT_GROUPS);
  const custom: Group[] = [{ id: "a", name: "運動" }];
  assert.deepEqual(parseGroups(JSON.stringify(custom)), custom);
});

test("グループ名: 空・重複は不可、名前変更では自分自身との重複は許す", () => {
  const groups = DEFAULT_GROUPS;
  assert.equal(validateGroupName(groups, "  ").ok, false);
  assert.equal(validateGroupName(groups, " 勉強 ").ok, false);
  assert.deepEqual(validateGroupName(groups, " 運動 "), { ok: true, name: "運動" });
  assert.deepEqual(validateGroupName(groups, "勉強", "study"), { ok: true, name: "勉強" });
});

test("グループの追加・名前変更・削除", () => {
  let groups = addGroup(DEFAULT_GROUPS, "運動");
  assert.deepEqual(groups.map((g) => g.name), ["勉強", "遊び", "運動"]);
  groups = renameGroup(groups, "study", "学習");
  assert.deepEqual(groups.map((g) => g.name), ["学習", "遊び", "運動"]);
  groups = removeGroup(groups, "play");
  assert.deepEqual(groups.map((g) => g.name), ["学習", "運動"]);
});

test("項目のグループを変更できる", () => {
  let items = setupGrouped("play:映画");
  items = moveItem(items, items[0].id, "study");
  assert.equal(items[0].groupId, "study");
});

test("存在しないグループの未完了項目は先頭グループへ寄せ、完了項目はそのまま", () => {
  let items = setupGrouped("gone:a", "gone:b");
  items = completeItem(items, items[1].id);
  const fixed = reconcileItems(items, DEFAULT_GROUPS);
  assert.equal(fixed[0].groupId, "study");
  assert.equal(fixed[1].groupId, "gone");
});

test("グループ指定の選出は、そのグループの未完了項目からのみ", () => {
  let items = setupGrouped("study:英語", "study:数学", "play:映画");
  items = completeItem(items, items[1].id);
  const target = { kind: "group", groupId: "study" } as const;
  assert.deepEqual(candidates(items, target).map((i) => i.text), ["英語"]);
  for (let i = 0; i < 50; i++) {
    assert.equal(pickForTarget(items, DEFAULT_GROUPS, target)?.text, "英語");
  }
  assert.equal(pickForTarget(items, DEFAULT_GROUPS, { kind: "group", groupId: "none" }), null);
});

test("おまかせは項目数に関係なくグループを等確率で選ぶ（勉強1件・遊び3件でも50:50）", () => {
  const items = setupGrouped("study:英語", "play:映画", "play:ゲーム", "play:散歩");
  // 1回目の乱数でグループ、2回目で項目を選ぶ
  const seq = (...values: number[]) => () => values.shift() ?? 0;
  assert.equal(pickForTarget(items, DEFAULT_GROUPS, { kind: "auto" }, seq(0.49, 0))?.text, "英語");
  assert.equal(pickForTarget(items, DEFAULT_GROUPS, { kind: "auto" }, seq(0.5, 0))?.text, "映画");
  assert.equal(pickForTarget(items, DEFAULT_GROUPS, { kind: "auto" }, seq(0.5, 0.99))?.text, "散歩");
});

test("おまかせは未完了項目がないグループを抽選対象から外す", () => {
  let items = setupGrouped("study:英語", "play:映画");
  items = completeItem(items, items[0].id);
  assert.deepEqual(groupsWithTodos(items, DEFAULT_GROUPS).map((g) => g.id), ["play"]);
  for (let i = 0; i < 50; i++) {
    assert.equal(pickForTarget(items, DEFAULT_GROUPS, { kind: "auto" })?.text, "映画");
  }
  assert.equal(pickForTarget([], DEFAULT_GROUPS, { kind: "auto" }), null);
});
