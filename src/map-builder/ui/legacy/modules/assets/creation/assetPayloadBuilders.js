const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const ASSET_DEFAULTS = Object.freeze({
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

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  });
}

function trimName(tab, { name, labelText }) {
  const base = (name || (tab === "text" ? labelText : tab)).trim();
  return base || tab;
}

export async function createAssetPayload({ tab, state, selectedImageSrc }) {
  const name = trimName(tab, state);

  if (tab === "image") {
    if (!state.imageFile) return null;
    const src = URL.createObjectURL(state.imageFile);
    const img = await loadImage(src);
    return {
      asset: {
        id: undefined,
        name,
        kind: "image",
        src,
        aspectRatio: img.width && img.height ? img.width / img.height : 1,
        ...ASSET_DEFAULTS.image,
        img,
      },
      assetType: "image",
    };
  }

  if (tab === "token") {
    let src = null;
    let aspectRatio = 1;

    if (state.tokenFile) {
      src = URL.createObjectURL(state.tokenFile);
      const img = await loadImage(src);
      aspectRatio = img.width && img.height ? img.width / img.height : 1;
    } else if (selectedImageSrc) {
      src = selectedImageSrc;
    }

    if (!src) return null;

    return {
      asset: {
        id: undefined,
        name,
        kind: "token",
        src,
        aspectRatio,
        ...ASSET_DEFAULTS.token,
        glowDefault: state.tokenGlow,
      },
      assetType: "token",
    };
  }

  if (tab === "text") {
    const size = clamp(parseInt(state.labelSize, 10) || 28, 8, 128);
    const padding = Math.round(size * 0.35);
    const measureCanvas = document.createElement("canvas");
    const measureCtx = measureCanvas.getContext("2d");
    measureCtx.font = `${size}px ${state.labelFont}`;
    const metrics = measureCtx.measureText(state.labelText);
    const textWidth = Math.ceil(metrics.width);
    const textHeight = Math.ceil(size * 1.2);
    const width = Math.max(1, textWidth + padding * 2);
    const height = Math.max(1, textHeight + padding * 2);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, width, height);
    ctx.font = `${size}px ${state.labelFont}`;
    ctx.textBaseline = "top";
    ctx.fillStyle = state.labelColor;
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    ctx.shadowBlur = Math.max(2, Math.round(size * 0.08));
    ctx.fillText(state.labelText, padding, padding);

    const src = canvas.toDataURL("image/png");
    const img = await loadImage(src);
    return {
      asset: {
        id: undefined,
        name,
        kind: "image",
        src,
        aspectRatio: img.width && img.height ? img.width / img.height : 1,
        ...ASSET_DEFAULTS.image,
        img,
        labelMeta: {
          text: state.labelText,
          color: state.labelColor,
          font: state.labelFont,
          size: state.labelSize,
        },
      },
      assetType: "image",
    };
  }

  if (tab === "material") {
    return {
      asset: {
        id: undefined,
        name: name || "Color",
        kind: "color",
        color: state.colorHex,
        ...ASSET_DEFAULTS.material,
      },
      assetType: "material",
    };
  }

  if (tab === "natural") {
    if (!state.variants.length) return null;
    return {
      asset: {
        id: undefined,
        name: name || "Natural",
        kind: "natural",
        variants: state.variants.slice(0, 16),
        ...ASSET_DEFAULTS.natural,
      },
      assetType: "natural",
    };
  }

  return null;
}

export async function updateAssetPayload({
  tab,
  state,
  initialAsset,
  selectedImageSrc,
}) {
  if (!initialAsset) return null;

  const base = {
    ...initialAsset,
    name: (state.name || initialAsset.name || "").trim(),
  };

  if (tab === "image") {
    if (state.imageFile) {
      const src = URL.createObjectURL(state.imageFile);
      const img = await loadImage(src);
      return {
        ...base,
        kind: "image",
        src,
        img,
        aspectRatio:
          img.width && img.height
            ? img.width / img.height
            : initialAsset.aspectRatio || 1,
      };
    }

    return base;
  }

  if (tab === "token") {
    let src = initialAsset.src;
    let aspectRatio = initialAsset.aspectRatio || 1;

    if (state.tokenFile) {
      src = URL.createObjectURL(state.tokenFile);
      const img = await loadImage(src);
      aspectRatio = img.width && img.height ? img.width / img.height : aspectRatio;
    } else if (selectedImageSrc) {
      src = selectedImageSrc;
    }

    return {
      ...base,
      kind: "token",
      src,
      aspectRatio,
      glowDefault: state.tokenGlow,
    };
  }

  if (tab === "text") {
    const size = clamp(parseInt(state.labelSize, 10) || 28, 8, 128);
    const padding = Math.round(size * 0.35);
    const measureCanvas = document.createElement("canvas");
    const measureCtx = measureCanvas.getContext("2d");
    measureCtx.font = `${size}px ${state.labelFont}`;
    const metrics = measureCtx.measureText(state.labelText);
    const textWidth = Math.ceil(metrics.width);
    const textHeight = Math.ceil(size * 1.2);
    const width = Math.max(1, textWidth + padding * 2);
    const height = Math.max(1, textHeight + padding * 2);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, width, height);
    ctx.font = `${size}px ${state.labelFont}`;
    ctx.textBaseline = "top";
    ctx.fillStyle = state.labelColor;
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    ctx.shadowBlur = Math.max(2, Math.round(size * 0.08));
    ctx.fillText(state.labelText, padding, padding);

    const src = canvas.toDataURL("image/png");
    const img = await loadImage(src);

    return {
      ...base,
      kind: "image",
      src,
      img,
      aspectRatio:
        img.width && img.height
          ? img.width / img.height
          : initialAsset.aspectRatio || 1,
      labelMeta: {
        text: state.labelText,
        color: state.labelColor,
        font: state.labelFont,
        size: state.labelSize,
      },
    };
  }

  if (tab === "material") {
    return {
      ...base,
      kind: "color",
      color: state.colorHex,
    };
  }

  if (tab === "natural") {
    return {
      ...base,
      kind: "natural",
      variants: state.variants.slice(0, 16),
    };
  }

  return null;
}
