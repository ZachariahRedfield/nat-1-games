import React from "react";
import SiteHeader from "../../common/SiteHeader";

export default function AssetCreation({ goBack, session, onLogout, onNavigate, currentScreen }) {
  return (
    <div className="w-full h-full flex flex-col">
      <SiteHeader session={session} onLogout={onLogout} onNavigate={onNavigate} currentScreen={currentScreen || 'assetCreation'} />

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
