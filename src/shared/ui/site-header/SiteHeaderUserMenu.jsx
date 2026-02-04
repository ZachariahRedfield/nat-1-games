import React from "react";
import StorageMenuSection from "./StorageMenuSection.jsx";

export default function SiteHeaderUserMenu({
  username,
  menuOpen,
  onToggleMenu,
  onNavigateHome,
  onLogout,
  homeActive,
  storageMenu,
  navItems = [],
  onNavigate,
}) {
  const hasNavItems = navItems.length > 0;

  return (
    <div className="relative flex items-center gap-2">
      <span className="text-xs opacity-90 hidden sm:inline">{username}</span>
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
        <div className="absolute right-0 top-full mt-1 z-[10100] bg-gray-800 border border-gray-600 rounded shadow-md min-w-[180px] max-h-[70vh] overflow-y-auto">
          {hasNavItems ? (
            <div className="border-b border-gray-700">
              {navItems.map(({ key, label, active }) => (
                <button
                  key={key}
                  className={`block w-full text-left px-3 py-1 text-sm ${
                    active ? "text-white font-semibold" : "text-gray-300 hover:text-white"
                  }`}
                  onClick={() => onNavigate?.(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
          {storageMenu ? (
            <StorageMenuSection
              providerLabel={storageMenu.providerLabel}
              canImport={storageMenu.canImport}
              canExport={storageMenu.canExport}
              importTitle={storageMenu.importTitle}
              exportTitle={storageMenu.exportTitle}
              onImportPack={storageMenu.onImportPack}
              onExportPack={storageMenu.onExportPack}
              statusMessage={storageMenu.statusMessage}
              statusTone={storageMenu.statusTone}
            />
          ) : null}
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
