import { ASSETS_DIR_NAME, ASSETS_MANIFEST_FILE } from "../persistence/persistenceKeys.js";
import { ensureAssetsDir } from "../filesystem/directoryManagement.js";
import { writeFile } from "../filesystem/fileIO.js";
import {
  assetFilenameFor,
  assetPathWithinLibrary,
  stripAssetInMemoryFields,
  stripRuntimeFields,
} from "./assetSerialization.js";
import { blobFromSrc } from "./assetData.js";

export async function readAssetsManifest(parentHandle) {
  try {
    const assetsDir = await parentHandle.getDirectoryHandle(ASSETS_DIR_NAME, { create: false });
    const manifestHandle = await assetsDir.getFileHandle(ASSETS_MANIFEST_FILE);
    const text = await (await manifestHandle.getFile()).text();
    const data = JSON.parse(text || "{}");
    if (data && Array.isArray(data.assets)) return data;
    return { version: 1, assets: [] };
  } catch {
    return { version: 1, assets: [] };
  }
}

export async function writeAssetsManifest(parentHandle, manifest) {
  const assetsDir = await ensureAssetsDir(parentHandle);
  await writeFile(
    assetsDir,
    [ASSETS_MANIFEST_FILE],
    new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" }),
  );
}

export async function writeAssetsLibrary(parentHandle, assetsList) {
  const manifest = await readAssetsManifest(parentHandle);
  const existing = new Map((manifest.assets || []).map((asset) => [asset.id, asset]));
  const output = new Map(existing);
  const assetsDir = await ensureAssetsDir(parentHandle);

  for (const asset of assetsList || []) {
    if (!asset) continue;
    const base = stripAssetInMemoryFields(asset);
    if (asset.kind === "image" || asset.kind === "token") {
      // eslint-disable-next-line no-await-in-loop
      const blob = await blobFromSrc(asset.src);
      let filename = base.path && base.path.startsWith(`${ASSETS_DIR_NAME}/`)
        ? assetPathWithinLibrary(base.path)
        : null;
      if (!filename) filename = assetFilenameFor(asset, null, blob);
      if (blob) {
        // eslint-disable-next-line no-await-in-loop
        await writeFile(assetsDir, [filename], blob);
      }
      const entry = { ...base, path: `${ASSETS_DIR_NAME}/${filename}` };
      output.set(entry.id, entry);
    } else if (asset.kind === "natural") {
      const variants = Array.isArray(asset.variants) ? asset.variants : [];
      const variantOutput = [];
      for (let i = 0; i < variants.length; i += 1) {
        const variant = variants[i];
        // eslint-disable-next-line no-await-in-loop
        const blob = await blobFromSrc(variant?.src);
        let filename = variant?.path && variant.path.startsWith(`${ASSETS_DIR_NAME}/`)
          ? assetPathWithinLibrary(variant.path)
          : null;
        if (!filename) filename = assetFilenameFor(asset, i, blob);
        if (blob) {
          // eslint-disable-next-line no-await-in-loop
          await writeFile(assetsDir, [filename], blob);
        }
        variantOutput.push({ ...stripRuntimeFields(variant), path: `${ASSETS_DIR_NAME}/${filename}` });
      }
      const entry = { ...base, variants: variantOutput };
      output.set(entry.id, entry);
    } else {
      output.set(base.id, base);
    }
  }

  const finalList = Array.from(output.values());
  await writeAssetsManifest(parentHandle, { version: 1, assets: finalList });
  return finalList;
}
