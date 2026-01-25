import React from "react";

const modeButtonClass = (imgMode, value) =>
  `px-3 py-1 text-sm ${
    imgMode === value ? "bg-blue-600 text-white" : "bg-transparent text-white/90"
  }`;

export default function ImageModeSection({ selectedObjsCount, imgMode, setImgMode }) {
  if (selectedObjsCount <= 1) {
    return (
      <div className="text-xs text-gray-300">
        Saving single image instance. Transforms will be baked into a new Image asset.
      </div>
    );
  }

  return (
    <div>
      <div className="font-bold text-sm mb-1">Image Save Mode</div>
      <div className="inline-flex bg-gray-800 border border-gray-700 rounded overflow-hidden">
        <button
          className={modeButtonClass(imgMode, "natural")}
          onClick={() => setImgMode("natural")}
        >
          Natural Group
        </button>
        <button
          className={modeButtonClass(imgMode, "merged")}
          onClick={() => setImgMode("merged")}
        >
          Merged Image
        </button>
      </div>
      <div className="mt-2 text-xs text-gray-300">
        {imgMode === "natural" ? (
          <>Creates a Natural asset with one variant per selected image.</>
        ) : (
          <>Rasterizes all selected into one image using their transforms.</>
        )}
      </div>
    </div>
  );
}
