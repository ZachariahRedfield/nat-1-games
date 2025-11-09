import React from "react";

export default function LegacyUndoRedoControls({
  top,
  center,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) {
  return (
    <div
      className="fixed z-[10015] pointer-events-auto"
      style={{ top, left: center, transform: "translateX(-50%)" }}
    >
      <div className="inline-flex items-center gap-2 bg-gray-700/40 border border-gray-600 rounded px-2 py-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo"
          className={`w-8 h-8 flex items-center justify-center rounded ${
            canUndo
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-transparent text-white/50 cursor-not-allowed"
          }`}
        >
          <svg
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="w-4 h-4"
          >
            <path d="M6 5H3.5L6.5 2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3.5 5c2.5-2.2 6.2-2 8.5.3 2.2 2.2 2.2 5.8 0 8" strokeLinecap="round" />
          </svg>
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo"
          className={`w-8 h-8 flex items-center justify-center rounded ${
            canRedo
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-transparent text-white/50 cursor-not-allowed"
          }`}
        >
          <svg
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="w-4 h-4"
          >
            <path d="M10 5h2.5L9.5 2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12.5 5c-2.5-2.2-6.2-2-8.5.3-2.2 2.2 2.2 5.8 0 8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
