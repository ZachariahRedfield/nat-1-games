import { ASSETS_DIR_NAME } from "../persistence/persistenceKeys.js";
import { mergeAssetSettings, readAssetSettings } from "./assetSettings.js";

async function resolveAssetSettings({ asset, projectDirHandle, parentDirHandle }) {
  if (!asset?.id) return null;
  if (parentDirHandle) {
    try {
      const assetsDir = await parentDirHandle.getDirectoryHandle(ASSETS_DIR_NAME);
      const settings = await readAssetSettings(assetsDir, asset.id);
      if (settings) return settings;
    } catch {
      // ignore missing assets dir
    }
  }
  if (projectDirHandle) {
    try {
      const assetsDir = await projectDirHandle.getDirectoryHandle(ASSETS_DIR_NAME);
      const settings = await readAssetSettings(assetsDir, asset.id);
      if (settings) return settings;
    } catch {
      // ignore missing assets dir
    }
  }
  return null;
}

export async function hydrateAssetsFromFS(projectJson, projectDirHandle, parentDirHandle) {
  const assets = Array.isArray(projectJson?.assets) ? projectJson.assets : [];
  const hydrated = [];
  for (const asset of assets) {
    const base = { ...asset };
    const settings = await resolveAssetSettings({ asset, projectDirHandle, parentDirHandle });
    const merged = settings ? mergeAssetSettings(base, settings) : base;
    if (asset.kind === "image" || asset.kind === "token") {
      if (asset.path) {
        try {
          const parts = asset.path.split("/").filter(Boolean);
          let dir = parts[0] === ASSETS_DIR_NAME && parentDirHandle
            ? await parentDirHandle.getDirectoryHandle(ASSETS_DIR_NAME)
            : projectDirHandle;
          const startIndex = parts[0] === ASSETS_DIR_NAME && parentDirHandle ? 1 : 0;
          for (let i = startIndex; i < parts.length - 1; i += 1) {
            // eslint-disable-next-line no-await-in-loop
            dir = await dir.getDirectoryHandle(parts[i]);
          }
          // eslint-disable-next-line no-await-in-loop
          const fileHandle = await dir.getFileHandle(parts[parts.length - 1]);
          // eslint-disable-next-line no-await-in-loop
          const file = await fileHandle.getFile();
          const blob = file;
          const src = URL.createObjectURL(blob);
          const img = new Image();
          img.src = src;
          hydrated.push({ ...merged, src, img, fileSizeBytes: file.size });
          continue;
        } catch {
          // ignore and fallback
        }
      }
      hydrated.push(merged);
    } else if (asset.kind === "natural") {
      const variants = Array.isArray(asset.variants) ? asset.variants : [];
      const variantOutput = [];
      let totalSizeBytes = 0;
      for (let i = 0; i < variants.length; i += 1) {
        const variant = variants[i];
        if (variant?.path) {
          try {
            const parts = variant.path.split("/").filter(Boolean);
            let dir = parts[0] === ASSETS_DIR_NAME && parentDirHandle
              ? await parentDirHandle.getDirectoryHandle(ASSETS_DIR_NAME)
              : projectDirHandle;
            const startIndex = parts[0] === ASSETS_DIR_NAME && parentDirHandle ? 1 : 0;
            for (let j = startIndex; j < parts.length - 1; j += 1) {
              // eslint-disable-next-line no-await-in-loop
              dir = await dir.getDirectoryHandle(parts[j]);
            }
            // eslint-disable-next-line no-await-in-loop
            const fileHandle = await dir.getFileHandle(parts[parts.length - 1]);
            // eslint-disable-next-line no-await-in-loop
            const file = await fileHandle.getFile();
            const blob = file;
            const src = URL.createObjectURL(blob);
            totalSizeBytes += file.size;
            variantOutput.push({ ...variant, src, fileSizeBytes: file.size });
            continue;
          } catch {
            // ignore and fallback
          }
        }
        variantOutput.push(variant);
      }
      hydrated.push({
        ...merged,
        variants: variantOutput,
        fileSizeBytes: totalSizeBytes || merged.fileSizeBytes,
      });
    } else {
      hydrated.push(merged);
    }
  }
  return hydrated;
}
