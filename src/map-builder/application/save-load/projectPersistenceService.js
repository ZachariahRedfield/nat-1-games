import JSZip from "jszip";
import {
  clearCurrentProjectDirectory,
  getCurrentProjectDirectoryHandle,
  getStoredParentDirectoryHandle,
  hasCurrentProjectDirectory,
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
import { pickFile, writeFile } from "../../infrastructure/filesystem/fileIO.js";
import { capturePerLayerPNGs } from "../../infrastructure/canvas/canvasCapture.js";
import {
  readAssetsManifest,
  writeAssetsLibrary,
} from "../../infrastructure/assets/assetLibrary.js";
import { hydrateAssetsFromFS } from "../../infrastructure/assets/assetHydration.js";
import { blobFromSrc } from "../../infrastructure/assets/assetData.js";
import {
  extFromType,
  stripAssetInMemoryFields,
} from "../../infrastructure/assets/assetSerialization.js";
import {
  buildProjectStateSnapshot,
  toObjectsJson,
  toProjectJson,
  toTilesJson,
  toTokensJson,
} from "../../domain/project/projectSerialization.js";
import {
  ASSETS_DIR_NAME,
  ASSETS_MANIFEST_FILE,
} from "../../infrastructure/persistence/persistenceKeys.js";

async function writeProjectFiles(projectDirHandle, projectState, layerBlobs) {
  const projectJson = toProjectJson(projectState);
  const objectsJson = toObjectsJson(projectState);
  const tokensJson = toTokensJson(projectState);
  const tilesJson = toTilesJson(projectState);

  await writeFile(
    projectDirHandle,
    ["project.json"],
    new Blob([JSON.stringify(projectJson, null, 2)], { type: "application/json" }),
  );
  await writeFile(
    projectDirHandle,
    ["tiles.json"],
    new Blob([JSON.stringify(tilesJson, null, 2)], { type: "application/json" }),
  );
  await writeFile(
    projectDirHandle,
    ["objects.json"],
    new Blob([JSON.stringify(objectsJson, null, 2)], { type: "application/json" }),
  );
  await writeFile(
    projectDirHandle,
    ["tokens.json"],
    new Blob([JSON.stringify(tokensJson, null, 2)], { type: "application/json" }),
  );

  if (layerBlobs.background) {
    await writeFile(projectDirHandle, ["canvas-background.png"], layerBlobs.background);
  }
  if (layerBlobs.base) {
    await writeFile(projectDirHandle, ["canvas-base.png"], layerBlobs.base);
  }
  if (layerBlobs.sky) {
    await writeFile(projectDirHandle, ["canvas-sky.png"], layerBlobs.sky);
  }
}

async function prepareProjectStateForSave(projectState, { canvasRefs, mapName }) {
  const layerBlobs = await capturePerLayerPNGs(canvasRefs);
  const name = mapName || projectState?.name || projectState?.settings?.name;
  return { layerBlobs, name };
}

export async function saveProject(projectState, { canvasRefs, mapName } = {}) {
  try {
    const { layerBlobs, name } = await prepareProjectStateForSave(projectState, { canvasRefs, mapName });
    if (hasFileSystemAccess()) {
      const parent = await getStoredParentDirectoryHandle();
      const parentOk = parent ? await verifyPermission(parent, true) : false;
      if (!parentOk) {
        return { ok: false, mode: "error", code: "NO_PARENT", message: "No Account Save Folder configured." };
      }

      let projectDirHandle = getCurrentProjectDirectoryHandle();
      let projectOk = projectDirHandle ? await verifyPermission(projectDirHandle, true) : false;
      if (!projectOk) {
        const folderName = sanitizeFolderName(name || "Map");
        const mapsDir = await ensureMapsDir(parent);
        projectDirHandle = await mapsDir.getDirectoryHandle(folderName, { create: true });
        projectOk = await verifyPermission(projectDirHandle, true);
        setCurrentProjectDirectoryHandle(projectDirHandle);
      }
      if (!projectOk) {
        return { ok: false, mode: "error", message: "Permission denied" };
      }

      const projectJson = toProjectJson({ ...projectState, name });
      const assetListOut = await writeAssetsLibrary(parent, projectState.assets || []);
      projectJson.assets = assetListOut.map((asset) => ({ ...asset }));
      const stateForFiles = { ...projectState, name, assets: projectJson.assets };
      await writeProjectFiles(projectDirHandle, stateForFiles, layerBlobs);
      return { ok: true, mode: "fs", message: "Project saved to folder." };
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

export async function loadProject() {
  if (hasFileSystemAccess()) {
    try {
      let parent = await getStoredParentDirectoryHandle();
      try {
        parent = await window.showDirectoryPicker({
          id: "mapbuilder-parent-open",
          mode: "readwrite",
          startIn: parent || undefined,
        });
      } catch {
        parent = await window.showDirectoryPicker({ id: "mapbuilder-parent-open", mode: "readwrite" });
      }
      const parentOk = await verifyPermission(parent, true);
      if (!parentOk) throw new Error("Permission denied");
      await setStoredParentDirectoryHandle(parent);

      let dirHandle = null;
      try {
        dirHandle = await window.showDirectoryPicker({
          id: "mapbuilder-project-open",
          mode: "readwrite",
          startIn: parent,
        });
      } catch {
        dirHandle = await window.showDirectoryPicker({ id: "mapbuilder-project-open", mode: "readwrite" });
      }
      const ok = await verifyPermission(dirHandle, true);
      if (!ok) throw new Error("Permission denied");
      setCurrentProjectDirectoryHandle(dirHandle);

      const projectText = await (await (await dirHandle.getFileHandle("project.json")).getFile()).text();
      const tilesText = await (await (await dirHandle.getFileHandle("tiles.json")).getFile()).text();
      const objectsText = await (await (await dirHandle.getFileHandle("objects.json")).getFile()).text();
      let tokensTop = null;
      try {
        const tokensFile = await (await dirHandle.getFileHandle("tokens.json")).getFile();
        const text = await tokensFile.text();
        const doc = JSON.parse(text || "{}");
        if (Array.isArray(doc?.tokens)) tokensTop = doc.tokens;
      } catch {
        // ignore missing tokens file
      }

      const canvases = { background: null, base: null, sky: null };
      try { const file = await (await dirHandle.getFileHandle("canvas-background.png")).getFile(); canvases.background = file; } catch {}
      try { const file = await (await dirHandle.getFileHandle("canvas-base.png")).getFile(); canvases.base = file; } catch {}
      try { const file = await (await dirHandle.getFileHandle("canvas-sky.png")).getFile(); canvases.sky = file; } catch {}
      let singleCanvas = null;
      if (!canvases.background && !canvases.base && !canvases.sky) {
        try { const file = await (await dirHandle.getFileHandle("canvas.png")).getFile(); singleCanvas = file; } catch {}
      }

      const raw = {
        project: JSON.parse(projectText || "{}"),
        tiles: JSON.parse(tilesText || "{}"),
        objects: JSON.parse(objectsText || "{}"),
      };
      if (tokensTop) raw.tokens = tokensTop;

      const libManifest = await readAssetsManifest(parent);
      const libAssetsHydrated = await hydrateAssetsFromFS({ assets: libManifest.assets }, dirHandle, parent);
      const projHydrated = await hydrateAssetsFromFS(raw.project, dirHandle, parent);
      const byId = new Map(libAssetsHydrated.map((asset) => [asset.id, asset]));
      for (const asset of projHydrated) {
        if (!byId.has(asset.id)) byId.set(asset.id, asset);
      }
      raw.project.assets = Array.from(byId.values());

      const snapshot = await buildProjectStateSnapshot(
        raw,
        canvases.background || canvases.base || canvases.sky ? canvases : singleCanvas,
      );
      return { ok: true, mode: "fs", data: snapshot };
    } catch (error) {
      console.error("loadProject FS error", error);
    }
  }

  const file = await pickFile(["application/zip", "application/json", ".zip", ".json"]);
  if (!file) return { ok: false, mode: "cancel" };
  try {
    const data = await importBundle(file);
    return { ok: true, mode: "zip", data };
  } catch (error) {
    console.error("importBundle error", error);
    return { ok: false, mode: "error", message: "Failed to load project." };
  }
}

export async function saveProjectAs(projectState, { canvasRefs, mapName } = {}) {
  try {
    const { layerBlobs, name } = await prepareProjectStateForSave(projectState, { canvasRefs, mapName });
    if (!hasFileSystemAccess()) {
      const res = await exportBundle(projectState, { canvasRefs, silent: false, mapName });
      return { ok: !!res, mode: "zip", message: "Bundle exported." };
    }

    const parent = await getStoredParentDirectoryHandle();
    const parentOk = parent ? await verifyPermission(parent, true) : false;
    if (!parentOk) {
      return { ok: false, mode: "error", code: "NO_PARENT", message: "No Account Save Folder configured." };
    }

    const mapsDir = await ensureMapsDir(parent);
    const { handle: projectDirHandle } = await createUniqueMapDir(
      mapsDir,
      name || projectState?.name || projectState?.settings?.name || "Map",
    );
    const ok = await verifyPermission(projectDirHandle, true);
    if (!ok) throw new Error("Permission denied");

    const projectJson = toProjectJson({ ...projectState, name });
    const assetListOut = await writeAssetsLibrary(parent, projectState.assets || []);
    projectJson.assets = assetListOut.map((asset) => ({ ...asset }));
    const stateForFiles = { ...projectState, name, assets: projectJson.assets };
    await writeProjectFiles(projectDirHandle, stateForFiles, layerBlobs);

    await setStoredParentDirectoryHandle(parent);
    setCurrentProjectDirectoryHandle(projectDirHandle);

    return { ok: true, mode: "fs", message: "Project saved to folder." };
  } catch (error) {
    console.error("saveProjectAs error", error);
    return { ok: false, mode: "error", message: "Failed to save project." };
  }
}

export async function exportBundle(projectState, { canvasRefs, silent = false, mapName } = {}) {
  const zip = new JSZip();
  const projectJson = toProjectJson(projectState);
  const objectsJson = toObjectsJson(projectState);
  const tilesJson = toTilesJson(projectState);
  const tokensJson = toTokensJson(projectState);

  const assetsOut = [];
  for (const asset of projectState.assets || []) {
    const base = stripAssetInMemoryFields(asset);
    if (asset.kind === "image" || asset.kind === "token") {
      // eslint-disable-next-line no-await-in-loop
      const blob = await blobFromSrc(asset.src);
      if (blob) {
        const ext = extFromType(blob.type);
        const filename = `${asset.id || Math.random().toString(36).slice(2)}.${ext}`;
        zip.file(`${ASSETS_DIR_NAME}/${filename}`, blob);
        assetsOut.push({ ...base, path: `${ASSETS_DIR_NAME}/${filename}` });
      } else {
        assetsOut.push(base);
      }
    } else if (asset.kind === "natural") {
      const variants = Array.isArray(asset.variants) ? asset.variants : [];
      const variantOutput = [];
      for (let i = 0; i < variants.length; i += 1) {
        const variant = variants[i];
        // eslint-disable-next-line no-await-in-loop
        const blob = await blobFromSrc(variant?.src);
        if (blob) {
          const ext = extFromType(blob.type);
          const filename = `${asset.id || "natural"}-v${i}.${ext}`;
          zip.file(`${ASSETS_DIR_NAME}/${filename}`, blob);
          variantOutput.push({ ...variant, path: `${ASSETS_DIR_NAME}/${filename}` });
        } else {
          variantOutput.push(variant);
        }
      }
      assetsOut.push({ ...base, variants: variantOutput });
    } else {
      assetsOut.push(base);
    }
  }

  projectJson.assets = assetsOut;
  zip.file(`${ASSETS_DIR_NAME}/${ASSETS_MANIFEST_FILE}`, JSON.stringify({ version: 1, assets: assetsOut }, null, 2));
  zip.file("project.json", JSON.stringify(projectJson, null, 2));
  zip.file("tiles.json", JSON.stringify(tilesJson, null, 2));
  zip.file("objects.json", JSON.stringify(objectsJson, null, 2));
  zip.file("tokens.json", JSON.stringify(tokensJson, null, 2));

  const layerBlobs = await capturePerLayerPNGs(canvasRefs);
  if (layerBlobs.background) zip.file("canvas-background.png", layerBlobs.background);
  if (layerBlobs.base) zip.file("canvas-base.png", layerBlobs.base);
  if (layerBlobs.sky) zip.file("canvas-sky.png", layerBlobs.sky);

  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const anchor = document.createElement("a");
  anchor.href = url;
  const base = sanitizeFolderName(mapName || projectState?.name || projectState?.settings?.name || "mapbuilder-project");
  anchor.download = `${base}.zip`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);

  if (!silent) alert("Project bundle exported.");
  return true;
}

export async function importBundle(file) {
  const isZip = /\.zip$/i.test(file.name) || file.type === "application/zip";
  if (!isZip) {
    const text = await file.text();
    const raw = JSON.parse(text || "{}");
    const snapshot = await buildProjectStateSnapshot(raw, null);
    snapshot.assets = (snapshot.assets || []).map((asset) => {
      if ((asset.kind === "image" || asset.kind === "token") && asset.src) {
        const img = new Image();
        img.src = asset.src;
        return { ...asset, img };
      }
      if (asset.kind === "natural" && Array.isArray(asset.variants)) {
        return { ...asset };
      }
      return asset;
    });
    return snapshot;
  }

  const zip = await JSZip.loadAsync(file);
  const readJson = async (name) => {
    const entry = zip.file(name);
    if (!entry) return null;
    const text = await entry.async("text");
    return JSON.parse(text || "{}");
  };

  const project = await readJson("project.json");
  const tiles = await readJson("tiles.json");
  const objects = await readJson("objects.json");
  const tokensDoc = await readJson("tokens.json");

  const canvases = { background: null, base: null, sky: null };
  const backgroundEntry = zip.file("canvas-background.png");
  const baseEntry = zip.file("canvas-base.png");
  const skyEntry = zip.file("canvas-sky.png");
  if (backgroundEntry) canvases.background = await backgroundEntry.async("blob");
  if (baseEntry) canvases.base = await baseEntry.async("blob");
  if (skyEntry) canvases.sky = await skyEntry.async("blob");
  let singleCanvas = null;
  if (!backgroundEntry && !baseEntry && !skyEntry) {
    const single = zip.file("canvas.png");
    if (single) singleCanvas = await single.async("blob");
  }

  let assetsIn = Array.isArray(project?.assets) ? project.assets : [];
  try {
    const manifestEntry = zip.file(`${ASSETS_DIR_NAME}/${ASSETS_MANIFEST_FILE}`);
    if (manifestEntry) {
      const text = await manifestEntry.async("text");
      const manifest = JSON.parse(text || "{}");
      if (Array.isArray(manifest.assets)) assetsIn = manifest.assets;
    }
  } catch {
    // ignore manifest errors
  }

  const hydrated = [];
  for (const asset of assetsIn) {
    if (asset.kind === "image" || asset.kind === "token") {
      if (asset.path && zip.file(asset.path)) {
        const blob = await zip.file(asset.path).async("blob");
        const src = URL.createObjectURL(blob);
        const img = new Image();
        img.src = src;
        hydrated.push({ ...asset, src, img });
      } else {
        hydrated.push(asset);
      }
    } else if (asset.kind === "natural") {
      const variantOutput = [];
      for (const variant of asset.variants || []) {
        if (variant.path && zip.file(variant.path)) {
          const blob = await zip.file(variant.path).async("blob");
          const src = URL.createObjectURL(blob);
          variantOutput.push({ ...variant, src });
        } else {
          variantOutput.push(variant);
        }
      }
      hydrated.push({ ...asset, variants: variantOutput });
    } else {
      hydrated.push(asset);
    }
  }

  const raw = { project: { ...(project || {}), assets: hydrated }, tiles, objects };
  if (tokensDoc && Array.isArray(tokensDoc.tokens)) raw.tokens = tokensDoc.tokens;
  const snapshot = await buildProjectStateSnapshot(
    raw,
    canvases.background || canvases.base || canvases.sky ? canvases : singleCanvas,
  );
  return snapshot;
}

export async function loadProjectFromDirectory(dirHandle) {
  try {
    const ok = await verifyPermission(dirHandle, true);
    if (!ok) throw new Error("Permission denied");
    const parent = await getStoredParentDirectoryHandle();

    const projectText = await (await (await dirHandle.getFileHandle("project.json")).getFile()).text();
    const tilesText = await (await (await dirHandle.getFileHandle("tiles.json")).getFile()).text();
    const objectsText = await (await (await dirHandle.getFileHandle("objects.json")).getFile()).text();
    let tokensTop = null;
    try {
      const tokensFile = await (await dirHandle.getFileHandle("tokens.json")).getFile();
      const text = await tokensFile.text();
      const doc = JSON.parse(text || "{}");
      if (Array.isArray(doc?.tokens)) tokensTop = doc.tokens;
    } catch {
      // ignore missing tokens file
    }

    const canvases = { background: null, base: null, sky: null };
    try { const file = await (await dirHandle.getFileHandle("canvas-background.png")).getFile(); canvases.background = file; } catch {}
    try { const file = await (await dirHandle.getFileHandle("canvas-base.png")).getFile(); canvases.base = file; } catch {}
    try { const file = await (await dirHandle.getFileHandle("canvas-sky.png")).getFile(); canvases.sky = file; } catch {}
    let singleCanvas = null;
    if (!canvases.background && !canvases.base && !canvases.sky) {
      try { const file = await (await dirHandle.getFileHandle("canvas.png")).getFile(); singleCanvas = file; } catch {}
    }

    const raw = {
      project: JSON.parse(projectText || "{}"),
      tiles: JSON.parse(tilesText || "{}"),
      objects: JSON.parse(objectsText || "{}"),
    };
    if (tokensTop) raw.tokens = tokensTop;

    const libManifest = await readAssetsManifest(parent);
    const libAssetsHydrated = await hydrateAssetsFromFS({ assets: libManifest.assets }, dirHandle, parent);
    const projHydrated = await hydrateAssetsFromFS(raw.project, dirHandle, parent);
    const byId = new Map(libAssetsHydrated.map((asset) => [asset.id, asset]));
    for (const asset of projHydrated) {
      if (!byId.has(asset.id)) byId.set(asset.id, asset);
    }
    raw.project.assets = Array.from(byId.values());

    const snapshot = await buildProjectStateSnapshot(
      raw,
      canvases.background || canvases.base || canvases.sky ? canvases : singleCanvas,
    );
    setCurrentProjectDirectoryHandle(dirHandle);
    return { ok: true, mode: "fs", data: snapshot };
  } catch (error) {
    console.error("loadProjectFromDirectory error", error);
    return { ok: false, mode: "error" };
  }
}

export {
  clearCurrentProjectDirectory as clearCurrentProjectDir,
  hasCurrentProjectDirectory as hasCurrentProjectDir,
};
