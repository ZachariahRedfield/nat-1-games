import React from "react";
import Grid from "../../../canvas/Grid/Grid.jsx";
import { SiteHeader } from "../../../../../shared/index.js";
import SaveSelectionDialog from "../../SaveSelectionDialog.jsx";
import Header from "../../Header.jsx";
import LayerBar from "../../LayerBar.jsx";
import VerticalToolStrip from "../../VerticalToolStrip.jsx";
import FeedbackLayer from "../../modules/feedback/FeedbackLayer.jsx";
import AssetCreatorModal from "../components/AssetCreatorModal.jsx";
import LoadMapsModal from "../components/LoadMapsModal.jsx";
import MapSizeModal from "../components/MapSizeModal.jsx";
import AssetsFolderDialog from "../components/AssetsFolderDialog.jsx";
import LegacyMapBuilderUndoRedoControls from "./LegacyUndoRedoControls.jsx";
import RightAssetsPanel from "../../components/RightAssetsPanel.jsx";

const GRID_BACKGROUND_IMAGE =
  "radial-gradient(80% 60% at 50% 0%, rgba(255, 243, 210, 0.6), rgba(255, 243, 210, 0.9)), repeating-linear-gradient(0deg, rgba(190,155,90,0.06), rgba(190,155,90,0.06) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 4px)";

export default function LegacyMapBuilderLayout({
  headerProps,
  assetsFolderDialogProps,
  feedbackLayerProps,
  assetCreatorModalProps,
  loadMapsModalProps,
  layout,
  layerBarProps,
  toolbarProps,
  historyControls,
  gridProps,
  mapSizeModalProps,
  rightAssetsPanelProps,
  saveSelectionDialogProps,
  session,
  onLogout,
  onNavigate,
  currentScreen,
  onBack,
}) {
  const { undo, redo, undoStack, redoStack } = historyControls;
  const rightPanelTopOffset = Math.max(0, layout.fixedBarTop + layout.topControlsHeight);

  const headerAllProps = { ...headerProps, onBack, session, onLogout };

  return (
    <div className="w-full h-full flex flex-col">
      <SiteHeader
        session={session}
        onLogout={onLogout}
        onNavigate={onNavigate}
        currentScreen={currentScreen || "mapBuilder"}
      />

      <main className="relative flex flex-1 overflow-hidden min-h-0">
        <div className="flex-1 overflow-hidden">
          <div
            ref={layout.scrollRef}
            className="w-full h-full overflow-hidden"
            style={{
              backgroundImage: GRID_BACKGROUND_IMAGE,
              backgroundPosition: "50% 0, 2px 0",
              backgroundRepeat: "no-repeat, repeat",
              backgroundColor: "#f4e4c1",
              paddingTop: layout.topControlsHeight,
            }}
          >
            <div className="relative w-full min-h-full flex justify-center items-start md:items-center p-3 sm:p-6">
              <div className="flex-1 flex">
                <div ref={layout.gridContentRef} className="relative inline-flex mx-auto">
                  <Grid {...gridProps} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none" data-overlay-root>
          <div className="absolute inset-0 z-[10005] pointer-events-none" data-overlay-layer="feedback">
            <FeedbackLayer {...feedbackLayerProps} />
          </div>

          <div
            className="absolute inset-0 z-[10010] pointer-events-none"
            data-overlay-layer="workspace-chrome"
          >
            <div
              ref={layout.topControlsWrapRef}
              className="absolute opacity-0 pointer-events-none -z-10"
              style={{
                top: -9999,
                left: -9999,
                width: "100%",
              }}
            >
              <div className="flex flex-col">
                <Header {...headerAllProps} />
                <LayerBar {...layerBarProps} />
              </div>
            </div>

            <div
              className="fixed inset-x-0 pointer-events-auto"
              style={{ top: layout.fixedBarTop }}
              data-workspace-chrome
            >
              <div className="flex flex-col">
                <Header {...headerAllProps} />
                <LayerBar {...layerBarProps} />
              </div>
            </div>
          </div>

          <div
            className="absolute inset-0 z-[10015] pointer-events-none"
            data-overlay-layer="tool-hud"
          >
            <div
              className="fixed pointer-events-auto"
              style={{ top: layout.overlayTop, left: layout.overlayLeft }}
              data-tool-hud-left-dock
            >
              <VerticalToolStrip {...toolbarProps} />
            </div>

            <div
              className="fixed pointer-events-auto"
              style={{
                top: layout.overlayTop,
                left: layout.overlayCenter,
                transform: "translateX(-50%)",
              }}
              data-tool-hud-top-center
            >
              <LegacyMapBuilderUndoRedoControls
                onUndo={undo}
                onRedo={redo}
                canUndo={undoStack.length > 0}
                canRedo={redoStack.length > 0}
              />
            </div>
          </div>

          <div className="absolute inset-0 z-[10030] pointer-events-none">
            <RightAssetsPanel {...rightAssetsPanelProps} topOffset={rightPanelTopOffset} />
          </div>

          <div className="absolute inset-0 z-[10060] pointer-events-none">
            <AssetCreatorModal {...assetCreatorModalProps} />
            <LoadMapsModal {...loadMapsModalProps} />
            <MapSizeModal {...mapSizeModalProps} />
            <SaveSelectionDialog {...saveSelectionDialogProps} />
            <AssetsFolderDialog {...assetsFolderDialogProps} />
          </div>
        </div>
      </main>
    </div>
  );
}
