import React from "react";
import LinkedSizeInputs from "../../components/LinkedSizeInputs.jsx";

function buildLinkButtonClass(linked) {
  return `p-1 rounded border ${
    linked
      ? "bg-gray-700 border-gray-600 text-white"
      : "bg-gray-800 border-gray-700 text-gray-300 hover:text-white"
  }`;
}

export default function NaturalBrushSizeSection({
  gridSettings,
  setGridSettings,
  snapshotSettings,
}) {
  const linkXY = !!gridSettings?.linkXY;
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
  );
}
