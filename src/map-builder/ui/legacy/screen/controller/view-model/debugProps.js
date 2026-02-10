export function createDebugProps(state) {
  return {
    selectionDebug: {
      selectedObjects: state.selectedObjsList?.length ?? 0,
      selectedTokens: state.selectedTokensList?.length ?? 0,
      hasSelection: Boolean((state.selectedObjsList?.length ?? 0) || (state.selectedTokensList?.length ?? 0)),
      currentLayer: state.currentLayer,
    },
    brushDebug: {
      engine: state.engine,
      interactionMode: state.interactionMode,
      brushSize: state.brushSize,
      canvasOpacity: state.canvasOpacity,
      canvasSpacing: state.canvasSpacing,
      canvasBlendMode: state.canvasBlendMode,
      canvasSmoothing: state.canvasSmoothing,
      naturalSettings: state.naturalSettings,
    },
    storageDebug: {
      backend: state.activeStorageBackend,
      lastSaveResult: state.lastSaveResult,
      lastSaveAt: state.lastSaveAt,
    },
    saveProject: state.saveProject,
    openLoadModal: state.openLoadModal,
    exportProject: state.exportProject,
    clearProjectCaches: state.clearProjectCaches,
    refreshStorageBackend: state.refreshStorageBackend,
  };
}

export default createDebugProps;
