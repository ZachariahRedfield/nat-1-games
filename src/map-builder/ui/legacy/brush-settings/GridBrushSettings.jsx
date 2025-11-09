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

function clampStep(value) {
  return Math.max(0.05, parseFloat(value));
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
  showSnapControls = true,
  showStep = true,
  tokenHighlightColor,
  onChangeTokenHighlight,
}) {
  const linkXY = !!(gridSettings?.linkXY);
  const numXYCls = showSnapControls
    ? "w-12 pr-5 px-1 py-0.5 text-xs text-black rounded"
    : "w-14 pr-5 px-2 py-1 text-xs text-black rounded border border-gray-500 bg-white";

  const numSmallCls = showSnapControls
    ? "w-12 px-1 py-0.5 text-xs text-black rounded"
    : "w-14 px-2 py-1 text-xs text-black rounded border border-gray-500 bg-white";

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

  const renderSnapControls = () => (
    <div className="text-xs inline-flex items-center gap-3 px-2 py-1 border border-white rounded-none w-fit">
      <span>Draw Spacing</span>
      <NumericInput
        value={gridSettings?.snapStep ?? 1}
        min={0.05}
        step={0.05}
        className={numSmallCls}
        onCommit={(value) => {
          snapshotSettings?.();
          setGridSettings((current) => ({ ...current, snapStep: clampStep(value) }));
        }}
        title="Spacing between placements while drawing"
      />
    </div>
  );

  const renderGridSnap = () => (
    <div className="text-xs inline-flex items-center gap-3 px-2 py-1 border border-white rounded-none w-fit">
      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!gridSettings?.snapToGrid}
          onChange={(event) => {
            snapshotSettings?.();
            const next = event.target.checked;
            setGridSettings((current) => ({ ...current, snapToGrid: next }));
          }}
        />
        Grid Snap
      </label>
      {!gridSettings?.snapToGrid && (
        <div className="inline-flex items-center gap-2">
          <span>Step</span>
          <NumericInput
            value={gridSettings?.snapStep ?? 1}
            min={0.05}
            step={0.05}
            className={numSmallCls}
            onCommit={(value) => {
              snapshotSettings?.();
              setGridSettings((current) => ({ ...current, snapStep: clampStep(value) }));
            }}
            title="Used when Grid Snap is off"
          />
        </div>
      )}
    </div>
  );

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
        {!showSnapControls ? (
          <>
            {renderTokenHighlight()}
            <div className="flex items-center gap-6 md:gap-8">
              <div className="text-xs inline-flex items-center gap-2 px-2 py-1 border border-white rounded-none w-fit">
                <span>Size</span>
                <LinkedSizeInputs
                  valueCols={gridSettings?.sizeCols ?? gridSettings?.sizeTiles}
                  valueRows={gridSettings?.sizeRows ?? gridSettings?.sizeTiles}
                  onCommitCols={commitCols}
                  onCommitRows={commitRows}
                  linkXY={linkXY}
                  onToggleLink={handleToggleLink}
                  inputClassName={numXYCls}
                  buttonClassName={buildLinkButtonClass(linkXY)}
                />
              </div>
              {showStep && renderSnapControls()}
            </div>
          </>
        ) : (
          <div className="flex items-end gap-3 mb-1">
            <span className="text-xs">Size</span>
            <div className="inline-flex items-center">
              <LinkedSizeInputs
                valueCols={gridSettings?.sizeCols ?? gridSettings?.sizeTiles}
                valueRows={gridSettings?.sizeRows ?? gridSettings?.sizeTiles}
                onCommitCols={commitCols}
                onCommitRows={commitRows}
                linkXY={linkXY}
                onToggleLink={handleToggleLink}
                inputClassName="w-12 pr-5 px-1 py-0.5 text-xs text-black rounded"
                buttonClassName={buildLinkButtonClass(linkXY, true)}
              />
            </div>
          </div>
        )}

        {showSnapControls && renderGridSnap()}

        {!showSnapControls ? (
          <div className="text-xs inline-flex items-center gap-2 px-2 py-1 border border-white rounded-none w-fit">
            <span>Opacity</span>
            <NumericInput
              value={gridSettings?.opacity}
              min={0.05}
              max={1}
              step={0.05}
              className={numSmallCls}
              onCommit={(value) => {
                snapshotSettings?.();
                setGridSettings((current) => ({ ...current, opacity: clampOpacity(value) }));
              }}
            />
            <div className="w-40">
              <AlphaSlider
                value={gridSettings?.opacity}
                min={0.05}
                max={1}
                step={0.05}
                onChange={(event) => {
                  snapshotSettings?.();
                  setGridSettings((current) => ({ ...current, opacity: parseFloat(event.target.value) }));
                }}
                trackHeight={16}
                thumbSize={18}
                checkerColor="#64748b"
                trackBgColor="#9ca3af"
                checkerSize={10}
              />
            </div>
          </div>
        ) : (
          <>
            <label className="block text-xs">Opacity</label>
            <div className="flex items-center gap-2 mb-1">
              <NumericInput
                value={gridSettings?.opacity}
                min={0.05}
                max={1}
                step={0.05}
                className={numSmallCls}
                onCommit={(value) => {
                  snapshotSettings?.();
                  setGridSettings((current) => ({ ...current, opacity: clampOpacity(value) }));
                }}
              />
            </div>
            <AlphaSlider
              value={gridSettings?.opacity}
              min={0.05}
              max={1}
              step={0.05}
              onChange={(event) => {
                snapshotSettings?.();
                setGridSettings((current) => ({ ...current, opacity: parseFloat(event.target.value) }));
              }}
            />
          </>
        )}

        {!showSnapControls ? (
          <div className="text-xs inline-flex items-center gap-2 px-2 py-1 border border-white rounded-none w-fit mt-2">
            <span>Rotation</span>
            <NumericInput
              value={gridSettings?.rotation}
              min={0}
              max={359}
              step={1}
              className={numSmallCls}
              onCommit={(value) => {
                snapshotSettings?.();
                setGridSettings((current) => ({ ...current, rotation: clampRotation(value) }));
              }}
            />
          </div>
        ) : (
          <>
            <label className="block text-xs">Rotation</label>
            <div className="flex items-center gap-3 mb-2">
              <NumericInput
                value={gridSettings?.rotation}
                min={0}
                max={359}
                step={1}
                className={numSmallCls}
                onCommit={(value) => {
                  snapshotSettings?.();
                  setGridSettings((current) => ({ ...current, rotation: clampRotation(value) }));
                }}
              />
            </div>
          </>
        )}

        <div className="w-full flex justify-center mt-3">
          <RotationWheel
            value={gridSettings?.rotation}
            onStart={() => snapshotSettings?.()}
            onChange={(value) => {
              const next = clampRotation(value);
              if (next === (gridSettings?.rotation ?? 0)) {
                return;
              }
              setGridSettings((current) => ({ ...current, rotation: next }));
            }}
            size={showSnapControls ? 96 : 128}
          />
        </div>
      </div>
    </div>
  );
}
