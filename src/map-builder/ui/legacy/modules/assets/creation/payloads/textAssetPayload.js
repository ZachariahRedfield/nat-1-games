import { ASSET_DEFAULTS } from "./common/assetDefaults.js";
import { loadImage } from "./common/loadImage.js";
import { renderLabelAsset } from "./common/renderLabelAsset.js";

async function buildLabelImage(state, fallbackAspectRatio) {
  return renderLabelAsset({
    labelText: state.labelText,
    labelFont: state.labelFont,
    labelColor: state.labelColor,
    labelSize: state.labelSize,
    fallbackAspectRatio,
    loadImage,
  });
}

export async function createTextAssetPayload({ name, state }) {
  const { src, img, aspectRatio, labelMeta } = await buildLabelImage(state, 1);

  return {
    asset: {
      id: undefined,
      name,
      kind: "image",
      src,
      aspectRatio,
      ...ASSET_DEFAULTS.image,
      img,
      labelMeta,
    },
    assetType: "image",
  };
}

export async function updateTextAssetPayload({ base, state }) {
  const { src, img, aspectRatio, labelMeta } = await buildLabelImage(state, base.aspectRatio || 1);

  return {
    ...base,
    kind: "image",
    src,
    img,
    aspectRatio,
    labelMeta,
  };
}
