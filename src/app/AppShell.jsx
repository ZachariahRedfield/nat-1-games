import React, { useEffect, useMemo, useRef, useState } from "react";
import { createAppContainer } from "./AppContainer.js";

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
    auth: { LoginScreen, getSession, isDM, clearSession, UserBadge },
    mapBuilder: { MapBuilderScreen, clearCurrentProjectDir },
    assets: { AssetCreationScreen },
    session: { SessionManagerScreen },
    shared: { MainMenu, supabase },
  } = container;

  const [screen, setScreen] = useState("login");
  const [sessionState, setSessionState] = useState(null);
  const prevScreenRef = useRef(null);

  useEffect(() => {
    const existing = getSession();
    if (existing) {
      setSessionState(existing);
      setScreen(existing.role === "DM" ? "menu" : "player");
    }
  }, [getSession]);

  useEffect(() => {
    const prevScreen = prevScreenRef.current;
    if (prevScreen === "mapBuilder" && screen !== "mapBuilder") {
      try {
        clearCurrentProjectDir();
      } catch (err) {
        console.warn("Failed to clear Map Builder project directory", err);
      }
    }
    prevScreenRef.current = screen;
  }, [screen, clearCurrentProjectDir]);

  const logout = () => {
    clearSession();
    try {
      supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase signOut failed", err);
    }
    setSessionState(null);
    setScreen("login");
  };

  const handleLoggedIn = (session) => {
    setSessionState(session);
    setScreen(session.role === "DM" ? "menu" : "player");
  };

  const renderScreen = () => {
    switch (screen) {
      case "mapBuilder":
        return isDM(sessionState) ? (
          <MapBuilderScreen
            goBack={() => setScreen("menu")}
            session={sessionState}
            onLogout={logout}
            onNavigate={setScreen}
            currentScreen={screen}
          />
        ) : (
          <LoginScreen onLoggedIn={handleLoggedIn} goBack={() => setScreen("menu")} />
        );
      case "startSession":
        return isDM(sessionState) ? (
          <SessionManagerScreen
            goBack={() => setScreen("menu")}
            session={sessionState}
            onLogout={logout}
            onNavigate={setScreen}
            currentScreen={screen}
          />
        ) : (
          <LoginScreen onLoggedIn={handleLoggedIn} goBack={() => setScreen("menu")} />
        );
      case "assetCreation":
        return isDM(sessionState) ? (
          <AssetCreationScreen
            goBack={() => setScreen("menu")}
            session={sessionState}
            onLogout={logout}
            onNavigate={setScreen}
            currentScreen={screen}
          />
        ) : (
          <LoginScreen onLoggedIn={handleLoggedIn} goBack={() => setScreen("menu")} />
        );
      case "login":
        return <LoginScreen onLoggedIn={handleLoggedIn} goBack={() => setScreen("menu")} />;
      case "player":
        return <PlayerPlaceholder session={sessionState} onLogout={logout} UserBadge={UserBadge} />;
      default:
        return <MainMenu setScreen={setScreen} session={sessionState} onLogout={logout} />;
    }
  };

  return <div className="w-screen h-screen bg-gray-900 text-white">{renderScreen()}</div>;
}
