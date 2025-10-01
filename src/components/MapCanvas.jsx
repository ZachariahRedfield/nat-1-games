import React from "react";
import { useEffect, useRef } from "react";

const MapCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Fill background
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    const tileSize = 50;
    ctx.strokeStyle = "#555";
    for (let x = 0; x < canvas.width; x += tileSize) {
      for (let y = 0; y < canvas.height; y += tileSize) {
        ctx.strokeRect(x, y, tileSize, tileSize);
      }
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{ border: "1px solid white" }}
    />
  );
};

export default MapCanvas;
