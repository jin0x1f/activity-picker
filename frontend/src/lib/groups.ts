import { generateId } from "./id.ts";

export type Group = {
  id: string;
  name: string;
};

export const DEFAULT_GROUPS: Group[] = [
  { id: "study", name: "勉強" },
  { id: "play", name: "遊び" },
];

/** グループ導入前に登録された項目の移行先（「遊び」） */
export const LEGACY_GROUP_ID = "play";

export type NameResult = { ok: true; name: string } | { ok: false; error: string };

/**
 * グループ名の入力チェック。空・空白のみ、既存グループとの重複は不可。
 * selfId を渡すと、そのグループ自身との重複は許す（名前変更用）
 */
export function validateGroupName(groups: Group[], input: string, selfId?: string): NameResult {
  const name = input.trim();
  if (name === "") return { ok: false, error: "グループ名を入力してください。" };
  if (groups.some((g) => g.name === name && g.id !== selfId)) {
    return { ok: false, error: `「${name}」はすでにあります。` };
  }
  return { ok: true, name };
}

export function addGroup(groups: Group[], name: string): Group[] {
  return [...groups, { id: generateId(), name }];
}

export function renameGroup(groups: Group[], id: string, name: string): Group[] {
  return groups.map((g) => (g.id === id ? { ...g, name } : g));
}

export function removeGroup(groups: Group[], id: string): Group[] {
  return groups.filter((g) => g.id !== id);
}

function isGroup(value: unknown): value is Group {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === "string" && typeof v.name === "string";
}

/** 保存データを読み込む。未保存・壊れたデータ・0件なら初期グループを返す */
export function parseGroups(raw: string | null): Group[] {
  if (raw === null) return DEFAULT_GROUPS;
  try {
    const data: unknown = JSON.parse(raw);
    const groups = Array.isArray(data) ? data.filter(isGroup) : [];
    return groups.length > 0 ? groups : DEFAULT_GROUPS;
  } catch {
    return DEFAULT_GROUPS;
  }
}
