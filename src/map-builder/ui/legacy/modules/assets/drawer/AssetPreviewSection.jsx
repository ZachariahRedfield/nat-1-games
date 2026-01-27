import AssetPreview from "./AssetPreview.jsx";

function updateStamp(setAssetStamp, key, value) {
  if (!setAssetStamp) return;
  setAssetStamp((previous) => ({
    ...(previous || {}),
    [key]: value,
  }));
}

export default function AssetPreviewSection({ assetPanelProps = {}, assetStamp, setAssetStamp }) {
  return (
    <div className="w-full flex md:flex-row flex-col gap-3">
      <div className="flex flex-col gap-2 items-start justify-start md:mr-2 mt-2 md:mt-6">
        <label className="text-xs inline-flex items-center gap-1 text-gray-200">
          <input
            type="checkbox"
            checked={!!assetStamp?.flipY}
            onChange={(event) => updateStamp(setAssetStamp, "flipY", event.target.checked)}
          />
          Flip Y
        </label>
        <label className="text-xs inline-flex items-center gap-1 text-gray-200">
          <input
            type="checkbox"
            checked={!!assetStamp?.flipX}
            onChange={(event) => updateStamp(setAssetStamp, "flipX", event.target.checked)}
          />
          Flip X
        </label>
      </div>
      <div className="flex-1 min-w-0 md:max-w-xs">
        <AssetPreview selectedAsset={assetPanelProps?.selectedAsset} gridSettings={assetStamp} />
      </div>
    </div>
  );
}
