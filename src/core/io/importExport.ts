import { schemaVersion, ProjectSchema, type ProjectDocument } from "./ProjectSchema";
import { migrate } from "./migrations";

export type LayerMap<T> = {
  background: T;
  base: T;
  sky: T;
};

export interface ProjectState {
  schemaVersion?: number;
  version?: number;
  name?: string;
  rows: number;
  cols: number;
  tileSize: number;
  maps: LayerMap<any[][]>;
  objects: LayerMap<any[]>;
  tokens: any[];
  assets: any[];
  settings?: any;
  canvases?: Record<string, string | null> | null;
  canvasDataUrl?: string | null;
}

const LAYERS: Array<keyof LayerMap<any>> = ["background", "base", "sky"];

function cloneMaps(maps: ProjectState["maps"] | undefined): LayerMap<any[][]> {
  const result: LayerMap<any[][]> = { background: [], base: [], sky: [] };
  for (const layer of LAYERS) {
    const grid = Array.isArray(maps?.[layer]) ? maps?.[layer] : [];
    result[layer] = (grid || []).map((row: any) => (Array.isArray(row) ? [...row] : []));
  }
  return result;
}

function cloneObjects(objects: ProjectState["objects"] | undefined): LayerMap<any[]> {
  const result: LayerMap<any[]> = { background: [], base: [], sky: [] };
  for (const layer of LAYERS) {
    const list = Array.isArray(objects?.[layer]) ? objects?.[layer] : [];
    result[layer] = (list || []).map((item: any) => (item ? { ...item } : item));
  }
  return result;
}

function cloneList(items: any[] | undefined): any[] {
  return Array.isArray(items) ? items.map((entry) => (entry ? { ...entry } : entry)) : [];
}

function sanitizeAsset(asset: any): any {
  if (!asset) return asset;
  const { img, ...rest } = asset;
  if (Array.isArray(rest.variants)) {
    rest.variants = rest.variants.map((variant: any) => {
      if (!variant) return variant;
      const { img: _img, ...variantRest } = variant;
      return { ...variantRest };
    });
  }
  return { ...rest };
}

function cloneAssets(assets: any[] | undefined): any[] {
  return Array.isArray(assets) ? assets.map((asset) => sanitizeAsset(asset)) : [];
}

export function projectStateToDocument(state: ProjectState): ProjectDocument {
  const maps = cloneMaps(state.maps);
  const objects = cloneObjects(state.objects);
  const tokens = cloneList(state.tokens);
  const assets = cloneAssets(state.assets);

  const document: ProjectDocument = ProjectSchema.parse({
    schemaVersion,
    name: state.name ?? state.settings?.name,
    grid: {
      rows: state.rows ?? 0,
      cols: state.cols ?? 0,
      tileSize: state.tileSize ?? 0,
      settings: state.settings?.gridSettings ? { ...state.settings.gridSettings } : undefined,
    },
    maps,
    layers: {
      background: { objects: objects.background },
      base: { objects: objects.base },
      sky: { objects: objects.sky },
    },
    tokens,
    assets,
    settings: state.settings ? { ...state.settings } : undefined,
    canvases: state.canvases ? { ...state.canvases } : undefined,
    canvasDataUrl: state.canvasDataUrl ?? undefined,
  });

  return document;
}

export function projectDocumentToState(document: ProjectDocument): ProjectState {
  const maps = cloneMaps(document.maps as any);
  const layers = document.layers as LayerMap<{ objects: any[] }>;

  const settings = document.settings ? { ...document.settings } : {};
  if (document.grid?.settings) {
    settings.gridSettings = { ...document.grid.settings };
  }

  const state: ProjectState = {
    schemaVersion: document.schemaVersion,
    name: document.name,
    rows: document.grid.rows,
    cols: document.grid.cols,
    tileSize: document.grid.tileSize,
    maps,
    objects: {
      background: cloneList(layers.background?.objects ?? []) as any[],
      base: cloneList(layers.base?.objects ?? []) as any[],
      sky: cloneList(layers.sky?.objects ?? []) as any[],
    },
    tokens: cloneList(document.tokens as any[]),
    assets: cloneAssets(document.assets as any[]),
    settings,
    canvases: document.canvases ? { ...document.canvases } : undefined,
    canvasDataUrl: document.canvasDataUrl ?? undefined,
  };

  return state;
}

export async function exportProjectToNat1(
  state: ProjectState,
  options: { name?: string; pretty?: boolean } = {}
): Promise<{ document: ProjectDocument; blob: Blob; json: string; filename: string }> {
  const document = projectStateToDocument({ ...state, schemaVersion });
  const json = JSON.stringify(document, options.pretty === false ? undefined : null, options.pretty === false ? undefined : 2);
  const filenameBase = (options.name || state.name || state.settings?.name || "map").trim() || "map";
  const filename = filenameBase.endsWith(".nat1.json") ? filenameBase : `${filenameBase}.nat1.json`;
  const blob = new Blob([json], { type: "application/json" });
  return { document, blob, json, filename };
}

export async function importProjectFromNat1(
  input: Blob | File | string | Record<string, unknown>
): Promise<{ document: ProjectDocument; state: ProjectState }> {
  let raw: unknown = input;
  if (typeof input === "string") {
    raw = JSON.parse(input);
  } else if (input instanceof Blob) {
    const text = await input.text();
    raw = JSON.parse(text);
  }

  const document = migrate(raw);
  const state = projectDocumentToState(document);
  return { document, state };
}

export async function exportProjectPNGs(_state?: ProjectState, _options?: Record<string, unknown>): Promise<null> {
  console.warn("exportProjectPNGs is not implemented yet");
  return null;
}
