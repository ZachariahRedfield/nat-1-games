import { writeFile } from "../filesystem/fileIO.js";
import { settingsFilenameForId } from "../persistence/settingsFiles.js";

export function extractAssetSettings(asset) {
  if (!asset) return null;
  const settings = {};
  if (asset.defaults) settings.defaults = asset.defaults;
  if (asset.stampDefaults) settings.stampDefaults = asset.stampDefaults;
  if (asset.naturalDefaults) settings.naturalDefaults = asset.naturalDefaults;
  if (asset.canvasBrushDefaults) settings.canvasBrushDefaults = asset.canvasBrushDefaults;
  if (Object.keys(settings).length) return settings;
  return { stampDefaults: { snapToGrid: true } };
}

export function mergeAssetSettings(asset, settings) {
  if (!settings) return asset;
  return { ...asset, ...settings };
}

export async function readAssetSettings(dirHandle, assetId) {
  if (!dirHandle || !assetId) return null;
  try {
    const filename = settingsFilenameForId(assetId);
    const fileHandle = await dirHandle.getFileHandle(filename);
    const text = await (await fileHandle.getFile()).text();
    return JSON.parse(text || "{}");
  } catch {
    return null;
  }
}

export async function writeAssetSettings(dirHandle, asset) {
  if (!dirHandle || !asset?.id) return;
  const settings = extractAssetSettings(asset);
  if (!settings) return;
  const filename = settingsFilenameForId(asset.id);
  await writeFile(dirHandle, [filename], JSON.stringify(settings, null, 2));
}
