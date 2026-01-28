const PROJECT_SNAPSHOT_VERSION = 2;
const LEGACY_PROJECT_VERSION = 1;

function normalizeProjectVersion(version, fallback = LEGACY_PROJECT_VERSION) {
  const parsed = Number.parseInt(version, 10);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return fallback;
}

function stripVariantRuntimeFields(variant) {
  const { img, file, ...rest } = variant || {};
  return rest;
}

function stripAssetInMemoryFields(asset) {
  const { img, file, variants, ...rest } = asset || {};
  if (Array.isArray(variants)) {
    return { ...rest, variants: variants.map(stripVariantRuntimeFields) };
  }
  return rest;
}

export function toProjectJson(projectState = {}) {
  const {
    name,
    rows,
    cols,
    tileSize,
    maps,
    objects,
    tokens,
    assets,
    settings,
    layers,
  } = projectState;

  return {
    version: PROJECT_SNAPSHOT_VERSION,
    name: name || settings?.name || undefined,
    map: { rows, cols, gridSize: tileSize },
    settings: settings || {},
    layers: Array.isArray(layers)
      ? layers.map((layer) =>
          typeof layer === "string" ? { id: layer, name: layer } : layer
        )
      : undefined,
    assets: (assets || []).map(stripAssetInMemoryFields),
  };
}

export function toTilesJson(projectState = {}) {
  const { maps } = projectState;
  return { tiles: maps || {} };
}

export function toObjectsJson(projectState = {}) {
  const { objects, tokens } = projectState;
  return { objects: objects || {}, tokens: tokens || [] };
}

export function toTokensJson(projectState = {}) {
  const { tokens } = projectState;
  return { tokens: tokens || [] };
}

export async function buildProjectStateSnapshot(raw = {}, canvasesOrSingleBlob = null) {
  const { map, settings, assets, layers: projectLayers, name } = raw.project || raw || {};
  const { tiles } = raw.tiles || {};
  const { objects, tokens } = raw.objects || {};
  const version = normalizeProjectVersion(raw?.project?.version ?? raw?.version ?? raw?.snapshotVersion);
  const rows = map?.rows || raw.rows || 20;
  const cols = map?.cols || raw.cols || 20;
  const tileSize = map?.gridSize || 32;
  const maps = tiles || raw.maps || {};
  const assetsIn = (assets || raw.assets || []).map(stripAssetInMemoryFields);
  const settingsLayers = raw.settings?.layers;
  const layersIn =
    (Array.isArray(projectLayers) && projectLayers.length ? projectLayers : null) ??
    (Array.isArray(raw.layers) && raw.layers.length ? raw.layers : null) ??
    (Array.isArray(settingsLayers) && settingsLayers.length ? settingsLayers : null) ??
    [];

  const canvasesInput = canvasesOrSingleBlob;
  let canvasDataUrl = null;
  let canvases = null;
  if (canvasesInput && typeof canvasesInput === "object" && !(canvasesInput instanceof Blob)) {
    canvases = {};
    const entries = Object.entries(canvasesInput);
    for (const [layerId, blob] of entries) {
      if (!blob) {
        canvases[layerId] = null;
        continue;
      }
      // eslint-disable-next-line no-await-in-loop
      canvases[layerId] = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    }
  } else if (canvasesInput instanceof Blob) {
    canvasDataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(canvasesInput);
    });
  }

  return {
    version,
    rows,
    cols,
    tileSize,
    maps,
    objects: objects || raw.objects || {},
    tokens: tokens || raw.tokens || [],
    assets: assetsIn,
    settings: settings || raw.settings || {},
    layers: layersIn,
    name: name || raw.name || raw.settings?.name || null,
    canvasDataUrl,
    canvases,
  };
}
