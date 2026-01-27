import JSZip from "jszip";
import { sanitizeFolderName } from "../../../infrastructure/filesystem/directoryManagement.js";
import { capturePerLayerPNGs } from "../../../infrastructure/canvas/canvasCapture.js";
import { blobFromSrc } from "../../../infrastructure/assets/assetData.js";
import { stripAssetInMemoryFields, extFromType } from "../../../infrastructure/assets/assetSerialization.js";
import { extractAssetSettings } from "../../../infrastructure/assets/assetSettings.js";
import { ASSETS_DIR_NAME, ASSETS_MANIFEST_FILE } from "../../../infrastructure/persistence/persistenceKeys.js";
import { settingsFilenameForId } from "../../../infrastructure/persistence/settingsFiles.js";
import {
  buildProjectStateSnapshot,
  toObjectsJson,
  toProjectJson,
  toTilesJson,
  toTokensJson,
} from "../../../domain/project/projectSerialization.js";

const PLACED_ASSET_SETTINGS_DIR = "asset-settings";

async function addImageAssetToZip(zip, asset, assetsOut) {
  const base = stripAssetInMemoryFields(asset);
  const blob = await blobFromSrc(asset.src);
  if (!blob) {
    assetsOut.push(base);
    return;
  }

  const ext = extFromType(blob.type);
  const filename = `${asset.id || Math.random().toString(36).slice(2)}.${ext}`;
  zip.file(`${ASSETS_DIR_NAME}/${filename}`, blob);
  assetsOut.push({ ...base, path: `${ASSETS_DIR_NAME}/${filename}` });
}

async function addNaturalAssetToZip(zip, asset, assetsOut) {
  const base = stripAssetInMemoryFields(asset);
  const variants = Array.isArray(asset.variants) ? asset.variants : [];
  const variantOutput = [];
  for (let i = 0; i < variants.length; i += 1) {
    const variant = variants[i];
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
}

async function serializeAssetsForBundle(zip, assets = []) {
  const assetsOut = [];
  for (const asset of assets) {
    if (asset.kind === "image" || asset.kind === "token") {
      // eslint-disable-next-line no-await-in-loop
      await addImageAssetToZip(zip, asset, assetsOut);
    } else if (asset.kind === "natural") {
      // eslint-disable-next-line no-await-in-loop
      await addNaturalAssetToZip(zip, asset, assetsOut);
    } else {
      assetsOut.push(stripAssetInMemoryFields(asset));
    }
  }
  return assetsOut;
}

function serializeAssetSettingsForBundle(zip, assets = []) {
  for (const asset of assets || []) {
    const settings = extractAssetSettings(asset);
    if (!settings || !asset?.id) continue;
    const filename = settingsFilenameForId(asset.id);
    zip.file(`${ASSETS_DIR_NAME}/${filename}`, JSON.stringify(settings, null, 2));
  }
}

function serializePlacedAssetSettingsForBundle(zip, projectState) {
  const objects = projectState?.objects || {};
  const tokens = projectState?.tokens || [];

  for (const [, layerObjects] of Object.entries(objects)) {
    for (const obj of layerObjects || []) {
      if (!obj?.id) continue;
      const filename = settingsFilenameForId(obj.id);
      const snapToGrid = typeof obj.snapToGrid === "boolean" ? obj.snapToGrid : true;
      zip.file(
        `${PLACED_ASSET_SETTINGS_DIR}/objects/${filename}`,
        JSON.stringify({ snapToGrid }, null, 2)
      );
    }
  }

  for (const token of tokens || []) {
    if (!token?.id) continue;
    const filename = settingsFilenameForId(token.id);
    const snapToGrid = typeof token.snapToGrid === "boolean" ? token.snapToGrid : true;
    zip.file(
      `${PLACED_ASSET_SETTINGS_DIR}/tokens/${filename}`,
      JSON.stringify({ snapToGrid }, null, 2)
    );
  }
}

export async function exportBundle(projectState, { canvasRefs, silent = false, mapName } = {}) {
  const zip = new JSZip();
  const assetsOut = await serializeAssetsForBundle(zip, projectState.assets);
  const projectJson = toProjectJson(projectState);
  const tilesJson = toTilesJson(projectState);
  const objectsJson = toObjectsJson(projectState);
  const tokensJson = toTokensJson(projectState);

  projectJson.assets = assetsOut;

  zip.file(
    `${ASSETS_DIR_NAME}/${ASSETS_MANIFEST_FILE}`,
    JSON.stringify({ version: 1, assets: assetsOut }, null, 2),
  );
  serializeAssetSettingsForBundle(zip, projectState.assets);
  serializePlacedAssetSettingsForBundle(zip, projectState);
  zip.file("project.json", JSON.stringify(projectJson, null, 2));
  zip.file("tiles.json", JSON.stringify(tilesJson, null, 2));
  zip.file("objects.json", JSON.stringify(objectsJson, null, 2));
  zip.file("tokens.json", JSON.stringify(tokensJson, null, 2));

  const layerBlobs = await capturePerLayerPNGs(canvasRefs);
  const entries = Object.entries(layerBlobs || {});
  let ordinal = 0;
  for (const [layerId, blob] of entries) {
    if (!blob) continue;
    const safeId = (layerId || `layer-${ordinal}`).replace(/[^a-z0-9_-]/gi, "_");
    if (layerId === "background" || layerId === "base" || layerId === "sky") {
      zip.file(`canvas-${layerId}.png`, blob);
    }
    const index = String(ordinal).padStart(2, "0");
    zip.file(`canvases/${index}-${safeId}.png`, blob);
    ordinal += 1;
  }

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

function hydrateImageAsset(asset, blob) {
  const src = URL.createObjectURL(blob);
  const img = new Image();
  img.src = src;
  return { ...asset, src, img };
}

async function hydrateAssetFromZip(zip, asset) {
  if (asset.kind === "image" || asset.kind === "token") {
    if (asset.path && zip.file(asset.path)) {
      const blob = await zip.file(asset.path).async("blob");
      return hydrateImageAsset(asset, blob);
    }
    return asset;
  }

  if (asset.kind === "natural") {
    const variants = [];
    for (const variant of asset.variants || []) {
      if (variant.path && zip.file(variant.path)) {
        const blob = await zip.file(variant.path).async("blob");
        const src = URL.createObjectURL(blob);
        variants.push({ ...variant, src });
      } else {
        variants.push(variant);
      }
    }
    return { ...asset, variants };
  }

  return asset;
}

async function readAssetSettingsFromZip(zip, assetId) {
  if (!assetId) return null;
  const entry = zip.file(`${ASSETS_DIR_NAME}/${settingsFilenameForId(assetId)}`);
  if (!entry) return null;
  const text = await entry.async("text");
  return JSON.parse(text || "{}");
}

async function hydrateAssetsFromZip(zip, assets = []) {
  const hydrated = [];
  for (const asset of assets) {
    // eslint-disable-next-line no-await-in-loop
    const settings = await readAssetSettingsFromZip(zip, asset.id);
    // eslint-disable-next-line no-await-in-loop
    const hydratedAsset = await hydrateAssetFromZip(zip, asset);
    hydrated.push(settings ? { ...hydratedAsset, ...settings } : hydratedAsset);
  }
  return hydrated;
}

async function readJsonEntry(zip, name) {
  const entry = zip.file(name);
  if (!entry) return null;
  const text = await entry.async("text");
  return JSON.parse(text || "{}");
}

async function readPlacedSettingsFromZip(zip, subdir, id) {
  if (!id) return null;
  const entry = zip.file(`${PLACED_ASSET_SETTINGS_DIR}/${subdir}/${settingsFilenameForId(id)}`);
  if (!entry) return null;
  const text = await entry.async("text");
  return JSON.parse(text || "{}");
}

async function applyPlacedAssetSettingsFromZip(zip, objectsDoc, tokens) {
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
      const settings = await readPlacedSettingsFromZip(zip, "objects", obj.id);
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
    const settings = await readPlacedSettingsFromZip(zip, "tokens", token.id);
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
  const project = await readJsonEntry(zip, "project.json");
  const tiles = await readJsonEntry(zip, "tiles.json");
  const objects = await readJsonEntry(zip, "objects.json");
  const tokensDoc = await readJsonEntry(zip, "tokens.json");

  const canvases = {};
  const backgroundEntry = zip.file("canvas-background.png");
  const baseEntry = zip.file("canvas-base.png");
  const skyEntry = zip.file("canvas-sky.png");
  if (backgroundEntry) canvases.background = await backgroundEntry.async("blob");
  if (baseEntry) canvases.base = await baseEntry.async("blob");
  if (skyEntry) canvases.sky = await skyEntry.async("blob");
  const canvasEntries = zip.file(/^canvases\//);
  for (const entry of canvasEntries) {
    const blob = await entry.async("blob");
    const [, fileName] = entry.name.split("/");
    const match = fileName.match(/^[0-9]+-(.+)\.png$/i);
    const key = match ? match[1] : fileName.replace(/\.png$/i, "");
    canvases[key] = blob;
  }
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

  const hydratedAssets = await hydrateAssetsFromZip(zip, assetsIn);
  const placedSettings = await applyPlacedAssetSettingsFromZip(zip, objects, tokensDoc?.tokens);
  const objectsWithSettings = placedSettings.objectsDoc || objects;
  const tokensWithSettings = Array.isArray(tokensDoc?.tokens) ? placedSettings.tokens : null;
  const raw = { project: { ...(project || {}), assets: hydratedAssets }, tiles, objects: objectsWithSettings };
  if (tokensWithSettings) raw.tokens = tokensWithSettings;
  const canvasSources = canvases.background || canvases.base || canvases.sky ? canvases : singleCanvas;
  const snapshot = await buildProjectStateSnapshot(raw, canvasSources);
  return snapshot;
}
