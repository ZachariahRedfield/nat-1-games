import {
  clearCurrentProjectDirectory,
  getCurrentProjectDirectoryHandle,
  getStoredParentDirectoryHandle,
  hasCurrentProjectDirectory,
  hasFileSystemAccess,
  setCurrentProjectDirectoryHandle,
  setStoredParentDirectoryHandle,
  verifyPermission,
} from "../../../infrastructure/filesystem/storageHandles.js";
import {
  createUniqueMapDir,
  ensureMapsDir,
  sanitizeFolderName,
} from "../../../infrastructure/filesystem/directoryManagement.js";
import { writeAssetsLibrary } from "../../../infrastructure/assets/assetLibrary.js";
import { writeProjectFiles } from "../core/projectFileWriter.js";
import { prepareProjectStateForSave } from "../core/projectStatePreparation.js";
import { exportBundle } from "./projectBundleService.js";

async function resolveProjectDirectory(parentHandle, name) {
  let projectDirHandle = getCurrentProjectDirectoryHandle();
  let projectOk = projectDirHandle ? await verifyPermission(projectDirHandle, true) : false;
  if (!projectOk) {
    const folderName = sanitizeFolderName(name || "Map");
    const mapsDir = await ensureMapsDir(parentHandle);
    projectDirHandle = await mapsDir.getDirectoryHandle(folderName, { create: true });
    projectOk = await verifyPermission(projectDirHandle, true);
    setCurrentProjectDirectoryHandle(projectDirHandle);
  }

  if (!projectOk) {
    return { ok: false, handle: null };
  }

  return { ok: true, handle: projectDirHandle };
}

async function prepareStateForFileOutput(projectState, name, parentHandle) {
  const assetListOut = await writeAssetsLibrary(parentHandle, projectState.assets || []);
  const assets = assetListOut.map((asset) => ({ ...asset }));
  const resolvedName = name || projectState?.name || projectState?.settings?.name;
  return { ...projectState, name: resolvedName, assets };
}

async function saveToDirectory(projectState, layerBlobs, name) {
  const parent = await getStoredParentDirectoryHandle();
  const parentOk = parent ? await verifyPermission(parent, true) : false;
  if (!parentOk) {
    return { ok: false, mode: "error", code: "NO_PARENT", message: "No Account Save Folder configured." };
  }

  const { ok, handle } = await resolveProjectDirectory(parent, name);
  if (!ok || !handle) {
    return { ok: false, mode: "error", message: "Permission denied" };
  }

  const stateForFiles = await prepareStateForFileOutput(projectState, name, parent);
  await writeProjectFiles(handle, stateForFiles, layerBlobs);
  return { ok: true, mode: "fs", message: "Project saved to folder." };
}

async function saveToNewDirectory(projectState, layerBlobs, name) {
  const parent = await getStoredParentDirectoryHandle();
  const parentOk = parent ? await verifyPermission(parent, true) : false;
  if (!parentOk) {
    return { ok: false, mode: "error", code: "NO_PARENT", message: "No Account Save Folder configured." };
  }

  const mapsDir = await ensureMapsDir(parent);
  const baseName = name || projectState?.name || projectState?.settings?.name || "Map";
  const { handle } = await createUniqueMapDir(mapsDir, baseName);
  const ok = await verifyPermission(handle, true);
  if (!ok) {
    throw new Error("Permission denied");
  }

  const stateForFiles = await prepareStateForFileOutput(projectState, name, parent);
  await writeProjectFiles(handle, stateForFiles, layerBlobs);
  await setStoredParentDirectoryHandle(parent);
  setCurrentProjectDirectoryHandle(handle);
  return { ok: true, mode: "fs", message: "Project saved to folder." };
}

export async function saveProject(projectState, { canvasRefs, mapName } = {}) {
  try {
    const { layerBlobs, name } = await prepareProjectStateForSave(projectState, { canvasRefs, mapName });

    if (hasFileSystemAccess()) {
      const result = await saveToDirectory(projectState, layerBlobs, name);
      if (result.ok) {
        return result;
      }
      if (result.code === "NO_PARENT") {
        return result;
      }
    }

    const res = await exportBundle(projectState, { canvasRefs, silent: true, mapName: name });
    return { ok: !!res, mode: "zip", message: "Bundle exported (fallback)." };
  } catch (error) {
    console.error("saveProject error", error);
    try {
      const res = await exportBundle(projectState, { canvasRefs, silent: true, mapName });
      return { ok: !!res, mode: "zip", message: "Bundle exported (fallback)." };
    } catch (fallbackError) {
      console.error("export fallback failed", fallbackError);
      return { ok: false, mode: "error", message: "Failed to save project." };
    }
  }
}

export async function saveProjectAs(projectState, { canvasRefs, mapName } = {}) {
  try {
    const { layerBlobs, name } = await prepareProjectStateForSave(projectState, { canvasRefs, mapName });
    if (!hasFileSystemAccess()) {
      const res = await exportBundle(projectState, { canvasRefs, silent: false, mapName });
      return { ok: !!res, mode: "zip", message: "Bundle exported." };
    }

    return await saveToNewDirectory(projectState, layerBlobs, name);
  } catch (error) {
    console.error("saveProjectAs error", error);
    return { ok: false, mode: "error", message: "Failed to save project." };
  }
}

export {
  clearCurrentProjectDirectory as clearCurrentProjectDir,
  hasCurrentProjectDirectory as hasCurrentProjectDir,
};
