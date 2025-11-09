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

  return (
    <div className="w-full h-full flex flex-col">
      <SiteHeader
        session={resolvedSession}
        onLogout={handleLogout}
        currentScreen={activeScreen ?? SCREENS.MENU}
        onNavigate={goTo}
      />
      <main className="flex-1 flex flex-col gap-4 items-center justify-center bg-gray-900 text-white">
        <button
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
          onClick={() => goTo?.(SCREENS.MAP_BUILDER)}
        >
          Map Builder
        </button>
        <button
          className="px-4 py-2 bg-green-600 rounded hover:bg-green-500"
          onClick={() => goTo?.(SCREENS.START_SESSION)}
        >
          Start Session
        </button>
        <button
          className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-500"
          onClick={() => goTo?.(SCREENS.ASSET_CREATION)}
        >
          Asset Creation
        </button>
      </main>
    </div>
  );
}
