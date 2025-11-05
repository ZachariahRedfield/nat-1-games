import { z } from "zod";

export const setGridSizePayloadSchema = z.object({
  rows: z.number().int().min(1).max(512),
  cols: z.number().int().min(1).max(512),
  anchor: z.enum(["center", "top-left", "bottom-right"]).optional(),
});

export const addLayerPayloadSchema = z.object({
  layerId: z.string().min(1),
  label: z.string().min(1).optional(),
  tiles: z
    .array(z.array(z.union([z.string(), z.null()])))
    .optional(),
  opacity: z.number().min(0).max(1).optional(),
  index: z.number().int().nonnegative().optional(),
});

export const setLayerOpacityPayloadSchema = z.object({
  layerId: z.string().min(1),
  opacity: z.number().min(0).max(1),
});

export const paintStrokeBatchPayloadSchema = z.object({
  layerId: z.string().min(1),
  updates: z
    .array(
      z.object({
        row: z.number().int().min(0),
        col: z.number().int().min(0),
        color: z.union([z.string().min(1), z.null()]),
      })
    )
    .min(1),
});

export const commandPayloadSchemas = {
  SetGridSize: setGridSizePayloadSchema,
  AddLayer: addLayerPayloadSchema,
  SetLayerOpacity: setLayerOpacityPayloadSchema,
  PaintStrokeBatch: paintStrokeBatchPayloadSchema,
} as const;

export type CommandType = keyof typeof commandPayloadSchemas;

export type CommandPayload<TType extends CommandType> = z.infer<
  (typeof commandPayloadSchemas)[TType]
>;

export interface Command<TType extends CommandType = CommandType> {
  type: TType;
  payload: CommandPayload<TType>;
}

export interface CommandResult<TType extends CommandType = CommandType>
  extends Command<TType> {
  label?: string;
}

export interface HistorySnapshot<TType extends CommandType = CommandType>
  extends CommandResult<TType> {
  undo: () => void;
  redo: () => void;
}

export type CommandHandler<TType extends CommandType> = (
  payload: CommandPayload<TType>
) => (Omit<HistorySnapshot<TType>, "payload" | "type"> & {
  skipHistory?: boolean;
}) | void;

export type HistoryEventKind = "push" | "undo" | "redo" | "clear";

export interface HistoryEvent<TType extends CommandType = CommandType> {
  kind: HistoryEventKind;
  entry?: HistorySnapshot<TType>;
  undoCount: number;
  redoCount: number;
}
