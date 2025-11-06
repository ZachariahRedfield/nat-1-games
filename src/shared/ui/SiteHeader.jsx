import React from "react";
import { useAppNavigation, useAppSession } from "../../app/AppContext.jsx";
import { SCREENS } from "../../app/screens.js";

// Inline username + menu in this header

export default function SiteHeader({ session, onLogout, currentScreen, onNavigate }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const navigation = useAppNavigation();
  const { session: contextSession } = useAppSession();

  const resolvedSession = session ?? contextSession;
  const activeScreen = currentScreen ?? navigation?.screen ?? SCREENS.MENU;
  const goTo = onNavigate || navigation?.navigate;
  const handleLogout = onLogout || navigation?.logout;

  const items = [
    { key: SCREENS.MAP_BUILDER, label: "Map Builder" },
    { key: SCREENS.START_SESSION, label: "Start Session" },
    { key: SCREENS.ASSET_CREATION, label: "Asset Creation" },
  ];
  return (
    <header className="px-4 py-3 bg-gray-800 text-white flex items-center justify-between">
      <button
        className="text-2xl font-bold hover:text-gray-200"
        onClick={() => goTo?.(SCREENS.MENU)}
        title="Home"
      >
        Nat-1 Games
      </button>
      <nav className="flex items-center gap-4 text-sm">
        {items.map((it) => {
          const active = activeScreen === it.key;
          const cls = active
            ? "text-white font-semibold"
            : "text-gray-400 hover:text-gray-200";
          return (
            <button
              key={it.key}
              className={cls}
              onClick={() => goTo?.(it.key)}
              title={it.label}
            >
              {it.label}
            </button>
          );
        })}
      </nav>
      <div className="relative flex items-center gap-2">
        <span className="text-xs opacity-90">{resolvedSession?.username || ""}</span>
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
              className={`block w-full text-left px-3 py-1 text-sm ${activeScreen===SCREENS.MENU ? 'text-white font-semibold' : 'text-gray-300 hover:text-white'}`}
              onClick={() => {
                setMenuOpen(false);
                goTo?.(SCREENS.MENU);
              }}
            >
              Home
            </button>
            <button
              className="block w-full text-left px-3 py-1 text-sm text-gray-300 hover:text-white"
              onClick={() => {
                setMenuOpen(false);
                handleLogout?.();
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
