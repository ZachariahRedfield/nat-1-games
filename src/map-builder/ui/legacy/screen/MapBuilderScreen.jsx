import React from "react";
import Grid from "../../canvas/Grid/Grid.jsx";
import { clearCurrentProjectDir } from "../../../application/save-load/index.js";
import { SiteHeader } from "../../../../shared/index.js";
import SaveSelectionDialog from "../SaveSelectionDialog.jsx";
import Header from "../Header.jsx";
import LayerBar from "../LayerBar.jsx";
import BottomAssetsDrawer from "../BottomAssetsDrawer.jsx";
import VerticalToolStrip from "../VerticalToolStrip.jsx";
import FeedbackLayer from "../modules/feedback/FeedbackLayer.jsx";
import AssetCreatorModal from "./components/AssetCreatorModal.jsx";
import LoadMapsModal from "./components/LoadMapsModal.jsx";
import MapSizeModal from "./components/MapSizeModal.jsx";
import AssetsFolderBanner from "./components/AssetsFolderBanner.jsx";
import LegacySettingsPanel from "./components/LegacySettingsPanel.jsx";
import { useLegacyMapBuilderController } from "./useLegacyMapBuilderController.js";

export default function MapBuilder({ goBack, session, onLogout, onNavigate, currentScreen }) {
  const {
    headerProps,
    assetsFolderBannerProps,
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
  } = useLegacyMapBuilderController();

  const { undo, redo, undoStack, redoStack } = historyControls;

  const onBackClick = () => {
    try {
      clearCurrentProjectDir();
    } catch (error) {
      console.warn("Failed to clear Map Builder project directory", error);
    }
    goBack?.();
  };

  return (
    <div className="w-full h-full flex flex-col">
      <SiteHeader
        session={session}
        onLogout={onLogout}
        onNavigate={onNavigate}
        currentScreen={currentScreen || "mapBuilder"}
      />
      <Header {...headerProps} onBack={onBackClick} session={session} onLogout={onLogout} />

      <AssetsFolderBanner {...assetsFolderBannerProps} />

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
              backgroundImage:
                "radial-gradient(80% 60% at 50% 0%, rgba(255, 243, 210, 0.6), rgba(255, 243, 210, 0.9)), repeating-linear-gradient(0deg, rgba(190,155,90,0.06), rgba(190,155,90,0.06) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 4px)",
              backgroundPosition: "50% 0, 2px 0",
              backgroundRepeat: "no-repeat, repeat",
              backgroundColor: "#f4e4c1",
              paddingTop: layout.layerBarHeight,
            }}
          >
            <div
              ref={layout.layerBarWrapRef}
              className="absolute opacity-0 pointer-events-none -z-10"
              style={{ top: -9999, left: -9999 }}
            >
              <LayerBar {...layerBarProps} />
            </div>

            <div
              className="fixed z-[10020]"
              style={{ top: layout.fixedBarTop, left: layout.fixedBarLeft, width: layout.fixedBarWidth }}
            >
              <LayerBar {...layerBarProps} />
            </div>

            <div className="relative w-full min-h-full flex justify-center items-start md:items-center p-6">
              <div
                className="fixed z-[10015] pointer-events-auto"
                style={{ top: layout.overlayTop, left: layout.overlayLeft }}
              >
                <VerticalToolStrip {...toolbarProps} />
              </div>

              <div
                className="fixed z-[10015] pointer-events-auto"
                style={{ top: layout.overlayTop, left: layout.overlayCenter, transform: "translateX(-50%)" }}
              >
                <div className="inline-flex items-center gap-2 bg-gray-700/40 border border-gray-600 rounded px-2 py-1">
                  <button
                    onClick={undo}
                    disabled={!undoStack.length}
                    aria-label="Undo"
                    className={`w-8 h-8 flex items-center justify-center rounded ${
                      undoStack.length
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-transparent text-white/50 cursor-not-allowed"
                    }`}
                  >
                    <svg
                      viewBox="0 0 16 16"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="w-4 h-4"
                    >
                      <path d="M6 5H3.5L6.5 2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3.5 5c2.5-2.2 6.2-2 8.5.3 2.2 2.2 2.2 5.8 0 8" strokeLinecap="round" />
                    </svg>
                  </button>
                  <button
                    onClick={redo}
                    disabled={!redoStack.length}
                    aria-label="Redo"
                    className={`w-8 h-8 flex items-center justify-center rounded ${
                      redoStack.length
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-transparent text-white/50 cursor-not-allowed"
                    }`}
                  >
                    <svg
                      viewBox="0 0 16 16"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="w-4 h-4"
                    >
                      <path d="M10 5h2.5L9.5 2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M12.5 5c-2.5-2.2-6.2-2-8.5.3-2.2 2.2 2.2 5.8 0 8" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>

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
    </div>
  );
}
