import localforage from "localforage";
import { DIR_HANDLE_KEY, PARENT_DIR_HANDLE_KEY } from "../persistence/persistenceKeys.js";
import { getSession } from "../../../auth/services/authService.js";

const HANDLE_STORE_VERSION = 2;
const SHARED_ACCOUNT_KEY = "__shared__";

function normalizeAccountKey(accountId, { treatAsUsername = false } = {}) {
  const raw = accountId == null ? "" : String(accountId);
  const trimmed = raw.trim();
  if (!trimmed) return SHARED_ACCOUNT_KEY;
  return `acct:${treatAsUsername ? trimmed.toLowerCase() : trimmed}`;
}

function resolveAccountKey(explicitAccountId) {
  if (explicitAccountId) {
    return normalizeAccountKey(explicitAccountId);
  }
  try {
    const session = getSession?.();
    if (session?.userId) {
      return normalizeAccountKey(session.userId);
    }
    if (session?.username) {
      return normalizeAccountKey(session.username, { treatAsUsername: true });
    }
  } catch {
    // ignore session lookup issues
  }
  return SHARED_ACCOUNT_KEY;
}

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

export function hasFileSystemAccess() {
  return typeof window !== "undefined" && Boolean(window.showDirectoryPicker);
}

export async function verifyPermission(handle, readWrite = false) {
  try {
    const opts = { mode: readWrite ? "readwrite" : "read" };
    if ((await handle.queryPermission?.(opts)) === "granted") return true;
    if ((await handle.requestPermission?.(opts)) === "granted") return true;
  } catch {
    // ignore
  }
  return false;
}

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

let currentProjectDirHandleMem = null;

export function getCurrentProjectDirectoryHandle() {
  return currentProjectDirHandleMem;
}

export function setCurrentProjectDirectoryHandle(handle) {
  currentProjectDirHandleMem = handle || null;
}

export function hasCurrentProjectDirectory() {
  return Boolean(currentProjectDirHandleMem);
}

export function clearCurrentProjectDirectory() {
  currentProjectDirHandleMem = null;
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
