import { useCallback } from "react";
import {
  addItem,
  completeItem,
  moveItem,
  parseItems,
  removeItem,
  reopenItem,
} from "../lib/items";
import { usePersistentState } from "./usePersistentState";

const STORAGE_KEY = "yaritaikoto.items.v1";

/** やりたいことの一覧を管理し、localStorage に保存する */
export function useItems() {
  const [items, setItems] = usePersistentState(STORAGE_KEY, parseItems);

  return {
    items,
    add: useCallback(
      (text: string, groupId: string) => setItems((prev) => addItem(prev, text, groupId)),
      [setItems],
    ),
    remove: useCallback((id: string) => setItems((prev) => removeItem(prev, id)), [setItems]),
    move: useCallback(
      (id: string, groupId: string) => setItems((prev) => moveItem(prev, id, groupId)),
      [setItems],
    ),
    complete: useCallback((id: string) => setItems((prev) => completeItem(prev, id)), [setItems]),
    reopen: useCallback((id: string) => setItems((prev) => reopenItem(prev, id)), [setItems]),
  };
}
