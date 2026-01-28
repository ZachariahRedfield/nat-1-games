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

export function createMapBuilderStorageAdapter() {
  return {
    hasFileSystemAccess,
    verifyPermission,
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
