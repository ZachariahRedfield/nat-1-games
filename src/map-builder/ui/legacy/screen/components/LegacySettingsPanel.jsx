import React from "react";
import BrushSettings from "../../BrushSettings.jsx";
import MapStatus from "../../MapStatus.jsx";
import {
  NumericInput,
  RotationWheel,
  TextCommitInput,
} from "../../../../../shared/index.js";

export default function LegacySettingsPanel({
  panToolActive,
  zoomToolActive,
  engine,
  interactionMode,
  assetGroup,
  selectedAsset,
  currentLayer,
  layerVisibility,
  selectedObj,
  selectedObjsList,
  selectedToken,
  selectedTokensList,
  assets,
  gridSettings,
  setGridSettings,
  naturalSettings,
  setNaturalSettings,
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
  tileSize,
  snapshotSettings,
  regenerateLabelInstance,
  updateTokenById,
  tokenHUDVisible,
  setTokenHUDVisible,
  tokenHUDShowInitiative,
  setTokenHUDShowInitiative,
}) {
  if (panToolActive || zoomToolActive) {
    return (
      <div className="hidden" aria-hidden="true">
        <div className="p-4 space-y-5 overflow-y-auto">
          <MapStatus
            selectedAsset={selectedAsset}
            engine={engine}
            currentLayer={currentLayer}
            layerVisibility={layerVisibility}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="hidden" aria-hidden="true">
      <div className="p-4 space-y-5 overflow-y-auto">
        {(!panToolActive && !zoomToolActive && (engine === "grid" || interactionMode === "select")) && (
          <div>
            {!selectedToken ? (
              <>
                {interactionMode === "select" && (selectedObjsList?.length || 0) > 1 ? (
                  <div className="text-xs text-amber-300 bg-amber-900/20 border border-amber-700 rounded px-2 py-1">
                    Multiple selected — settings locked. Save as a group to edit parent settings later.
                  </div>
                ) : (
                  <BrushSettings
                    kind={interactionMode === "select" ? "grid" : assetGroup === "natural" ? "natural" : "grid"}
                    titleOverride={interactionMode === "select" ? "Settings" : undefined}
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
                  />
                )}

                {selectedObj && (selectedObjsList?.length || 0) <= 1 && (() => {
                  const asset = assets.find((x) => x.id === selectedObj.assetId);
                  return asset && asset.kind === "image" && asset.labelMeta;
                })() && (() => {
                  const asset = assets.find((x) => x.id === selectedObj.assetId) || {};
                  const meta = asset.labelMeta || {};
                  return (
                    <div className="mt-3">
                      <h3 className="font-bold text-sm mb-2">Label Settings</h3>
                      <div className="grid gap-2">
                        <label className="text-xs">
                          Text
                          <TextCommitInput
                            className="w-full p-1 text-black rounded"
                            value={meta.text || ""}
                            onCommit={(value) => {
                              snapshotSettings();
                              regenerateLabelInstance(selectedObj.assetId, { ...meta, text: value });
                            }}
                          />
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="text-xs">
                            Color
                            <input
                              type="color"
                              className="w-full h-8 p-0 border border-gray-500 rounded"
                              value={meta.color || "#ffffff"}
                              onChange={(event) => {
                                snapshotSettings();
                                regenerateLabelInstance(selectedObj.assetId, {
                                  ...meta,
                                  color: event.target.value,
                                });
                              }}
                            />
                          </label>
                          <label className="text-xs">
                            Font Size
                            <NumericInput
                              value={meta.size || 28}
                              min={8}
                              max={128}
                              step={1}
                              onCommit={(value) => {
                                snapshotSettings();
                                regenerateLabelInstance(selectedObj.assetId, {
                                  ...meta,
                                  size: value,
                                });
                              }}
                              className="w-12 px-1 py-0.5 text-xs text-black rounded"
                            />
                          </label>
                          <label className="text-xs col-span-2">
                            Font Family
                            <TextCommitInput
                              className="w-full p-1 text-black rounded"
                              value={meta.font || "Arial"}
                              onCommit={(value) => {
                                snapshotSettings();
                                regenerateLabelInstance(selectedObj.assetId, {
                                  ...meta,
                                  font: value,
                                });
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            ) : (
              <>
                {(selectedTokensList?.length || 0) > 1 ? (
                  <div className="text-xs text-amber-300 bg-amber-900/20 border border-amber-700 rounded px-2 py-1">
                    Multiple tokens selected — settings locked. Save as a Token Group to manage as a set.
                  </div>
                ) : (
                  <>
                    <h3 className="font-bold text-sm mb-2">Token Settings</h3>
                    <div className="grid gap-2">
                      <div className="flex items-end gap-3 mb-1">
                        <span className="text-xs">Size</span>
                        <div className="inline-flex items-center">
                          <div className="relative">
                            <NumericInput
                              value={gridSettings.sizeCols ?? gridSettings.sizeTiles}
                              min={1}
                              max={100}
                              step={1}
                              className="w-12 pr-5 px-1 py-0.5 text-xs text-black rounded"
                              onCommit={(value) => {
                                const next = Math.max(1, Math.min(100, Math.round(value)));
                                snapshotSettings();
                                setGridSettings((state) => ({ ...state, sizeCols: next }));
                              }}
                            />
                            <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">
                              X
                            </span>
                          </div>
                        </div>
                        <div className="inline-flex items-center">
                          <div className="relative">
                            <NumericInput
                              value={gridSettings.sizeRows ?? gridSettings.sizeTiles}
                              min={1}
                              max={100}
                              step={1}
                              className="w-12 pr-5 px-1 py-0.5 text-xs text-black rounded"
                              onCommit={(value) => {
                                const next = Math.max(1, Math.min(100, Math.round(value)));
                                snapshotSettings();
                                setGridSettings((state) => ({ ...state, sizeRows: next }));
                              }}
                            />
                            <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">
                              Y
                            </span>
                          </div>
                        </div>
                      </div>
                      <label className="block text-xs">Rotation</label>
                      <div className="flex items-center gap-3 mb-1">
                        <NumericInput
                          value={gridSettings.rotation}
                          min={0}
                          max={359}
                          step={1}
                          className="w-12 px-1 py-0.5 text-xs text-black rounded"
                          onCommit={(value) => {
                            const next = Math.max(0, Math.min(359, Math.round(value)));
                            snapshotSettings();
                            setGridSettings((state) => ({ ...state, rotation: next }));
                          }}
                        />
                        <RotationWheel
                          value={gridSettings.rotation}
                          onChange={(value) => {
                            const next = Math.max(0, Math.min(359, Math.round(value)));
                            snapshotSettings();
                            setGridSettings((state) => ({ ...state, rotation: next }));
                          }}
                          size={72}
                        />
                      </div>
                      <div className="flex gap-2">
                        <label className="text-xs">
                          <input
                            type="checkbox"
                            checked={gridSettings.flipX}
                            onChange={(event) => {
                              snapshotSettings();
                              setGridSettings((state) => ({ ...state, flipX: event.target.checked }));
                            }}
                          />
                          {" "}Flip X
                        </label>
                        <label className="text-xs">
                          <input
                            type="checkbox"
                            checked={gridSettings.flipY}
                            onChange={(event) => {
                              snapshotSettings();
                              setGridSettings((state) => ({ ...state, flipY: event.target.checked }));
                            }}
                          />
                          {" "}Flip Y
                        </label>
                      </div>
                      <label className="block text-xs">Opacity</label>
                      <div className="w-full">
                        <style>
                          {`.alpha-range{ -webkit-appearance:none; appearance:none; width:100%; background:transparent; height:24px; margin:0; }
                          .alpha-range:focus{ outline:none; }
                          .alpha-range::-webkit-slider-runnable-track{ height:12px; border-radius:2px; background-color:#e5e7eb; background-image: linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,1)), linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%); background-size:auto,8px 8px,8px 8px,8px 8px,8px 8px; background-position:0 0,0 0,0 4px,4px -4px,-4px 0px; }
                          .alpha-range::-webkit-slider-thumb{ -webkit-appearance:none; appearance:none; width:16px; height:16px; border-radius:4px; margin-top:-2px; background:#ffffff; border:2px solid #374151; box-shadow:0 0 0 1px rgba(0,0,0,0.1); }
                          .alpha-range::-moz-range-track{ height:12px; border-radius:2px; background-color:#e5e7eb; background-image: linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,1)), linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%); background-size:auto,8px 8px,8px 8px,8px 8px,8px 8px; background-position:0 0,0 0,0 4px,4px -4px,-4px 0px; }
                          .alpha-range::-moz-range-thumb{ width:16px; height:16px; border-radius:4px; background:#ffffff; border:2px solid #374151; }`}
                        </style>
                        <input
                          type="range"
                          min="0.05"
                          max="1"
                          step="0.05"
                          value={gridSettings.opacity}
                          onChange={(event) => {
                            snapshotSettings();
                            setGridSettings((state) => ({
                              ...state,
                              opacity: parseFloat(event.target.value),
                            }));
                          }}
                          className="alpha-range"
                          aria-label="Opacity"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <label className="text-xs">
                          Name
                          <TextCommitInput
                            className="w-full p-1 text-black rounded"
                            value={selectedToken?.meta?.name || ""}
                            onCommit={(value) =>
                              updateTokenById(selectedToken.id, {
                                meta: { ...selectedToken.meta, name: value },
                              })
                            }
                          />
                        </label>
                        <label className="text-xs">
                          HP
                          <NumericInput
                            value={selectedToken?.meta?.hp ?? 0}
                            min={-9999}
                            max={999999}
                            step={1}
                            onCommit={(value) =>
                              updateTokenById(selectedToken.id, {
                                meta: {
                                  ...selectedToken.meta,
                                  hp: Math.round(value),
                                },
                              })
                            }
                            className="w-12 px-1 py-0.5 text-xs text-black rounded"
                          />
                        </label>
                        <label className="text-xs">
                          Initiative
                          <NumericInput
                            value={selectedToken?.meta?.initiative ?? 0}
                            min={-99}
                            max={999}
                            step={1}
                            onCommit={(value) =>
                              updateTokenById(selectedToken.id, {
                                meta: {
                                  ...selectedToken.meta,
                                  initiative: Math.round(value),
                                },
                              })
                            }
                            className="w-12 px-1 py-0.5 text-xs text-black rounded"
                          />
                        </label>
                        <label className="text-xs inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={tokenHUDVisible}
                            onChange={(event) => setTokenHUDVisible(event.target.checked)}
                          />
                          Show Token HUD
                        </label>
                        <label className="text-xs inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={tokenHUDShowInitiative}
                            onChange={(event) => setTokenHUDShowInitiative(event.target.checked)}
                          />
                          Show Initiative in HUD
                        </label>
                      </div>
                      <div className="mt-2">
                        <label className="text-xs">Glow Color</label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="color"
                            value={selectedToken.glowColor || "#7dd3fc"}
                            onChange={(event) =>
                              updateTokenById(selectedToken.id, {
                                glowColor: event.target.value,
                              })
                            }
                            className="w-10 h-6 p-0 border border-gray-500 rounded"
                            title="Token glow color"
                          />
                          <input
                            type="text"
                            className="flex-1 p-1 text-black rounded"
                            value={selectedToken.glowColor || "#7dd3fc"}
                            onChange={(event) =>
                              updateTokenById(selectedToken.id, {
                                glowColor: event.target.value,
                              })
                            }
                            placeholder="#7dd3fc"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {!panToolActive &&
          !zoomToolActive &&
          assetGroup !== "token" &&
          engine === "canvas" &&
          interactionMode !== "select" && (
            <BrushSettings
              kind="canvas"
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
            />
          )}

        <MapStatus
          selectedAsset={selectedAsset}
          engine={engine}
          currentLayer={currentLayer}
          layerVisibility={layerVisibility}
        />
      </div>
    </div>
  );
}
