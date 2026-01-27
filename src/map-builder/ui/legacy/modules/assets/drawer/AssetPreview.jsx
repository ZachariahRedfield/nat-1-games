import { useEffect, useMemo, useRef, useState } from "react";

const MIN_TILE_SIZE = 8;
const MAX_TILE_SIZE = 96;
const DEFAULT_TILE_SIZE = 32;

function getAssetPresentation(asset) {
  if (!asset) {
    return { label: "", kind: null, aspect: 1, src: null, color: null };
  }

  if (asset.kind === "natural") {
    const variant = asset.variants?.[0] ?? {};
    return {
      label: asset.name || asset.kind,
      kind: asset.kind,
      aspect: variant.aspectRatio || 1,
      src: variant.src || null,
      color: null,
    };
  }

  if (asset.kind === "image" || asset.kind === "token") {
    return {
      label: asset.name || asset.kind,
      kind: asset.kind,
      aspect: asset.aspectRatio || 1,
      src: asset.src || null,
      color: null,
    };
  }

  if (asset.kind === "color") {
    return {
      label: asset.name || asset.kind,
      kind: asset.kind,
      aspect: 1,
      src: null,
      color: asset.color || "#cccccc",
    };
  }

  return { label: asset.name || asset.kind, kind: asset.kind, aspect: 1, src: null, color: null };
}

function useResponsiveTileSize(containerRef, widthTiles, heightTiles) {
  const [tileSize, setTileSize] = useState(DEFAULT_TILE_SIZE);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const computeTileSize = () => {
      const rect = element.getBoundingClientRect();
      const columns = Math.max(1, widthTiles + 2);
      const rows = Math.max(1, heightTiles + 2);
      const width = rect.width / columns;
      const height = rect.height / rows;
      const next = Math.floor(Math.min(width, height));
      const clamped = Math.max(MIN_TILE_SIZE, Math.min(MAX_TILE_SIZE, next || DEFAULT_TILE_SIZE));
      setTileSize(clamped);
    };

    computeTileSize();

    let observer;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(computeTileSize);
      observer.observe(element);
    }

    return () => {
      observer?.disconnect();
    };
  }, [containerRef, widthTiles, heightTiles]);

  return tileSize;
}

export default function AssetPreview({ selectedAsset, gridSettings }) {
  const containerRef = useRef(null);
  const presentation = useMemo(() => getAssetPresentation(selectedAsset), [selectedAsset]);
  const snapToGrid = gridSettings?.snapToGrid ?? true;

  const widthTiles = useMemo(
    () => {
      const base = gridSettings?.sizeCols ?? gridSettings?.sizeTiles ?? 1;
      const clamped = Math.max(1, base);
      return snapToGrid ? Math.round(clamped) : Number.parseFloat(clamped.toFixed(2));
    },
    [gridSettings?.sizeCols, gridSettings?.sizeTiles, snapToGrid]
  );

  const heightTiles = useMemo(() => {
    const target = gridSettings?.sizeRows ?? widthTiles / (presentation.aspect || 1) ?? widthTiles;
    const clamped = Math.max(1, target);
    return snapToGrid ? Math.round(clamped) : Number.parseFloat(clamped.toFixed(2));
  }, [gridSettings?.sizeRows, presentation.aspect, snapToGrid, widthTiles]);

  const tileSize = useResponsiveTileSize(containerRef, widthTiles, heightTiles);

  const assetWidth = widthTiles * tileSize;
  const assetHeight = heightTiles * tileSize;
  const rotation = gridSettings?.rotation ?? 0;
  const flipX = gridSettings?.flipX ? -1 : 1;
  const flipY = gridSettings?.flipY ? -1 : 1;
  const opacity = Math.max(0.05, Math.min(1, gridSettings?.opacity ?? 1));

  const gridBackgroundStyle = useMemo(
    () => ({
      backgroundImage:
        "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), " +
        "linear-gradient(to bottom, rgba(195,255,255,0.08) 1px, transparent 1px)",
      backgroundSize: `${tileSize}px ${tileSize}px, ${tileSize}px ${tileSize}px`,
      backgroundColor: "#111827",
    }),
    [tileSize]
  );

  const gridWidth = (widthTiles + 2) * tileSize;
  const gridHeight = (heightTiles + 2) * tileSize;
  const offset = tileSize;

  const renderContent = () => {
    if (!selectedAsset) {
      return <div className="text-xs text-gray-400">Select an asset</div>;
    }

    if (presentation.kind === "color") {
      return (
        <div
          className="rounded shadow"
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: presentation.color,
            opacity,
            transform: `rotate(${rotation}deg) scale(${flipX}, ${flipY})`,
            transformOrigin: "center",
          }}
        />
      );
    }

    if (presentation.src) {
      return (
        <img
          src={presentation.src}
          alt={presentation.label}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "fill",
            opacity,
            transform: `rotate(${rotation}deg) scale(${flipX}, ${flipY})`,
            transformOrigin: "center",
          }}
        />
      );
    }

    return <div className="text-xs text-gray-400">No preview</div>;
  };

  return (
    <div className="w-full" aria-label="Asset Preview">
      <div className="text-xs opacity-80 mb-1">Preview</div>
      <div
        ref={containerRef}
        className="relative w-full h-32 md:h-36 border border-gray-700 rounded overflow-hidden"
        style={{ backgroundColor: "#111827" }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative overflow-hidden" style={{ ...gridBackgroundStyle, width: gridWidth, height: gridHeight }}>
            <div className="absolute inset-0 pointer-events-none">
              <div style={{ position: "absolute", left: offset, top: offset, width: assetWidth, height: assetHeight }}>
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
