import { z } from "zod";

const tileValue = z.union([z.null(), z.number(), z.string(), z.boolean(), z.record(z.any())]);

const tileGrid = z.array(z.array(tileValue)).superRefine((grid, ctx) => {
  if (!grid.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Grid must contain at least one row." });
    return;
  }
  const width = grid[0]?.length ?? 0;
  if (!width) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Grid must contain at least one column.",
    });
  }
  grid.forEach((row, rowIndex) => {
    if (row.length !== width) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "All rows must be the same length.",
        path: [rowIndex],
      });
    }
  });
});

const objectPlacement = z
  .object({
    id: z.string().min(1),
    assetId: z.string().min(1),
    row: z.number().int().min(0),
    col: z.number().int().min(0),
    wTiles: z.number().int().min(1),
    hTiles: z.number().int().min(1),
    rotation: z.number().optional(),
    flipX: z.boolean().optional(),
    flipY: z.boolean().optional(),
    opacity: z.number().min(0).max(1).optional(),
  })
  .passthrough();

const tokenPlacement = z
  .object({
    id: z.string().min(1),
    assetId: z.string().min(1),
    row: z.number().int().min(0),
    col: z.number().int().min(0),
    wTiles: z.number().int().min(1).default(1),
    hTiles: z.number().int().min(1).default(1),
    rotation: z.number().optional(),
    opacity: z.number().min(0).max(1).optional(),
    meta: z.record(z.any()).optional(),
  })
  .passthrough();

const assetSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    kind: z.enum(["image", "token", "natural", "label"]).default("image"),
    defaultEngine: z.enum(["grid", "canvas"]).default("grid"),
  })
  .passthrough();

const layerCollection = z.object({
  background: z.array(objectPlacement),
  base: z.array(objectPlacement),
  sky: z.array(objectPlacement),
});

export const MapProjectSchema = z.object({
  version: z.number().int().min(1).default(1),
  name: z.string().min(1).optional(),
  rows: z.number().int().min(1),
  cols: z.number().int().min(1),
  tileSize: z.number().int().min(1),
  maps: z.object({
    background: tileGrid,
    base: tileGrid,
    sky: tileGrid,
  }),
  objects: layerCollection,
  tokens: z.array(tokenPlacement),
  assets: z.array(assetSchema),
  settings: z.record(z.any()).default({}),
});

export const safeParseMapProject = (project) => MapProjectSchema.safeParse(project);
