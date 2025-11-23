export function deriveAssetName(tab, state) {
  const base = (state.name || (tab === "text" ? state.labelText : tab)).trim();
  return base || tab;
}
