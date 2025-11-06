import localforage from "localforage";
import { ASSETS_STORE_KEY } from "../../infrastructure/persistence/persistenceKeys.js";
import { blobFromSrc } from "../../infrastructure/assets/assetData.js";
import { stripRuntimeFields } from "../../infrastructure/assets/assetSerialization.js";

export async function saveGlobalAssets(assets) {
  if (!localforage) return false;
  try {
    const output = [];
    for (const asset of assets || []) {
      const base = stripRuntimeFields(asset);
      if (asset.kind === "image" || asset.kind === "token") {
        // eslint-disable-next-line no-await-in-loop
        const blob = await blobFromSrc(asset.src);
        output.push({ ...base, kind: asset.kind, data: blob || null });
      } else if (asset.kind === "natural") {
        const variants = Array.isArray(asset.variants) ? asset.variants : [];
        const variantOutput = [];
        for (let i = 0; i < variants.length; i += 1) {
          const variant = variants[i];
          // eslint-disable-next-line no-await-in-loop
          const blob = await blobFromSrc(variant?.src);
          variantOutput.push({ ...stripRuntimeFields(variant), data: blob || null });
        }
        output.push({ ...base, kind: "natural", variants: variantOutput });
      } else {
        output.push({ ...base });
      }
    }
    await localforage.setItem(ASSETS_STORE_KEY, output);
    return true;
  } catch (error) {
    console.error("saveGlobalAssets error", error);
    return false;
  }
}

export async function loadGlobalAssets() {
  if (!localforage) return [];
  try {
    const stored = (await localforage.getItem(ASSETS_STORE_KEY)) || [];
    const hydrated = [];
    for (const asset of stored) {
      if (asset.kind === "image" || asset.kind === "token") {
        let src = null;
        let img = null;
        const aspectRatio = asset.aspectRatio || 1;
        if (asset.data instanceof Blob) {
          src = URL.createObjectURL(asset.data);
          img = new Image();
          img.src = src;
        } else if (asset.src) {
          src = asset.src;
          img = new Image();
          img.src = src;
        }
        hydrated.push({ ...asset, src, img, aspectRatio });
      } else if (asset.kind === "natural") {
        const variantOutput = [];
        for (const variant of asset.variants || []) {
          if (variant.data instanceof Blob) {
            const src = URL.createObjectURL(variant.data);
            variantOutput.push({ ...variant, src });
          } else if (variant.src) {
            variantOutput.push({ ...variant });
          } else {
            variantOutput.push(variant);
          }
        }
        hydrated.push({ ...asset, variants: variantOutput });
      } else {
        hydrated.push(asset);
      }
    }
    return hydrated;
  } catch (error) {
    console.error("loadGlobalAssets error", error);
    return [];
  }
}
