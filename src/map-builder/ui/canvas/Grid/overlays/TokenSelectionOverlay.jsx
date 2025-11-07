import React from "react";

export default function TokenSelectionOverlay({
  selectedTokenId,
  selectedTokenIds,
  getTokenById,
  tileSize,
}) {
  const ids =
    selectedTokenIds && selectedTokenIds.length
      ? selectedTokenIds
      : selectedTokenId
      ? [selectedTokenId]
      : [];

  if (!ids.length) return null;

  const renderSelectionBox = (token) => {
    const left = token.col * tileSize;
    const top = token.row * tileSize;
    const width = (token.wTiles || 1) * tileSize;
    const height = (token.hTiles || 1) * tileSize;

    return {
      left,
      top,
      width,
      height,
    };
  };

  return (
    <>
      {ids.map((id) => {
        const token = getTokenById(id);
        if (!token) return null;
        const { left, top, width, height } = renderSelectionBox(token);
        return (
          <div
            key={`tsel-${id}`}
            className="absolute pointer-events-none"
            style={{
              left,
              top,
              width,
              height,
              zIndex: 9998,
              border: "2px dashed #22d3ee",
              boxShadow: "0 0 0 2px rgba(34,211,238,0.25) inset",
            }}
          />
        );
      })}

      {ids.map((id) => {
        const token = getTokenById(id);
        if (!token) return null;
        const { left, top, width, height } = renderSelectionBox(token);
        const size = 8;
        const half = Math.floor(size / 2);
        const corners = [
          { key: "nw", x: left, y: top },
          { key: "ne", x: left + width, y: top },
          { key: "sw", x: left, y: top + height },
          { key: "se", x: left + width, y: top + height },
        ];

        return corners.map((corner) => (
          <div
            key={`thdl-${id}-${corner.key}`}
            className="absolute bg-cyan-300 shadow pointer-events-none"
            style={{
              left: corner.x - half,
              top: corner.y - half,
              width: size,
              height: size,
              zIndex: 9999,
              borderRadius: 2,
            }}
          />
        ));
      })}

      {ids.length === 1 && (() => {
        const token = getTokenById(ids[0]);
        if (!token) return null;
        const centerX = (token.col + (token.wTiles || 1) / 2) * tileSize;
        const centerY = (token.row + (token.hTiles || 1) / 2) * tileSize;
        const radiusX = ((token.wTiles || 1) * tileSize) / 2;
        const radiusY = ((token.hTiles || 1) * tileSize) / 2;
        const radius = Math.sqrt(radiusX * radiusX + radiusY * radiusY) + 8;
        const diameter = radius * 2;
        return (
          <div
            key={`trot-${ids[0]}`}
            className="absolute pointer-events-none"
            style={{
              left: centerX - radius,
              top: centerY - radius,
              width: diameter,
              height: diameter,
              zIndex: 10000,
              borderRadius: "50%",
              boxShadow: "0 0 0 2px rgba(34,211,238,0.55) inset",
            }}
          />
        );
      })()}
    </>
  );
}
