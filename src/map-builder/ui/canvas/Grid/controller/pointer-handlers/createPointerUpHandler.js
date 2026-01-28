import { computeLinkedResizeUpdate, oppositeCorner } from "../resizeMath.js";

function finalizeZoomTool({ config, refs, callbacks }) {
  const { zoomToolActive } = config;
  if (!zoomToolActive) return false;

  const { zoomDragRef } = refs;
  const { onZoomToolRect } = callbacks;
  const z = zoomDragRef.current;
  if (z && z.kind === "marquee") {
    const left = Math.min(z.startCss.x, z.curCss.x);
    const top = Math.min(z.startCss.y, z.curCss.y);
    const width = Math.abs(z.curCss.x - z.startCss.x);
    const height = Math.abs(z.curCss.y - z.startCss.y);
    if (width > 8 && height > 8) onZoomToolRect?.({ left, top, width, height });
  }
  zoomDragRef.current = null;
  return true;
}

function finalizeCanvasStroke({ refs, config, data }) {
  if (config.engine !== "canvas") return;
  const end = refs.emaCssRef?.current || refs.lastStampCssRef?.current;
  if (end) data.paintTipAt?.(end);
}

function collectMarqueeSelection({ refs, selection, config, data, actions }) {
  const drag = refs.dragRef.current;
  if (!drag) return;
  if (drag.kind !== "marquee-obj" && drag.kind !== "marquee-token") return;

  const { startRow, startCol, curRow, curCol } = drag;
  const r1 = Math.floor(Math.min(startRow, curRow));
  const r2 = Math.ceil(Math.max(startRow, curRow));
  const c1 = Math.floor(Math.min(startCol, curCol));
  const c2 = Math.ceil(Math.max(startCol, curCol));

  if (drag.kind === "marquee-obj") {
    const layerObjects = data.objects?.[config.currentLayer] || [];
    const arr = layerObjects
      .filter((o) => !(o.row + o.hTiles <= r1 || r2 <= o.row || o.col + o.wTiles <= c1 || c2 <= o.col))
      .map((o) => o.id);
    selection.setSelectedObjIds(arr);
    selection.setSelectedObjId(arr[0] || null);
    actions.onSelectionChange?.(
      arr.map((id) => selection.getObjectById(config.currentLayer, id)).filter(Boolean)
    );
  } else {
    const tokens = data.tokens || [];
    const arr = tokens
      .filter((t) => {
        const h = t.hTiles || 1;
        const w = t.wTiles || 1;
        return !(t.row + h <= r1 || r2 <= t.row || t.col + w <= c1 || c2 <= t.col);
      })
      .map((t) => t.id);
    selection.setSelectedTokenIds(arr);
    selection.setSelectedTokenId(arr[0] || null);
    actions.onTokenSelectionChange?.(
      arr.map((id) => selection.getTokenById(id)).filter(Boolean)
    );
  }
}

function finalizeLinkedResize({ refs, config, selection, actions, geometry }) {
  const drag = refs.dragRef.current;
  if (!drag || !config?.gridSettings) return;
  if (!config.gridSettings.linkXY) return;

  const snapToGrid = config.gridSettings?.snapToGrid ?? true;
  const anchorCorner = oppositeCorner(drag.corner);

  if (drag.kind === "resize-obj") {
    const obj = selection.getObjectById(config.currentLayer, drag.id);
    if (!obj) return;
    const startW = drag.startW ?? obj.wTiles ?? 1;
    const startH = drag.startH ?? obj.hTiles ?? 1;
    const deltaW = Math.abs(startW - (obj.wTiles || 1));
    const deltaH = Math.abs(startH - (obj.hTiles || 1));
    const base = deltaW >= deltaH ? obj.wTiles || 1 : obj.hTiles || 1;
    const linkedResult = computeLinkedResizeUpdate({
      anchorRow: drag.anchorRow,
      anchorCol: drag.anchorCol,
      rotation: drag.rotation ?? obj.rotation ?? 0,
      anchorCorner,
      sizeTiles: base,
      geometry,
      snapToGrid,
    });
    if (!linkedResult) return;
    if (
      obj.row === linkedResult.row &&
      obj.col === linkedResult.col &&
      obj.wTiles === linkedResult.wTiles &&
      obj.hTiles === linkedResult.hTiles
    ) {
      return;
    }
    actions.updateObjectById?.(config.currentLayer, obj.id, linkedResult);
    config.setGridSettings?.((settings) => ({
      ...settings,
      sizeCols: linkedResult.wTiles,
      sizeRows: linkedResult.hTiles,
    }));
    return;
  }

  if (drag.kind === "resize-token") {
    const token = selection.getTokenById(drag.id);
    if (!token) return;
    const startW = drag.startW ?? token.wTiles ?? 1;
    const startH = drag.startH ?? token.hTiles ?? 1;
    const deltaW = Math.abs(startW - (token.wTiles || 1));
    const deltaH = Math.abs(startH - (token.hTiles || 1));
    const base = deltaW >= deltaH ? token.wTiles || 1 : token.hTiles || 1;
    const linkedResult = computeLinkedResizeUpdate({
      anchorRow: drag.anchorRow,
      anchorCol: drag.anchorCol,
      rotation: drag.rotation ?? token.rotation ?? 0,
      anchorCorner,
      sizeTiles: base,
      geometry,
      snapToGrid,
    });
    if (!linkedResult) return;
    if (
      token.row === linkedResult.row &&
      token.col === linkedResult.col &&
      (token.wTiles || 1) === linkedResult.wTiles &&
      (token.hTiles || 1) === linkedResult.hTiles
    ) {
      return;
    }
    actions.updateTokenById?.(drag.id, linkedResult);
    config.setGridSettings?.((settings) => ({
      ...settings,
      sizeCols: linkedResult.wTiles,
      sizeRows: linkedResult.hTiles,
    }));
  }
}

export function createPointerUpHandler(context) {
  const { refs, config, callbacks, data, selection, actions, state, geometry } = context;

  return function handlePointerUp(event) {
    event.target.releasePointerCapture?.(event.pointerId);

    if (finalizeZoomTool({ config, refs, callbacks })) return;

    finalizeCanvasStroke({ refs, config, data });

    state?.setSelectionDragging?.(false);

    if (refs.dragRef.current) {
      finalizeLinkedResize({ refs, config, selection, actions, geometry });
      collectMarqueeSelection({ refs, selection, config, data, actions });
      refs.dragRef.current = null;
    }
  };
}

export default createPointerUpHandler;
