export function generateId(): string {
  // randomUUID は安全なコンテキスト（https / localhost）でしか使えないためフォールバックを用意
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
