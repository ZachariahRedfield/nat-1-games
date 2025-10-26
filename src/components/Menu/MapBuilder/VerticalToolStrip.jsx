import React from "react";

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
const PanIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M6 2c.6 0 1 .4 1 1v3h1V2c0-.6.4-1 1-1s1 .4 1 1v4h1V3c0-.6.4-1 1-1s1 .4 1 1v5h1V5c0-.6.4-1 1-1s1 .4 1 1v6c0 2.2-1.8 4-4 4H7c-2.8 0-5-2.2-5-5V9c0-1.1.9-2 2-2h1V3c0-.6.4-1 1-1z" />
  </svg>
);
const ZoomIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <circle cx="7" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10.5 10.5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
const TrashIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M6 2h4l1 1h3v2H2V3h3l1-1z" />
    <path d="M3 6h10l-1 8H4L3 6z" />
  </svg>
);

export default function VerticalToolStrip({
  interactionMode,
  zoomToolActive,
  panToolActive,
  setInteractionMode,
  setZoomToolActive,
  setPanToolActive,
  isErasing,
  setIsErasing,
  engine,
  setEngine,
  assetGroup,
  canActOnSelection,
  onSaveSelection,
  onDeleteSelection,
}) {
  const btnCls = (active) => `w-8 h-8 flex items-center justify-center rounded ${active ? 'bg-gray-700 text-white' : 'bg-transparent text-white/90 hover:bg-gray-700/40'}`;
  const timersRef = React.useRef({});
  const [tip, setTip] = React.useState({}); // {key:boolean}
  const showTip = (key) => {
    try { if (timersRef.current[key]) clearTimeout(timersRef.current[key]); } catch {}
    setTip((s) => ({ ...s, [key]: true }));
    timersRef.current[key] = setTimeout(() => setTip((s) => ({ ...s, [key]: false })), 1500);
  };
  const tipCls = (key) => `${tip[key] ? 'opacity-100' : 'opacity-0'} transition-opacity`;
  const drawActive = (!zoomToolActive && !panToolActive && interactionMode === 'draw');
  return (
    <div className={`relative inline-flex flex-col items-center gap-1 bg-gray-700/30 border border-gray-600 rounded-md p-1 shadow z-[10015] overflow-visible`}>
      {/* Draw button (keeps column width fixed) */}
      <div className="group relative">
        <button
          onClick={() => { showTip('draw'); setZoomToolActive(false); setPanToolActive(false); setInteractionMode('draw'); }}
          aria-label="Draw"
          className={btnCls(!zoomToolActive && !panToolActive && interactionMode === 'draw') + ' relative'}
        >
          <span className={`${tip['draw'] ? 'opacity-0' : 'opacity-100'} transition-opacity`}><BrushIcon /></span>
          <span className={`absolute inset-0 flex items-center justify-center text-[10px] ${tipCls('draw')}`}>Draw</span>
        </button>
      </div>
      {/* Floating Draw options: Grid, Canvas, Eraser */}
      {drawActive && (
        <div className="absolute left-full ml-2 top-1 pointer-events-auto flex items-center gap-2">
          {/* Grid toggle */}
          {assetGroup !== 'token' && (
            <div className="h-[36px] bg-gray-700/30 border border-gray-600 rounded-md flex items-center justify-center group relative">
              <button
                onClick={() => { showTip('grid'); setEngine?.('grid'); }}
                aria-label="Grid"
                className={`relative w-8 h-8 flex items-center justify-center rounded ${engine === 'grid' ? 'bg-gray-700 text-white' : 'bg-transparent text-white/90 hover:bg-gray-700/40'}`}
              >
                <span className={`${tip['grid'] ? 'opacity-0' : 'opacity-100'} transition-opacity`}><GridIcon /></span>
                <span className={`absolute inset-0 flex items-center justify-center text-[10px] ${tipCls('grid')}`}>Grid</span>
              </button>
            </div>
          )}
          {/* Canvas toggle */}
          {assetGroup !== 'token' && (
            <div className="h-[36px] bg-gray-700/30 border border-gray-600 rounded-md flex items-center justify-center group relative">
              <button
                onClick={() => { showTip('canvas'); setEngine?.('canvas'); }}
                aria-label="Canvas"
                className={`relative w-8 h-8 flex items-center justify-center rounded ${engine === 'canvas' ? 'bg-gray-700 text-white' : 'bg-transparent text-white/90 hover:bg-gray-700/40'}`}
              >
                <span className={`${tip['canvas'] ? 'opacity-0' : 'opacity-100'} transition-opacity`}><CanvasIcon /></span>
                <span className={`absolute inset-0 flex items-center justify-center text-[10px] ${tipCls('canvas')}`}>Canvas</span>
              </button>
            </div>
          )}
          {/* Eraser toggle */}
          <div className="h-[36px] bg-gray-700/30 border border-gray-600 rounded-md flex items-center justify-center group relative">
            <button
              onClick={() => { showTip('eraser'); setIsErasing?.((s) => !s); }}
              aria-label="Eraser"
              className={`relative w-8 h-8 flex items-center justify-center rounded ${isErasing ? 'bg-red-700 text-white' : 'bg-transparent text-white/90 hover:bg-gray-700/40'}`}
            >
              <span className={`${tip['eraser'] ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
                <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" className="w-4 h-4">
                  <path d="M3 10l5-5 4 4-5 5H3l-2-2 4-4z" />
                  <path d="M7 14h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                </svg>
              </span>
              <span className={`absolute inset-0 flex items-center justify-center text-[10px] ${tipCls('eraser')}`}>Eraser</span>
            </button>
          </div>
        </div>
      )}
      <div className="group relative">
        <button
          onClick={() => { showTip('select'); setZoomToolActive(false); setPanToolActive(false); setInteractionMode('select'); }}
          aria-label="Select"
          className={btnCls(!zoomToolActive && !panToolActive && interactionMode === 'select') + ' relative'}
        >
          <span className={`${tip['select'] ? 'opacity-0' : 'opacity-100'} transition-opacity`}><CursorIcon /></span>
          <span className={`absolute inset-0 flex items-center justify-center text-[10px] ${tipCls('select')}`}>Select</span>
        </button>
      </div>
      <div className="group relative">
        <button
          onClick={() => { showTip('pan'); setPanToolActive(true); setZoomToolActive(false); }}
          aria-label="Pan"
          className={btnCls(panToolActive) + ' relative'}
        >
          <span className={`${tip['pan'] ? 'opacity-0' : 'opacity-100'} transition-opacity`}><PanIcon /></span>
          <span className={`absolute inset-0 flex items-center justify-center text-[10px] ${tipCls('pan')}`}>Pan</span>
        </button>
      </div>
      <div className="group relative">
        <button
          onClick={() => { showTip('zoom'); setZoomToolActive(true); setPanToolActive(false); }}
          aria-label="Zoom"
          className={btnCls(zoomToolActive) + ' relative'}
        >
          <span className={`${tip['zoom'] ? 'opacity-0' : 'opacity-100'} transition-opacity`}><ZoomIcon /></span>
          <span className={`absolute inset-0 flex items-center justify-center text-[10px] ${tipCls('zoom')}`}>Zoom</span>
        </button>
      </div>

      {/* Floating Select actions: Save, Delete */}
      {(!zoomToolActive && !panToolActive && interactionMode === 'select') && (
        <div className="absolute left-full ml-2 top-[40px] pointer-events-auto flex items-center gap-2">
          <div className="h-[36px] bg-gray-700/30 border border-gray-600 rounded-md flex items-center justify-center group relative">
            <button
              onClick={() => { showTip('save'); canActOnSelection && onSaveSelection?.(); }}
              disabled={!canActOnSelection}
              aria-label="Save"
              className={`relative w-8 h-8 flex items-center justify-center rounded ${canActOnSelection ? 'bg-gray-700 text-white' : 'bg-transparent text-white/50 cursor-not-allowed'}`}
            >
              <span className={`${tip['save'] ? 'opacity-0' : 'opacity-100'} transition-opacity`}><SaveIcon /></span>
              <span className={`absolute inset-0 flex items-center justify-center text-[10px] ${tipCls('save')}`}>Save</span>
            </button>
          </div>
          <div className="h-[36px] bg-gray-700/30 border border-gray-600 rounded-md flex items-center justify-center group relative">
            <button
              onClick={() => { showTip('delete'); canActOnSelection && onDeleteSelection?.(); }}
              disabled={!canActOnSelection}
              aria-label="Delete"
              className={`relative w-8 h-8 flex items-center justify-center rounded ${canActOnSelection ? 'bg-gray-700 text-white' : 'bg-transparent text-white/50 cursor-not-allowed'}`}
            >
              <span className={`${tip['delete'] ? 'opacity-0' : 'opacity-100'} transition-opacity`}><TrashIcon /></span>
              <span className={`absolute inset-0 flex items-center justify-center text-[10px] ${tipCls('delete')}`}>Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
