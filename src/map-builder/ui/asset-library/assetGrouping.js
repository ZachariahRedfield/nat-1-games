export const ASSET_GROUPS = {
  IMAGE: "image",
  TOKEN: "token",
  MATERIAL: "material",
  NATURAL: "natural",
};

const TOKEN_KINDS = new Set(["token", "tokenGroup"]);

export function assetMatchesGroup(asset, group) {
  if (!asset || asset.hiddenFromUI) return false;
  switch (group) {
    case ASSET_GROUPS.IMAGE:
      return asset.kind === "image";
    case ASSET_GROUPS.TOKEN:
      return TOKEN_KINDS.has(asset.kind);
    case ASSET_GROUPS.MATERIAL:
      return asset.kind === "color";
    case ASSET_GROUPS.NATURAL:
      return asset.kind === "natural";
    default:
      return true;
  }
}

export function determineCreatorKind(asset) {
  if (!asset) return "image";
  if (asset.kind === "color") return "material";
  if (asset.kind === "natural") return "natural";
  if (TOKEN_KINDS.has(asset.kind)) return "token";
  if (asset.kind === "image" && asset.labelMeta) return "text";
  return "image";
}

export function resolvePrimaryPreview(asset) {
  if (!asset) return { type: "none" };
  if (asset.kind === "color") {
    return { type: "color", color: asset.color || "#cccccc" };
  }
  if (asset.kind === "natural") {
    const variant = Array.isArray(asset.variants) ? asset.variants[0] : null;
    if (!variant) {
      return { type: "emptyNatural" };
    }
    return {
      type: "image",
      src: variant.src || null,
      alt: asset.name,
      aspectRatio: variant.aspectRatio || 1,
    };
  }
  if (asset.kind === "tokenGroup") {
    return { type: "tokenGroup", count: Array.isArray(asset.members) ? asset.members.length : 0 };
  }
  if (asset.kind === "image" || asset.kind === "token") {
    return {
      type: "image",
      src: asset.src || null,
      alt: asset.name,
      aspectRatio: asset.aspectRatio || 1,
    };
  }
  return { type: "none" };
}
