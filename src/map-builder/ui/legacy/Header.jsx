import React from "react";
// User badge removed; shown in global SiteHeader

export default function Header({
  onUndo,
  onRedo,
  onSave,
  onSaveAs,
  onLoad,
  onBack,
  session,
  onLogout,
  showSaveWords = false,
  // New: control Maps toggle from parent
  mapsMenuOpen = false,
  onToggleMaps,
  onOpenMapSize,
}) {
  return (
    <header className="px-3 py-1.5 sm:p-4 bg-gray-800 grid grid-cols-[1fr_auto_1fr] items-center text-white">
      {/* Left spacer to keep center aligned */}
      <div />
      {/* Center: Save / Save As / Load (aligned under main menu) */}
      <div className="flex gap-2 justify-center">
        <div className="flex flex-col items-center gap-1">
          {/* Manage Map toggle button (underline style) */}
          <button
            className={`${mapsMenuOpen ? 'text-white font-semibold' : 'text-gray-400 hover:text-gray-200'} text-[11px] sm:text-sm px-2 pb-0.5 border-b-2 border-white/90`}
            onClick={onToggleMaps}
            aria-pressed={mapsMenuOpen}
          >
            Manage Map
          </button>
          {showSaveWords && (
            <div className="flex flex-wrap justify-center gap-2 sm:gap-6 text-[11px] sm:text-sm text-gray-200">
              <button onClick={onSave} className="hover:text-white">Save</button>
              <button onClick={onSaveAs} className="hover:text-white">Save As</button>
              <button onClick={onLoad} className="hover:text-white">Load</button>
              <button onClick={onOpenMapSize} className="hover:text-white">Map Size</button>
            </div>
          )}
        </div>
      </div>
      {/* Right spacer to keep center aligned */}
      <div />
    </header>
  );
}
