import React from "react";

// Inline icons (kept minimal to avoid extra deps)
const BrushIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M2 12c2 0 3-.8 3-2l5.2-5.2 2 2L7 12c-.8.8-2 .9-3 .9H2z" />
    <path d="M10 2l4 4 1-1c.6-.6.6-1.4 0-2l-2-2c-.6-.6-1.4-.6-2 0l-1 1z" />
  </svg>
);
const CursorIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M3 2l8 6-4 1 1 4-2 1-1-4-4-1z" />
  </svg>
);
const EraserIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M3 10l5-5 4 4-5 5H3l-2-2 4-4z" />
    <path d="M7 14h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
);
const GridIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M2 2h4v4H2zM8 2h4v4H8zM2 8h4v4H2zM8 8h4v4H8z" />
  </svg>
);
const CanvasIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M8 2c1.2 2 4 4 4 7a4 4 0 11-8 0c0-3 2.8-5 4-7z" />
  </svg>
);
const SaveIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M2 2h9l3 3v9H2z" />
    <path d="M4 2h6v4H4zM4 11h8v2H4z" fill="currentColor" />
  </svg>
);
const ZoomIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <circle cx="7" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10.5 10.5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default function InteractionControls({
  interactionMode,
  setInteractionMode,
  zoomToolActive,
  setZoomToolActive,
  assetGroup,
  engine,
  setEngine,
  isErasing,
  setIsErasing,
  canSave = false,
  onSaveClick,
}) {
  return (
    <>
      {/* Row 1: Mode segmented (+ Zoom Tool at right; mutually exclusive) */}
      <div className="inline-flex items-center gap-0 bg-gray-700/40 border border-gray-600 rounded overflow-hidden">
        <button
          onClick={() => { setZoomToolActive(false); setInteractionMode("draw"); }}
          title="Draw"
          aria-label="Draw"
          className={`px-3 py-1 text-sm relative group ${(!zoomToolActive && interactionMode === "draw") ? "bg-blue-600 text-white" : "bg-transparent text-white/90"}`}
        >
          <BrushIcon className="w-4 h-4" />
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none">Draw</div>
        </button>
        <button
          onClick={() => { setZoomToolActive(false); setInteractionMode("select"); }}
          title="Select"
          aria-label="Select"
          className={`px-3 py-1 text-sm relative group ${(!zoomToolActive && interactionMode === "select") ? "bg-blue-600 text-white" : "bg-transparent text-white/90"}`}
        >
          <CursorIcon className="w-4 h-4" />
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none">Select</div>
        </button>
        <button
          className={`px-3 py-1 text-sm relative group ${zoomToolActive ? 'bg-blue-600 text-white' : 'bg-transparent text-white/90'}`}
          onClick={() => setZoomToolActive((v)=> !v)}
          title="Zoom Tool: drag a rectangle to zoom"
          aria-label="Zoom Tool"
        >
          <ZoomIcon className="w-4 h-4" />
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none">Zoom Tool</div>
        </button>
      </div>

      {/* Row 2: Context */}
      <div className="mt-2 flex items-center gap-2">
        {interactionMode === 'draw' ? (
          <>
            {assetGroup !== 'token' && (
              <div className="inline-flex items-center gap-0 bg-gray-700/40 border border-gray-600 rounded overflow-hidden">
                <button
                  onClick={() => setEngine("grid")}
                  title="Grid"
                  aria-label="Grid"
                  className={`px-3 py-1 text-sm relative group ${engine === "grid" ? "bg-blue-600 text-white" : "bg-transparent text-white/90"}`}
                >
                  <GridIcon className="w-4 h-4" />
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none">Grid</div>
                </button>
                <button
                  onClick={() => setEngine("canvas")}
                  title="Canvas"
                  aria-label="Canvas"
                  className={`px-3 py-1 text-sm relative group ${engine === "canvas" ? "bg-blue-600 text-white" : "bg-transparent text-white/90"}`}
                >
                  <CanvasIcon className="w-4 h-4" />
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none">Canvas</div>
                </button>
              </div>
            )}
            <button
              onClick={() => setIsErasing((s) => !s)}
              className={`px-3 py-1 text-sm border rounded relative group ${isErasing ? 'bg-red-700 border-red-600' : 'bg-gray-700/40 border-gray-600'}`}
              title={`Eraser: ${isErasing ? 'On' : 'Off'}`}
              aria-label={`Eraser: ${isErasing ? 'On' : 'Off'}`}
            >
              <EraserIcon className="w-4 h-4" />
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none">Eraser: {isErasing ? 'On' : 'Off'}</div>
            </button>
          </>
        ) : (
          <button
            onClick={onSaveClick}
            disabled={!canSave}
            className={`px-3 py-1 text-sm border rounded relative group ${ canSave ? 'bg-amber-600 border-amber-500 hover:bg-amber-500' : 'bg-gray-700/40 border-gray-600 cursor-not-allowed'}`}
            title="Save selected as a new asset"
            aria-label="Save"
          >
            <span className="inline-flex items-center gap-2">
              <SaveIcon className="w-4 h-4" />
              <span className="text-xs">Save</span>
            </span>
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none">Save</div>
          </button>
        )}
      </div>
    </>
  );
}

