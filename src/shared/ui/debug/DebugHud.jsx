import React, { useMemo, useState } from "react";

function formatValue(value) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return "[unserializable]";
  }
}

export default function DebugHud({
  responsiveMode,
  activeToolId,
  pointerDebug,
  selectionDebug,
  brushDebug,
  storageDebug,
  stateSummary,
  actions,
}) {
  const [collapsed, setCollapsed] = useState(false);

  const rows = useMemo(
    () => [
      ["responsiveMode", responsiveMode],
      ["activeToolId", activeToolId],
      ["pointerDebug", pointerDebug],
      ["selectionDebug", selectionDebug],
      ["brushDebug", brushDebug],
      ["storageDebug", storageDebug],
    ],
    [activeToolId, brushDebug, pointerDebug, responsiveMode, selectionDebug, storageDebug],
  );

  return (
    <aside
      className="fixed bottom-3 right-3 pointer-events-auto rounded border border-gray-700 bg-black/80 text-[11px] text-gray-100 shadow-xl"
      style={{ width: 340, maxWidth: "min(340px, calc(100vw - 24px))" }}
      aria-label="Debug HUD"
    >
      <div className="flex items-center justify-between gap-2 border-b border-gray-700 px-2 py-1.5">
        <strong className="text-[11px] tracking-wide">Dev Debug HUD</strong>
        <button
          type="button"
          className="rounded border border-gray-600 bg-gray-800 px-2 py-0.5 text-[10px] hover:bg-gray-700"
          onClick={() => setCollapsed((value) => !value)}
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>

      {collapsed ? null : (
        <div className="space-y-2 p-2">
          <div className="space-y-1">
            {rows.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[110px_1fr] items-start gap-2">
                <span className="text-gray-400">{label}</span>
                <code className="break-words text-gray-100">{formatValue(value)}</code>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button type="button" className="rounded bg-blue-700 px-2 py-1 hover:bg-blue-600" onClick={actions?.saveNow}>
              Save
            </button>
            <button type="button" className="rounded bg-blue-700 px-2 py-1 hover:bg-blue-600" onClick={actions?.loadNow}>
              Load
            </button>
            <button
              type="button"
              className="rounded bg-blue-700 px-2 py-1 hover:bg-blue-600"
              onClick={actions?.exportNow}
            >
              Export
            </button>
            <button
              type="button"
              className="rounded bg-red-700 px-2 py-1 hover:bg-red-600"
              onClick={actions?.clearCaches}
            >
              Clear Caches
            </button>
            <button
              type="button"
              className="col-span-2 rounded bg-gray-700 px-2 py-1 hover:bg-gray-600"
              onClick={actions?.dumpState}
            >
              Dump State Summary
            </button>
          </div>

          {stateSummary ? (
            <div className="max-h-36 overflow-auto rounded border border-gray-700 bg-gray-900/80 p-1.5">
              <pre className="whitespace-pre-wrap break-words text-[10px] text-gray-200">{stateSummary}</pre>
            </div>
          ) : null}
        </div>
      )}
    </aside>
  );
}

