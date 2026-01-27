export function getAssetTypeTag(asset) {
  if (!asset) return null;
  if (asset.kind === "color") return "Material";
  if (asset.kind === "image" && asset.labelMeta) return "Label";
  if (asset.kind === "image") return "Image";
  if (asset.kind === "natural") return "Natural";
  if (asset.kind === "token" || asset.kind === "tokenGroup") return "Token";
  return null;
}

export function getAssetTagClasses(tag) {
  if (tag === "Material") {
    return "bg-emerald-900/80 text-emerald-100";
  }
  if (tag === "Natural") {
    return "bg-amber-900/80 text-amber-100";
  }
  if (tag === "Token") {
    return "bg-fuchsia-900/80 text-fuchsia-100";
  }
  if (tag === "Label") {
    return "bg-cyan-900/80 text-cyan-100";
  }
  return "bg-blue-900/80 text-blue-100";
}
