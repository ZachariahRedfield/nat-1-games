import React from "react";
import { LAYERS } from "./utils";

export default function LayersIcon({ currentLayer, layerVisibility, onPick }) {
  // Three horizontal lines stacked and spaced; top is 'sky', bottom 'background'
  const W = 84, H = 40;
  const len = 50; // line length
  const thick = 4; // line thickness
  const baseX = (W - len) / 2;
  const baseY = 6;
  const gap = 12; // more spacing between lines

  // Draw in reverse so sky is at the top, background at bottom
  const order = [...LAYERS].reverse();

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {order.map((l, i) => {
        const y = baseY + i * gap;
        const active = currentLayer === l;
        const vis = layerVisibility?.[l] !== false;
        const fill = active ? '#60a5fa' : '#94a3b8'; // active blue, otherwise slate-400
        const opacity = vis ? 1 : 0.3;
        const group = (
          <g key={`g-${l}`} onClick={() => onPick?.(l)} cursor="pointer" opacity={opacity}>
            <rect x={baseX} y={y} width={len} height={thick} rx={2} ry={2} fill={fill} />
            {/* active brackets */}
            {active && (
              <>
                <text x={baseX - 6} y={y + thick / 2} textAnchor="end" dominantBaseline="middle" fontSize="10" fill={fill}>{'{'}</text>
                <text x={baseX + len + 6} y={y + thick / 2} textAnchor="start" dominantBaseline="middle" fontSize="10" fill={fill}>{'}'}</text>
              </>
            )}
            {/* enlarge hit area */}
            <rect x={baseX - 6} y={y - 6} width={len + 12} height={thick + 12} fill="transparent" />
          </g>
        );
        return group;
      })}
    </svg>
  );
}
