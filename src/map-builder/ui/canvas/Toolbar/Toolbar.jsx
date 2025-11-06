import React from "react";

export default function Toolbar({ selectedTile, setSelectedTile }) {
  const tiles = ["grass", "water", "stone"];

  return (
    <div className="w-32 bg-gray-800 p-4 space-y-2 text-white">
      <h3 className="font-bold mb-2">Tiles</h3>
      {tiles.map((tile) => (
        <button
          key={tile}
          onClick={() => setSelectedTile(tile)}
          className={`w-full px-2 py-1 rounded ${
            selectedTile === tile ? "bg-blue-600" : "bg-gray-600"
          }`}
        >
          {tile}
        </button>
      ))}
    </div>
  );
}
