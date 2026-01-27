const HANDLE_SIZE = 10;

const withinHandle = (targetX, targetY, xCss, yCss) =>
  Math.abs(xCss - targetX) <= HANDLE_SIZE && Math.abs(yCss - targetY) <= HANDLE_SIZE;

const buildCornerData = (left, top, width, height) => [
  { corner: "nw", x: left, y: top },
  { corner: "ne", x: left + width, y: top },
  { corner: "sw", x: left, y: top + height },
  { corner: "se", x: left + width, y: top + height },
];

const rotatePoint = (x, y, cx, cy, angleRad) => {
  if (!angleRad) return { x, y };
  const dx = x - cx;
  const dy = y - cy;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return {
    x: cx + dx * cos - dy * sin,
    y: cy + dx * sin + dy * cos,
  };
};

const rotateCorners = (corners, cx, cy, angleDeg) => {
  if (!angleDeg) return corners;
  const angleRad = (angleDeg * Math.PI) / 180;
  return corners.map((corner) => {
    const { x, y } = rotatePoint(corner.x, corner.y, cx, cy, angleRad);
    return { ...corner, x, y };
  });
};

export const hitObjectResizeHandle = (xCss, yCss, { getSelectedObject, tileSize }) => {
  const sel = getSelectedObject?.();
  if (!sel) return null;

  const left = sel.col * tileSize;
  const top = sel.row * tileSize;
  const w = sel.wTiles * tileSize;
  const h = sel.hTiles * tileSize;
  const cx = left + w / 2;
  const cy = top + h / 2;

  const corners = rotateCorners(buildCornerData(left, top, w, h), cx, cy, sel.rotation || 0);
  for (const c of corners) {
    if (withinHandle(c.x, c.y, xCss, yCss)) return { sel, corner: c.corner };
  }
  return null;
};

export const hitTokenResizeHandle = (xCss, yCss, { getSelectedToken, tileSize }) => {
  const sel = getSelectedToken?.();
  if (!sel) return null;

  const widthTiles = sel.wTiles || 1;
  const heightTiles = sel.hTiles || 1;

  const left = sel.col * tileSize;
  const top = sel.row * tileSize;
  const w = widthTiles * tileSize;
  const h = heightTiles * tileSize;
  const cx = left + w / 2;
  const cy = top + h / 2;

  const corners = rotateCorners(buildCornerData(left, top, w, h), cx, cy, sel.rotation || 0);
  for (const c of corners) {
    if (withinHandle(c.x, c.y, xCss, yCss)) return { sel, corner: c.corner };
  }
  return null;
};

const ROTATE_TOLERANCE = 8;

const hitRotateRingBase = (xCss, yCss, { cx, cy, radius }) => {
  const dx = xCss - cx;
  const dy = yCss - cy;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance < radius - ROTATE_TOLERANCE || distance > radius + ROTATE_TOLERANCE) return null;
  return Math.atan2(dy, dx);
};

export const hitObjectRotateRing = (xCss, yCss, { getSelectedObject, tileSize }) => {
  const sel = getSelectedObject?.();
  if (!sel) return null;

  const cx = (sel.col + sel.wTiles / 2) * tileSize;
  const cy = (sel.row + sel.hTiles / 2) * tileSize;
  const rx = (sel.wTiles * tileSize) / 2;
  const ry = (sel.hTiles * tileSize) / 2;
  const radius = Math.sqrt(rx * rx + ry * ry) + ROTATE_TOLERANCE;
  const angle = hitRotateRingBase(xCss, yCss, { cx, cy, radius });
  if (angle == null) return null;
  return { sel, cx, cy, startAngle: angle };
};

export const hitTokenRotateRing = (xCss, yCss, { getSelectedToken, tileSize }) => {
  const sel = getSelectedToken?.();
  if (!sel) return null;

  const widthTiles = sel.wTiles || 1;
  const heightTiles = sel.hTiles || 1;

  const cx = (sel.col + widthTiles / 2) * tileSize;
  const cy = (sel.row + heightTiles / 2) * tileSize;
  const rx = (widthTiles * tileSize) / 2;
  const ry = (heightTiles * tileSize) / 2;
  const radius = Math.sqrt(rx * rx + ry * ry) + ROTATE_TOLERANCE;
  const angle = hitRotateRingBase(xCss, yCss, { cx, cy, radius });
  if (angle == null) return null;
  return { sel, cx, cy, startAngle: angle };
};
