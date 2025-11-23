import { ASSET_DEFAULTS } from "./common/assetDefaults.js";

export function createNaturalAssetPayload({ name, state }) {
  if (!state.variants.length) return null;

  return {
    asset: {
      id: undefined,
      name: name || "Natural",
      kind: "natural",
      variants: state.variants.slice(0, 16),
      ...ASSET_DEFAULTS.natural,
    },
    assetType: "natural",
  };
}

export function updateNaturalAssetPayload({ base, state }) {
  return {
    ...base,
    kind: "natural",
    variants: state.variants.slice(0, 16),
  };
}
