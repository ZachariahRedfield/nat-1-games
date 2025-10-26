import React from "react";
// User badge removed; shown in global SiteHeader

export default function Header({
  showToolbar,
  onToggleToolbar,
  onUndo,
  onRedo,
  onSave,
  onSaveAs,
  onLoad,
  onBack,
  session,
  onLogout,
}) {
  return (
    <header className="p-4 bg-gray-800 flex justify-between text-white items-center">
      <div className="flex flex-col items-start gap-1">
        <button
          onClick={onToggleToolbar}
          className="text-[11px] px-2 py-0.5 bg-gray-700/60 hover:bg-gray-600/70 border border-gray-600 rounded"
        >
          {showToolbar ? "Hide Toolbar" : "Show Toolbar"}
        </button>
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex gap-2 bg-gray-700/40 border border-gray-600 rounded px-2 py-1">
          <button onClick={onUndo} className="px-2.5 py-1 text-sm bg-gray-700 hover:bg-gray-600 border border-gray-500 rounded">Undo</button>
          <button onClick={onRedo} className="px-2.5 py-1 text-sm bg-gray-700 hover:bg-gray-600 border border-gray-500 rounded">Redo</button>
        </div>
        <div className="flex gap-2 bg-gray-700/40 border border-gray-600 rounded px-2 py-1">
          <button onClick={onSave} className="px-2.5 py-1 text-sm bg-green-700 hover:bg-green-600 border border-green-500 rounded">Save</button>
          <button onClick={onSaveAs} className="px-2.5 py-1 text-sm bg-emerald-700 hover:bg-emerald-600 border border-emerald-500 rounded">Save As</button>
          <button onClick={onLoad} className="px-2.5 py-1 text-sm bg-blue-700 hover:bg-blue-600 border border-blue-500 rounded">Load</button>
        </div>
      </div>
    </header>
  );
}
