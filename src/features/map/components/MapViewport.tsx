import React, { useEffect, useMemo, useRef, useState } from 'react';
import RenderSurface, {
  type ViewportState,
} from '../../../core/render/RenderSurface';
import {
  enumerateVisibleChunks,
  type ChunkDescriptor,
  type ChunkingOptions,
} from '../../../core/render/Chunking';

type TileDebug = {
  row: number;
  col: number;
  color?: number;
  alpha?: number;
};

type DebugOverlay = {
  /** Render chunk wireframes */
  showChunks?: boolean;
  /** Tiles to highlight in the viewport */
  tiles?: TileDebug[];
  /** Override chunk size when in debug mode */
  chunkSize?: number;
};

export interface MapViewportProps {
  tileSize?: number;
  showGridLines?: boolean;
  /** Optional debug overlay configuration */
  debug?: DebugOverlay;
  /** Called whenever the viewport changes */
  onViewportChange?: (state: ViewportState) => void;
  /** Optionally seed the initial viewport */
  initialViewport?: Partial<ViewportState>;
  /** Optional grid dimensions in tiles for layout sizing */
  rows?: number;
  cols?: number;
  /** Reference to the DOM element that represents the grid content */
  contentRef?: React.Ref<HTMLDivElement>;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const DEFAULT_CHUNK_SIZE = 16;

const MapViewport: React.FC<MapViewportProps> = ({
  tileSize = 32,
  showGridLines = true,
  debug,
  onViewportChange,
  initialViewport,
  rows,
  cols,
  contentRef,
  className,
  style,
  children,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const contentDivRef = useRef<HTMLDivElement | null>(null);
  const surfaceRef = useRef<RenderSurface | null>(null);
  const [viewport, setViewport] = useState<ViewportState | null>(null);

  const chunkSize = debug?.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const chunkOptions: ChunkingOptions = useMemo(
    () => ({ chunkSize, tileSize }),
    [chunkSize, tileSize]
  );

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const surface = new RenderSurface({ initialScale: initialViewport?.scale ?? 1 });
    surfaceRef.current = surface;
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    surface
      .mount(host)
      .then(() => {
        if (cancelled) {
          surface.destroy();
          return;
        }

        if (typeof initialViewport?.x === 'number' && typeof initialViewport?.y === 'number') {
          surface.setViewportOrigin(initialViewport.x, initialViewport.y);
        }
        if (typeof initialViewport?.scale === 'number') {
          surface.setViewportScale(initialViewport.scale);
        }

        unsubscribe = surface.subscribe((state) => {
          setViewport(state);
          onViewportChange?.(state);
        });
      })
      .catch((err) => {
        console.error('Failed to initialise render surface', err);
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
      surface.destroy();
      surfaceRef.current = null;
    };
  }, [initialViewport, onViewportChange]);

  const visibleChunks = useMemo<ChunkDescriptor[]>(() => {
    if (!viewport) return [];
    return enumerateVisibleChunks(viewport, chunkOptions);
  }, [viewport, chunkOptions]);

  useEffect(() => {
    if (!contentRef) return;
    if (typeof contentRef === 'function') {
      contentRef(contentDivRef.current);
      return () => contentRef(null);
    }

    (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = contentDivRef.current;
    return () => {
      (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = null;
    };
  }, [contentRef]);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;

    const graphics = surface.getGraphicsLayer('grid');
    graphics.clear();

    if (!viewport || !showGridLines) return;

    const lineWidth = 1 / viewport.scale;
    graphics.lineStyle({ width: lineWidth, color: 0xffffff, alpha: 0.18 });

    for (const chunk of visibleChunks) {
      const { worldBounds } = chunk;
      for (let i = 0; i <= chunkOptions.chunkSize; i++) {
        const x = worldBounds.x + i * chunkOptions.tileSize;
        graphics.moveTo(x, worldBounds.y);
        graphics.lineTo(x, worldBounds.y + worldBounds.height);
      }
      for (let j = 0; j <= chunkOptions.chunkSize; j++) {
        const y = worldBounds.y + j * chunkOptions.tileSize;
        graphics.moveTo(worldBounds.x, y);
        graphics.lineTo(worldBounds.x + worldBounds.width, y);
      }
    }
  }, [chunkOptions, showGridLines, visibleChunks, viewport]);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;

    const debugGraphics = surface.getGraphicsLayer('debug');
    debugGraphics.clear();

    if (!viewport) return;

    if (debug?.showChunks) {
      const lineWidth = 2 / viewport.scale;
      debugGraphics.lineStyle({ width: lineWidth, color: 0xff8800, alpha: 0.65 });
      for (const chunk of visibleChunks) {
        const { worldBounds } = chunk;
        debugGraphics.drawRect(worldBounds.x, worldBounds.y, worldBounds.width, worldBounds.height);
      }
    }

    const tiles = debug?.tiles ?? [];
    if (tiles.length) {
      for (const tile of tiles) {
        const color = tile.color ?? 0x00ffcc;
        const alpha = tile.alpha ?? 0.35;
        debugGraphics.beginFill(color, alpha);
        debugGraphics.drawRect(tile.col * tileSize, tile.row * tileSize, tileSize, tileSize);
        debugGraphics.endFill();
      }
    }
  }, [debug, tileSize, viewport, visibleChunks]);

  return (
    <div
      className={className}
      style={{ position: 'relative', width: '100%', height: '100%', ...style }}
    >
      <div
        ref={contentDivRef}
        style={{
          position: 'relative',
          width: cols ? cols * tileSize : '100%',
          height: rows ? rows * tileSize : '100%',
        }}
      >
        <div ref={hostRef} style={{ position: 'absolute', inset: 0 }} />
      </div>
      {children ? (
        <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
      ) : null}
    </div>
  );
};

export default MapViewport;
