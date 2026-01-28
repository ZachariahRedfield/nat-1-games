import { sanitizeFolderName } from "../../../infrastructure/filesystem/directoryManagement.js";
import { downloadPack } from "../../../../storage/pack/packDownload.ts";
import { getStorageManager } from "../storageManager.js";

const DEFAULT_EXPORT_NAME = "mapbuilder-project";

function resolveExportName(projectName) {
  const sanitized = sanitizeFolderName(projectName || "");
  return sanitized || DEFAULT_EXPORT_NAME;
}

export async function getStorageMenuState() {
  const storageManager = getStorageManager();
  const [providerInfo, projectInfo] = await Promise.all([
    storageManager.getActiveProviderInfo(),
    storageManager.getCurrentProjectInfo(),
  ]);
  return {
    providerInfo,
    projectInfo,
  };
}

export async function exportCurrentProjectPack() {
  const storageManager = getStorageManager();
  const projectInfo = await storageManager.getCurrentProjectInfo();
  if (!projectInfo?.id) {
    return { ok: false, message: "No active project to export." };
  }
  const blob = await storageManager.exportPack(projectInfo.id);
  const exportName = resolveExportName(projectInfo.name);
  downloadPack(blob, `${exportName}.nat1pack`);
  return { ok: true, message: "Exported project pack." };
}

export async function importProjectPack(file) {
  if (!file) {
    return { ok: false, message: "No pack selected." };
  }
  const storageManager = getStorageManager();
  const result = await storageManager.importPack(file);
  return { ok: true, message: "Imported project pack.", result };
}
