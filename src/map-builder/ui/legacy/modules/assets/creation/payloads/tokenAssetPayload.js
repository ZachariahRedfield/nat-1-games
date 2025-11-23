import { ASSET_DEFAULTS } from "./common/assetDefaults.js";
import { loadImage } from "./common/loadImage.js";

async function resolveTokenImage(state, selectedImageSrc, fallbackAspectRatio) {
  let src = null;
  let aspectRatio = fallbackAspectRatio ?? 1;

  if (state.tokenFile) {
    src = URL.createObjectURL(state.tokenFile);
    const img = await loadImage(src);
    aspectRatio = img.width && img.height ? img.width / img.height : aspectRatio;
  } else if (selectedImageSrc) {
    src = selectedImageSrc;
  }

  return { src, aspectRatio };
}

export async function createTokenAssetPayload({ name, state, selectedImageSrc }) {
  const { src, aspectRatio } = await resolveTokenImage(state, selectedImageSrc, 1);
  if (!src) return null;

  return {
    asset: {
      id: undefined,
      name,
      kind: "token",
      src,
      aspectRatio,
      ...ASSET_DEFAULTS.token,
      glowDefault: state.tokenGlow,
    },
    assetType: "token",
  };
}

export async function updateTokenAssetPayload({ base, state, selectedImageSrc }) {
  const { src, aspectRatio } = await resolveTokenImage(state, selectedImageSrc, base.aspectRatio || 1);

  return {
    ...base,
    kind: "token",
    src: src || base.src,
    aspectRatio,
    glowDefault: state.tokenGlow,
  };
}
