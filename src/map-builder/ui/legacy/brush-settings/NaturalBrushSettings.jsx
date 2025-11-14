import React from "react";
import { NumericInput } from "../../../../shared/index.js";
import SectionTitle from "./components/SectionTitle.jsx";
import LinkedSizeInputs from "./components/LinkedSizeInputs.jsx";

function buildLinkButtonClass(linked) {
  return `p-1 rounded border ${
    linked
      ? "bg-gray-700 border-gray-600 text-white"
      : "bg-gray-800 border-gray-700 text-gray-300 hover:text-white"
  }`;
}

export default function NaturalBrushSettings({
  titleOverride,
  gridSettings,
  setGridSettings,
  naturalSettings,
  setNaturalSettings,
  snapshotSettings,
  hideNaturalSize = false,
}) {
  const linkXY = !!(gridSettings?.linkXY);
  const numXYCls = "w-12 pr-5 px-1 py-0.5 text-xs text-black rounded";

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

  return (
    <div>
      <SectionTitle title={titleOverride || "Settings"} />
      <div className="grid gap-2">
        {!hideNaturalSize && (
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
                inputClassName={numXYCls}
                buttonClassName={`mx-1 ${buildLinkButtonClass(linkXY)}`}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-2">
          <label className="text-xs inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!naturalSettings?.randomRotation}
              onChange={(event) => {
                snapshotSettings?.();
                const checked = event.target.checked;
                setNaturalSettings((current) => ({ ...current, randomRotation: checked }));
              }}
            />
            Random Rotation
          </label>
          <label className="text-xs inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!naturalSettings?.randomVariant}
              onChange={(event) => {
                snapshotSettings?.();
                const checked = event.target.checked;
                setNaturalSettings((current) => ({ ...current, randomVariant: checked }));
              }}
            />
            Random Variant
          </label>
          <label className="text-xs inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!naturalSettings?.randomFlipX}
              onChange={(event) => {
                snapshotSettings?.();
                const checked = event.target.checked;
                setNaturalSettings((current) => ({ ...current, randomFlipX: checked }));
              }}
            />
            Random Flip X
          </label>
          <label className="text-xs inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!naturalSettings?.randomFlipY}
              onChange={(event) => {
                snapshotSettings?.();
                const checked = event.target.checked;
                setNaturalSettings((current) => ({ ...current, randomFlipY: checked }));
              }}
            />
            Random Flip Y
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="text-xs">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!naturalSettings?.randomSize?.enabled}
                onChange={(event) => {
                  snapshotSettings?.();
                  const enabled = event.target.checked;
                  setNaturalSettings((current) => ({
                    ...current,
                    randomSize: {
                      ...(current?.randomSize || { min: 1, max: 1 }),
                      enabled,
                    },
                  }));
                }}
              />
              Random Size
            </label>
            <div className="flex items-center gap-1 mt-1">
              <NumericInput
                value={naturalSettings?.randomSize?.min ?? 1}
                min={1}
                max={20}
                step={1}
                onCommit={(value) => {
                  const next = Math.round(value);
                  snapshotSettings?.();
                  setNaturalSettings((current) => ({
                    ...current,
                    randomSize: {
                      ...(current?.randomSize || { enabled: false, max: 1 }),
                      min: next,
                    },
                  }));
                }}
                className="w-12 p-1 text-black rounded"
              />
              <span>to</span>
              <NumericInput
                value={naturalSettings?.randomSize?.max ?? 1}
                min={1}
                max={20}
                step={1}
                onCommit={(value) => {
                  const next = Math.round(value);
                  snapshotSettings?.();
                  setNaturalSettings((current) => ({
                    ...current,
                    randomSize: {
                      ...(current?.randomSize || { enabled: false, min: 1 }),
                      max: next,
                    },
                  }));
                }}
                className="w-12 p-1 text-black rounded"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!naturalSettings?.randomOpacity?.enabled}
                onChange={(event) => {
                  snapshotSettings?.();
                  const enabled = event.target.checked;
                  setNaturalSettings((current) => ({
                    ...current,
                    randomOpacity: {
                      ...(current?.randomOpacity || { min: 1, max: 1 }),
                      enabled,
                    },
                  }));
                }}
              />
              Random Opacity
            </label>
            <div className="flex items-center gap-1 mt-1">
              <NumericInput
                value={naturalSettings?.randomOpacity?.min ?? 1}
                min={0.05}
                max={1}
                step={0.05}
                onCommit={(value) => {
                  const next = Math.max(0.05, Math.min(1, parseFloat(value)));
                  snapshotSettings?.();
                  setNaturalSettings((current) => ({
                    ...current,
                    randomOpacity: {
                      ...(current?.randomOpacity || { enabled: false, max: 1 }),
                      min: next,
                    },
                  }));
                }}
                className="w-14 p-1 text-black rounded"
              />
              <span>to</span>
              <NumericInput
                value={naturalSettings?.randomOpacity?.max ?? 1}
                min={0.05}
                max={1}
                step={0.05}
                onCommit={(value) => {
                  const next = Math.max(0.05, Math.min(1, parseFloat(value)));
                  snapshotSettings?.();
                  setNaturalSettings((current) => ({
                    ...current,
                    randomOpacity: {
                      ...(current?.randomOpacity || { enabled: false, min: 1 }),
                      max: next,
                    },
                  }));
                }}
                className="w-14 p-1 text-black rounded"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
