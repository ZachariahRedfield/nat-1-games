const STORAGE_PROVIDER_KEY = "nat1-storage-provider";

export function getStoredActiveProviderKey(): string | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    return window.localStorage.getItem(STORAGE_PROVIDER_KEY);
  } catch {
    return null;
  }
}

export function setStoredActiveProviderKey(key: string | null): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    if (!key) {
      window.localStorage.removeItem(STORAGE_PROVIDER_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_PROVIDER_KEY, key);
  } catch {
    return;
  }
}
