import { ASSET_DEFAULTS } from "./common/assetDefaults.js";

export function createMaterialAssetPayload({ name, state }) {
  return {
    asset: {
      id: undefined,
      name: name || "Color",
      kind: "color",
      color: state.colorHex,
      ...ASSET_DEFAULTS.material,
    },
    assetType: "material",
  };
}

export function updateMaterialAssetPayload({ base, state }) {
  return {
    ...base,
    kind: "color",
    color: state.colorHex,
  };
}
