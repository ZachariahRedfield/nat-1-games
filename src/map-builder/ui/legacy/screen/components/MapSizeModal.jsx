import React from "react";

export default function MapSizeModal({
  open,
  rowsValue,
  colsValue,
  onChangeRows,
  onChangeCols,
  onApply,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10060] flex items-center justify-center bg-black/60 pointer-events-auto">
      <div className="w-[90%] max-w-sm bg-gray-800 border border-gray-600 rounded p-4 text-gray-100">
        <div className="font-semibold mb-2">Map Size</div>
        <div className="grid grid-cols-2 gap-3 mb-3 items-end">
          <label className="text-xs">
            Rows
            <input
              type="number"
              value={rowsValue}
              min={1}
              max={200}
              step={1}
              onChange={onChangeRows}
              className="box-border w-full px-1 py-0.5 text-xs text-black rounded"
            />
          </label>
          <label className="text-xs">
            Cols
            <input
              type="number"
              value={colsValue}
              min={1}
              max={200}
              step={1}
              onChange={onChangeCols}
              className="box-border w-full px-1 py-0.5 text-xs text-black rounded"
            />
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <button className="px-2 py-1 text-xs bg-gray-700 rounded" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded"
            onClick={onApply}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
