import {
  saveProject as legacySaveProject,
  saveProjectAs as legacySaveProjectAs,
  loadProject as legacyLoadProject,
  loadProjectFromDirectory as legacyLoadProjectFromDirectory,
  listMaps as legacyListMaps,
  deleteMap as legacyDeleteMap,
  loadGlobalAssets,
  saveGlobalAssets,
  loadAssetsFromStoredParent,
  chooseAssetsFolder,
  isAssetsFolderConfigured,
  hasCurrentProjectDir,
  clearCurrentProjectDir,
} from "../../components/Menu/MapBuilder/saveLoadManager";
import { projectStateToDocument, type ProjectState } from "./importExport";
import { schemaVersion } from "./ProjectSchema";

export async function saveProject(state: ProjectState, options?: any) {
  const normalized: ProjectState = { ...state, schemaVersion };
  const document = projectStateToDocument(normalized);
  const result = await legacySaveProject(normalized as any, options);
  return { ...result, document };
}

export async function saveProjectAs(state: ProjectState, options?: any) {
  const normalized: ProjectState = { ...state, schemaVersion };
  const document = projectStateToDocument(normalized);
  const result = await legacySaveProjectAs(normalized as any, options);
  return { ...result, document };
}

export async function loadProject(options?: any) {
  const result = await legacyLoadProject(options);
  if (result?.data) {
    const document = projectStateToDocument({ ...result.data, schemaVersion });
    return { ...result, document };
  }
  return result;
}

export async function loadProjectFromDirectory(handle: any) {
  const result = await legacyLoadProjectFromDirectory(handle);
  if (result?.data) {
    const document = projectStateToDocument({ ...result.data, schemaVersion });
    return { ...result, document };
  }
  return result;
}

export async function listMaps(...args: any[]) {
  return legacyListMaps(...args);
}

export async function deleteMap(...args: any[]) {
  return legacyDeleteMap(...args);
}

export {
  loadGlobalAssets,
  saveGlobalAssets,
  loadAssetsFromStoredParent,
  chooseAssetsFolder,
  isAssetsFolderConfigured,
  hasCurrentProjectDir,
  clearCurrentProjectDir,
};
