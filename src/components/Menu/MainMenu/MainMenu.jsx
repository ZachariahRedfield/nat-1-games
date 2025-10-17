import React from "react";

export default function MainMenu({ setScreen }) {
  return (
    <div className="flex flex-col gap-4 items-center">
      <h1 className="text-3xl font-bold">Nat-1 Games</h1>
      <button
        className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
        onClick={() => setScreen("mapBuilder")}
      >
        Map Builder
      </button>
      <button
        className="px-4 py-2 bg-green-600 rounded hover:bg-green-500"
        onClick={() => setScreen("startSession")}
      >
        Start Session
      </button>
      <button
        className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-500"
        onClick={() => setScreen("assetCreation")}
      >
        Asset Creation
      </button>
    </div>
  );
}
