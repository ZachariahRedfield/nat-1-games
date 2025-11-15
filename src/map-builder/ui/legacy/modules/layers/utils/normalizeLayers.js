export function normalizeLayers(layers = []) {
  return layers
    .map((layer) =>
      typeof layer === "string" ? { id: layer, name: layer } : layer,
    )
    .filter((layer) => !!layer?.id);
}
