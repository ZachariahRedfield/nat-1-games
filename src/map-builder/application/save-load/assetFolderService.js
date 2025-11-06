import {
  getStoredParentDirectoryHandle,
  setStoredParentDirectoryHandle,
  verifyPermission,
} from "../../infrastructure/filesystem/storageHandles.js";
import { ensureAssetsDir } from "../../infrastructure/filesystem/directoryManagement.js";
import { hydrateAssetsFromFS } from "../../infrastructure/assets/assetHydration.js";
import { readAssetsManifest, writeAssetsManifest } from "../../infrastructure/assets/assetLibrary.js";

export async function loadAssetsFromStoredParent() {
  try {
    const parent = await getStoredParentDirectoryHandle();
    const ok = parent ? await verifyPermission(parent, false) : false;
    if (!ok) return [];
    const manifest = await readAssetsManifest(parent);
    const hydrated = await hydrateAssetsFromFS({ assets: manifest.assets }, null, parent);
    return hydrated;
  } catch (error) {
    console.error("loadAssetsFromStoredParent error", error);
    return [];
  }
}

export async function chooseAssetsFolder() {
  try {
    let parent = await getStoredParentDirectoryHandle();
    try {
      parent = await window.showDirectoryPicker({
        id: "mapbuilder-assets-parent",
        mode: "readwrite",
        startIn: parent || undefined,
      });
    } catch {
      parent = await window.showDirectoryPicker({ id: "mapbuilder-assets-parent", mode: "readwrite" });
    }
    const ok = await verifyPermission(parent, true);
    if (!ok) throw new Error("Permission denied");
    await setStoredParentDirectoryHandle(parent);
    await ensureAssetsDir(parent);
    const manifest = await readAssetsManifest(parent);
    if (!manifest || !Array.isArray(manifest.assets)) {
      await writeAssetsManifest(parent, { version: 1, assets: [] });
    }
    const hydrated = await hydrateAssetsFromFS({ assets: manifest.assets || [] }, null, parent);
    return { ok: true, assets: hydrated };
  } catch (error) {
    console.error("chooseAssetsFolder error", error);
    return { ok: false, assets: [] };
  }
}

export async function isAssetsFolderConfigured() {
  try {
    const parent = await getStoredParentDirectoryHandle();
    if (!parent) return false;
    const ok = await verifyPermission(parent, false);
    return Boolean(ok);
  } catch {
    return false;
  }
}
