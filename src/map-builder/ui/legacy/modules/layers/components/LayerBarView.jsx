import { LayerList } from "./LayerList.jsx";
import { LayerBarZoomControls } from "./LayerBarZoomControls.jsx";

export function LayerBarView({
  layerEntries,
  currentLayer,
  setCurrentLayer,
  layerVisibility,
  renamingId,
  setRenamingId,
  draftName,
  setDraftName,
  finishRename,
  draggingId,
  dragTarget,
  dropIndicatorClass,
  handleDragStart,
  handleDragOverItem,
  handleDrop,
  handleDragEnd,
  handleDragOverEnd,
  canRemoveActiveLayer,
  handleRemoveActiveLayer,
  handleAddLayer,
  toggleLayerVisibility,
  toggleLabel,
  showGridLines,
  setShowGridLines,
  tileSize,
  setTileSize,
  onZoomToFit,
  gridSettings,
  setGridSettings,
  activeLayer,
}) {
  const tokensVisible = layerVisibility?.tokens !== false;
  const tokensToggleLabel = tokensVisible ? "Hide Tokens" : "Show Tokens";

  return (
    <div className="w-full z-[10020] bg-gray-800 text-white px-2 py-1 sm:py-2 border-b border-gray-700 shadow">
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:pb-1 max-sm:pr-2">
        <span className="hidden sm:inline text-[11px] uppercase opacity-80 mr-2">Layers</span>

        {canRemoveActiveLayer && (
          <button
            type="button"
            className="ml-1 px-2 py-1 sm:py-0.5 text-[11px] sm:text-xs rounded border border-red-400 text-red-300 hover:text-red-200 hover:border-red-300 transition whitespace-nowrap shrink-0"
            title={`Remove ${activeLayer?.name || "layer"}`}
            onClick={handleRemoveActiveLayer}
          >
            Remove
          </button>
        )}

        <button
          type="button"
          className="px-2 py-1 sm:py-0.5 text-[11px] sm:text-xs rounded-full border border-dashed border-white/60 text-white/80 hover:border-white/90 hover:text-white transition whitespace-nowrap shrink-0"
          onClick={handleAddLayer}
        >
          + Add Layer
        </button>

        <LayerList
          layers={layerEntries}
          currentLayer={currentLayer}
          setCurrentLayer={setCurrentLayer}
          layerVisibility={layerVisibility}
          renamingId={renamingId}
          setRenamingId={setRenamingId}
          draftName={draftName}
          setDraftName={setDraftName}
          finishRename={finishRename}
          draggingId={draggingId}
          dragTarget={dragTarget}
          dropIndicatorClass={dropIndicatorClass}
          handleDragStart={handleDragStart}
          handleDragOverItem={handleDragOverItem}
          handleDrop={handleDrop}
          handleDragEnd={handleDragEnd}
        />

        <div
          className="w-4 h-6"
          onDragOver={handleDragOverEnd}
          onDrop={(event) => handleDrop(event, null)}
        />

        <button
          type="button"
          disabled={!currentLayer}
          className={`px-2 py-1 sm:py-0.5 text-[11px] sm:text-[12px] rounded-full border border-white/90 bg-gray-700 whitespace-nowrap shrink-0 ${
            !currentLayer ? "opacity-40 cursor-not-allowed" : ""
          }`}
          onClick={() => currentLayer && toggleLayerVisibility?.(currentLayer)}
          title={toggleLabel}
        >
          {toggleLabel}
        </button>

        <button
          type="button"
          className="px-2 py-1 sm:py-0.5 text-[11px] sm:text-[12px] rounded-full border border-white/90 bg-gray-700 whitespace-nowrap shrink-0"
          onClick={() => toggleLayerVisibility?.("tokens")}
          title={tokensToggleLabel}
        >
          {tokensToggleLabel}
        </button>

        <div className="h-4 w-px bg-gray-600 mx-1 shrink-0" />

        <button
          type="button"
          className="px-2 py-1 sm:py-0.5 text-[11px] sm:text-[12px] rounded-full border border-white/90 bg-gray-700 whitespace-nowrap shrink-0"
          onClick={() => setShowGridLines((value) => !value)}
          title={showGridLines ? "Hide Grid" : "Show Grid"}
        >
          {showGridLines ? "Hide Grid" : "Show Grid"}
        </button>

        <LayerBarZoomControls
          tileSize={tileSize}
          setTileSize={setTileSize}
          onZoomToFit={onZoomToFit}
          snapToGrid={gridSettings?.snapToGrid ?? true}
          onToggleSnap={() => {
            setGridSettings?.((current) => ({ ...current, snapToGrid: !current?.snapToGrid }));
          }}
        />
      </div>
    </div>
  );
}
