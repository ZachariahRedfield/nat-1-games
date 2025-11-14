import React from "react";

const DEFAULT_LAYER = [{ id: "layer-1", name: "Layer 1" }];

const normalizeLayers = (layers = []) =>
  (layers.length ? layers : DEFAULT_LAYER)
    .map((layer) =>
      typeof layer === "string" ? { id: layer, name: layer } : layer
    )
    .filter((layer) => !!layer?.id);

export default function LayersIcon({ layers, currentLayer, layerVisibility, onPick }) {
  const entries = normalizeLayers(layers);
  const W = 84;
  const padding = 6;
  const lineHeight = 5;
  const gap = 6;
  const len = 48;
  const baseX = (W - len) / 2;
  const H = padding * 2 + entries.length * lineHeight + Math.max(0, entries.length - 1) * gap;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {entries
        .slice()
        .reverse()
        .map((layer, index) => {
          const y = padding + index * (lineHeight + gap);
          const active = currentLayer === layer.id;
          const visible = layerVisibility?.[layer.id] !== false;
          const fill = active ? "#60a5fa" : "#94a3b8";
          const opacity = visible ? 1 : 0.3;
          return (
            <g
              key={layer.id}
              onClick={() => onPick?.(layer.id)}
              cursor="pointer"
              opacity={opacity}
            >
              <title>{layer.name}</title>
              <rect x={baseX} y={y} width={len} height={lineHeight} rx={2} ry={2} fill={fill} />
              {active && (
                <rect
                  x={baseX - 4}
                  y={y - 2}
                  width={len + 8}
                  height={lineHeight + 4}
                  fill="none"
                  stroke={fill}
                  strokeWidth={1.5}
                  opacity={0.8}
                />
              )}
              <rect x={baseX - 8} y={y - 6} width={len + 16} height={lineHeight + 12} fill="transparent" />
            </g>
          );
        })}
    </svg>
  );
}
