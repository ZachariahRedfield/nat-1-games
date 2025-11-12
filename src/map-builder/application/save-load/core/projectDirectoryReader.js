import { readAssetsManifest } from "../../../infrastructure/assets/assetLibrary.js";
import { hydrateAssetsFromFS } from "../../../infrastructure/assets/assetHydration.js";
import { buildProjectStateSnapshot } from "../../../domain/project/projectSerialization.js";

async function readJsonFromHandle(dirHandle, fileName) {
  const file = await (await dirHandle.getFileHandle(fileName)).getFile();
  const text = await file.text();
  return JSON.parse(text || "{}");
}

async function readOptionalTokens(dirHandle) {
  try {
    const file = await (await dirHandle.getFileHandle("tokens.json")).getFile();
    const text = await file.text();
    const doc = JSON.parse(text || "{}");
    if (Array.isArray(doc?.tokens)) return doc.tokens;
  } catch {
    // ignore missing tokens file
  }
  return null;
}

async function tryGetFile(dirHandle, fileName) {
  try {
    return await (await dirHandle.getFileHandle(fileName)).getFile();
  } catch {
    return null;
  }
}

async function resolveCanvasFiles(dirHandle) {
  const canvases = {
    background: await tryGetFile(dirHandle, "canvas-background.png"),
    base: await tryGetFile(dirHandle, "canvas-base.png"),
    sky: await tryGetFile(dirHandle, "canvas-sky.png"),
  };

  if (!canvases.background && !canvases.base && !canvases.sky) {
    const single = await tryGetFile(dirHandle, "canvas.png");
    return { canvases, single };
  }

  return { canvases, single: null };
}

function mergeAssetLists(libraryAssets, projectAssets) {
  const byId = new Map(libraryAssets.map((asset) => [asset.id, asset]));
  for (const asset of projectAssets) {
    if (!byId.has(asset.id)) {
      byId.set(asset.id, asset);
    }
  }
  return Array.from(byId.values());
}

export async function loadProjectSnapshotFromDirectory(dirHandle, parentHandle) {
  const project = await readJsonFromHandle(dirHandle, "project.json");
  const tiles = await readJsonFromHandle(dirHandle, "tiles.json");
  const objects = await readJsonFromHandle(dirHandle, "objects.json");
  const tokens = await readOptionalTokens(dirHandle);

  const { canvases, single } = await resolveCanvasFiles(dirHandle);

  const libraryManifest = await readAssetsManifest(parentHandle);
  const libraryAssets = await hydrateAssetsFromFS({ assets: libraryManifest.assets }, dirHandle, parentHandle);
  const projectAssets = await hydrateAssetsFromFS(project, dirHandle, parentHandle);
  const mergedAssets = mergeAssetLists(libraryAssets, projectAssets);

  const raw = { project: { ...project, assets: mergedAssets }, tiles, objects };
  if (tokens) raw.tokens = tokens;

  const canvasSources = canvases.background || canvases.base || canvases.sky ? canvases : single;
  const snapshot = await buildProjectStateSnapshot(raw, canvasSources);
  return snapshot;
}
