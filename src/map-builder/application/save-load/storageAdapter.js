import {
  clearCurrentProjectDirectory,
  getCurrentProjectDirectoryHandle,
  getStoredParentDirectoryHandle,
  hasFileSystemAccess,
  setCurrentProjectDirectoryHandle,
  setStoredParentDirectoryHandle,
  verifyPermission,
} from "../../infrastructure/filesystem/storageHandles.js";
import {
  createUniqueMapDir,
  ensureMapsDir,
  sanitizeFolderName,
} from "../../infrastructure/filesystem/directoryManagement.js";
import { writeAssetsLibrary } from "../../infrastructure/assets/assetLibrary.js";
import { writeProjectFiles } from "./core/projectFileWriter.js";
import { loadProjectSnapshotFromDirectory } from "./core/projectDirectoryReader.js";
import { buildPackEntries, buildSnapshotFromPackEntries } from "./packAdapter.js";

export async function prepareStateForFileOutput(projectState, name, parentHandle) {
  const assetListOut = await writeAssetsLibrary(parentHandle, projectState.assets || []);
  const assets = assetListOut.map((asset) => ({ ...asset }));
  const resolvedName = name || projectState?.name || projectState?.settings?.name;
  return { ...projectState, name: resolvedName, assets };
}

export async function readProjectJson(dirHandle) {
  try {
    const fileHandle = await dirHandle.getFileHandle("project.json");
    const file = await fileHandle.getFile();
    const text = await file.text();
    const project = JSON.parse(text || "{}");
    return { project, lastModified: file.lastModified || 0 };
  } catch {
    return null;
  }
}

export async function requestParentDirectoryHandle(startIn) {
  if (typeof window === "undefined" || typeof window.showDirectoryPicker !== "function") {
    return null;
  }
  const options = {
    id: "mapbuilder-parent",
    mode: "readwrite",
    startIn: startIn || undefined,
  };
  try {
    return await window.showDirectoryPicker(options);
  } catch (error) {
    if (startIn) {
      return window.showDirectoryPicker({ id: "mapbuilder-parent", mode: "readwrite" });
    }
    throw error;
  }
}

export function createMapBuilderStorageAdapter() {
  return {
    hasFileSystemAccess,
    verifyPermission,
    requestParentDirectoryHandle,
    getStoredParentDirectoryHandle,
    setStoredParentDirectoryHandle,
    getCurrentProjectDirectoryHandle,
    setCurrentProjectDirectoryHandle,
    clearCurrentProjectDirectory,
    ensureMapsDir,
    createUniqueMapDir,
    sanitizeFolderName,
    prepareStateForFileOutput,
    writeProjectFiles,
    loadProjectSnapshotFromDirectory,
    readProjectJson,
    buildPackEntries,
    buildSnapshotFromPackEntries,
  };
}
