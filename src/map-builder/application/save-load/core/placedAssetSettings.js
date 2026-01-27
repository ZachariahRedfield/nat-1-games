import { writeFile } from "../../../infrastructure/filesystem/fileIO.js";
import { settingsFilenameForId } from "../../../infrastructure/persistence/settingsFiles.js";

const PLACED_ASSET_SETTINGS_DIR = "asset-settings";
const OBJECT_SETTINGS_DIR = "objects";
const TOKEN_SETTINGS_DIR = "tokens";

function resolveSnapToGrid(value) {
  if (typeof value === "boolean") return value;
  return true;
}

async function readSettingsFile(dirHandle, subdir, id) {
  if (!dirHandle || !id) return null;
  try {
    const parent = await dirHandle.getDirectoryHandle(PLACED_ASSET_SETTINGS_DIR);
    const settingsDir = await parent.getDirectoryHandle(subdir);
    const fileHandle = await settingsDir.getFileHandle(settingsFilenameForId(id));
    const text = await (await fileHandle.getFile()).text();
    return JSON.parse(text || "{}");
  } catch {
    return null;
  }
}

async function writeSettingsFile(dirHandle, subdir, id, settings) {
  if (!dirHandle || !id || !settings) return;
  await writeFile(dirHandle, [PLACED_ASSET_SETTINGS_DIR, subdir, settingsFilenameForId(id)], JSON.stringify(settings, null, 2));
}

export async function applyPlacedAssetSettingsFromDirectory({ dirHandle, objectsDoc, tokens }) {
  if (!dirHandle) return { objectsDoc, tokens };
  const objects = objectsDoc?.objects || {};
  const tokensList = Array.isArray(tokens) ? tokens : Array.isArray(objectsDoc?.tokens) ? objectsDoc.tokens : [];

  const nextObjects = {};
  const layerEntries = Object.entries(objects || {});
  for (const [layerId, layerObjects] of layerEntries) {
    const updatedLayer = [];
    for (const obj of layerObjects || []) {
      const settings = await readSettingsFile(dirHandle, OBJECT_SETTINGS_DIR, obj.id);
      const snapToGrid = resolveSnapToGrid(settings?.snapToGrid ?? obj.snapToGrid);
      updatedLayer.push({ ...obj, snapToGrid });
    }
    nextObjects[layerId] = updatedLayer;
  }

  const nextTokens = [];
  for (const token of tokensList || []) {
    const settings = await readSettingsFile(dirHandle, TOKEN_SETTINGS_DIR, token.id);
    const snapToGrid = resolveSnapToGrid(settings?.snapToGrid ?? token.snapToGrid);
    nextTokens.push({ ...token, snapToGrid });
  }

  return {
    objectsDoc: { ...(objectsDoc || {}), objects: nextObjects, tokens: nextTokens },
    tokens: nextTokens,
  };
}

export async function writePlacedAssetSettings(projectDirHandle, projectState) {
  if (!projectDirHandle || !projectState) return;
  const objects = projectState.objects || {};
  const tokens = projectState.tokens || [];

  const layerEntries = Object.entries(objects);
  for (const [, layerObjects] of layerEntries) {
    for (const obj of layerObjects || []) {
      const snapToGrid = resolveSnapToGrid(obj?.snapToGrid);
      await writeSettingsFile(projectDirHandle, OBJECT_SETTINGS_DIR, obj.id, { snapToGrid });
    }
  }

  for (const token of tokens || []) {
    const snapToGrid = resolveSnapToGrid(token?.snapToGrid);
    await writeSettingsFile(projectDirHandle, TOKEN_SETTINGS_DIR, token.id, { snapToGrid });
  }
}
