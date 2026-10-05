// Keep the current journey usable when storage is blocked or its quota is full.
// This fallback is deliberately ephemeral: it does not survive a page reload.
const sessionValues = new Map<string, string | null>();
const unavailableKeys = new Set<string>();
const listeners = new Set<() => void>();
function markUnavailable(key: string) {
  unavailableKeys.add(key);
  for (const listener of listeners) listener();
}
export function hasStorageIssue() {
  return unavailableKeys.size > 0;
}
export function subscribeStorageIssues(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readBrowserStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  if (sessionValues.has(key)) return sessionValues.get(key)!;
  try {
    return window.localStorage.getItem(key);
  } catch {
    markUnavailable(key);
    return null;
  }
}

export function writeBrowserStorage(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, value);
    sessionValues.delete(key);
    return true;
  } catch {
    sessionValues.set(key, value);
    markUnavailable(key);
    return false;
  }
}

export function removeBrowserStorage(key: string): boolean {
  sessionValues.delete(key);
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    // A read-only store may still contain the old value. Hide it for this session.
    sessionValues.set(key, null);
    markUnavailable(key);
    return false;
  }
}
