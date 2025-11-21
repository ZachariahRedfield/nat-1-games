import { getCornerSign, getCornerWorldPosition, oppositeCorner } from "../../resizeMath.js";
import { setPointerCapture } from "./pointerCapture.js";

export function beginObjectResize({ event, cornerHit, dragRef, callbacks, config }) {
  const { onBeginObjectStroke } = callbacks;
  const { currentLayer } = config;
  const o = cornerHit.sel;
  const anchorCorner = oppositeCorner(cornerHit.corner);
  const anchor = getCornerWorldPosition(o, anchorCorner);
  const sign = getCornerSign(cornerHit.corner);

  onBeginObjectStroke?.(currentLayer);
  dragRef.current = {
    kind: "resize-obj",
    id: o.id,
    anchorRow: anchor.row,
    anchorCol: anchor.col,
    corner: cornerHit.corner,
    rotation: o.rotation || 0,
    signX: sign.x,
    signY: sign.y,
    minWidthTiles: 1,
    minHeightTiles: 1,
  };
  setPointerCapture(event);
  return true;
}

export function beginTokenResize({ event, tokenCorner, dragRef, callbacks }) {
  const { onBeginTokenStroke } = callbacks;
  const token = tokenCorner.sel;
  const anchorCorner = oppositeCorner(tokenCorner.corner);
  const anchorToken = getCornerWorldPosition(token, anchorCorner);
  const sign = getCornerSign(tokenCorner.corner);

  onBeginTokenStroke?.();
  dragRef.current = {
    kind: "resize-token",
    id: token.id,
    anchorRow: anchorToken.row,
    anchorCol: anchorToken.col,
    corner: tokenCorner.corner,
    rotation: token.rotation || 0,
    signX: sign.x,
    signY: sign.y,
    minWidthTiles: 1,
    minHeightTiles: 1,
  };
  setPointerCapture(event);
  return true;
}

export function beginObjectRotation({ event, rotHit, dragRef, callbacks, config }) {
  const { onBeginObjectStroke } = callbacks;
  const { currentLayer } = config;
  const o = rotHit.sel;

  onBeginObjectStroke?.(currentLayer);
  dragRef.current = {
    kind: "rotate-obj",
    id: o.id,
    cx: rotHit.cx,
    cy: rotHit.cy,
    startAngle: rotHit.startAngle,
    startRot: o.rotation || 0,
  };
  setPointerCapture(event);
  return true;
}

export function beginTokenRotation({ event, tokRot, dragRef, callbacks }) {
  const { onBeginTokenStroke } = callbacks;
  const token = tokRot.sel;

  onBeginTokenStroke?.();
  dragRef.current = {
    kind: "rotate-token",
    id: token.id,
    cx: tokRot.cx,
    cy: tokRot.cy,
    startAngle: tokRot.startAngle,
    startRot: token.rotation || 0,
  };
  setPointerCapture(event);
  return true;
}
