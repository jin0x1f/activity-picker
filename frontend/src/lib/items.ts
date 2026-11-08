import { LEGACY_GROUP_ID, type Group } from "./groups.ts";
import { generateId } from "./id.ts";

export type ItemStatus = "todo" | "done";

export type Item = {
  id: string;
  text: string;
  /** 所属グループ。完了済み項目はグループ削除後も元の ID を保持する */
  groupId: string;
  status: ItemStatus;
  createdAt: string;
  /** 完了にした日時（ISO 文字列）。未完了なら null */
  completedAt: string | null;
};

/** 空・空白のみの入力は null を返す（登録しない） */
export function normalizeText(input: string): string | null {
  const text = input.trim();
  return text === "" ? null : text;
}

export function addItem(items: Item[], text: string, groupId: string, now = new Date()): Item[] {
  const item: Item = {
    id: generateId(),
    text,
    groupId,
    status: "todo",
    createdAt: now.toISOString(),
    completedAt: null,
  };
  return [...items, item];
}

/** 未完了一覧からの削除。完了済み項目は削除しない */
export function removeItem(items: Item[], id: string): Item[] {
  return items.filter((item) => !(item.id === id && item.status === "todo"));
}

export function moveItem(items: Item[], id: string, groupId: string): Item[] {
  return items.map((item) => (item.id === id ? { ...item, groupId } : item));
}

export function completeItem(items: Item[], id: string, now = new Date()): Item[] {
  return items.map((item) =>
    item.id === id && item.status === "todo"
      ? { ...item, status: "done", completedAt: now.toISOString() }
      : item,
  );
}

export function reopenItem(items: Item[], id: string): Item[] {
  return items.map((item) =>
    item.id === id && item.status === "done"
      ? { ...item, status: "todo", completedAt: null }
      : item,
  );
}

export function todoItems(items: Item[]): Item[] {
  return items.filter((item) => item.status === "todo");
}

/** 完了日時の新しい順 */
export function doneItems(items: Item[]): Item[] {
  return items
    .filter((item) => item.status === "done")
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
}

/**
 * 存在しないグループに属する未完了項目を先頭のグループに寄せる。
 * 別タブでのグループ削除などで不整合が起きても、未完了項目が迷子にならないようにする
 */
export function reconcileItems(items: Item[], groups: Group[]): Item[] {
  const ids = new Set(groups.map((g) => g.id));
  const fallback = groups[0]?.id;
  if (fallback === undefined) return items;
  return items.map((item) =>
    item.status === "todo" && !ids.has(item.groupId) ? { ...item, groupId: fallback } : item,
  );
}

/** 等確率で1件選ぶ。空なら null */
function pickOne<T>(list: T[], random: () => number): T | null {
  if (list.length === 0) return null;
  return list[Math.floor(random() * list.length)];
}

/** 選出対象: すべて / 特定グループ */
export type PickTarget = { kind: "all" } | { kind: "group"; groupId: string };

/** 選出対象になる未完了項目 */
export function candidates(items: Item[], target: PickTarget): Item[] {
  const todos = todoItems(items);
  return target.kind === "group" ? todos.filter((item) => item.groupId === target.groupId) : todos;
}

/** 対象の未完了項目から等確率で1件選ぶ。対象がなければ null */
export function pickForTarget(
  items: Item[],
  target: PickTarget,
  random: () => number = Math.random,
): Item | null {
  return pickOne(candidates(items, target), random);
}

/** 保存データを読み込む際の項目チェック。groupId がない旧データは「遊び」に移行する */
function toItem(value: unknown): Item | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  const valid =
    typeof v.id === "string" &&
    typeof v.text === "string" &&
    (v.status === "todo" || v.status === "done") &&
    typeof v.createdAt === "string" &&
    (v.completedAt === null || typeof v.completedAt === "string") &&
    (v.groupId === undefined || typeof v.groupId === "string");
  if (!valid) return null;
  return {
    id: v.id as string,
    text: v.text as string,
    groupId: (v.groupId as string | undefined) ?? LEGACY_GROUP_ID,
    status: v.status as ItemStatus,
    createdAt: v.createdAt as string,
    completedAt: v.completedAt as string | null,
  };
}

/** 保存データを読み込む。壊れた・不正なデータは無視する */
export function parseItems(raw: string | null): Item[] {
  if (raw === null) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.map(toItem).filter((item): item is Item => item !== null);
  } catch {
    return [];
  }
}
