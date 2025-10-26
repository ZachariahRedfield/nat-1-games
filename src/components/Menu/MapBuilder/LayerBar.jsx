import React from "react";
import { LAYERS } from "./utils";
import { EyeIcon, EyeOffIcon } from "./icons";
import LayersIcon from "./LayersIcon";

function LayerStackViz({ currentLayer, layerVisibility, onPick }) {
  const W = 52, H = 36;
  const base = { cx: 16, cy: 24, r: 7 };
  const layers = LAYERS.map((l, i) => ({ key: l, cx: base.cx + i * 6, cy: base.cy - i * 6, r: base.r }));
  const pathFor = (cx, cy, r) => `M ${cx} ${cy - r} L ${cx + r} ${cy} L ${cx} ${cy + r} L ${cx - r} ${cy} Z`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="text-red-400">
      {layers.map((ly) => {
        const l = ly.key;
        const active = currentLayer === l;
        const vis = layerVisibility?.[l] !== false;
        const stroke = active ? '#60a5fa' : '#ef4444';
        const opacity = vis ? 1 : 0.35;
        return (
          <g key={`g-${l}`} onClick={() => onPick?.(l)} cursor="pointer">
            <path d={pathFor(ly.cx, ly.cy, ly.r)} fill="none" stroke={stroke} strokeWidth={2} opacity={opacity} />
            <path d={pathFor(ly.cx, ly.cy, ly.r + 4)} fill="transparent" stroke="transparent" strokeWidth={8} />
          </g>
        );
      })}
    </svg>
  );
}

export default function LayerBar({
  currentLayer,
  setCurrentLayer,
  layerVisibility,
  toggleLayerVisibility,
  tokensVisible,
  setTokensVisible,
  showGridLines,
  setShowGridLines,
  tileSize,
  setTileSize,
}) {
  return (
    <div className="sticky top-0 left-0 right-0 z-40 bg-gray-800/80 text-white backdrop-blur px-2 py-1 border-b border-gray-700">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 mr-2">
          <span className="text-[11px] uppercase opacity-80">Layers</span>
          <div className="h-5 w-[76px] flex items-center">
            <LayersIcon currentLayer={currentLayer} layerVisibility={layerVisibility} onPick={setCurrentLayer} />
          </div>
        </div>
        {LAYERS.map((l) => (
          <div key={`layerbar-${l}`} className="flex items-center gap-1">
            <button
              onClick={() => setCurrentLayer(l)}
              className={`px-2 py-0.5 text-[12px] rounded ${currentLayer === l ? 'bg-blue-600' : 'bg-gray-700'}`}
              title={`Edit ${l}`}
            >
              {l}
            </button>
            <button
              onClick={() => toggleLayerVisibility(l)}
              className={`px-2 py-0.5 text-[12px] rounded ${layerVisibility[l] ? 'bg-gray-600' : 'bg-gray-700'}`}
              title={layerVisibility[l] ? 'Hide' : 'Show'}
            >
              {layerVisibility[l] ? 'Hide' : 'Show'}
            </button>
          </div>
        ))}
        <div className="h-4 w-px bg-gray-600 mx-1" />
        <label className="flex items-center gap-2 text-[12px] bg-gray-700 px-2 py-0.5 rounded cursor-pointer">
          <input type="checkbox" checked={!tokensVisible} onChange={() => setTokensVisible((v) => !v)} />
          <span>{tokensVisible ? 'Hide Tokens' : 'Show Tokens'}</span>
        </label>
        <label className="flex items-center gap-2 text-[12px] bg-gray-700 px-2 py-0.5 rounded cursor-pointer">
          <input type="checkbox" checked={!showGridLines} onChange={() => setShowGridLines((v) => !v)} />
          <span>{showGridLines ? 'Hide Grid' : 'Show Grid'}</span>
        </label>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] opacity-80">Zoom</span>
          <input
            type="range"
            min="8"
            max="128"
            step="2"
            value={tileSize}
            onChange={(e) => setTileSize(Math.max(8, Math.min(128, Math.round(parseInt(e.target.value)/2)*2)))}
          />
          <span className="text-[11px] w-10 text-right">{Math.round((tileSize/32)*100)}%</span>
        </div>
      </div>
    </div>
  );
}
