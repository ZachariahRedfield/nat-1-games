import { getStorageManager } from "./storageManager.js";

export async function listMaps() {
  try {
    const storageManager = getStorageManager();
    return await storageManager.listProjects();
  } catch (error) {
    console.error("listMaps error", error);
    return [];
  }
}

export async function deleteMap(projectId) {
  try {
    const storageManager = getStorageManager();
    return await storageManager.deleteProject(projectId);
  } catch (error) {
    console.error("deleteMap error", error);
    return { ok: false, message: "Failed to delete map." };
  }
}
