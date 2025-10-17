import React from "react";

export default function PointerOverlay({
  cssWidth,
  cssHeight,
  cursorStyle,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}) {
  return (
    <div
      className="absolute top-0 left-0"
      style={{
        width: cssWidth,
        height: cssHeight,
        zIndex: 100,
        cursor: cursorStyle,
        touchAction: "none",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}

