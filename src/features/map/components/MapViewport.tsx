import { useEffect, useRef } from "react";
import { RenderSurface } from "../../../core/render";
import { useChunkedProcessing } from "../../../core/io";
import { useStore } from "../../../core/store";
import { iterateGrid } from "../services/grid";
import type { MapStoreApi } from "../services/layers";

interface MapViewportProps {
  store: MapStoreApi;
  tileSize?: number;
}

export function MapViewport({ store, tileSize = 32 }: MapViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const surfaceRef = useRef<RenderSurface>();

  if (!surfaceRef.current) {
    surfaceRef.current = new RenderSurface();
  }

  const dimensions = useStore(store, (state) => state.dimensions);
  const layers = useStore(store, (state) => state.layers);

  useEffect(() => {
    const canvas = canvasRef.current;
    const surface = surfaceRef.current;
    if (!canvas || !surface) return;
    surface.attach(canvas);
    surface.resize(dimensions.cols * tileSize, dimensions.rows * tileSize);
    return () => surface.detach();
  }, [dimensions, tileSize]);

  useEffect(() => {
    surfaceRef.current?.resize(dimensions.cols * tileSize, dimensions.rows * tileSize);
    surfaceRef.current?.clear();
  }, [dimensions, tileSize]);

  useEffect(() => {
    surfaceRef.current?.clear();
  }, [layers]);

  useChunkedProcessing(
    layers,
    (layer) => {
      if (!layer.visible) return;
      const surface = surfaceRef.current;
      if (!surface) return;
      surface.withContext((ctx) => {
        ctx.save();
        ctx.globalAlpha = layer.opacity;
        iterateGrid(layer.grid, (value, row, col) => {
          if (!value) return;
          ctx.fillStyle = value;
          ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
        });
        ctx.restore();
      });
    },
    {
      dependencies: [layers, tileSize, dimensions],
      resetOnChange: true,
      chunkSize: 1,
      onComplete: () => {
        const surface = surfaceRef.current;
        if (!surface) return;
        surface.withContext((ctx) => {
          ctx.save();
          ctx.strokeStyle = "rgba(255,255,255,0.05)";
          ctx.lineWidth = 1;
          for (let r = 0; r <= dimensions.rows; r += 1) {
            ctx.beginPath();
            ctx.moveTo(0, r * tileSize);
            ctx.lineTo(dimensions.cols * tileSize, r * tileSize);
            ctx.stroke();
          }
          for (let c = 0; c <= dimensions.cols; c += 1) {
            ctx.beginPath();
            ctx.moveTo(c * tileSize, 0);
            ctx.lineTo(c * tileSize, dimensions.rows * tileSize);
            ctx.stroke();
          }
          ctx.restore();
        });
      },
    }
  );

  return <canvas ref={canvasRef} className="w-full h-full rounded-lg bg-slate-900 shadow-inner" />;
}

export default MapViewport;
