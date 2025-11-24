import { clamp, hexToRgba } from "../utils.js";

const computeTileBounds = (centerRow, centerCol, widthTiles, heightTiles) => {
  const baseRow = centerRow;
  const baseCol = centerCol;
  const halfH = heightTiles / 2;
  const halfW = widthTiles / 2;
  return { baseRow, baseCol, halfH, halfW };
};

export const eraseGridStampAt = (centerRow, centerCol, context) => {
  const { rows, cols, gridSettings, objects, currentLayer, placeTiles, removeObjectById } = context;
  const wTiles = Math.max(1, Math.round(gridSettings.sizeCols || gridSettings.sizeTiles || 1));
  const hTiles = Math.max(1, Math.round(gridSettings.sizeRows || gridSettings.sizeTiles || 1));

  const r0 = clamp(centerRow - Math.floor(hTiles / 2), 0, Math.max(0, rows - hTiles));
  const c0 = clamp(centerCol - Math.floor(wTiles / 2), 0, Math.max(0, cols - wTiles));

  const updates = [];
  for (let r = 0; r < hTiles; r++) {
    for (let c = 0; c < wTiles; c++) {
      updates.push({ row: r0 + r, col: c0 + c });
    }
  }
  placeTiles(updates);

  const arr = objects[currentLayer] || [];
  for (const o of arr) {
    const intersects = !(
      o.row + o.hTiles <= r0 ||
      r0 + hTiles <= o.row ||
      o.col + o.wTiles <= c0 ||
      c0 + wTiles <= o.col
    );
    if (intersects) removeObjectById(currentLayer, o.id);
  }
};

export const placeGridImageAt = (centerRow, centerCol, context) => {
  const {
    selectedAsset,
    naturalSettings,
    stamp,
    gridSettings,
    rows,
    cols,
    addObject,
    currentLayer,
  } = context;

  if (!selectedAsset || (selectedAsset.kind !== "image" && selectedAsset.kind !== "natural")) return;

  const isNatural = selectedAsset.kind === "natural";
  const variants = isNatural ? selectedAsset.variants || [] : null;
  const chooseVariantIndex = () => {
    if (!isNatural) return undefined;
    const n = variants?.length || 0;
    if (n <= 0) return 0;
    if (naturalSettings?.randomVariant) return Math.floor(Math.random() * n);
    return 0;
  };

  const variantIndex = chooseVariantIndex();
  const variantAspect = isNatural
    ? variants?.[variantIndex || 0]?.aspectRatio || 1
    : selectedAsset.aspectRatio || 1;

  const aspect = variantAspect;
  const wTiles = Math.max(1, Math.round((stamp.sizeCols ?? stamp.sizeTiles ?? gridSettings.sizeCols ?? gridSettings.sizeTiles ?? 1)));
  const hTiles = Math.max(1, Math.round(stamp.sizeRows ?? Math.round(wTiles / aspect)));

  const { baseRow, baseCol, halfH, halfW } = computeTileBounds(centerRow, centerCol, wTiles, hTiles);

  const r0 = clamp(baseRow - halfH, 0, Math.max(0, rows - hTiles));
  const c0 = clamp(baseCol - halfW, 0, Math.max(0, cols - wTiles));

  const decideRotation = () => stamp.rotation ?? gridSettings.rotation ?? 0;

  const autoRotation = naturalSettings?.randomRotation
    ? [0, 90, 180, 270][Math.floor(Math.random() * 4)]
    : decideRotation();

  const flipX = naturalSettings?.randomFlipX ? Math.random() < 0.5 : !!(stamp.flipX ?? gridSettings.flipX);
  const flipY = naturalSettings?.randomFlipY ? Math.random() < 0.5 : !!(stamp.flipY ?? gridSettings.flipY);
  const opacity = naturalSettings?.randomOpacity?.enabled
    ? Math.max(
        0.05,
        Math.min(
          1,
          (naturalSettings.randomOpacity.min ?? 0.05) +
            Math.random() *
              Math.max(0, (naturalSettings.randomOpacity.max ?? 1) - (naturalSettings.randomOpacity.min ?? 0.05))
        )
      )
    : Math.max(0.05, Math.min(1, stamp.opacity ?? gridSettings.opacity ?? 1));

  addObject(currentLayer, {
    assetId: selectedAsset.id,
    row: r0,
    col: c0,
    wTiles,
    hTiles,
    rotation: autoRotation,
    flipX,
    flipY,
    opacity,
    ...(isNatural ? { variantIndex: variantIndex || 0 } : {}),
  });
};

export const placeGridColorStampAt = (centerRow, centerCol, context) => {
  const { stamp, gridSettings, rows, cols, canvasColor, selectedAsset, placeTiles } = context;

  const wTiles = Math.max(1, Math.round((stamp.sizeCols ?? stamp.sizeTiles ?? gridSettings.sizeCols ?? gridSettings.sizeTiles ?? 1)));
  const hTiles = Math.max(1, Math.round((stamp.sizeRows ?? stamp.sizeTiles ?? gridSettings.sizeRows ?? gridSettings.sizeTiles ?? 1)));

  const { baseRow, baseCol, halfH, halfW } = computeTileBounds(centerRow, centerCol, wTiles, hTiles);

  const r0 = clamp(baseRow - halfH, 0, Math.max(0, rows - hTiles));
  const c0 = clamp(baseCol - halfW, 0, Math.max(0, cols - wTiles));

  const updates = [];
  for (let r = 0; r < hTiles; r++) {
    for (let c = 0; c < wTiles; c++) {
      updates.push({ row: r0 + r, col: c0 + c });
    }
  }

  if (!canvasColor || selectedAsset?.kind !== "color") return;
  const a = Math.max(0.05, Math.min(1, stamp.opacity ?? gridSettings.opacity ?? 1));
  const rgba = hexToRgba(canvasColor, a);
  placeTiles(updates, rgba);
};

export const placeTokenAt = (centerRow, centerCol, context) => {
  const { selectedAsset, gridSettings, stamp, rows, cols, addToken, assets } = context;
  if (!selectedAsset) return;

  const baseW = Math.max(1, Math.round((stamp.sizeCols ?? stamp.sizeTiles ?? gridSettings.sizeCols ?? gridSettings.sizeTiles ?? 1)));
  const baseH = Math.max(1, Math.round((stamp.sizeRows ?? stamp.sizeTiles ?? gridSettings.sizeRows ?? gridSettings.sizeTiles ?? 1)));
  if (selectedAsset.kind === "token") {
    const wTiles = baseW;
    const hTiles = baseH;
    const r0 = clamp(
      centerRow - hTiles / 2,
      0,
      Math.max(0, rows - hTiles)
    );
    const c0 = clamp(
      centerCol - wTiles / 2,
      0,
      Math.max(0, cols - wTiles)
    );
    const glow = selectedAsset?.glowDefault || "#7dd3fc";
    addToken?.({
      assetId: selectedAsset.id,
      row: r0,
      col: c0,
      wTiles,
      hTiles,
      rotation: stamp.rotation ?? gridSettings.rotation ?? 0,
      flipX: !!(stamp.flipX ?? gridSettings.flipX),
      flipY: !!(stamp.flipY ?? gridSettings.flipY),
      opacity: Math.max(0.05, Math.min(1, stamp.opacity ?? gridSettings.opacity ?? 1)),
      glowColor: glow,
      meta: { name: selectedAsset?.name || "Token", hp: 0, initiative: 0 },
    });
    return;
  }

  if (selectedAsset.kind === "tokenGroup" && Array.isArray(selectedAsset.members)) {
    let cursorCol = centerCol;
    const placed = [];
    for (const m of selectedAsset.members) {
      const tokAsset = assets.find((a) => a.id === m.assetId);
      if (!tokAsset) continue;
      const wTiles = baseW;
      const hTiles = baseH;
      const r0 = clamp(
        centerRow - hTiles / 2,
        0,
        Math.max(0, rows - hTiles)
      );
      const c0 = clamp(
        cursorCol - wTiles / 2,
        0,
        Math.max(0, cols - wTiles)
      );
      placed.push({ assetId: tokAsset.id, r0, c0, wTiles, hTiles, name: tokAsset.name });
      cursorCol += wTiles;
    }
    for (const p of placed) {
      const tokAsset = assets.find((a) => a.id === p.assetId);
      const glow = tokAsset?.glowDefault || "#7dd3fc";
      addToken?.({
        assetId: p.assetId,
        row: p.r0,
        col: p.c0,
        wTiles: p.wTiles,
        hTiles: p.hTiles,
        rotation: stamp.rotation ?? gridSettings.rotation ?? 0,
        flipX: !!(stamp.flipX ?? gridSettings.flipX),
        flipY: !!(stamp.flipY ?? gridSettings.flipY),
        opacity: Math.max(0.05, Math.min(1, stamp.opacity ?? gridSettings.opacity ?? 1)),
        glowColor: glow,
        meta: { name: p.name || "Token", hp: 0, initiative: 0 },
      });
    }
  }
};
