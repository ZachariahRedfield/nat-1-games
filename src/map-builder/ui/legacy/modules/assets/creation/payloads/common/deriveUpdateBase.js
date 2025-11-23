export function deriveUpdateBase(initialAsset, state) {
  return {
    ...initialAsset,
    name: (state.name || initialAsset.name || "").trim(),
  };
}
