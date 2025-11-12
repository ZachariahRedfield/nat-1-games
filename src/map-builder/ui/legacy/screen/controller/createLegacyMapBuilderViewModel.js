import { createDialogProps } from "./view-model/dialogProps.js";
import { createFeedbackLayerProps } from "./view-model/feedbackProps.js";
import { createLegacySettingsPanelProps } from "./view-model/legacySettingsPanelProps.js";
import { createLayoutProps } from "./view-model/layoutProps.js";
import { createLayerBarProps } from "./view-model/layerBarProps.js";
import { createToolbarProps } from "./view-model/toolbarProps.js";
import { createHistoryControls } from "./view-model/historyControls.js";
import { createGridProps } from "./view-model/gridProps.js";
import { createBottomAssetsDrawerProps } from "./view-model/bottomAssetsDrawerProps.js";
import { createHeaderProps } from "./view-model/headerProps.js";

export function createLegacyMapBuilderViewModel(state) {
  const headerProps = createHeaderProps(state);
  const feedbackLayerProps = createFeedbackLayerProps(state);
  const legacySettingsPanelProps = createLegacySettingsPanelProps(state);
  const { layout } = createLayoutProps(state);
  const layerBarProps = createLayerBarProps(state);
  const toolbarProps = createToolbarProps(state);
  const historyControls = createHistoryControls(state);
  const gridProps = createGridProps(state);
  const bottomAssetsDrawerProps = createBottomAssetsDrawerProps(state);

  const {
    assetsFolderDialogProps,
    assetCreatorModalProps,
    loadMapsModalProps,
    mapSizeModalProps,
    saveSelectionDialogProps,
  } = createDialogProps(state);

  return {
    headerProps,
    assetsFolderDialogProps,
    feedbackLayerProps,
    assetCreatorModalProps,
    loadMapsModalProps,
    legacySettingsPanelProps,
    layout,
    layerBarProps,
    toolbarProps,
    historyControls,
    gridProps,
    mapSizeModalProps,
    bottomAssetsDrawerProps,
    saveSelectionDialogProps,
  };
}

export default createLegacyMapBuilderViewModel;
