import React from "react";
import DialogActions from "./save-selection/DialogActions.jsx";
import DialogHeader from "./save-selection/DialogHeader.jsx";
import ImageModeSection from "./save-selection/ImageModeSection.jsx";
import MixedSelectionWarning from "./save-selection/MixedSelectionWarning.jsx";
import TargetSelector from "./save-selection/TargetSelector.jsx";
import TokenModeSection from "./save-selection/TokenModeSection.jsx";

export default function SaveSelectionDialog({
  open = false,
  onClose,
  // selection
  selectedObjsList = [],
  selectedTokensList = [],
  // actions (delegates to existing MapBuilder helpers)
  saveSelectionAsAsset, // single image/natural
  saveMultipleObjectsAsNaturalGroup, // multi images -> natural
  saveMultipleObjectsAsMergedImage, // multi images -> merged image
  saveSelectedTokenAsAsset, // single token
  saveSelectedTokensAsGroup, // multi tokens
}) {
  const hasImgs = (selectedObjsList?.length || 0) > 0;
  const hasToks = (selectedTokensList?.length || 0) > 0;
  const mixed = hasImgs && hasToks;

  const [target, setTarget] = React.useState(() =>
    hasToks && !hasImgs ? "tokens" : "images"
  );
  const [imgMode, setImgMode] = React.useState("natural"); // 'natural' | 'merged' | 'single'

  React.useEffect(() => {
    if (hasImgs && !hasToks) setTarget("images");
    else if (hasToks && !hasImgs) setTarget("tokens");
  }, [hasImgs, hasToks]);

  React.useEffect(() => {
    const count = selectedObjsList?.length || 0;
    if (count <= 1) setImgMode("single");
    else if (imgMode === "single") setImgMode("natural");
  }, [selectedObjsList]);

  React.useEffect(() => {
    const onKey = (e) => {
      if (!open) return;
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = async () => {
    if (target === "images") {
      const count = selectedObjsList?.length || 0;
      if (count <= 1) {
        await saveSelectionAsAsset?.();
      } else if (imgMode === "natural") {
        await saveMultipleObjectsAsNaturalGroup?.(selectedObjsList);
      } else if (imgMode === "merged") {
        await saveMultipleObjectsAsMergedImage?.(selectedObjsList);
      }
      onClose?.();
      return;
    }
    if (target === "tokens") {
      const count = selectedTokensList?.length || 0;
      if (count <= 1) {
        await saveSelectedTokenAsAsset?.();
      } else {
        await saveSelectedTokensAsGroup?.(selectedTokensList);
      }
      onClose?.();
    }
  };

  const disabled = (!hasImgs && target === "images") || (!hasToks && target === "tokens");
  const selectedObjsCount = selectedObjsList?.length || 0;
  const selectedTokensCount = selectedTokensList?.length || 0;

  return (
    <div className="fixed inset-0 z-[10058] flex items-center justify-center bg-black/60">
      <div className="w-[96%] max-w-xl max-h-[80vh] overflow-auto bg-gray-900 text-white border border-gray-700 rounded">
        <DialogHeader onClose={onClose} />
        <div className="p-4">
          {mixed && <MixedSelectionWarning />}

          <TargetSelector target={target} setTarget={setTarget} />

          {target === "images" && (
            <div className="space-y-3">
              <ImageModeSection
                selectedObjsCount={selectedObjsCount}
                imgMode={imgMode}
                setImgMode={setImgMode}
              />
            </div>
          )}

          {target === "tokens" && (
            <TokenModeSection selectedTokensCount={selectedTokensCount} />
          )}

          <DialogActions disabled={disabled} onSave={handleSave} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
