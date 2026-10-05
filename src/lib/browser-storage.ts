// Keep the current journey usable when storage is blocked or its quota is full.
// This fallback is deliberately ephemeral: it does not survive a page reload.
const sessionValues = new Map<string, string>();

export function readBrowserStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  if (sessionValues.has(key)) return sessionValues.get(key)!;
  try {
    return window.localStorage.getItem(key);
  } catch {
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
    return false;
  }
}

export function removeBrowserStorage(key: string): void {
  sessionValues.delete(key);
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // A denied store has no accessible value to remove.
  }
}
