import React from "react";

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

  const [target, setTarget] = React.useState(() => (hasToks && !hasImgs ? 'tokens' : 'images'));
  const [imgMode, setImgMode] = React.useState('natural'); // 'natural' | 'merged' | 'single'

  React.useEffect(() => {
    if (hasImgs && !hasToks) setTarget('images');
    else if (hasToks && !hasImgs) setTarget('tokens');
  }, [hasImgs, hasToks]);

  React.useEffect(() => {
    const count = selectedObjsList?.length || 0;
    if (count <= 1) setImgMode('single');
    else if (imgMode === 'single') setImgMode('natural');
  }, [selectedObjsList]);

  React.useEffect(() => {
    const onKey = (e) => {
      if (!open) return;
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = async () => {
    if (target === 'images') {
      const count = selectedObjsList?.length || 0;
      if (count <= 1) {
        await saveSelectionAsAsset?.();
      } else if (imgMode === 'natural') {
        await saveMultipleObjectsAsNaturalGroup?.(selectedObjsList);
      } else if (imgMode === 'merged') {
        await saveMultipleObjectsAsMergedImage?.(selectedObjsList);
      }
      onClose?.();
      return;
    }
    if (target === 'tokens') {
      const count = selectedTokensList?.length || 0;
      if (count <= 1) {
        await saveSelectedTokenAsAsset?.();
      } else {
        await saveSelectedTokensAsGroup?.(selectedTokensList);
      }
      onClose?.();
    }
  };

  const disabled = (!hasImgs && target === 'images') || (!hasToks && target === 'tokens');

  return (
    <div className="fixed inset-0 z-[200] flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-[380px] max-w-[90vw] h-full bg-gray-900 text-white border-l border-gray-700 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">Save Selection</h3>
          <button className="px-2 py-1 bg-gray-700 rounded" onClick={onClose}>Close</button>
        </div>

        {mixed && (
          <div className="mb-3 p-2 bg-amber-900/20 border border-amber-700 rounded text-xs">
            Mixed selection detected (images + tokens). Choose a target below; the other type will be ignored for this save.
          </div>
        )}

        <div className="mb-3">
          <div className="font-bold text-sm mb-1">Target</div>
          <div className="inline-flex bg-gray-800 border border-gray-700 rounded overflow-hidden">
            <button
              className={`px-3 py-1 text-sm ${target === 'images' ? 'bg-blue-600 text-white' : 'bg-transparent text-white/90'}`}
              onClick={() => setTarget('images')}
            >Images</button>
            <button
              className={`px-3 py-1 text-sm ${target === 'tokens' ? 'bg-blue-600 text-white' : 'bg-transparent text-white/90'}`}
              onClick={() => setTarget('tokens')}
            >Tokens</button>
          </div>
        </div>

        {target === 'images' && (
          <div className="space-y-3">
            {(selectedObjsList?.length || 0) <= 1 ? (
              <div className="text-xs text-gray-300">Saving single image instance. Transforms will be baked into a new Image asset.</div>
            ) : (
              <div>
                <div className="font-bold text-sm mb-1">Image Save Mode</div>
                <div className="inline-flex bg-gray-800 border border-gray-700 rounded overflow-hidden">
                  <button
                    className={`px-3 py-1 text-sm ${imgMode === 'natural' ? 'bg-blue-600 text-white' : 'bg-transparent text-white/90'}`}
                    onClick={() => setImgMode('natural')}
                  >Natural Group</button>
                  <button
                    className={`px-3 py-1 text-sm ${imgMode === 'merged' ? 'bg-blue-600 text-white' : 'bg-transparent text-white/90'}`}
                    onClick={() => setImgMode('merged')}
                  >Merged Image</button>
                </div>
                <div className="mt-2 text-xs text-gray-300">
                  {imgMode === 'natural' ? (
                    <>Creates a Natural asset with one variant per selected image.</>
                  ) : (
                    <>Rasterizes all selected into one image using their transforms.</>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {target === 'tokens' && (
          <div className="space-y-2 text-xs text-gray-300">
            {(selectedTokensList?.length || 0) <= 1 ? (
              <>Saving single token as a Token asset. Defaults (grid engine) will be applied.</>
            ) : (
              <>Saving multiple tokens as a Token Group; spawns members side-by-side on placement.</>
            )}
          </div>
        )}

        <div className="mt-6 flex gap-2">
          <button
            className={`px-3 py-1 rounded ${disabled ? 'bg-gray-700/60 cursor-not-allowed' : 'bg-green-700 hover:bg-green-600'}`}
            disabled={disabled}
            onClick={handleSave}
          >Save</button>
          <button className="px-3 py-1 rounded bg-gray-700" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

