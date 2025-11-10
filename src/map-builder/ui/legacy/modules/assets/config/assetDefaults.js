const DEFAULT_NATURAL_SETTINGS = {
  randomRotation: false,
  randomFlipX: false,
  randomFlipY: false,
  randomSize: { enabled: false, min: 1, max: 1 },
  randomOpacity: { enabled: false, min: 1, max: 1 },
  randomVariant: true,
};

const normalizeStamp = (stamp = {}) => ({
  sizeTiles: Number.isFinite(stamp.sizeTiles) ? stamp.sizeTiles : 1,
  sizeCols: Number.isFinite(stamp.sizeCols)
    ? stamp.sizeCols
    : Number.isFinite(stamp.sizeTiles)
    ? stamp.sizeTiles
    : 1,
  sizeRows: Number.isFinite(stamp.sizeRows)
    ? stamp.sizeRows
    : Number.isFinite(stamp.sizeTiles)
    ? stamp.sizeTiles
    : 1,
  rotation: Number.isFinite(stamp.rotation) ? stamp.rotation : 0,
  flipX: !!stamp.flipX,
  flipY: !!stamp.flipY,
  opacity: Number.isFinite(stamp.opacity) ? stamp.opacity : 1,
  snapToGrid: stamp.snapToGrid ?? true,
  snapStep: Number.isFinite(stamp.snapStep) ? stamp.snapStep : 1,
  linkXY: !!stamp.linkXY,
});

const normalizeNaturalSettings = (settings = {}) => ({
  randomRotation: !!settings.randomRotation,
  randomFlipX: !!settings.randomFlipX,
  randomFlipY: !!settings.randomFlipY,
  randomSize: {
    enabled: !!settings.randomSize?.enabled,
    min: Number.isFinite(settings.randomSize?.min) ? settings.randomSize.min : 1,
    max: Number.isFinite(settings.randomSize?.max) ? settings.randomSize.max : 1,
  },
  randomOpacity: {
    enabled: !!settings.randomOpacity?.enabled,
    min: Number.isFinite(settings.randomOpacity?.min) ? settings.randomOpacity.min : 1,
    max: Number.isFinite(settings.randomOpacity?.max) ? settings.randomOpacity.max : 1,
  },
  randomVariant: settings.randomVariant ?? true,
});

export { DEFAULT_NATURAL_SETTINGS, normalizeStamp, normalizeNaturalSettings };
