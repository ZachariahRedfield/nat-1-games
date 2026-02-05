import {
  getStoredParentDirectoryHandle,
  hasFileSystemAccess,
  setStoredParentDirectoryHandle,
  verifyPermission,
} from "../../infrastructure/filesystem/storageHandles.js";
import { ensureAssetsDir } from "../../infrastructure/filesystem/directoryManagement.js";
import { hydrateAssetsFromFS } from "../../infrastructure/assets/assetHydration.js";
import { readAssetsManifest, writeAssetsManifest } from "../../infrastructure/assets/assetLibrary.js";
import { getStorageManager } from "./storageManager.js";

function isAbortError(error) {
  return error?.name === "AbortError";
}

export async function loadAssetsFromStoredParent() {
  try {
    const storageManager = getStorageManager();
    if (!storageManager.isFolderProviderAvailable()) return [];
    const parent = await getStoredParentDirectoryHandle();
    const ok = parent ? await verifyPermission(parent, false) : false;
    if (!ok) {
      await setStoredParentDirectoryHandle(null);
      return [];
    }
    const manifest = await readAssetsManifest(parent);
    const manifestAssets = Array.isArray(manifest?.assets) ? manifest.assets : [];
    const hydrated = await hydrateAssetsFromFS({ assets: manifestAssets }, null, parent);
    return hydrated;
  } catch (error) {
    console.error("loadAssetsFromStoredParent error", error);
    return [];
  }
}

export async function chooseAssetsFolder() {
  try {
    if (!hasFileSystemAccess()) {
      return { ok: false, reason: "unsupported" };
    }

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
    const hydratedAssets = Array.isArray(manifest?.assets) ? manifest.assets : [];
    const hydrated = await hydrateAssetsFromFS({ assets: hydratedAssets }, null, parent);
    return { ok: true, assets: hydrated };
  } catch (error) {
    if (isAbortError(error)) {
      return { ok: false, reason: "canceled", assets: [] };
    }
    console.error("chooseAssetsFolder error", error);
    return { ok: false, reason: "error", assets: [] };
  }
}

export async function isAssetsFolderRequired() {
  try {
    const storageManager = getStorageManager();
    if (!storageManager.isFolderProviderAvailable()) {
      return false;
    }
    const provider = await storageManager.getActiveProviderInfo();
    return provider?.key === "folder";
  } catch {
    return true;
  }
}

export async function isAssetsFolderConfigured() {
  try {
    const storageManager = getStorageManager();
    if (!storageManager.isFolderProviderAvailable()) return true;
    const parent = await getStoredParentDirectoryHandle();
    if (!parent) return false;
    const ok = await verifyPermission(parent, false);
    if (!ok) {
      await setStoredParentDirectoryHandle(null);
    }
    return Boolean(ok);
  } catch {
    return false;
  }
}
