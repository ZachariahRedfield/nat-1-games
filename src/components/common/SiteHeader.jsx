import React from "react";
// Inline username + menu in this header

export default function SiteHeader({ session, onLogout, currentScreen, onNavigate }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const items = [
    { key: "mapBuilder", label: "Map Builder" },
    { key: "startSession", label: "Start Session" },
    { key: "assetCreation", label: "Asset Creation" },
  ];
  return (
    <header className="px-4 py-3 bg-gray-800 text-white flex items-center justify-between">
      <button
        className="text-2xl font-bold hover:text-gray-200"
        onClick={() => onNavigate?.('menu')}
        title="Home"
      >
        Nat-1 Games
      </button>
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
      <div className="relative flex items-center gap-2">
        <span className="text-xs opacity-90">{session?.username || ''}</span>
        <button
          className="w-7 h-7 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded flex items-center justify-center"
          onClick={() => setMenuOpen((v) => !v)}
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
              className={`block w-full text-left px-3 py-1 text-sm ${currentScreen==='menu' ? 'text-white font-semibold' : 'text-gray-300 hover:text-white'}`}
              onClick={() => { setMenuOpen(false); onNavigate?.('menu'); }}
            >Home</button>
            <button
              className="block w-full text-left px-3 py-1 text-sm text-gray-300 hover:text-white"
              onClick={() => { setMenuOpen(false); onLogout?.(); }}
            >Logout</button>
          </div>
        )}
      </div>
    </header>
  );
}
