export function hasFileSystemAccess() {
  if (typeof window === "undefined") return false;
  if (!window.isSecureContext) return false;
  return typeof window.showDirectoryPicker === "function";
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
