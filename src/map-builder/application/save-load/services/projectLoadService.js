import { pickFile } from "../../../infrastructure/filesystem/fileIO.js";
import { importBundle } from "./projectBundleService.js";
import { getStorageManager } from "../storageManager.js";

export async function loadProject() {
  const file = await pickFile([
    "application/zip",
    "application/json",
    ".zip",
    ".json",
    ".nat1pack",
  ]);
  if (!file) return { ok: false, mode: "cancel" };
  try {
    const data = await importBundle(file);
    return { ok: true, mode: "pack", data };
  } catch (error) {
    console.error("importBundle error", error);
    return { ok: false, mode: "error", message: "Failed to load project." };
  }
}

export async function loadProjectById(projectId) {
  try {
    const storageManager = getStorageManager();
    const snapshot = await storageManager.loadProject(projectId);
    return { ok: true, mode: "storage", data: snapshot };
  } catch (error) {
    console.error("loadProjectById error", error);
    return { ok: false, mode: "error" };
  }
}
