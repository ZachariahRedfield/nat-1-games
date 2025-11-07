import React, { useCallback, useEffect, useRef, useState } from "react";
import Grid from "../../canvas/Grid/Grid.jsx";
import {
  saveProject as saveProjectManager,
  saveProjectAs as saveProjectAsManager,
  loadProject as loadProjectManager,
  loadProjectFromDirectory,
  listMaps,
  deleteMap,
  loadAssetsFromStoredParent,
  isAssetsFolderConfigured,
  hasCurrentProjectDir,
  clearCurrentProjectDir,
} from "../../../application/save-load/index.js";
import { useLegacySceneState } from "../modules/editor/useLegacySceneState.js";
import { SiteHeader } from "../../../../shared/index.js";
import SaveSelectionDialog from "../SaveSelectionDialog.jsx";
import Header from "../Header.jsx";
import LayerBar from "../LayerBar.jsx";
import BottomAssetsDrawer from "../BottomAssetsDrawer.jsx";
import VerticalToolStrip from "../VerticalToolStrip.jsx";
import { useOverlayLayout } from "../modules/layout/useOverlayLayout.js";
import { useZoomControls } from "../modules/interaction/useZoomControls.js";
import FeedbackLayer from "../modules/feedback/FeedbackLayer.jsx";
import { useFeedbackState } from "../modules/feedback/useFeedbackState.js";
import { useLegacyProjectSaving } from "../modules/save-load/useLegacyProjectSaving.js";
import { useLegacyProjectLoading } from "../modules/save-load/useLegacyProjectLoading.js";
import {
  BrushIcon,
  CanvasIcon,
  CursorIcon,
  EraserIcon,
  GridIcon,
  PanIcon,
  SaveIcon,
  ZoomIcon,
} from "./components/ToolIcons.jsx";
import AssetCreatorModal from "./components/AssetCreatorModal.jsx";
import LoadMapsModal from "./components/LoadMapsModal.jsx";
import MapSizeModal from "./components/MapSizeModal.jsx";
import AssetsFolderBanner from "./components/AssetsFolderBanner.jsx";
import LegacySettingsPanel from "./components/LegacySettingsPanel.jsx";
import { useGridSelectionState } from "./state/useGridSelectionState.js";
import { useTokenSelectionState } from "./state/useTokenSelectionState.js";
import { useLayerVisibilityState } from "./state/useLayerVisibilityState.js";
import { useLegacyAssetWorkflow } from "./state/useLegacyAssetWorkflow.js";
import { useLegacyHistory } from "./state/useLegacyHistory.js";

export default function MapBuilder({ goBack, session, onLogout, onNavigate, currentScreen }) {
  // --- layers ---
  const [currentLayer, setCurrentLayer] = useState("base");

  // Edit mode: 'draw' | 'select'
  const [interactionMode, setInteractionMode] = useState("draw");

  const [isErasing, setIsErasing] = useState(false);
  const [canvasColor, setCanvasColor] = useState(null);

  const {
    rowsInput,
    setRowsInput,
    colsInput,
    setColsInput,
    rows,
    cols,
    maps,
    setMaps,
    objects,
    setObjects,
    updateGridSizes,
    placeTiles,
    addObject,
    eraseObjectAt,
    moveObject,
    updateObjectById,
    removeObjectById,
  } = useLegacySceneState({
    getCurrentLayer: useCallback(() => currentLayer, [currentLayer]),
    getIsErasing: useCallback(() => isErasing, [isErasing]),
    getCanvasColor: useCallback(() => canvasColor, [canvasColor]),
  });

  const [gridSettings, setGridSettings] = useState({
    sizeTiles: 1,
    sizeCols: 1,
    sizeRows: 1,
    linkXY: false,
    rotation: 0,
    flipX: false,
    flipY: false,
    opacity: 1,
    snapToGrid: true,
    snapStep: 1,
    smartAdjacency: true,
  });

  const {
    hasSelection,
    selectedObj,
    selectedObjsList,
    handleSelectionChange,
    clearObjectSelection,
  } = useGridSelectionState({ gridSettings, setGridSettings });

  const {
    tokens,
    setTokens,
    tokensVisible,
    setTokensVisible,
    selectedToken,
    setSelectedToken,
    selectedTokensList,
    setSelectedTokensList,
    tokenHUDVisible,
    setTokenHUDVisible,
    tokenHUDShowInitiative,
    setTokenHUDShowInitiative,
    addToken,
    moveToken,
    updateTokenById,
    removeTokenById,
    handleTokenSelectionChange,
    clearTokenSelection,
  } = useTokenSelectionState({ setGridSettings });

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [mapsMenuOpen, setMapsMenuOpen] = useState(false);

  const {
    toasts,
    showToast,
    promptState,
    promptInputRef,
    requestPrompt,
    submitPrompt,
    cancelPrompt,
    confirmState,
    requestConfirm,
    approveConfirm,
    cancelConfirm,
  } = useFeedbackState();

  const promptUser = requestPrompt;
  const confirmUser = requestConfirm;

  const [mapSizeModalOpen, setMapSizeModalOpen] = useState(false);

  const canvasRefs = {
    background: useRef(null),
    base: useRef(null),
    sky: useRef(null),
  };

  const [tileSize, setTileSize] = useState(24);
  const scrollRef = useRef(null);
  const gridContentRef = useRef(null);
  const layerBarWrapRef = useRef(null);

  const {
    layerBarHeight,
    overlayPosition: { top: overlayTop, left: overlayLeft, center: overlayCenter },
    fixedLayerBar: { top: fixedBarTop, left: fixedBarLeft, width: fixedBarWidth },
  } = useOverlayLayout({
    scrollRef,
    layerBarWrapRef,
    tileSize,
    rows,
    cols,
    menuOpen: mapsMenuOpen,
  });

  const {
    zoomToolActive,
    setZoomToolActive,
    panToolActive,
    setPanToolActive,
    zoomScrubRef,
    zoomScrubPos,
    handleZoomScrubStart,
  } = useZoomControls({ setTileSize });

  const { layerVisibility, toggleLayerVisibility, showAllLayers, hideAllLayers } =
    useLayerVisibilityState();
  const [showGridLines, setShowGridLines] = useState(true);

  const [engine, setEngine] = useState("grid");
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // ====== Zoom Tool (rectangle zoom) ======
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const snap = (v, step = 4) => Math.round(v / step) * step;
  const handleZoomToRect = ({ left, top, width, height }) => {
    const container = scrollRef.current;
    const content = gridContentRef.current;
    if (!container || !content) return;
    // Snapshot current view for undo
    setUndoStack((prev) => [
      ...prev,
      { type: 'view', tileSize, scrollLeft: container.scrollLeft, scrollTop: container.scrollTop },
    ]);
    setRedoStack([]);

    const prev = tileSize;
    if (width < 8 || height < 8) return;

    // Desired scale to fit rect into viewport
    const scaleX = container.clientWidth / width;
    const scaleY = container.clientHeight / height;
    let next = clamp(snap(prev * Math.min(scaleX, scaleY), 4), 8, 128);
    // Nudge at least one step in
    if (next <= prev) next = clamp(prev + 8, 8, 128);

    // Selection center as ratio within content
    const contentWidthPrev = cols * prev;
    const contentHeightPrev = rows * prev;
    let rx = (left + width / 2) / (contentWidthPrev || 1);
    let ry = (top + height / 2) / (contentHeightPrev || 1);
    rx = clamp(rx, 0, 1);
    ry = clamp(ry, 0, 1);

    // Content offset inside scroll container (centering/padding)
    const containerRect = container.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    const contentOffsetLeft = contentRect.left - containerRect.left + container.scrollLeft;
    const contentOffsetTop = contentRect.top - containerRect.top + container.scrollTop;

    setTileSize(next);
    const centerAfterPaint = () => {
      const contentWidthNext = cols * next;
      const contentHeightNext = rows * next;
      const desiredLeft = contentOffsetLeft + rx * contentWidthNext - container.clientWidth / 2;
      const desiredTop = contentOffsetTop + ry * contentHeightNext - container.clientHeight / 2;
      // Clamp within actual content bounds
      const minLeft = Math.max(0, contentOffsetLeft);
      const minTop = Math.max(0, contentOffsetTop);
      const maxLeft = Math.max(minLeft, contentOffsetLeft + contentWidthNext - container.clientWidth);
      const maxTop = Math.max(minTop, contentOffsetTop + contentHeightNext - container.clientHeight);
      container.scrollTo({
        left: clamp(desiredLeft, minLeft, maxLeft),
        top: clamp(desiredTop, minTop, maxTop),
      });
    };
    // Wait for layout to reflect new tile size
    requestAnimationFrame(() => requestAnimationFrame(centerAfterPaint));
  };
  useEffect(() => {
    const onKey = (e) => { if (e.code === 'Escape') setZoomToolActive(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const {
    assets,
    setAssets,
    getAsset,
    selectedAsset,
    selectedAssetId,
    setSelectedAssetId,
    selectAsset,
    assetGroup,
    setAssetGroup,
    showAssetKindMenu,
    setShowAssetKindMenu,
    showAssetPreviews,
    setShowAssetPreviews,
    creatorOpen,
    setCreatorOpen,
    creatorKind,
    setCreatorKind,
    editingAsset,
    setEditingAsset,
    openCreator,
    openEditAsset,
    handleCreatorCreate,
    addColorMode,
    setAddColorMode,
    newColorName,
    setNewColorName,
    newColorHex,
    setNewColorHex,
    newLabelText,
    setNewLabelText,
    newLabelColor,
    setNewLabelColor,
    newLabelSize,
    setNewLabelSize,
    newLabelFont,
    setNewLabelFont,
    flowHue,
    setFlowHue,
    flowSat,
    setFlowSat,
    flowLight,
    setFlowLight,
    assetStamp,
    setAssetStamp,
    naturalSettings,
    setNaturalSettings,
    updateAssetById,
    mapAssetToCreatorKind,
    handleUpload,
    handleCreateNatural,
    createTextLabelAsset,
    needsAssetsFolder,
    setNeedsAssetsFolder,
    promptChooseAssetsFolder,
    normalizeStamp,
    normalizeNaturalSettings,
    brushSize,
    setBrushSize,
    canvasOpacity,
    setCanvasOpacity,
    canvasSpacing,
    setCanvasSpacing,
    canvasBlendMode,
    setCanvasBlendMode,
    canvasSmoothing,
    setCanvasSmoothing,
    regenerateLabelInstance,
    saveSelectionAsAsset,
    saveSelectedTokenAsAsset,
    saveMultipleObjectsAsNaturalGroup,
    saveMultipleObjectsAsMergedImage,
    saveSelectedTokensAsGroup,
    saveCurrentSelection,
  } = useLegacyAssetWorkflow({
    setEngine,
    setInteractionMode,
    setZoomToolActive,
    setPanToolActive,
    setCanvasColor,
    interactionMode,
    gridSettings,
    setGridSettings,
    hasSelection,
    showToast,
    promptUser,
    confirmUser,
    setUndoStack,
    setRedoStack,
    updateObjectById,
    currentLayer,
    tileSize,
    objects,
    selectedObj,
    selectedObjsList,
    selectedToken,
    selectedTokensList,
    setSelectedToken,
  });

  const {
    onBeginTileStroke,
    onBeginCanvasStroke,
    onBeginObjectStroke,
    onBeginTokenStroke,
    deleteCurrentSelection,
    undo,
    redo,
  } = useLegacyHistory({
    undoStack,
    setUndoStack,
    redoStack,
    setRedoStack,
    maps,
    setMaps,
    objects,
    setObjects,
    tokens,
    setTokens,
    assets,
    setAssets,
    gridSettings,
    setGridSettings,
    brushSize,
    setBrushSize,
    canvasOpacity,
    setCanvasOpacity,
    canvasSpacing,
    setCanvasSpacing,
    canvasBlendMode,
    setCanvasBlendMode,
    canvasSmoothing,
    setCanvasSmoothing,
    naturalSettings,
    setNaturalSettings,
    tileSize,
    setTileSize,
    scrollRef,
    canvasRefs,
    currentLayer,
    showToast,
    selectedObjsList,
    selectedTokensList,
    removeObjectById,
    removeTokenById,
    clearObjectSelection,
    clearTokenSelection,
  });

  const snapshotSettings = () => {};

  // ====== Load Maps Modal ======
  // ====== save / load (desktop FS API + mobile bundle fallback) ======

  const loadProject = async () => {
    const res = await loadProjectManager();
    if (!res?.ok || !res?.data) return;
    const data = res.data;

    setRowsInput(String(Math.min(200, data.rows || 20)));
    setColsInput(String(Math.min(200, data.cols || 20)));
    if (data.maps) setMaps(data.maps);
    if (data.objects) setObjects(data.objects);
    if (data.tokens) setTokens(data.tokens);

    if (data.assets) {
      const hydrated = data.assets.map((a) => {
        if ((a.kind === 'image' || a.kind === 'token') && a.src && !a.img) {
          const img = new Image();
          img.src = a.src;
          return { ...a, img };
        }
        return a;
      });
      setAssets(hydrated);
      if (hydrated[0]) setSelectedAssetId(hydrated[0].id);
    }

    // Update project name reference
    projectNameRef.current = data.name || data.settings?.name || 'My Map';

    // Draw per-layer overlay canvases if present; else legacy single canvas
    setTimeout(() => {
      if (data.canvases) {
        for (const layer of ['background','base','sky']) {
          const dataUrl = data.canvases?.[layer];
          if (!dataUrl) continue;
          const canvas = canvasRefs[layer]?.current;
          if (!canvas) continue;
          const ctx = canvas.getContext('2d');
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = dataUrl;
        }
      } else if (data.canvasDataUrl) {
        const canvas = canvasRefs.base?.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = data.canvasDataUrl;
        }
      }
    }, 0);

    showToast('Project loaded.', 'success');
  };

  // Project name remembered across saves; updated on load
  const projectNameRef = useRef('My Map');

  const {
    loadModalOpen,
    mapsList,
    openLoadModal,
    closeLoadModal,
    handleLoadMapFromList,
    handleDeleteMapFromList,
  } = useLegacyProjectLoading({
    isAssetsFolderConfigured,
    setNeedsAssetsFolder,
    showToast,
    listMaps,
    loadProjectFromDirectory,
    setRowsInput,
    setColsInput,
    setMaps,
    setObjects,
    setTokens,
    setAssets,
    setSelectedAssetId,
    projectNameRef,
    canvasRefs,
    confirmUser,
    deleteMap,
  });

  const { saveProject, saveProjectAs } = useLegacyProjectSaving({
    isAssetsFolderConfigured,
    showToast,
    setNeedsAssetsFolder,
    hasCurrentProjectDir,
    promptUser,
    saveProjectManager,
    saveProjectAsManager,
    loadAssetsFromStoredParent,
    setAssets,
    setSelectedAssetId,
    setUndoStack,
    setRedoStack,
    projectNameRef,
    canvasRefs,
    rows,
    cols,
    tileSize,
    maps,
    objects,
    tokens,
    assets,
    currentLayer,
    brushSize,
    gridSettings,
    engine,
    layerVisibility,
    tokensVisible,
    tokenHUDVisible,
    tokenHUDShowInitiative,
    assetGroup,
    showGridLines,
    canvasOpacity,
    canvasSpacing,
    canvasBlendMode,
    canvasSmoothing,
    naturalSettings,
  });

  // ====== Save current selection as a new image asset ======
  // ====== header button order ======
  const onBackClick = () => { try { clearCurrentProjectDir(); } catch {} ; goBack?.(); };
  return (
    <div className="w-full h-full flex flex-col">
      <SiteHeader session={session} onLogout={onLogout} onNavigate={onNavigate} currentScreen={currentScreen || 'mapBuilder'} />
      <Header
        onUndo={undo}
        onRedo={redo}
        onSave={saveProject}
        onSaveAs={saveProjectAs}
        onLoad={openLoadModal}
        onBack={onBackClick}
        session={session}
        onLogout={onLogout}
        showSaveWords={mapsMenuOpen}
        mapsMenuOpen={mapsMenuOpen}
        onToggleMaps={() => setMapsMenuOpen((v) => !v)}
        onOpenMapSize={() => setMapSizeModalOpen(true)}
      />


      <AssetsFolderBanner
        needsAssetsFolder={needsAssetsFolder}
        onChooseFolder={promptChooseAssetsFolder}
      />

      <main className="flex flex-1 overflow-hidden min-h-0">
        <FeedbackLayer
          toasts={toasts}
          promptState={promptState}
          confirmState={confirmState}
          promptInputRef={promptInputRef}
          onPromptSubmit={submitPrompt}
          onPromptCancel={cancelPrompt}
          onConfirmApprove={approveConfirm}
          onConfirmCancel={cancelConfirm}
        />

        <AssetCreatorModal
          open={creatorOpen}
          editingAsset={editingAsset}
          creatorKind={creatorKind}
          selectedAsset={selectedAsset}
          onClose={() => {
            setCreatorOpen(false);
            setEditingAsset(null);
          }}
          onCreate={handleCreatorCreate}
          onUpdate={(updated) => {
            if (!editingAsset) return;
            updateAssetById(editingAsset.id, updated);
          }}
        />

        <LoadMapsModal
          open={loadModalOpen}
          mapsList={mapsList}
          onClose={closeLoadModal}
          onOpenMap={handleLoadMapFromList}
          onDeleteMap={handleDeleteMapFromList}
        />
        <LegacySettingsPanel
          panToolActive={panToolActive}
          zoomToolActive={zoomToolActive}
          engine={engine}
          interactionMode={interactionMode}
          assetGroup={assetGroup}
          selectedAsset={selectedAsset}
          currentLayer={currentLayer}
          layerVisibility={layerVisibility}
          selectedObj={selectedObj}
          selectedObjsList={selectedObjsList}
          selectedToken={selectedToken}
          selectedTokensList={selectedTokensList}
          assets={assets}
          gridSettings={gridSettings}
          setGridSettings={setGridSettings}
          naturalSettings={naturalSettings}
          setNaturalSettings={setNaturalSettings}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          canvasOpacity={canvasOpacity}
          setCanvasOpacity={setCanvasOpacity}
          canvasSpacing={canvasSpacing}
          setCanvasSpacing={setCanvasSpacing}
          canvasBlendMode={canvasBlendMode}
          setCanvasBlendMode={setCanvasBlendMode}
          canvasSmoothing={canvasSmoothing}
          setCanvasSmoothing={setCanvasSmoothing}
          tileSize={tileSize}
          snapshotSettings={snapshotSettings}
          regenerateLabelInstance={regenerateLabelInstance}
          updateTokenById={updateTokenById}
          tokenHUDVisible={tokenHUDVisible}
          setTokenHUDVisible={setTokenHUDVisible}
          tokenHUDShowInitiative={tokenHUDShowInitiative}
          setTokenHUDShowInitiative={setTokenHUDShowInitiative}
        />

        {/* CENTERED DRAW AREA */}
        <div className="flex-1 overflow-hidden">
          <div
            ref={scrollRef}
            className="w-full h-full overflow-auto overflow-x-hidden"
            style={{
              backgroundImage:
                "radial-gradient(80% 60% at 50% 0%, rgba(255, 243, 210, 0.6), rgba(255, 243, 210, 0.9)), repeating-linear-gradient(0deg, rgba(190,155,90,0.06), rgba(190,155,90,0.06) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 4px)",
              backgroundPosition: "50% 0, 2px 0",
              backgroundRepeat: "no-repeat, repeat",
              backgroundColor: "#f4e4c1",
              paddingTop: layerBarHeight,
            }}
          >
            {/* Top layer bar placeholder for measurement only (no layout) */}
            <div ref={layerBarWrapRef} className="absolute opacity-0 pointer-events-none -z-10" style={{ top: -9999, left: -9999 }}>
              <LayerBar
                currentLayer={currentLayer}
                setCurrentLayer={setCurrentLayer}
                layerVisibility={layerVisibility}
                toggleLayerVisibility={toggleLayerVisibility}
              tokensVisible={tokensVisible}
              setTokensVisible={setTokensVisible}
              showGridLines={showGridLines}
              setShowGridLines={setShowGridLines}
              tileSize={tileSize}
              setTileSize={setTileSize}
            />
            </div>
            {/* Fixed LAYERS bar overlay aligned to the scroll container */}
            <div className="fixed z-[10020]" style={{ top: fixedBarTop, left: fixedBarLeft, width: fixedBarWidth }}>
              <LayerBar
                currentLayer={currentLayer}
                setCurrentLayer={setCurrentLayer}
                layerVisibility={layerVisibility}
                toggleLayerVisibility={toggleLayerVisibility}
                tokensVisible={tokensVisible}
                setTokensVisible={setTokensVisible}
                showGridLines={showGridLines}
                setShowGridLines={setShowGridLines}
                tileSize={tileSize}
                setTileSize={setTileSize}
              />
            </div>
            <div className="relative w-full min-h-full flex justify-center items-start md:items-center p-6">
              {/* Fixed overlays under LAYERS; do not affect layout; overlap grid */}
              <div className="fixed z-[10015] pointer-events-auto" style={{ top: overlayTop, left: overlayLeft }}>
                <VerticalToolStrip
                  interactionMode={interactionMode}
                  zoomToolActive={zoomToolActive}
                  panToolActive={panToolActive}
                  setInteractionMode={setInteractionMode}
                  setZoomToolActive={setZoomToolActive}
                  setPanToolActive={setPanToolActive}
                  isErasing={isErasing}
                  setIsErasing={setIsErasing}
                  engine={engine}
                  setEngine={setEngine}
                  assetGroup={assetGroup}
                  canActOnSelection={(selectedObjsList?.length || 0) > 0 || (selectedTokensList?.length || 0) > 0}
                  onSaveSelection={() => setSaveDialogOpen(true)}
                  onDeleteSelection={deleteCurrentSelection}
                />
              </div>
              <div className="fixed z-[10015] pointer-events-auto" style={{ top: overlayTop, left: overlayCenter, transform: 'translateX(-50%)' }}>
                <div className="inline-flex items-center gap-2 bg-gray-700/40 border border-gray-600 rounded px-2 py-1">
                  <button
                    onClick={undo}
                    disabled={!undoStack.length}
                    aria-label="Undo"
                    className={`w-8 h-8 flex items-center justify-center rounded ${undoStack.length ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-transparent text-white/50 cursor-not-allowed'}`}
                  >
                    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                      <path d="M6 5H3.5L6.5 2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3.5 5c2.5-2.2 6.2-2 8.5.3 2.2 2.2 2.2 5.8 0 8" strokeLinecap="round" />
                    </svg>
                  </button>
                  <button
                    onClick={redo}
                    disabled={!redoStack.length}
                    aria-label="Redo"
                    className={`w-8 h-8 flex items-center justify-center rounded ${redoStack.length ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-transparent text-white/50 cursor-not-allowed'}`}
                  >
                    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                      <path d="M10 5h2.5L9.5 2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M12.5 5c-2.5-2.2-6.2-2-8.5.3-2.2 2.2 2.2 5.8 0 8" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
              <Grid
                maps={maps}
                objects={objects}
                tokens={tokens}
                assets={assets}
                engine={engine}
                selectedAsset={selectedAsset}
                gridSettings={gridSettings}
                stampSettings={assetStamp}
                setGridSettings={setGridSettings}
                brushSize={brushSize}
                canvasOpacity={canvasOpacity}
                canvasColor={canvasColor}
                canvasSpacing={canvasSpacing}
                canvasBlendMode={canvasBlendMode}
                canvasSmoothing={canvasSmoothing}
                naturalSettings={naturalSettings}
                isErasing={isErasing}
                interactionMode={interactionMode}
                tileSize={tileSize}
                scrollRef={scrollRef}
                contentRef={gridContentRef}
                zoomToolActive={zoomToolActive}
                panToolActive={panToolActive}
                onZoomToolRect={handleZoomToRect}
                canvasRefs={canvasRefs}
                currentLayer={currentLayer}
                layerVisibility={layerVisibility}
                tokensVisible={tokensVisible}
                tokenHUDVisible={tokenHUDVisible}
                tokenHUDShowInitiative={tokenHUDShowInitiative}
                assetGroup={assetGroup}
                onBeginTileStroke={onBeginTileStroke}
                onBeginCanvasStroke={onBeginCanvasStroke}
                onBeginObjectStroke={onBeginObjectStroke}
                onBeginTokenStroke={onBeginTokenStroke}
                placeTiles={placeTiles}
                addObject={addObject}
                eraseObjectAt={eraseObjectAt}
                moveObject={moveObject}
                removeObjectById={removeObjectById}
                updateObjectById={updateObjectById}
                onSelectionChange={handleSelectionChange}
                addToken={addToken}
                moveToken={moveToken}
                removeTokenById={removeTokenById}
                updateTokenById={updateTokenById}
                onTokenSelectionChange={handleTokenSelectionChange}
                showGridLines={showGridLines}
              />
            </div>
          </div>
        </div>
      </main>

      {/* MAP SIZE MODAL */}
      <MapSizeModal
        open={mapSizeModalOpen}
        rowsValue={rowsInput}
        colsValue={colsInput}
        onChangeRows={(event) => setRowsInput(event.target.value)}
        onChangeCols={(event) => setColsInput(event.target.value)}
        onCancel={() => setMapSizeModalOpen(false)}
        onApply={() => {
          updateGridSizes();
          setMapSizeModalOpen(false);
        }}
      />

      {/* Bottom Assets drawer overlay (resizable, overlaps content) */}
      <BottomAssetsDrawer
        assetPanelProps={{
          assetGroup,
          setAssetGroup,
          showAssetKindMenu,
          setShowAssetKindMenu,
          showAssetPreviews,
          setShowAssetPreviews,
          assets,
          selectedAssetId,
          selectedAsset,
          selectAsset,
          tokens,
          objects,
          creatorOpen,
          creatorKind,
          editingAsset,
          openCreator,
          setCreatorOpen,
          setEditingAsset,
          handleCreatorCreate,
          updateAssetById,
          setAssets,
          setSelectedAssetId,
          alertFn: (msg) => showToast(msg, 'warning', 3500),
          confirmFn: (msg) => confirmUser(msg),
        }}
        initialHeight={90}
        minHeight={0}
        maxHeightPct={0.7}
        assetStamp={assetStamp}
        setAssetStamp={setAssetStamp}
        naturalSettings={naturalSettings}
        setNaturalSettings={setNaturalSettings}
      />

      <SaveSelectionDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        selectedObjsList={selectedObjsList}
        selectedTokensList={selectedTokensList}
        saveSelectionAsAsset={saveSelectionAsAsset}
        saveMultipleObjectsAsNaturalGroup={saveMultipleObjectsAsNaturalGroup}
        saveMultipleObjectsAsMergedImage={saveMultipleObjectsAsMergedImage}
        saveSelectedTokenAsAsset={saveSelectedTokenAsAsset}
        saveSelectedTokensAsGroup={saveSelectedTokensAsGroup}
      />
    </div>
  );
}






































