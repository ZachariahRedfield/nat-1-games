import React from "react";
import AssetCreator from "./AssetCreator";

export default function AssetPanel({
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
  // creator / editor
  creatorOpen,
  creatorKind,
  editingAsset,
  openCreator,
  setCreatorOpen,
  setEditingAsset,
  handleCreatorCreate,
  updateAssetById,
  // asset updates
  setAssets,
  setSelectedAssetId,
  alertFn,
  confirmFn,
}) {
  const openEditAsset = (a) => {
    if (!a) return;
    setEditingAsset(a);
    const kind = a.kind === 'color' ? 'material' : a.kind === 'natural' ? 'natural' : (a.kind === 'token' || a.kind === 'tokenGroup') ? 'token' : (a.kind === 'image' && a.labelMeta) ? 'text' : 'image';
    // open editor
    openCreator(kind);
  };

  return (
    <div className="relative">
      {/* Group selection (always visible) */}
      <div className="mt-1 p-2 bg-gray-800 border border-gray-700 rounded flex flex-wrap gap-2 justify-center">
        <button
          className={`px-2 py-0.5 text-sm rounded-full border border-white/90 ${assetGroup==='image' ? 'text-white font-semibold' : 'text-gray-400 hover:text-gray-200'}`}
          onClick={() => { setAssetGroup('image'); setCreatorOpen(false); }}
        >
          Image
        </button>
        <button
          className={`px-2 py-0.5 text-sm rounded-full border border-white/90 ${assetGroup==='token' ? 'text-white font-semibold' : 'text-gray-400 hover:text-gray-200'}`}
          onClick={() => { setAssetGroup('token'); setCreatorOpen(false); }}
        >
          Token
        </button>
        <button
          className={`px-2 py-0.5 text-sm rounded-full border border-white/90 ${assetGroup==='material' ? 'text-white font-semibold' : 'text-gray-400 hover:text-gray-200'}`}
          onClick={() => { setAssetGroup('material'); setCreatorOpen(false); }}
        >
          Materials
        </button>
        <button
          className={`px-2 py-0.5 text-sm rounded-full border border-white/90 ${assetGroup==='natural' ? 'text-white font-semibold' : 'text-gray-400 hover:text-gray-200'}`}
          onClick={() => { setAssetGroup('natural'); setCreatorOpen(false); }}
        >
          Natural
        </button>
      </div>

      {/* Creation buttons (always visible) */}
      <div className="mt-1 mb-3 flex flex-wrap items-center gap-2">
        {assetGroup === 'image' && (
          <>
            <button className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm" onClick={() => openCreator('image')}>Create Image</button>
            <button className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm" onClick={() => openCreator('text')}>Text/Label</button>
          </>
        )}
        {assetGroup === 'natural' && (
          <button className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm" onClick={() => openCreator('natural')}>Add Natural</button>
        )}
        {assetGroup === 'material' && (
          <button className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm" onClick={() => openCreator('material')}>Add Color</button>
        )}
        {assetGroup === 'token' && (
          <button className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm" onClick={() => openCreator('token')}>Add Token</button>
        )}
      </div>

      {/* Asset list header + content */}
      <div className="mb-2 border border-gray-600 rounded overflow-hidden">
        <div className="flex items-center justify-between bg-gray-700 px-2 py-1">
          <span className="text-xs uppercase tracking-wide">Assets</span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] opacity-80">View:</span>
            <div className="inline-flex items-center bg-gray-800 rounded overflow-hidden border border-gray-700">
              <button
                className={`text-xs px-2 py-0.5 ${showAssetPreviews ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-200'}`}
                onClick={() => setShowAssetPreviews(true)}
                title="Show image thumbnails"
              >
                Images
              </button>
              <button
                className={`text-xs px-2 py-0.5 ${!showAssetPreviews ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-200'}`}
                onClick={() => setShowAssetPreviews(false)}
                title="Show names list"
              >
                Names
              </button>
            </div>
          </div>
        </div>
        <div className={`p-2 ${showAssetPreviews ? 'grid grid-cols-2 md:grid-cols-3 gap-4' : 'grid grid-cols-2 md:grid-cols-3 gap-2'}`}>
        {assets
          .filter((a) => !a.hiddenFromUI)
          .filter((a) => (
            assetGroup === 'image'
              ? a.kind === 'image'
              : assetGroup === 'token'
              ? (a.kind === 'token' || a.kind === 'tokenGroup')
              : assetGroup === 'material'
              ? a.kind === 'color'
              : assetGroup === 'natural'
              ? a.kind === 'natural'
              : true
          ))
          .map((a) => (
            <div
              key={a.id}
              onClick={() => selectAsset(a.id)}
              className={`relative cursor-pointer transition ${
                showAssetPreviews
                  ? 'rounded-lg p-2 pb-2 text-xs flex flex-col border shadow-sm '
                  : 'p-2 text-xs rounded-lg border shadow-sm '
              } ${
                selectedAssetId === a.id
                  ? 'border-white/90 ring-1 ring-white/70 bg-gray-700/80'
                  : 'border-gray-600 bg-gray-800/60 hover:bg-gray-700/60'
              }`}
              title={a.name}
            >
              {(a.kind === 'image' || a.kind === 'token' || a.kind === 'natural' || a.kind === 'tokenGroup') ? (
                showAssetPreviews ? (
                  a.kind === 'natural'
                    ? (a.variants?.length
                        ? <img src={a.variants[0]?.src} alt={a.name} className="w-full h-24 md:h-28 object-contain" />
                        : <div className="w-full h-24 md:h-28 flex items-center justify-center text-[10px] opacity-80">0 variants</div>)
                    : a.kind === 'tokenGroup'
                    ? (<div className="w-full h-24 md:h-28 flex items-center justify-center text-[10px] opacity-80">{(a.members?.length||0)} tokens</div>)
                    : (<img src={a.src} alt={a.name} className="w-full h-24 md:h-28 object-contain" />)
                ) : (
                  <div className="text-xs font-medium whitespace-normal break-words leading-tight py-0.5">{a.name}</div>
                )
              ) : (
                showAssetPreviews
                  ? <div className="w-full h-24 md:h-28 rounded" style={{ backgroundColor: a.color || '#cccccc' }} />
                  : <div className="text-xs font-medium whitespace-normal break-words leading-tight py-0.5">{a.name}</div>
              )}
              {showAssetPreviews && (
                <>
                  <div className="mt-1 h-px bg-gray-600" />
                  <div className="pt-1 truncate">{a.name}</div>
                </>
              )}
              {(a.kind === 'image' || a.kind === 'token' || a.kind === 'natural' || a.kind === 'color') && (
                showAssetPreviews ? (
                  selectedAssetId === a.id ? (
                    <div className="mt-1 inline-flex overflow-hidden rounded">
                      <button
                        className="px-2 py-0.5 text-[11px] bg-gray-700 hover:bg-gray-600"
                        onClick={(e) => { e.stopPropagation(); openEditAsset(a); }}
                        title="Edit asset"
                      >
                        Edit
                      </button>
                      <button
                        className="px-2 py-0.5 text-[11px] bg-red-700 hover:bg-red-600"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const msg = `Delete asset \"${a.name}\"?`;
                          const ok = confirmFn ? await confirmFn(msg) : window.confirm(msg);
                          if (ok) {
                            setAssets((prev) => prev.filter((x) => x.id !== a.id));
                            const next = assets.find(
                              (x) => x.id !== a.id && (assetGroup === 'image' ? x.kind === 'image' : assetGroup === 'token' ? (x.kind === 'token' || x.kind === 'tokenGroup') : assetGroup === 'natural' ? x.kind === 'natural' : true)
                            );
                            if (next) setSelectedAssetId(next.id);
                          }
                        }}
                        title="Delete asset"
                      >
                        Delete
                      </button>
                    </div>
                  ) : null
                ) : (
                  selectedAssetId === a.id ? (
                    <div className="absolute top-1 right-1 inline-flex overflow-hidden rounded">
                      <button
                        className="px-2 py-0.5 text-[11px] bg-gray-700 hover:bg-gray-600"
                        onClick={(e) => { e.stopPropagation(); openEditAsset(a); }}
                        title="Edit asset"
                      >
                        Edit
                      </button>
                      <button
                        className="px-2 py-0.5 text-[11px] bg-red-700 hover:bg-red-600"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const msg = `Delete asset \"${a.name}\"?`;
                          const ok = confirmFn ? await confirmFn(msg) : window.confirm(msg);
                          if (ok) {
                            setAssets((prev) => prev.filter((x) => x.id !== a.id));
                            const next = assets.find(
                              (x) => x.id !== a.id && (assetGroup === 'image' ? x.kind === 'image' : assetGroup === 'token' ? (x.kind === 'token' || x.kind === 'tokenGroup') : assetGroup === 'natural' ? x.kind === 'natural' : true)
                            );
                            if (next) setSelectedAssetId(next.id);
                          }
                        }}
                        title="Delete asset"
                      >
                        Delete
                      </button>
                    </div>
                  ) : null
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

