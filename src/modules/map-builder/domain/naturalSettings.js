export const NATURAL_DEFAULTS = {
  randomRotation: false,
  randomFlipX: false,
  randomFlipY: false,
  randomSize: { enabled: false, min: 1, max: 1 },
  randomOpacity: { enabled: false, min: 1, max: 1 },
  randomVariant: true,
};

export const normalizeNatural = (settings = {}) => ({
  randomRotation: !!settings.randomRotation,
  randomFlipX: !!settings.randomFlipX,
  randomFlipY: !!settings.randomFlipY,
  randomVariant:
    typeof settings.randomVariant === 'boolean'
      ? settings.randomVariant
      : NATURAL_DEFAULTS.randomVariant,
  randomSize: {
    enabled: !!settings?.randomSize?.enabled,
    min: Number.isFinite(settings?.randomSize?.min)
      ? settings.randomSize.min
      : NATURAL_DEFAULTS.randomSize.min,
    max: Number.isFinite(settings?.randomSize?.max)
      ? settings.randomSize.max
      : NATURAL_DEFAULTS.randomSize.max,
  },
  randomOpacity: {
    enabled: !!settings?.randomOpacity?.enabled,
    min: Number.isFinite(settings?.randomOpacity?.min)
      ? settings.randomOpacity.min
      : NATURAL_DEFAULTS.randomOpacity.min,
    max: Number.isFinite(settings?.randomOpacity?.max)
      ? settings.randomOpacity.max
      : NATURAL_DEFAULTS.randomOpacity.max,
  },
});

export const areNaturalSettingsEqual = (a, b) => {
  const na = normalizeNatural(a);
  const nb = normalizeNatural(b);
  return (
    na.randomRotation === nb.randomRotation &&
    na.randomFlipX === nb.randomFlipX &&
    na.randomFlipY === nb.randomFlipY &&
    na.randomVariant === nb.randomVariant &&
    na.randomSize.enabled === nb.randomSize.enabled &&
    na.randomSize.min === nb.randomSize.min &&
    na.randomSize.max === nb.randomSize.max &&
    na.randomOpacity.enabled === nb.randomOpacity.enabled &&
    na.randomOpacity.min === nb.randomOpacity.min &&
    na.randomOpacity.max === nb.randomOpacity.max
  );
};
