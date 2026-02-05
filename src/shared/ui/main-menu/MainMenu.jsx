import React from "react";
import { useAppNavigation, useAppSession } from "../../../app/AppContext.jsx";
import { SCREENS } from "../../../app/screens.js";
import SiteHeader from "../site-header/SiteHeader.jsx";

export default function MainMenu({ setScreen, session, onLogout }) {
  const { navigate, logout, screen: activeScreen } = useAppNavigation();
  const { session: contextSession } = useAppSession();

  const goTo = setScreen || navigate;
  const resolvedSession = session ?? contextSession;
  const handleLogout = onLogout || logout;
  const isDM = resolvedSession?.role === "DM";

  const dmOnlyActions = new Set([
    SCREENS.MAP_BUILDER,
    SCREENS.START_SESSION,
    SCREENS.ASSET_CREATION,
  ]);

  const menuActions = [
    { label: "Map Builder", screen: SCREENS.MAP_BUILDER, className: "bg-blue-600 hover:bg-blue-500" },
    { label: "Start Session", screen: SCREENS.START_SESSION, className: "bg-green-600 hover:bg-green-500" },
    { label: "Asset Creation", screen: SCREENS.ASSET_CREATION, className: "bg-purple-600 hover:bg-purple-500" },
  ];

  return (
    <div className="w-full h-full flex flex-col">
      <SiteHeader
        session={resolvedSession}
        onLogout={handleLogout}
        currentScreen={activeScreen ?? SCREENS.MENU}
        onNavigate={goTo}
      />
      <main className="flex-1 flex flex-col gap-4 items-center justify-center bg-gray-900 text-white">
        {menuActions.map(({ label, screen, className }) => {
          const isDmOnly = dmOnlyActions.has(screen);
          const isBlocked = isDmOnly && !isDM;

          return (
            <button
              key={screen}
              className={`px-4 py-2 rounded ${
                isBlocked ? "bg-gray-600 cursor-not-allowed opacity-70" : className
              }`}
              disabled={isBlocked}
              aria-label={isBlocked ? `${label} (DM only)` : label}
              title={isBlocked ? "DM only" : undefined}
              onClick={() => goTo?.(screen)}
            >
              {label}
              {isBlocked ? " (DM only)" : ""}
            </button>
          );
        })}
      </main>
    </div>
  );
}
