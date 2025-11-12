import { pickFile } from "../../../infrastructure/filesystem/fileIO.js";
import {
  getStoredParentDirectoryHandle,
  hasFileSystemAccess,
  setCurrentProjectDirectoryHandle,
  setStoredParentDirectoryHandle,
  verifyPermission,
} from "../../../infrastructure/filesystem/storageHandles.js";
import { loadProjectSnapshotFromDirectory } from "../core/projectDirectoryReader.js";
import { importBundle } from "./projectBundleService.js";

async function chooseDirectoryWithFallback(id, options = {}) {
  try {
    return await window.showDirectoryPicker({ id, ...options });
  } catch {
    const { startIn, ...rest } = options;
    return await window.showDirectoryPicker({ id, ...rest });
  }
}

async function requestParentDirectory() {
  let parent = await getStoredParentDirectoryHandle();
  parent = await chooseDirectoryWithFallback("mapbuilder-parent-open", {
    mode: "readwrite",
    startIn: parent || undefined,
  });
  const parentOk = await verifyPermission(parent, true);
  if (!parentOk) throw new Error("Permission denied");
  await setStoredParentDirectoryHandle(parent);
  return parent;
}

async function requestProjectDirectory(parent) {
  const dirHandle = await chooseDirectoryWithFallback("mapbuilder-project-open", {
    mode: "readwrite",
    startIn: parent,
  });
  const ok = await verifyPermission(dirHandle, true);
  if (!ok) throw new Error("Permission denied");
  return dirHandle;
}

async function loadSnapshotFromDirectoryHandle(dirHandle) {
  const parent = await getStoredParentDirectoryHandle();
  const snapshot = await loadProjectSnapshotFromDirectory(dirHandle, parent);
  setCurrentProjectDirectoryHandle(dirHandle);
  return snapshot;
}

export async function loadProject() {
  if (hasFileSystemAccess()) {
    try {
      const parent = await requestParentDirectory();
      const dirHandle = await requestProjectDirectory(parent);
      const snapshot = await loadSnapshotFromDirectoryHandle(dirHandle);
      return { ok: true, mode: "fs", data: snapshot };
    } catch (error) {
      console.error("loadProject FS error", error);
    }
  }

  const file = await pickFile(["application/zip", "application/json", ".zip", ".json"]);
  if (!file) return { ok: false, mode: "cancel" };
  try {
    const data = await importBundle(file);
    return { ok: true, mode: "zip", data };
  } catch (error) {
    console.error("importBundle error", error);
    return { ok: false, mode: "error", message: "Failed to load project." };
  }
}

export async function loadProjectFromDirectory(dirHandle) {
  try {
    const ok = await verifyPermission(dirHandle, true);
    if (!ok) throw new Error("Permission denied");
    const snapshot = await loadSnapshotFromDirectoryHandle(dirHandle);
    return { ok: true, mode: "fs", data: snapshot };
  } catch (error) {
    console.error("loadProjectFromDirectory error", error);
    return { ok: false, mode: "error" };
  }
}
