export type LayerType = "background" | "base" | "overlay";

export type LayerGrid = (string | null)[][];

export interface LayerDefinition {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  opacity: number;
  grid: LayerGrid;
}

export const layerSchema = {
  parse(input: Partial<LayerDefinition>): LayerDefinition {
    if (!input.grid) {
      throw new Error("Layer grid is required");
    }

    const type: LayerType = ((): LayerType => {
      if (input.type === "background" || input.type === "base" || input.type === "overlay") {
        return input.type;
      }
      return "base";
    })();

    const opacity = typeof input.opacity === "number" ? Math.min(Math.max(input.opacity, 0), 1) : 1;

    return {
      id: typeof input.id === "string" && input.id.length > 0 ? input.id : "",
      name: typeof input.name === "string" && input.name.length > 0 ? input.name : "Layer",
      type,
      visible: typeof input.visible === "boolean" ? input.visible : true,
      opacity,
      grid: input.grid,
    };
  },
};
