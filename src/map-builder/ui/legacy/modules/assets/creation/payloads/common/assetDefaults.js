export const ASSET_DEFAULTS = Object.freeze({
  image: {
    defaultEngine: "grid",
    allowedEngines: ["grid", "canvas"],
    defaults: { sizeTiles: 1, opacity: 1, snap: true },
  },
  token: {
    defaultEngine: "grid",
    allowedEngines: [],
    defaults: { sizeTiles: 1, opacity: 1, snap: true },
  },
  material: {
    defaultEngine: "canvas",
    allowedEngines: ["grid", "canvas"],
    defaults: { sizeTiles: 1, sizePx: 32, opacity: 0.6, snap: false },
  },
  natural: {
    defaultEngine: "grid",
    allowedEngines: [],
    defaults: { sizeTiles: 1, opacity: 1, snap: true },
  },
});
