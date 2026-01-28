import { blobFromSrc } from "../../infrastructure/assets/assetData.js";
import { stripAssetInMemoryFields, extFromType } from "../../infrastructure/assets/assetSerialization.js";
import { extractAssetSettings } from "../../infrastructure/assets/assetSettings.js";
import { ASSETS_DIR_NAME, ASSETS_MANIFEST_FILE } from "../../infrastructure/persistence/persistenceKeys.js";
import { settingsFilenameForId } from "../../infrastructure/persistence/settingsFiles.js";
import {
  buildProjectStateSnapshot,
  toObjectsJson,
  toProjectJson,
  toTilesJson,
  toTokensJson,
} from "../../domain/project/projectSerialization.js";

const PLACED_ASSET_SETTINGS_DIR = "asset-settings";

async function addImageAsset(entries, asset, assetsOut) {
  const base = stripAssetInMemoryFields(asset);
  const blob = await blobFromSrc(asset.src);
  if (!blob) {
    assetsOut.push(base);
    return;
  }

  const ext = extFromType(blob.type);
  const filename = `${asset.id || Math.random().toString(36).slice(2)}.${ext}`;
  entries.push({ path: `${ASSETS_DIR_NAME}/${filename}`, data: blob, type: "blob" });
  assetsOut.push({ ...base, path: `${ASSETS_DIR_NAME}/${filename}` });
}

async function addNaturalAsset(entries, asset, assetsOut) {
  const base = stripAssetInMemoryFields(asset);
  const variants = Array.isArray(asset.variants) ? asset.variants : [];
  const variantOutput = [];
  for (let i = 0; i < variants.length; i += 1) {
    const variant = variants[i];
    // eslint-disable-next-line no-await-in-loop
    const blob = await blobFromSrc(variant?.src);
    if (blob) {
      const ext = extFromType(blob.type);
      const filename = `${asset.id || "natural"}-v${i}.${ext}`;
      entries.push({ path: `${ASSETS_DIR_NAME}/${filename}`, data: blob, type: "blob" });
      variantOutput.push({ ...variant, path: `${ASSETS_DIR_NAME}/${filename}` });
    } else {
      variantOutput.push(variant);
    }
  }
  assetsOut.push({ ...base, variants: variantOutput });
}

async function serializeAssets(entries, assets = []) {
  const assetsOut = [];
  for (const asset of assets) {
    if (asset.kind === "image" || asset.kind === "token") {
      // eslint-disable-next-line no-await-in-loop
      await addImageAsset(entries, asset, assetsOut);
    } else if (asset.kind === "natural") {
      // eslint-disable-next-line no-await-in-loop
      await addNaturalAsset(entries, asset, assetsOut);
    } else {
      assetsOut.push(stripAssetInMemoryFields(asset));
    }
  }
  return assetsOut;
}

function serializeAssetSettings(entries, assets = []) {
  for (const asset of assets || []) {
    const settings = extractAssetSettings(asset);
    if (!settings || !asset?.id) continue;
    const filename = settingsFilenameForId(asset.id);
    entries.push({
      path: `${ASSETS_DIR_NAME}/${filename}`,
      data: JSON.stringify(settings, null, 2),
      type: "text",
    });
  }
}

function serializePlacedAssetSettings(entries, projectState) {
  const objects = projectState?.objects || {};
  const tokens = projectState?.tokens || [];

  for (const [, layerObjects] of Object.entries(objects)) {
    for (const obj of layerObjects || []) {
      if (!obj?.id) continue;
      const filename = settingsFilenameForId(obj.id);
      const snapToGrid = typeof obj.snapToGrid === "boolean" ? obj.snapToGrid : true;
      entries.push({
        path: `${PLACED_ASSET_SETTINGS_DIR}/objects/${filename}`,
        data: JSON.stringify({ snapToGrid }, null, 2),
        type: "text",
      });
    }
  }

  for (const token of tokens || []) {
    if (!token?.id) continue;
    const filename = settingsFilenameForId(token.id);
    const snapToGrid = typeof token.snapToGrid === "boolean" ? token.snapToGrid : true;
    entries.push({
      path: `${PLACED_ASSET_SETTINGS_DIR}/tokens/${filename}`,
      data: JSON.stringify({ snapToGrid }, null, 2),
      type: "text",
    });
  }
}

async function blobFromDataUrl(dataUrl) {
  const response = await fetch(dataUrl);
  return response.blob();
}

async function resolveLayerBlobs(projectState, layerBlobs) {
  if (layerBlobs && Object.keys(layerBlobs).length) {
    return layerBlobs;
  }
  if (projectState?.canvases) {
    const entries = Object.entries(projectState.canvases);
    const output = {};
    for (const [layerId, dataUrl] of entries) {
      if (!dataUrl) continue;
      // eslint-disable-next-line no-await-in-loop
      output[layerId] = await blobFromDataUrl(dataUrl);
    }
    return output;
  }
  if (projectState?.canvasDataUrl) {
    return { base: await blobFromDataUrl(projectState.canvasDataUrl) };
  }
  return {};
}

export async function buildPackEntries(projectState, layerBlobs) {
  const entries = [];
  const assetsOut = await serializeAssets(entries, projectState.assets);
  const projectJson = toProjectJson(projectState);
  const tilesJson = toTilesJson(projectState);
  const objectsJson = toObjectsJson(projectState);
  const tokensJson = toTokensJson(projectState);

  projectJson.assets = assetsOut;

  entries.push({
    path: `${ASSETS_DIR_NAME}/${ASSETS_MANIFEST_FILE}`,
    data: JSON.stringify({ version: 1, assets: assetsOut }, null, 2),
    type: "text",
  });
  serializeAssetSettings(entries, projectState.assets);
  serializePlacedAssetSettings(entries, projectState);
  entries.push({ path: "project.json", data: JSON.stringify(projectJson, null, 2), type: "text" });
  entries.push({ path: "tiles.json", data: JSON.stringify(tilesJson, null, 2), type: "text" });
  entries.push({ path: "objects.json", data: JSON.stringify(objectsJson, null, 2), type: "text" });
  entries.push({ path: "tokens.json", data: JSON.stringify(tokensJson, null, 2), type: "text" });

  const resolvedBlobs = await resolveLayerBlobs(projectState, layerBlobs);
  const blobEntries = Object.entries(resolvedBlobs || {});
  let ordinal = 0;
  for (const [layerId, blob] of blobEntries) {
    if (!blob) continue;
    const safeId = (layerId || `layer-${ordinal}`).replace(/[^a-z0-9_-]/gi, "_");
    if (layerId === "background" || layerId === "base" || layerId === "sky") {
      entries.push({ path: `canvas-${layerId}.png`, data: blob, type: "blob" });
    }
    const index = String(ordinal).padStart(2, "0");
    entries.push({ path: `canvases/${index}-${safeId}.png`, data: blob, type: "blob" });
    ordinal += 1;
  }

  return entries;
}

function entriesToMap(entries) {
  const map = new Map();
  for (const entry of entries || []) {
    map.set(entry.path, entry);
  }
  return map;
}

async function readEntryText(entriesMap, name) {
  const entry = entriesMap.get(name);
  if (!entry) return null;
  if (typeof entry.data === "string") return entry.data;
  return entry.data.text();
}

async function readEntryJson(entriesMap, name) {
  const text = await readEntryText(entriesMap, name);
  if (text == null) return null;
  return JSON.parse(text || "{}");
}

async function readEntryBlob(entriesMap, name) {
  const entry = entriesMap.get(name);
  if (!entry) return null;
  if (entry.data instanceof Blob) return entry.data;
  return new Blob([entry.data]);
}

async function hydrateImageAsset(asset, blob) {
  const src = URL.createObjectURL(blob);
  return { ...asset, src };
}

async function hydrateAssetFromPack(entriesMap, asset) {
  if (asset.kind === "image" || asset.kind === "token") {
    if (asset.path) {
      const blob = await readEntryBlob(entriesMap, asset.path);
      if (blob) return hydrateImageAsset(asset, blob);
    }
    return asset;
  }

  if (asset.kind === "natural") {
    const variants = [];
    for (const variant of asset.variants || []) {
      if (variant.path) {
        // eslint-disable-next-line no-await-in-loop
        const blob = await readEntryBlob(entriesMap, variant.path);
        if (blob) {
          const src = URL.createObjectURL(blob);
          variants.push({ ...variant, src });
        } else {
          variants.push(variant);
        }
      } else {
        variants.push(variant);
      }
    }
    return { ...asset, variants };
  }

  return asset;
}

async function readAssetSettingsFromPack(entriesMap, assetId) {
  if (!assetId) return null;
  const text = await readEntryText(entriesMap, `${ASSETS_DIR_NAME}/${settingsFilenameForId(assetId)}`);
  if (!text) return null;
  return JSON.parse(text || "{}");
}

async function hydrateAssetsFromPack(entriesMap, assets = []) {
  const hydrated = [];
  for (const asset of assets) {
    // eslint-disable-next-line no-await-in-loop
    const settings = await readAssetSettingsFromPack(entriesMap, asset.id);
    // eslint-disable-next-line no-await-in-loop
    const hydratedAsset = await hydrateAssetFromPack(entriesMap, asset);
    hydrated.push(settings ? { ...hydratedAsset, ...settings } : hydratedAsset);
  }
  return hydrated;
}

async function readPlacedSettings(entriesMap, subdir, id) {
  if (!id) return null;
  const text = await readEntryText(entriesMap, `${PLACED_ASSET_SETTINGS_DIR}/${subdir}/${settingsFilenameForId(id)}`);
  if (!text) return null;
  return JSON.parse(text || "{}");
}

async function applyPlacedAssetSettings(entriesMap, objectsDoc, tokens) {
  const objects = objectsDoc?.objects || {};
  const tokensList = Array.isArray(tokens)
    ? tokens
    : Array.isArray(objectsDoc?.tokens)
      ? objectsDoc.tokens
      : [];

  const nextObjects = {};
  for (const [layerId, layerObjects] of Object.entries(objects || {})) {
    const updatedLayer = [];
    for (const obj of layerObjects || []) {
      // eslint-disable-next-line no-await-in-loop
      const settings = await readPlacedSettings(entriesMap, "objects", obj.id);
      const snapToGrid = typeof (settings?.snapToGrid ?? obj.snapToGrid) === "boolean"
        ? settings?.snapToGrid ?? obj.snapToGrid
        : true;
      updatedLayer.push({ ...obj, snapToGrid });
    }
    nextObjects[layerId] = updatedLayer;
  }

  const nextTokens = [];
  for (const token of tokensList || []) {
    // eslint-disable-next-line no-await-in-loop
    const settings = await readPlacedSettings(entriesMap, "tokens", token.id);
    const snapToGrid = typeof (settings?.snapToGrid ?? token.snapToGrid) === "boolean"
      ? settings?.snapToGrid ?? token.snapToGrid
      : true;
    nextTokens.push({ ...token, snapToGrid });
  }

  return {
    objectsDoc: { ...(objectsDoc || {}), objects: nextObjects, tokens: nextTokens },
    tokens: nextTokens,
  };
}

function parseCanvasEntries(entriesMap) {
  const canvases = {};
  const background = entriesMap.get("canvas-background.png");
  const base = entriesMap.get("canvas-base.png");
  const sky = entriesMap.get("canvas-sky.png");
  if (background?.data instanceof Blob) canvases.background = background.data;
  if (base?.data instanceof Blob) canvases.base = base.data;
  if (sky?.data instanceof Blob) canvases.sky = sky.data;

  for (const [path, entry] of entriesMap.entries()) {
    if (!path.startsWith("canvases/")) continue;
    if (!(entry.data instanceof Blob)) continue;
    const fileName = path.replace(/^canvases\//, "");
    const match = fileName.match(/^[0-9]+-(.+)\.png$/i);
    const key = match ? match[1] : fileName.replace(/\.png$/i, "");
    canvases[key] = entry.data;
  }

  if (Object.keys(canvases).length) return { canvases, single: null };
  const single = entriesMap.get("canvas.png");
  return { canvases: null, single: single?.data instanceof Blob ? single.data : null };
}

export async function buildSnapshotFromPackEntries(entries) {
  const entriesMap = entriesToMap(entries);
  const project = await readEntryJson(entriesMap, "project.json");
  const tiles = await readEntryJson(entriesMap, "tiles.json");
  const objects = await readEntryJson(entriesMap, "objects.json");
  const tokensDoc = await readEntryJson(entriesMap, "tokens.json");

  const { canvases, single } = parseCanvasEntries(entriesMap);

  let assetsIn = Array.isArray(project?.assets) ? project.assets : [];
  try {
    const manifestText = await readEntryText(entriesMap, `${ASSETS_DIR_NAME}/${ASSETS_MANIFEST_FILE}`);
    if (manifestText) {
      const manifest = JSON.parse(manifestText || "{}");
      if (Array.isArray(manifest.assets)) assetsIn = manifest.assets;
    }
  } catch {
    // ignore manifest errors
  }

  const hydratedAssets = await hydrateAssetsFromPack(entriesMap, assetsIn);
  const placedSettings = await applyPlacedAssetSettings(entriesMap, objects, tokensDoc?.tokens);
  const objectsWithSettings = placedSettings.objectsDoc || objects;
  const tokensWithSettings = Array.isArray(tokensDoc?.tokens) ? placedSettings.tokens : null;
  const raw = { project: { ...(project || {}), assets: hydratedAssets }, tiles, objects: objectsWithSettings };
  if (tokensWithSettings) raw.tokens = tokensWithSettings;
  const canvasSources = canvases?.background || canvases?.base || canvases?.sky ? canvases : single;
  return buildProjectStateSnapshot(raw, canvasSources);
}
