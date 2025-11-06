import { ASSETS_DIR_NAME } from "../persistence/persistenceKeys.js";

export function stripAssetInMemoryFields(asset) {
  const { img, ...rest } = asset || {};
  return rest;
}

export function stripRuntimeFields(asset) {
  const { img, src, ...rest } = asset || {};
  return rest;
}

export function extFromType(type) {
  if (!type) return "png";
  const normalized = String(type).toLowerCase();
  if (normalized.includes("jpeg")) return "jpg";
  if (normalized.includes("png")) return "png";
  if (normalized.includes("webp")) return "webp";
  if (normalized.includes("gif")) return "gif";
  return "png";
}

export function assetFilenameFor(asset, variantIndex = null, blob) {
  const id = asset.id || Math.random().toString(36).slice(2);
  let ext = "png";
  if (blob && blob.type) {
    ext = extFromType(blob.type);
  } else if (asset.src) {
    const match = (asset.src.match(/\.([a-zA-Z0-9]+)(?:$|\?)/) || [])[1];
    if (match) ext = match.toLowerCase();
  }
  if (asset.kind === "natural" && variantIndex !== null) {
    return `${id}-v${variantIndex}.${ext}`;
  }
  return `${id}.${ext}`;
}

export function assetPathWithinLibrary(path = "") {
  if (!path.startsWith(`${ASSETS_DIR_NAME}/`)) return path;
  return path.split("/").slice(1).join("/");
}
