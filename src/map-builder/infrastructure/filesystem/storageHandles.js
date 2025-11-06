import localforage from "localforage";
import { DIR_HANDLE_KEY, PARENT_DIR_HANDLE_KEY } from "../persistence/persistenceKeys.js";

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

export async function getStoredParentDirectoryHandle() {
  if (!localforage) return null;
  try {
    const handle = await localforage.getItem(PARENT_DIR_HANDLE_KEY);
    return handle || null;
  } catch {
    return null;
  }
}

export async function setStoredParentDirectoryHandle(handle) {
  if (!localforage) return;
  try {
    await localforage.setItem(PARENT_DIR_HANDLE_KEY, handle);
  } catch {
    // ignore
  }
}
