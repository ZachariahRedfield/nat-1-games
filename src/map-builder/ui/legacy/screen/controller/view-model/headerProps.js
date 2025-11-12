export function createHeaderProps(state) {
  return {
    onUndo: state.undo,
    onRedo: state.redo,
    onSave: state.saveProject,
    onSaveAs: state.saveProjectAs,
    onLoad: state.openLoadModal,
    showSaveWords: state.mapsMenuOpen,
    mapsMenuOpen: state.mapsMenuOpen,
    onToggleMaps: state.toggleMapsMenu,
    onOpenMapSize: state.openMapSizeModal,
  };
}
