import React from "react";
import SiteHeader from "../../../components/common/SiteHeader";

export default function MainMenu({ setScreen, session, onLogout }) {
  return (
    <div className="w-full h-full flex flex-col">
      <SiteHeader session={session} onLogout={onLogout} currentScreen="menu" onNavigate={setScreen} />
      <main className="flex-1 flex flex-col gap-4 items-center justify-center bg-gray-900 text-white">
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
      </main>
    </div>
  );
}
