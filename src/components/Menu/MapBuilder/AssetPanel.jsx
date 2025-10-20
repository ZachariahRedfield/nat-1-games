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
      <button
        className="font-bold text-sm mb-2 px-2 py-1 bg-gray-700 rounded inline-flex items-center gap-2"
        onClick={() => setShowAssetKindMenu((s)=>!s)}
        onMouseEnter={() => setShowAssetKindMenu(true)}
      >
        Assets
        <span className="text-xs opacity-80">
          {assetGroup === 'image' ? 'Image' : assetGroup === 'token' ? 'Token' : assetGroup === 'material' ? 'Materials' : 'Natural'}
        </span>
      </button>

      <div
        className={`overflow-y-hidden overflow-x-visible transition-[max-height,opacity] duration-200 ${
          showAssetKindMenu ? 'max-h-[140px] opacity-100 pointer-events-auto mb-3' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="mt-1 p-2 bg-gray-800 border border-gray-700 rounded flex flex-wrap gap-0"
          onMouseEnter={() => setShowAssetKindMenu(true)}
          onMouseLeave={() => setShowAssetKindMenu(false)}
        >
          <button
            className={`px-2 py-1 text-xs rounded ${assetGroup==='image'?'bg-blue-600':'bg-gray-700'}`}
            onClick={() => { setAssetGroup('image'); setShowAssetKindMenu(false); setCreatorOpen(false); }}
          >
            Image
          </button>
          <button
            className={`px-2 py-1 text-xs rounded ${assetGroup==='token'?'bg-blue-600':'bg-gray-700'}`}
            onClick={() => { setAssetGroup('token'); setShowAssetKindMenu(false); setCreatorOpen(false); }}
          >
            Token
          </button>
          <button
            className={`px-2 py-1 text-xs rounded ${assetGroup==='material'?'bg-blue-600':'bg-gray-700'}`}
            onClick={() => { setAssetGroup('material'); setShowAssetKindMenu(false); setCreatorOpen(false); }}
          >
            Materials
          </button>
          <button
            className={`px-2 py-1 text-xs rounded ${assetGroup==='natural'?'bg-blue-600':'bg-gray-700'}`}
            onClick={() => { setAssetGroup('natural'); setShowAssetKindMenu(false); setCreatorOpen(false); }}
          >
            Natural
          </button>
        </div>
      </div>

      {/* Creation buttons */}
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

      {creatorOpen && (
        <AssetCreator
          kind={creatorKind}
          onClose={() => { setCreatorOpen(false); setEditingAsset(null); }}
          onCreate={handleCreatorCreate}
          onUpdate={(updated)=> {
            if (!editingAsset) return;
            updateAssetById(editingAsset.id, updated);
          }}
          initialAsset={editingAsset}
          selectedImageSrc={selectedAsset?.kind==='image' ? selectedAsset?.src : null}
          mode={editingAsset ? 'edit' : 'create'}
        />
      )}

      <div className="mb-2 border border-gray-600 rounded overflow-hidden">
        <div className="flex items-center justify-between bg-gray-700 px-2 py-1">
          <span className="text-xs uppercase tracking-wide">Assets</span>
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
        <div className={`p-2 ${showAssetPreviews ? 'grid grid-cols-3 gap-2' : 'flex flex-col gap-1'}`}>
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
                className={`relative cursor-pointer ${showAssetPreviews ? 'border rounded p-1 pb-2 text-xs flex flex-col' : 'px-2 py-1 text-xs hover:bg-gray-700'} ${
                  selectedAssetId === a.id
                    ? (showAssetPreviews ? 'border-blue-400 bg-blue-600/20' : 'border border-blue-400 bg-blue-600/10')
                    : (showAssetPreviews ? 'border-gray-600 bg-gray-700/40' : 'border border-transparent')
                }`}
                title={a.name}
              >
                {(a.kind === 'image' || a.kind === 'token' || a.kind === 'natural' || a.kind === 'tokenGroup') ? (
                  showAssetPreviews ? (
                    a.kind === 'natural'
                      ? (a.variants?.length
                          ? <img src={a.variants[0]?.src} alt={a.name} className="w-full h-12 object-contain" />
                          : <div className="w-full h-12 flex items-center justify-center text-[10px] opacity-80">0 variants</div>)
                      : a.kind === 'tokenGroup'
                      ? (<div className="w-full h-12 flex items-center justify-center text-[10px] opacity-80">{(a.members?.length||0)} tokens</div>)
                      : (<img src={a.src} alt={a.name} className="w-full h-12 object-contain" />)
                  ) : (
                    <div className="text-xs font-medium whitespace-normal break-words leading-tight py-0.5">{a.name}</div>
                  )
                ) : (
                  showAssetPreviews
                    ? <div className="w-full h-12 rounded" style={{ backgroundColor: a.color || '#cccccc' }} />
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
                          className="px-2 py-0.5 text-[11px] bg-blue-700 hover:bg-blue-600"
                          onClick={(e) => { e.stopPropagation(); openEditAsset(a); }}
                        >
                          Edit
                        </button>
                        <button
                          className="px-2 py-0.5 text-[11px] bg-red-700 hover:bg-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            const useCountTokens = (tokens || []).filter((t) => t.assetId === a.id).length;
                            const countInObjects = ['background', 'base', 'sky'].reduce(
                              (acc, l) => acc + (objects?.[l] || []).filter((o) => o.assetId === a.id).length,
                              0
                            );
                            if (a.kind === 'token' && useCountTokens > 0) {
                              alert(`Cannot delete token asset in use by ${useCountTokens} token(s). Delete tokens first.`);
                              return;
                            }
                            if ((a.kind === 'image' || a.kind === 'natural') && countInObjects > 0) {
                              alert(`Cannot delete image asset in use by ${countInObjects} object(s). Delete stamps first.`);
                              return;
                            }
                            if (confirm(`Delete asset "${a.name}"?`)) {
                              setAssets((prev) => prev.filter((x) => x.id !== a.id));
                              const next = assets.find(
                                (x) => x.id !== a.id && (assetGroup === 'image' ? x.kind === 'image' : assetGroup === 'token' ? (x.kind === 'token' || x.kind === 'tokenGroup') : assetGroup === 'natural' ? x.kind === 'natural' : true)
                              );
                              if (next) setSelectedAssetId(next.id);
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    ) : null
                  ) : (
                    selectedAssetId === a.id ? (
                      <div className="absolute top-1 right-1 inline-flex overflow-hidden rounded">
                        <button
                          className="px-2 py-0.5 text-[11px] bg-blue-700 hover:bg-blue-600"
                          onClick={(e) => { e.stopPropagation(); openEditAsset(a); }}
                        >
                          Edit
                        </button>
                        <button
                          className="px-2 py-0.5 text-[11px] bg-red-700 hover:bg-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            const useCountTokens = (tokens || []).filter((t) => t.assetId === a.id).length;
                            const countInObjects = ['background', 'base', 'sky'].reduce(
                              (acc, l) => acc + (objects?.[l] || []).filter((o) => o.assetId === a.id).length,
                              0
                            );
                            if (a.kind === 'token' && useCountTokens > 0) {
                              alert(`Cannot delete token asset in use by ${useCountTokens} token(s). Delete tokens first.`);
                              return;
                            }
                            if ((a.kind === 'image' || a.kind === 'natural') && countInObjects > 0) {
                              alert(`Cannot delete image asset in use by ${countInObjects} object(s). Delete stamps first.`);
                              return;
                            }
                            if (confirm(`Delete asset \"${a.name}\"?`)) {
                              setAssets((prev) => prev.filter((x) => x.id !== a.id));
                              const next = assets.find(
                                (x) => x.id !== a.id && (assetGroup === 'image' ? x.kind === 'image' : assetGroup === 'token' ? (x.kind === 'token' || x.kind === 'tokenGroup') : assetGroup === 'natural' ? x.kind === 'natural' : true)
                              );
                              if (next) setSelectedAssetId(next.id);
                            }
                          }}
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

