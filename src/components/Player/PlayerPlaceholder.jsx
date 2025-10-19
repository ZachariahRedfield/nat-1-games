import React from "react";
import UserBadge from "../Auth/UserBadge";

export default function PlayerPlaceholder({ goBack, session, onLogout }) {
  return (
    <div className="w-full h-full flex flex-col">
      <header className="p-4 bg-gray-800 flex justify-between items-center">
        <h2 className="text-xl font-bold">Player View</h2>
        <div className="flex items-center gap-2">
          <UserBadge session={session} onLogout={onLogout} />
          <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded" onClick={goBack}>Back</button>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center bg-gray-900 text-gray-300">
        Player View Coming Soon
      </main>
    </div>
  );
}
