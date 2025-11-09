import React from "react";

export default function SiteHeaderUserMenu({
  username,
  menuOpen,
  onToggleMenu,
  onNavigateHome,
  onLogout,
  homeActive,
}) {
  return (
    <div className="relative flex items-center gap-2">
      <span className="text-xs opacity-90">{username}</span>
      <button
        className="w-7 h-7 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded flex items-center justify-center"
        onClick={onToggleMenu}
        aria-label="Menu"
        title="Menu"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <rect x="2" y="4" width="12" height="2" rx="1" />
          <rect x="2" y="7" width="12" height="2" rx="1" />
          <rect x="2" y="10" width="12" height="2" rx="1" />
        </svg>
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 z-[10100] bg-gray-800 border border-gray-600 rounded shadow-md min-w-[120px]">
          <button
            className={`block w-full text-left px-3 py-1 text-sm ${
              homeActive ? "text-white font-semibold" : "text-gray-300 hover:text-white"
            }`}
            onClick={onNavigateHome}
          >
            Home
          </button>
          <button
            className="block w-full text-left px-3 py-1 text-sm text-gray-300 hover:text-white"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
