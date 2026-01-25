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
  return (
    <div className="w-full z-[10020] bg-gray-800 text-white px-2 py-1 border-b border-gray-700 shadow">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[11px] uppercase opacity-80 mr-2">Layers</span>

        {canRemoveActiveLayer && (
          <button
            type="button"
            className="ml-1 px-2 py-0.5 text-xs rounded border border-red-400 text-red-300 hover:text-red-200 hover:border-red-300 transition"
            title={`Remove ${activeLayer?.name || "layer"}`}
            onClick={handleRemoveActiveLayer}
          >
            Remove
          </button>
        )}

        <button
          type="button"
          className="px-2 py-0.5 text-xs rounded-full border border-dashed border-white/60 text-white/80 hover:border-white/90 hover:text-white transition"
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
          className={`px-2 py-0.5 text-[12px] rounded-full border border-white/90 bg-gray-700 ${
            !currentLayer ? "opacity-40 cursor-not-allowed" : ""
          }`}
          onClick={() => currentLayer && toggleLayerVisibility?.(currentLayer)}
          title={toggleLabel}
        >
          {toggleLabel}
        </button>

        <div className="h-4 w-px bg-gray-600 mx-1" />

        <button
          type="button"
          className="px-2 py-0.5 text-[12px] rounded-full border border-white/90 bg-gray-700"
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
