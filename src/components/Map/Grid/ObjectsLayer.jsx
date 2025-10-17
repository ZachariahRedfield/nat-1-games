import React from "react";
import { LAYERS } from "./utils";

export default function ObjectsLayer({
  objects,
  assets,
  tileSize,
  cssWidth,
  cssHeight,
  layerVisibility,
}) {
  const getAssetById = (id) => assets.find((a) => a.id === id);

  return (
    <>
      {LAYERS.map((layer, i) => (
        <div
          key={`objs-${layer}`}
          className="absolute top-0 left-0 pointer-events-none"
          style={{
            width: cssWidth,
            height: cssHeight,
            zIndex: 11 + i * 20,
            display: layerVisibility[layer] ? "block" : "none",
          }}
        >
          {(objects[layer] || []).map((o) => {
            const a = getAssetById(o.assetId);
            if (!a || a.kind !== "image") return null;
            const left = o.col * tileSize;
            const top = o.row * tileSize;
            const w = o.wTiles * tileSize;
            const h = o.hTiles * tileSize;
            const rot = o.rotation || 0;
            const sx = o.flipX ? -1 : 1;
            const sy = o.flipY ? -1 : 1;

            return (
              <div
                key={o.id}
                className="absolute"
                style={{
                  left,
                  top,
                  width: w,
                  height: h,
                  transformOrigin: "center",
                  transform: `translate(0,0) rotate(${rot}deg) scale(${sx}, ${sy})`,
                  opacity: o.opacity ?? 1,
                }}
              >
                <img
                  src={a.src}
                  alt={a.name}
                  className="w-full h-full object-fill pointer-events-none select-none"
                />
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}

