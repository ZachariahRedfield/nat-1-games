import React, { useState } from "react";
import Grid from "../Map/Grid";
import Toolbar from "../Map/Toolbar";

export default function MapBuilder({ goBack }) {
  const [selectedTile, setSelectedTile] = useState("grass");
  const [map, setMap] = useState(
  Array.from({ length: 20 }, () => Array.from({ length: 20 }, () => null))
    );

  const placeTile = (row, col) => {
    const newMap = map.map((r, ri) =>
      r.map((c, ci) => (ri === row && ci === col ? selectedTile : c))
    );
    setMap(newMap);
  };

  const saveMap = () => {
    const json = JSON.stringify(map);
    localStorage.setItem("savedMap", json);
    alert("Map saved!");
  };

  const loadMap = () => {
    const saved = localStorage.getItem("savedMap");
    if (saved) setMap(JSON.parse(saved));
  };

  return (
    <div className="w-full h-full flex flex-col">
      <header className="p-4 bg-gray-800 flex justify-between text-white">
        <h2 className="text-xl font-bold">Map Builder</h2>
        <div className="flex gap-2">
          <button onClick={saveMap} className="px-3 py-1 bg-green-600 rounded">
            Save
          </button>
          <button onClick={loadMap} className="px-3 py-1 bg-blue-600 rounded">
            Load
          </button>
           <button
            className="px-3 py-1 bg-red-600 rounded"
            onClick={goBack}
            >
            Back
            </button>

        </div>
      </header>

      <main className="flex flex-1 overflow-hidden min-h-0">
        <div className="w-52 bg-gray-800 p-2">
            <Toolbar selectedTile={selectedTile} setSelectedTile={setSelectedTile} />
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-900">
            <Grid map={map} placeTile={placeTile} />
        </div>
      </main>
    </div>
  );
}
