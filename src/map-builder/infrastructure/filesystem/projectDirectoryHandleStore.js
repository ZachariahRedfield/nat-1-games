import localforage from "localforage";
import { DIR_HANDLE_KEY } from "../persistence/persistenceKeys.js";

export async function getStoredProjectDirectoryHandle() {
  if (!localforage) return null;
  try {
    const handle = await localforage.getItem(DIR_HANDLE_KEY);
    return handle || null;
  } catch {
    return null;
  }
}

export async function setStoredProjectDirectoryHandle(handle) {
  if (!localforage) return;
  try {
    await localforage.setItem(DIR_HANDLE_KEY, handle);
  } catch {
    // ignore
  }
}
