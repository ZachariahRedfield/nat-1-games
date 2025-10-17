import React from "react";

export default function AssetCreation({ goBack }) {
  return (
    <div className="w-full h-full flex flex-col">
      <header className="p-4 bg-gray-800 flex justify-between">
        <h2 className="text-xl font-bold">Asset Creation</h2>
        <button
          className="px-4 py-2 bg-red-600 rounded hover:bg-red-500"
          onClick={goBack}
        >
          Back to Menu
        </button>
      </header>

      <main className="flex-1 grid grid-cols-3 gap-4 p-6 bg-gray-900">
        <div className="bg-gray-700 p-4 rounded">Tiles</div>
        <div className="bg-gray-700 p-4 rounded">VFX</div>
        <div className="bg-gray-700 p-4 rounded">SFX</div>
        <div className="bg-gray-700 p-4 rounded">Players</div>
        <div className="bg-gray-700 p-4 rounded">Enemies</div>
        <div className="bg-gray-700 p-4 rounded">Gear / Tools</div>
      </main>
    </div>
  );
}
