export interface WorldRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ChunkingOptions {
  /** Number of tiles per side in a chunk */
  chunkSize: number;
  /** Tile size in world units (pixels) */
  tileSize: number;
}

export interface ChunkDescriptor {
  key: string;
  chunkX: number;
  chunkY: number;
  worldBounds: WorldRect;
  tileBounds: { minX: number; minY: number; maxX: number; maxY: number };
}

export function chunkKey(chunkX: number, chunkY: number): string {
  return `${chunkX},${chunkY}`;
}

export function getChunkWorldBounds(chunkX: number, chunkY: number, options: ChunkingOptions): WorldRect {
  const size = options.chunkSize * options.tileSize;
  return {
    x: chunkX * size,
    y: chunkY * size,
    width: size,
    height: size,
  };
}

export function enumerateVisibleChunks(viewRect: WorldRect, options: ChunkingOptions): ChunkDescriptor[] {
  const { chunkSize, tileSize } = options;
  if (chunkSize <= 0 || tileSize <= 0) {
    return [];
  }

  const minTileX = Math.floor(viewRect.x / tileSize);
  const minTileY = Math.floor(viewRect.y / tileSize);
  const maxTileX = Math.ceil((viewRect.x + viewRect.width) / tileSize) - 1;
  const maxTileY = Math.ceil((viewRect.y + viewRect.height) / tileSize) - 1;

  const minChunkX = Math.floor(minTileX / chunkSize);
  const minChunkY = Math.floor(minTileY / chunkSize);
  const maxChunkX = Math.floor(maxTileX / chunkSize);
  const maxChunkY = Math.floor(maxTileY / chunkSize);

  const descriptors: ChunkDescriptor[] = [];
  for (let cy = minChunkY; cy <= maxChunkY; cy++) {
    for (let cx = minChunkX; cx <= maxChunkX; cx++) {
      const worldBounds = getChunkWorldBounds(cx, cy, options);
      descriptors.push({
        key: chunkKey(cx, cy),
        chunkX: cx,
        chunkY: cy,
        worldBounds,
        tileBounds: {
          minX: cx * chunkSize,
          minY: cy * chunkSize,
          maxX: cx * chunkSize + chunkSize - 1,
          maxY: cy * chunkSize + chunkSize - 1,
        },
      });
    }
  }

  return descriptors;
}

export function filterTilesToView<T extends { row: number; col: number }>(
  tiles: T[],
  viewRect: WorldRect,
  options: ChunkingOptions
): T[] {
  const { tileSize } = options;
  const minTileX = Math.floor(viewRect.x / tileSize);
  const minTileY = Math.floor(viewRect.y / tileSize);
  const maxTileX = Math.ceil((viewRect.x + viewRect.width) / tileSize);
  const maxTileY = Math.ceil((viewRect.y + viewRect.height) / tileSize);

  return tiles.filter((tile) =>
    tile.col >= minTileX &&
    tile.col < maxTileX &&
    tile.row >= minTileY &&
    tile.row < maxTileY
  );
}
