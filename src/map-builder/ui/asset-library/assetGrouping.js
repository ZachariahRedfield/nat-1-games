const TOKEN_KINDS = new Set(["token", "tokenGroup"]);

export function assetMatchesGroup(asset) {
  if (!asset || asset.hiddenFromUI) return false;
  return true;
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
    const variants = Array.isArray(asset.variants)
      ? asset.variants.filter((entry) => entry && entry.src)
      : [];
    if (!variants.length) {
      return { type: "emptyNatural" };
    }
    return {
      type: "naturalStack",
      items: variants.slice(0, 4).map((variant, index) => ({
        src: variant.src || null,
        alt: variant.name || `${asset.name} ${index + 1}`,
      })),
      total: variants.length,
      alt: asset.name,
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
