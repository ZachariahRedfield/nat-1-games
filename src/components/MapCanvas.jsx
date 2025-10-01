import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

export default function MapCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Create PIXI app
    const app = new PIXI.Application({
      width: 800,
      height: 600,
      backgroundColor: 0x2b2b2b
    });
    canvasRef.current.appendChild(app.view);

    // Grid settings
    const tileSize = 50;
    const rows = 12;
    const cols = 16;

    // Store tiles
    const tiles = [];

    for (let y = 0; y < rows; y++) {
      tiles[y] = [];
      for (let x = 0; x < cols; x++) {
        const tile = new PIXI.Graphics();
        tile.lineStyle(1, 0x444444);
        tile.beginFill(0x228B22); // grass green
        tile.drawRect(x * tileSize, y * tileSize, tileSize, tileSize);
        tile.endFill();

        // Interactivity
        tile.interactive = true;
        tile.on("pointerdown", () => {
          // Toggle between grass + stone
          tile.clear();
          const color = tile.tint === 0x228B22 ? 0x808080 : 0x228B22;
          tile.beginFill(color);
          tile.lineStyle(1, 0x444444);
          tile.drawRect(x * tileSize, y * tileSize, tileSize, tileSize);
          tile.endFill();
          tile.tint = color;
        });

        app.stage.addChild(tile);
        tiles[y][x] = tile;
      }
    }

    return () => {
      app.destroy(true, true);
    };
  }, []);

  return <div ref={canvasRef}></div>;
}
