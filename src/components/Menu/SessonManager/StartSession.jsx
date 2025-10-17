import React from "react";

export default function StartSession({ goBack }) {
  return (
    <div className="w-full h-full flex flex-col">
      <header className="p-4 bg-gray-800 flex justify-between">
        <h2 className="text-xl font-bold">Start Session</h2>
        <button
          className="px-4 py-2 bg-red-600 rounded hover:bg-red-500"
          onClick={goBack}
        >
          Back to Menu
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <p className="text-gray-400">[Session setup will go here]</p>
      </main>
    </div>
  );
}
