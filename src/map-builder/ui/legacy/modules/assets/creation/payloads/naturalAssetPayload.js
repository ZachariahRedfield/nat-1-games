import { ASSET_DEFAULTS } from "./common/assetDefaults.js";

export function createNaturalAssetPayload({ name, state }) {
  if (!state.variants.length) return null;
  const fileSizeBytes = state.variants.reduce((sum, variant) => {
    const size = Number.isFinite(variant?.fileSizeBytes) ? variant.fileSizeBytes : 0;
    return sum + size;
  }, 0);

  return {
    asset: {
      id: undefined,
      name: name || "Natural",
      kind: "natural",
      variants: state.variants.slice(0, 16),
      fileSizeBytes: fileSizeBytes || undefined,
      ...ASSET_DEFAULTS.natural,
    },
    assetType: "natural",
  };
}

export function updateNaturalAssetPayload({ base, state }) {
  const fileSizeBytes = state.variants.reduce((sum, variant) => {
    const size = Number.isFinite(variant?.fileSizeBytes) ? variant.fileSizeBytes : 0;
    return sum + size;
  }, 0);
  return {
    ...base,
    kind: "natural",
    variants: state.variants.slice(0, 16),
    fileSizeBytes: fileSizeBytes || base.fileSizeBytes,
  };
}
