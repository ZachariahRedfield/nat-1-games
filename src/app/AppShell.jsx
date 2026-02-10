import React, { useMemo } from "react";
import { createAppContainer } from "./AppContainer.js";
import { AppProvider } from "./AppContext.jsx";
import AppScreenRenderer from "./ui/navigation/AppScreenRenderer.jsx";
import { useAppNavigationState } from "./ui/navigation/useAppNavigationState.js";
import { SCREENS } from "./screens.js";

function DevAuthDebugPanel({ screen, onNavigate, onClearSession }) {
  return (
    <div className="fixed bottom-2 left-2 rounded border border-amber-400/50 bg-black/75 px-2 py-2 text-[11px] text-amber-200">
      <div className="mb-1 font-semibold">DEV AUTH</div>
      <div className="mb-2">screen: {screen}</div>
      <div className="flex flex-wrap gap-1">
        <button className="rounded border border-amber-300/40 px-2 py-0.5" onClick={() => onNavigate?.(SCREENS.MAP_BUILDER)}>MapBuilder</button>
        <button className="rounded border border-amber-300/40 px-2 py-0.5" onClick={() => onNavigate?.(SCREENS.START_SESSION)}>Start Session</button>
        <button className="rounded border border-amber-300/40 px-2 py-0.5" onClick={() => onNavigate?.(SCREENS.ASSET_CREATION)}>Asset Creation</button>
        <button className="rounded border border-red-300/40 px-2 py-0.5 text-red-200" onClick={onClearSession}>Clear session</button>
      </div>
    </div>
  );
}

export default function AppShell() {
  const container = useMemo(() => createAppContainer(), []);
  const { screen, session, setSession, setScreen, navigate, logout, handleLoggedIn, devAuthDebug } =
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
        {devAuthDebug?.enabled ? (
          <div className="pointer-events-none fixed left-2 top-2 rounded border border-amber-400/50 bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
            DEV AUTH
          </div>
        ) : null}
        {devAuthDebug?.enabled && devAuthDebug?.shouldShowPanel ? (
          <DevAuthDebugPanel
            screen={screen}
            onNavigate={appNavigate}
            onClearSession={() => {
              container.auth.clearSession?.();
              setSession(null);
              appNavigate?.(SCREENS.LOGIN);
            }}
          />
        ) : null}
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
