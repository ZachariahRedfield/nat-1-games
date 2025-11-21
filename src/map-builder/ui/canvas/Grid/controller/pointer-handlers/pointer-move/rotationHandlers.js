import { getPointerCssPosition } from "../gridPointerUtils.js";

export function handleObjectRotation({ event, refs, selection, config, actions }) {
  const { dragRef } = refs;
  if (!dragRef.current || dragRef.current.kind !== "rotate-obj") return false;

  const pointer = getPointerCssPosition(event);
  const angle = Math.atan2(pointer.yCss - dragRef.current.cy, pointer.xCss - dragRef.current.cx);
  const deltaRad = angle - dragRef.current.startAngle;
  const deltaDeg = (deltaRad * 180) / Math.PI;
  const o = selection.getObjectById(config.currentLayer, dragRef.current.id);
  if (!o) return true;

  let next = (dragRef.current.startRot + deltaDeg) % 360;
  if (next < 0) next += 360;
  const rot = Math.round(next);
  actions.updateObjectById(config.currentLayer, o.id, { rotation: rot });
  config.setGridSettings?.((settings) => ({ ...settings, rotation: rot }));
  return true;
}

export function handleTokenRotation({ event, refs, selection, config, actions }) {
  const { dragRef } = refs;
  if (!dragRef.current || dragRef.current.kind !== "rotate-token") return false;

  const pointer = getPointerCssPosition(event);
  const angle = Math.atan2(pointer.yCss - dragRef.current.cy, pointer.xCss - dragRef.current.cx);
  const deltaRad = angle - dragRef.current.startAngle;
  const deltaDeg = (deltaRad * 180) / Math.PI;
  const token = selection.getTokenById(dragRef.current.id);
  if (!token) return true;

  let next = (dragRef.current.startRot + deltaDeg) % 360;
  if (next < 0) next += 360;
  actions.updateTokenById?.(dragRef.current.id, { rotation: Math.round(next) });
  return true;
}
