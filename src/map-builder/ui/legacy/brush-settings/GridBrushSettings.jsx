import React from "react";
import { NumericInput, RotationWheel, AlphaSlider } from "../../../../shared/index.js";
import SectionTitle from "./components/SectionTitle.jsx";
import LinkedSizeInputs from "./components/LinkedSizeInputs.jsx";

function buildLinkButtonClass(linked, withMargin = false) {
  const base = linked
    ? "bg-gray-700 border-gray-600 text-white"
    : "bg-gray-800 border-gray-700 text-gray-300 hover:text-white";
  return `${withMargin ? "mx-1 " : ""}p-1 rounded border ${base}`;
}

function clampOpacity(value) {
  return Math.max(0.05, Math.min(1, parseFloat(value)));
}

function clampRotation(value) {
  return Math.max(0, Math.min(359, Math.round(value)));
}

export default function GridBrushSettings({
  titleOverride,
  gridSettings,
  setGridSettings,
  snapshotSettings,
  tokenHighlightColor,
  onChangeTokenHighlight,
}) {
  const linkXY = !!(gridSettings?.linkXY);
  const numXYCls = "w-12 pr-5 px-1 py-0.5 text-xs text-black rounded";

  const numSmallCls = "w-12 px-1 py-0.5 text-xs text-black rounded";
  const sizeColsValue = gridSettings?.sizeCols ?? gridSettings?.sizeTiles;
  const sizeRowsValue = gridSettings?.sizeRows ?? gridSettings?.sizeTiles;
  const sizeColsMixed = typeof sizeColsValue !== "number";
  const sizeRowsMixed = typeof sizeRowsValue !== "number";
  const opacityMixed = typeof gridSettings?.opacity !== "number";
  const rotationMixed = typeof gridSettings?.rotation !== "number";

  const handleToggleLink = () => {
    snapshotSettings?.();
    setGridSettings((current) => ({ ...current, linkXY: !current?.linkXY }));
  };

  const commitCols = (value) => {
    snapshotSettings?.();
    setGridSettings((current) =>
      linkXY
        ? { ...current, sizeCols: value, sizeRows: value }
        : { ...current, sizeCols: value }
    );
  };

  const commitRows = (value) => {
    snapshotSettings?.();
    setGridSettings((current) =>
      linkXY
        ? { ...current, sizeRows: value, sizeCols: value }
        : { ...current, sizeRows: value }
    );
  };

  const renderTokenHighlight = () => {
    if (typeof tokenHighlightColor !== "string" || typeof onChangeTokenHighlight !== "function") {
      return null;
    }
    return (
      <div className="text-xs inline-flex items-center gap-2 px-2 py-1 border border-white rounded-none w-fit">
        <span>Highlight</span>
        <input
          type="color"
          value={tokenHighlightColor || "#7dd3fc"}
          onChange={(event) => onChangeTokenHighlight(event.target.value)}
          className="w-8 h-5 p-0 border border-gray-500 rounded"
          title="Default token highlight color"
        />
        <input
          type="text"
          className="w-24 p-1 text-black rounded"
          value={tokenHighlightColor || "#7dd3fc"}
          onChange={(event) => onChangeTokenHighlight(event.target.value)}
          placeholder="#7dd3fc"
        />
      </div>
    );
  };

  return (
    <div>
      <SectionTitle title={titleOverride || "Settings"} />
      <div className="grid gap-2">
        {renderTokenHighlight()}

        <div className="flex items-end gap-3 mb-1">
          <span className="text-xs">Size</span>
          <div className="inline-flex items-center">
            <LinkedSizeInputs
              valueCols={sizeColsValue}
              valueRows={sizeRowsValue}
              onCommitCols={commitCols}
              onCommitRows={commitRows}
              linkXY={linkXY}
              onToggleLink={handleToggleLink}
              inputClassName={numXYCls}
              buttonClassName={buildLinkButtonClass(linkXY, true)}
              placeholderCols={sizeColsMixed ? "N/A" : ""}
              placeholderRows={sizeRowsMixed ? "N/A" : ""}
            />
          </div>
        </div>

        <label className="block text-xs">Opacity</label>
        <div className="flex items-center gap-2 mb-1">
          <NumericInput
            value={gridSettings?.opacity}
            min={0.05}
            max={1}
            step={0.05}
            className={numSmallCls}
            placeholder={opacityMixed ? "N/A" : ""}
            onCommit={(value) => {
              snapshotSettings?.();
              setGridSettings((current) => ({ ...current, opacity: clampOpacity(value) }));
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <AlphaSlider
            value={typeof gridSettings?.opacity === "number" ? gridSettings.opacity : 1}
            min={0.05}
            max={1}
            step={0.05}
            onChange={(event) => {
              snapshotSettings?.();
              setGridSettings((current) => ({ ...current, opacity: parseFloat(event.target.value) }));
            }}
            className="flex-1"
          />
          {opacityMixed && <span className="text-[10px] text-gray-400 uppercase">N/A</span>}
        </div>

        <label className="block text-xs mt-2">Rotation</label>
        <div className="flex items-center gap-3 mb-2">
          <NumericInput
            value={gridSettings?.rotation}
            min={0}
            max={359}
            step={1}
            className={numSmallCls}
            placeholder={rotationMixed ? "N/A" : ""}
            onCommit={(value) => {
              snapshotSettings?.();
              setGridSettings((current) => ({ ...current, rotation: clampRotation(value) }));
            }}
          />
        </div>

        <div className="w-full flex justify-center mt-3">
          <RotationWheel
            value={typeof gridSettings?.rotation === "number" ? gridSettings.rotation : 0}
            onStart={() => snapshotSettings?.()}
            onChange={(value) => {
              const next = clampRotation(value);
              if (next === (gridSettings?.rotation ?? 0)) {
                return;
              }
              setGridSettings((current) => ({ ...current, rotation: next }));
            }}
            size={128}
          />
        </div>
        {rotationMixed && <div className="text-center text-[10px] text-gray-400 uppercase mt-1">N/A</div>}
      </div>
    </div>
  );
}
