import { createAssetPanelProps } from "./assetPanelProps.js";
import { createLegacySettingsPanelProps } from "./legacySettingsPanelProps.js";

export function createRightAssetsPanelProps(state) {
  return {
    assetPanelProps: createAssetPanelProps(state),
    assetStamp: state.assetStamp,
    setAssetStamp: state.setAssetStamp,
    naturalSettings: state.naturalSettings,
    setNaturalSettings: state.setNaturalSettings,
    engine: state.engine,
    interactionMode: state.interactionMode,
    brushSize: state.brushSize,
    setBrushSize: state.setBrushSize,
    tileSize: state.tileSize,
    snapshotSettings: state.snapshotSettings,
    selectionPanelProps: createLegacySettingsPanelProps(state),
    selectedObj: state.selectedObj,
    selectedToken: state.selectedToken,
    handleSelectionChange: state.handleSelectionChange,
    handleTokenSelectionChange: state.handleTokenSelectionChange,
    clearObjectSelection: state.clearObjectSelection,
    clearTokenSelection: state.clearTokenSelection,
    setCurrentLayer: state.setCurrentLayer,
    canActOnSelection: state.selectedObjsList?.length > 0 || state.selectedTokensList?.length > 0,
    onSaveSelection: state.openSaveSelectionDialog,
    onDeleteSelection: state.deleteCurrentSelection,
    placedTabLabel: state.placedTabLabel,
  };
}
