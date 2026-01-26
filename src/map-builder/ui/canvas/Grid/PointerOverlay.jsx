import React from "react";

export default function PointerOverlay({
  cssWidth,
  cssHeight,
  cursorStyle,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  capturePadding = 0,
}) {
  const padding = Math.max(0, Number(capturePadding) || 0);
  return (
    <div
      className="absolute top-0 left-0"
      style={{
        width: cssWidth + padding * 2,
        height: cssHeight + padding * 2,
        top: -padding,
        left: -padding,
        zIndex: 100,
        cursor: cursorStyle,
        touchAction: "none",
      }}
      data-offset-x={padding}
      data-offset-y={padding}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
