import { ASSET_DEFAULTS } from "./common/assetDefaults.js";
import { loadImage } from "./common/loadImage.js";

export async function createImageAssetPayload({ name, state }) {
  if (!state.imageFile) return null;

  const src = URL.createObjectURL(state.imageFile);
  const img = await loadImage(src);
  const aspectRatio = img.width && img.height ? img.width / img.height : 1;

  return {
    asset: {
      id: undefined,
      name,
      kind: "image",
      src,
      fileSizeBytes: state.imageFile?.size,
      aspectRatio,
      ...ASSET_DEFAULTS.image,
      img,
    },
    assetType: "image",
  };
}

export async function updateImageAssetPayload({ base, state }) {
  if (!state.imageFile) return base;

  const src = URL.createObjectURL(state.imageFile);
  const img = await loadImage(src);
  const aspectRatio = img.width && img.height ? img.width / img.height : base.aspectRatio || 1;

  return {
    ...base,
    kind: "image",
    src,
    img,
    aspectRatio,
    fileSizeBytes: state.imageFile?.size ?? base.fileSizeBytes,
  };
}
