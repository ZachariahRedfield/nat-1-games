import React, { useMemo } from "react";
import { createAppContainer } from "./AppContainer.js";
import { AppProvider } from "./AppContext.jsx";
import AppScreenRenderer from "./ui/navigation/AppScreenRenderer.jsx";
import { useAppNavigationState } from "./ui/navigation/useAppNavigationState.js";

export default function AppShell() {
  const container = useMemo(() => createAppContainer(), []);
  const { screen, session, setSession, setScreen, navigate, logout, handleLoggedIn } =
    useAppNavigationState(container);

  const appNavigate = navigate ?? setScreen;

  return (
    <AppProvider
      container={container}
      screen={screen}
      setScreen={appNavigate}
      session={session}
      setSession={setSession}
      logout={logout}
    >
      <div className="w-screen h-screen bg-gray-900 text-white">
        <AppScreenRenderer
          container={container}
          screen={screen}
          session={session}
          onNavigate={appNavigate}
          onLogout={logout}
          onLoggedIn={handleLoggedIn}
        />
      </div>
    </AppProvider>
  );
}
