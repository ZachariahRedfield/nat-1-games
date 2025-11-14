import React from "react";
import Grid from "../../../canvas/Grid/Grid.jsx";
import { SiteHeader } from "../../../../../shared/index.js";
import SaveSelectionDialog from "../../SaveSelectionDialog.jsx";
import Header from "../../Header.jsx";
import LayerBar from "../../LayerBar.jsx";
import BottomAssetsDrawer from "../../BottomAssetsDrawer.jsx";
import VerticalToolStrip from "../../VerticalToolStrip.jsx";
import FeedbackLayer from "../../modules/feedback/FeedbackLayer.jsx";
import AssetCreatorModal from "../components/AssetCreatorModal.jsx";
import LoadMapsModal from "../components/LoadMapsModal.jsx";
import MapSizeModal from "../components/MapSizeModal.jsx";
import AssetsFolderDialog from "../components/AssetsFolderDialog.jsx";
import LegacySettingsPanel from "../components/LegacySettingsPanel.jsx";
import LegacyMapBuilderUndoRedoControls from "./LegacyUndoRedoControls.jsx";

const GRID_BACKGROUND_IMAGE =
  "radial-gradient(80% 60% at 50% 0%, rgba(255, 243, 210, 0.6), rgba(255, 243, 210, 0.9)), repeating-linear-gradient(0deg, rgba(190,155,90,0.06), rgba(190,155,90,0.06) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 4px)";

export default function LegacyMapBuilderLayout({
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
  session,
  onLogout,
  onNavigate,
  currentScreen,
  onBack,
}) {
  const { undo, redo, undoStack, redoStack } = historyControls;

  const headerAllProps = { ...headerProps, onBack, session, onLogout };

  return (
    <div className="w-full h-full flex flex-col">
      <SiteHeader
        session={session}
        onLogout={onLogout}
        onNavigate={onNavigate}
        currentScreen={currentScreen || "mapBuilder"}
      />

      <main className="flex flex-1 overflow-hidden min-h-0">
        <FeedbackLayer {...feedbackLayerProps} />

        <AssetCreatorModal {...assetCreatorModalProps} />
        <LoadMapsModal {...loadMapsModalProps} />
        <LegacySettingsPanel {...legacySettingsPanelProps} />

        <div className="flex-1 overflow-hidden">
          <div
            ref={layout.scrollRef}
            className="w-full h-full overflow-auto overflow-x-hidden"
            style={{
              backgroundImage: GRID_BACKGROUND_IMAGE,
              backgroundPosition: "50% 0, 2px 0",
              backgroundRepeat: "no-repeat, repeat",
              backgroundColor: "#f4e4c1",
              paddingTop: layout.topControlsHeight,
            }}
          >
            <div
              ref={layout.topControlsWrapRef}
              className="absolute opacity-0 pointer-events-none -z-10"
              style={{
                top: -9999,
                left: -9999,
                width: layout.fixedBarWidth || undefined,
              }}
            >
              <div className="flex flex-col">
                <Header {...headerAllProps} />
                <LayerBar {...layerBarProps} />
              </div>
            </div>

            <div
              className="fixed z-[10020]"
              style={{ top: layout.fixedBarTop, left: layout.fixedBarLeft, width: layout.fixedBarWidth }}
            >
              <div className="flex flex-col">
                <Header {...headerAllProps} />
                <LayerBar {...layerBarProps} />
              </div>
            </div>

            <div className="relative w-full min-h-full flex justify-center items-start md:items-center p-6">
              <div
                className="fixed z-[10015] pointer-events-auto"
                style={{ top: layout.overlayTop, left: layout.overlayLeft }}
              >
                <VerticalToolStrip {...toolbarProps} />
              </div>

              <LegacyMapBuilderUndoRedoControls
                top={layout.overlayTop}
                center={layout.overlayCenter}
                onUndo={undo}
                onRedo={redo}
                canUndo={undoStack.length > 0}
                canRedo={redoStack.length > 0}
              />

              <div className="flex-1 flex justify-center">
                <div ref={layout.gridContentRef} className="relative inline-flex">
                  <Grid {...gridProps} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <MapSizeModal {...mapSizeModalProps} />
      <BottomAssetsDrawer {...bottomAssetsDrawerProps} />
      <SaveSelectionDialog {...saveSelectionDialogProps} />
      <AssetsFolderDialog {...assetsFolderDialogProps} />
    </div>
  );
}
