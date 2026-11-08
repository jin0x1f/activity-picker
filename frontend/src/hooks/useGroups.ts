import { useCallback } from "react";
import { addGroup, parseGroups, removeGroup, renameGroup } from "../lib/groups";
import { usePersistentState } from "./usePersistentState";

const STORAGE_KEY = "yaritaikoto.groups.v1";

/** グループの一覧を管理し、localStorage に保存する */
export function useGroups() {
  const [groups, setGroups] = usePersistentState(STORAGE_KEY, parseGroups);

  return {
    groups,
    add: useCallback((name: string) => setGroups((prev) => addGroup(prev, name)), [setGroups]),
    rename: useCallback(
      (id: string, name: string) => setGroups((prev) => renameGroup(prev, id, name)),
      [setGroups],
    ),
    remove: useCallback((id: string) => setGroups((prev) => removeGroup(prev, id)), [setGroups]),
  };
}
