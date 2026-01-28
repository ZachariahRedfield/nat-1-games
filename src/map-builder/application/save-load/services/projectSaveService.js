import { prepareProjectStateForSave } from "../core/projectStatePreparation.js";
import { exportBundle } from "./projectBundleService.js";
import { getStorageManager } from "../storageManager.js";

export async function saveProject(projectState, { canvasRefs, mapName } = {}) {
  try {
    const { layerBlobs, name } = await prepareProjectStateForSave(projectState, { canvasRefs, mapName });
    const storageManager = getStorageManager();
    const result = await storageManager.saveProject({
      projectName: name,
      projectState,
      layerBlobs,
    });
    if (result?.ok) return result;
    if (result?.code === "NO_PARENT") return result;

    const res = await exportBundle(projectState, { canvasRefs, silent: true, mapName: name });
    return { ok: !!res, mode: "pack", message: "Pack exported (fallback)." };
  } catch (error) {
    console.error("saveProject error", error);
    try {
      const res = await exportBundle(projectState, { canvasRefs, silent: true, mapName });
      return { ok: !!res, mode: "pack", message: "Pack exported (fallback)." };
    } catch (fallbackError) {
      console.error("export fallback failed", fallbackError);
      return { ok: false, mode: "error", message: "Failed to save project." };
    }
  }
}

export async function saveProjectAs(projectState, { canvasRefs, mapName } = {}) {
  try {
    const { layerBlobs, name } = await prepareProjectStateForSave(projectState, { canvasRefs, mapName });
    const storageManager = getStorageManager();
    return await storageManager.saveProjectAs({
      projectName: name,
      projectState,
      layerBlobs,
    });
  } catch (error) {
    console.error("saveProjectAs error", error);
    return { ok: false, mode: "error", message: "Failed to save project." };
  }
}

export function hasCurrentProjectDir() {
  return getStorageManager().hasCurrentProject();
}

export function clearCurrentProjectDir() {
  getStorageManager().clearCurrentProject();
}
