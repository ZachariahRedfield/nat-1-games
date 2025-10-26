import React from "react";
import UserBadge from "../Auth/UserBadge";

export default function SiteHeader({ session, onLogout, currentScreen, onNavigate }) {
  const items = [
    { key: "mapBuilder", label: "Map Builder" },
    { key: "startSession", label: "Start Session" },
    { key: "assetCreation", label: "Asset Creation" },
  ];
  return (
    <header className="px-4 py-3 bg-gray-800 text-white flex items-center justify-between">
      <h1 className="text-2xl font-bold">Nat-1 Games</h1>
      <nav className="flex items-center gap-4 text-sm">
        {items.map((it) => {
          const active = currentScreen === it.key;
          const cls = active
            ? "text-white font-semibold"
            : "text-gray-400 hover:text-gray-200";
        return (
          <button
            key={it.key}
            className={`${cls}`}
            onClick={() => onNavigate?.(it.key)}
            title={it.label}
          >
            {it.label}
          </button>
        );
        })}
      </nav>
      <div className="flex items-center gap-2">
        <UserBadge session={session} onLogout={onLogout} />
      </div>
    </header>
  );
}
