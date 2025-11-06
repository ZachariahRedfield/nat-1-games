function stripAssetInMemoryFields(asset) {
  const { img, ...rest } = asset || {};
  return rest;
}

export function toProjectJson(projectState = {}) {
  const {
    version = 1,
    name,
    rows,
    cols,
    tileSize,
    maps,
    objects,
    tokens,
    assets,
    settings,
  } = projectState;

  return {
    version: version ?? 1,
    name: name || settings?.name || undefined,
    map: { rows, cols, gridSize: tileSize },
    settings: settings || {},
    assets: (assets || []).map(stripAssetInMemoryFields),
  };
}

export function toTilesJson(projectState = {}) {
  const { maps } = projectState;
  return { tiles: { background: maps?.background, base: maps?.base, sky: maps?.sky } };
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
  const { map, settings, assets } = raw.project || raw || {};
  const { tiles } = raw.tiles || {};
  const { objects, tokens } = raw.objects || {};
  const rows = map?.rows || raw.rows || 20;
  const cols = map?.cols || raw.cols || 20;
  const tileSize = map?.gridSize || 32;
  const maps = tiles || raw.maps || { background: [], base: [], sky: [] };
  const assetsIn = assets || raw.assets || [];

  const canvasesInput = canvasesOrSingleBlob;
  let canvasDataUrl = null;
  let canvases = null;
  if (canvasesInput && typeof canvasesInput === "object" && !(canvasesInput instanceof Blob)) {
    canvases = {};
    for (const layer of ["background", "base", "sky"]) {
      const blob = canvasesInput[layer];
      if (!blob) {
        canvases[layer] = null;
        continue;
      }
      // eslint-disable-next-line no-await-in-loop
      canvases[layer] = await new Promise((resolve) => {
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
    rows,
    cols,
    tileSize,
    maps,
    objects: objects || raw.objects || { background: [], base: [], sky: [] },
    tokens: tokens || raw.tokens || [],
    assets: assetsIn,
    settings: settings || raw.settings || {},
    canvasDataUrl,
    canvases,
  };
}
