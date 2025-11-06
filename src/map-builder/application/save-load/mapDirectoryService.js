import {
  getStoredParentDirectoryHandle,
  verifyPermission,
} from "../../infrastructure/filesystem/storageHandles.js";
import { ensureMapsDir } from "../../infrastructure/filesystem/directoryManagement.js";
import { MAPS_DIR_NAME } from "../../infrastructure/persistence/persistenceKeys.js";

export async function listMaps() {
  try {
    const parent = await getStoredParentDirectoryHandle();
    const ok = parent ? await verifyPermission(parent, false) : false;
    if (!ok) return [];
    const results = [];
    const scanDir = async (dirHandle) => {
      // eslint-disable-next-line no-restricted-syntax
      for await (const [name, handle] of dirHandle.entries ? dirHandle.entries() : dirHandle) {
        try {
          const isDir = handle.kind === "directory" || handle.getDirectoryHandle;
          if (!isDir) continue;
          try {
            // eslint-disable-next-line no-await-in-loop
            const projectHandle = await handle.getFileHandle("project.json");
            // eslint-disable-next-line no-await-in-loop
            const file = await projectHandle.getFile();
            // eslint-disable-next-line no-await-in-loop
            const text = await file.text();
            const project = JSON.parse(text || "{}");
            const displayName = project?.name || name;
            results.push({ name: displayName, folderName: name, dirHandle: handle, mtime: file.lastModified || 0 });
          } catch {
            // ignore entries without project.json
          }
        } catch {
          // ignore entry errors
        }
      }
    };

    try {
      const mapsDir = await parent.getDirectoryHandle(MAPS_DIR_NAME, { create: true });
      await scanDir(mapsDir);
    } catch {
      // ignore missing maps dir
    }

    results.sort((a, b) => (b.mtime || 0) - (a.mtime || 0));
    return results;
  } catch (error) {
    console.error("listMaps error", error);
    return [];
  }
}

export async function deleteMap(folderName) {
  try {
    const parent = await getStoredParentDirectoryHandle();
    const ok = parent ? await verifyPermission(parent, true) : false;
    if (!ok) return { ok: false, message: "No Account Save Folder configured." };
    const mapsDir = await ensureMapsDir(parent);
    try {
      await mapsDir.removeEntry(folderName, { recursive: true });
      return { ok: true };
    } catch (error) {
      console.error("removeEntry failed", error);
      return { ok: false, message: "Failed to delete map." };
    }
  } catch (error) {
    console.error("deleteMap error", error);
    return { ok: false, message: "Failed to delete map." };
  }
}
