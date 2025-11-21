export function resolveAssetSource(asset, variantIndex = 0) {
  if (!asset) return null;
  if (asset.kind === "image") {
    return asset.img?.src || asset.src || null;
  }
  if (asset.kind === "natural") {
    const variant = Array.isArray(asset.variants) && asset.variants[variantIndex] ? asset.variants[variantIndex] : null;
    return variant?.src || null;
  }
  return null;
}
