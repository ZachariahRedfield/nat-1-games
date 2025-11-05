import { z } from "zod";

export const schemaVersion = 1 as const;

const TileGridSchema = z.array(z.array(z.any()));

const LayerObjectSchema = z.object({
  id: z.string(),
  assetId: z.string(),
  row: z.number(),
  col: z.number(),
  wTiles: z.number().optional(),
  hTiles: z.number().optional(),
  rotation: z.number().optional(),
  flipX: z.boolean().optional(),
  flipY: z.boolean().optional(),
  opacity: z.number().optional(),
  meta: z.any().optional(),
  data: z.any().optional(),
});

const LayerSchema = z.object({
  objects: z.array(LayerObjectSchema),
});

const LayersSchema = z.object({
  background: LayerSchema,
  base: LayerSchema,
  sky: LayerSchema,
});

const TokenSchema = z.object({
  id: z.string(),
  assetId: z.string(),
  row: z.number(),
  col: z.number(),
  wTiles: z.number().optional(),
  hTiles: z.number().optional(),
  rotation: z.number().optional(),
  opacity: z.number().optional(),
  meta: z.any().optional(),
  data: z.any().optional(),
});

const AssetSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  kind: z.string(),
  src: z.any().optional(),
  path: z.string().optional(),
  defaults: z.any().optional(),
  allowedEngines: z.any().optional(),
  defaultEngine: z.string().optional(),
  variants: z.any().optional(),
  hiddenFromUI: z.boolean().optional(),
  labelMeta: z.any().optional(),
  glowDefault: z.any().optional(),
});

const GridSettingsSchema = z.object({
  sizeCols: z.number().optional(),
  sizeRows: z.number().optional(),
  sizeTiles: z.number().optional(),
  linkXY: z.boolean().optional(),
  snapToGrid: z.boolean().optional(),
  snapStep: z.number().optional(),
  rotation: z.number().optional(),
  flipX: z.boolean().optional(),
  flipY: z.boolean().optional(),
  opacity: z.number().optional(),
  snap: z.boolean().optional(),
  offsetRow: z.number().optional(),
  offsetCol: z.number().optional(),
});

export const ProjectSchema = z.object({
  schemaVersion: z.literal(schemaVersion),
  name: z.string().optional(),
  grid: z.object({
    rows: z.number(),
    cols: z.number(),
    tileSize: z.number(),
    settings: GridSettingsSchema.optional(),
  }),
  maps: z.object({
    background: TileGridSchema,
    base: TileGridSchema,
    sky: TileGridSchema,
  }),
  layers: LayersSchema,
  tokens: z.array(TokenSchema),
  assets: z.array(AssetSchema),
  settings: z.any().optional(),
  canvases: z.any().optional(),
  canvasDataUrl: z.string().optional(),
});

export type LayerObject = ReturnType<typeof LayerObjectSchema["parse"]>;
export type Token = ReturnType<typeof TokenSchema["parse"]>;
export type Asset = ReturnType<typeof AssetSchema["parse"]>;
export type GridSettings = ReturnType<typeof GridSettingsSchema["parse"]>;
export type ProjectDocument = ReturnType<typeof ProjectSchema["parse"]>;
