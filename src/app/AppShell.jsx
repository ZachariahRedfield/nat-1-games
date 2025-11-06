import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createAppContainer } from "./AppContainer.js";
import { AppProvider } from "./AppContext.jsx";
import { DM_ONLY_SCREENS, SCREENS, getDefaultScreenForSession } from "./screens.js";

function PlayerPlaceholder({ session, onLogout, UserBadge }) {
  return (
    <div className="w-screen h-screen bg-white relative">
      <div className="absolute top-2 right-2">
        <UserBadge session={session} onLogout={onLogout} />
      </div>
    </div>
  );
}

export default function AppShell() {
  const container = useMemo(() => createAppContainer(), []);
  const {
    auth: { LoginScreen, getSession, clearSession, UserBadge },
    mapBuilder: { MapBuilderScreen, clearCurrentProjectDir },
    assets: { AssetCreationScreen },
    session: { SessionManagerScreen },
    shared: { MainMenu, supabase },
  } = container;

  const [screen, setScreen] = useState(SCREENS.LOGIN);
  const [sessionState, setSessionState] = useState(null);
  const prevScreenRef = useRef(null);

  useEffect(() => {
    const existing = getSession();
    if (existing) {
      setSessionState(existing);
      setScreen(getDefaultScreenForSession(existing));
    }
  }, [getSession]);

  useEffect(() => {
    const prevScreen = prevScreenRef.current;
    if (prevScreen === SCREENS.MAP_BUILDER && screen !== SCREENS.MAP_BUILDER) {
      try {
        clearCurrentProjectDir();
      } catch (err) {
        console.warn("Failed to clear Map Builder project directory", err);
      }
    }
    prevScreenRef.current = screen;
  }, [screen, clearCurrentProjectDir]);

  const logout = useCallback(() => {
    clearSession();
    try {
      supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase signOut failed", err);
    }
    setSessionState(null);
    setScreen(SCREENS.LOGIN);
  }, [clearSession, supabase, setScreen]);

  const handleLoggedIn = useCallback((session) => {
    setSessionState(session);
    setScreen(getDefaultScreenForSession(session));
  }, []);

  const navigate = useCallback(
    (nextScreen) => {
      if (!nextScreen) return;
      if (DM_ONLY_SCREENS.has(nextScreen) && sessionState?.role !== "DM") {
        setScreen(SCREENS.LOGIN);
        return;
      }
      setScreen(nextScreen);
    },
    [sessionState]
  );

  const renderScreen = () => {
    switch (screen) {
      case SCREENS.MAP_BUILDER:
        return sessionState?.role === "DM" ? (
          <MapBuilderScreen
            goBack={() => navigate(SCREENS.MENU)}
            session={sessionState}
            onLogout={logout}
            onNavigate={navigate}
            currentScreen={screen}
          />
        ) : (
          <LoginScreen onLoggedIn={handleLoggedIn} goBack={() => navigate(SCREENS.MENU)} />
        );
      case SCREENS.START_SESSION:
        return sessionState?.role === "DM" ? (
          <SessionManagerScreen
            goBack={() => navigate(SCREENS.MENU)}
            session={sessionState}
            onLogout={logout}
            onNavigate={navigate}
            currentScreen={screen}
          />
        ) : (
          <LoginScreen onLoggedIn={handleLoggedIn} goBack={() => navigate(SCREENS.MENU)} />
        );
      case SCREENS.ASSET_CREATION:
        return sessionState?.role === "DM" ? (
          <AssetCreationScreen
            goBack={() => navigate(SCREENS.MENU)}
            session={sessionState}
            onLogout={logout}
            onNavigate={navigate}
            currentScreen={screen}
          />
        ) : (
          <LoginScreen onLoggedIn={handleLoggedIn} goBack={() => navigate(SCREENS.MENU)} />
        );
      case SCREENS.LOGIN:
        return <LoginScreen onLoggedIn={handleLoggedIn} goBack={() => navigate(SCREENS.MENU)} />;
      case SCREENS.PLAYER:
        return <PlayerPlaceholder session={sessionState} onLogout={logout} UserBadge={UserBadge} />;
      default:
        return <MainMenu setScreen={navigate} session={sessionState} onLogout={logout} />;
    }
  };

  return (
    <AppProvider
      container={container}
      screen={screen}
      setScreen={navigate}
      session={sessionState}
      setSession={setSessionState}
      logout={logout}
    >
      <div className="w-screen h-screen bg-gray-900 text-white">{renderScreen()}</div>
    </AppProvider>
  );
}
