import localforage from "localforage";
import { PARENT_DIR_HANDLE_KEY } from "../persistence/persistenceKeys.js";
import { resolveAccountKey, normalizeAccountKey, SHARED_ACCOUNT_KEY } from "./accountScope.js";

const HANDLE_STORE_VERSION = 2;

function isFileSystemDirectoryHandleLike(value) {
  return value && typeof value === "object" && typeof value.kind === "string" && value.kind === "directory";
}

async function readParentHandleStore() {
  if (!localforage) {
    return { handles: {}, needsPersist: false };
  }

  try {
    const stored = await localforage.getItem(PARENT_DIR_HANDLE_KEY);
    if (!stored) {
      return { handles: {}, needsPersist: false };
    }

    if (stored && typeof stored === "object" && stored.version === HANDLE_STORE_VERSION && stored.handles) {
      return { handles: { ...stored.handles }, needsPersist: false };
    }

    if (stored && typeof stored === "object" && stored.handles) {
      return { handles: { ...stored.handles }, needsPersist: true };
    }

    if (stored && typeof stored === "object" && "handle" in stored) {
      const key = stored.accountId ? normalizeAccountKey(stored.accountId) : SHARED_ACCOUNT_KEY;
      const handle = stored.handle && isFileSystemDirectoryHandleLike(stored.handle) ? stored.handle : stored.handle;
      const handles = handle ? { [key]: handle } : {};
      return { handles, needsPersist: true };
    }

    if (isFileSystemDirectoryHandleLike(stored)) {
      return { handles: { [SHARED_ACCOUNT_KEY]: stored }, needsPersist: true };
    }

    return { handles: {}, needsPersist: false };
  } catch {
    return { handles: {}, needsPersist: false };
  }
}

async function writeParentHandleStore(handles) {
  if (!localforage) return;
  try {
    const entries = Object.entries(handles || {}).filter(([, handle]) => Boolean(handle));
    if (!entries.length) {
      await localforage.removeItem(PARENT_DIR_HANDLE_KEY);
      return;
    }
    const normalized = Object.fromEntries(entries);
    await localforage.setItem(PARENT_DIR_HANDLE_KEY, { version: HANDLE_STORE_VERSION, handles: normalized });
  } catch {
    // ignore persist failures
  }
}

export async function getStoredParentDirectoryHandle(accountId) {
  if (!localforage) return null;
  try {
    const accountKey = resolveAccountKey(accountId);
    const { handles, needsPersist } = await readParentHandleStore();
    if (needsPersist) {
      await writeParentHandleStore(handles);
    }
    const handle = handles[accountKey];
    if (handle) return handle;
    if (accountKey === SHARED_ACCOUNT_KEY) {
      return handles[SHARED_ACCOUNT_KEY] || null;
    }
    return null;
  } catch {
    return null;
  }
}

export async function setStoredParentDirectoryHandle(handle, accountId) {
  if (!localforage) return;
  try {
    const accountKey = resolveAccountKey(accountId);
    const { handles } = await readParentHandleStore();
    if (!handle) {
      if (handles[accountKey]) {
        delete handles[accountKey];
        await writeParentHandleStore(handles);
      }
      return;
    }
    handles[accountKey] = handle;
    if (accountKey !== SHARED_ACCOUNT_KEY && handles[SHARED_ACCOUNT_KEY]) {
      delete handles[SHARED_ACCOUNT_KEY];
    }
    await writeParentHandleStore(handles);
  } catch {
    // ignore
  }
}
