import React from "react";
import { useAppNavigation, useAppSession } from "../../../app/AppContext.jsx";
import { SCREENS } from "../../../app/screens.js";
import SiteHeader from "../site-header/SiteHeader.jsx";
import AppButton from "../button/AppButton.jsx";

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
    { label: "Map Builder", screen: SCREENS.MAP_BUILDER, tone: "primary" },
    { label: "Start Session", screen: SCREENS.START_SESSION, tone: "primary" },
    { label: "Asset Creation", screen: SCREENS.ASSET_CREATION, tone: "primary" },
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
        {menuActions.map(({ label, screen, tone }) => {
          const isDmOnly = dmOnlyActions.has(screen);
          const isBlocked = isDmOnly && !isDM;

          return (
            <AppButton
              key={screen}
              className="min-w-52"
              tone={isBlocked ? "neutral" : tone}
              size="large"
              disabled={isBlocked}
              aria-label={isBlocked ? `${label} (DM only)` : label}
              title={isBlocked ? "DM only" : undefined}
              onClick={() => goTo?.(screen)}
            >
              {label}
              {isBlocked ? " (DM only)" : ""}
            </AppButton>
          );
        })}
      </main>
    </div>
  );
}
