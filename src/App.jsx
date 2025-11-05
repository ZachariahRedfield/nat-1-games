import React, { useEffect, useState } from "react";
import { MainMenuScreen } from "./modules/main-menu";
import { MapBuilderScreen, clearCurrentProjectDir } from "./modules/map-builder";
import { SessionManagerScreen } from "./modules/session-manager";
import { AssetCreationScreen } from "./modules/asset-library";
import { LoginScreen, UserBadge, getSession, isDM, clearSession } from "./modules/auth";
import { supabase } from "./utils/supabaseClient";

function App() {
  // Default to Login; auto-route if prior session exists
  const [screen, setScreen] = useState("login");
  const [session, setSessionState] = useState(null);
  const [prevScreen, setPrevScreen] = useState(null);

  useEffect(() => {
    const s = getSession();
    if (s) {
      setSessionState(s);
      // DM -> Main Menu, Player -> white screen
      setScreen(s.role === 'DM' ? 'menu' : 'player');
    }
  }, []);

  const handleLoggedIn = (s) => {
    setSessionState(s);
    // DM -> Main Menu, Player -> white screen
    setScreen(s.role === 'DM' ? 'menu' : 'player');
  };

  const logout = () => {
    clearSession();
    try { supabase.auth.signOut(); } catch {}
    setSessionState(null);
    setScreen('login');
  };

  // Clear quick-save project handle when leaving Map Builder
  useEffect(() => {
    if (prevScreen === 'mapBuilder' && screen !== 'mapBuilder') {
      try { clearCurrentProjectDir(); } catch {}
    }
    setPrevScreen(screen);
  }, [screen]);

  const renderScreen = () => {
    switch (screen) {
      case "mapBuilder":
        return isDM(session) ? (
          <MapBuilderScreen goBack={() => setScreen("menu")} session={session} onLogout={logout} onNavigate={setScreen} currentScreen={screen} />
        ) : (
          <LoginScreen onLoggedIn={handleLoggedIn} goBack={() => setScreen("menu")} />
        );
      case "startSession":
        return isDM(session) ? (
          <SessionManagerScreen goBack={() => setScreen("menu")} session={session} onLogout={logout} onNavigate={setScreen} currentScreen={screen} />
        ) : (
          <LoginScreen onLoggedIn={handleLoggedIn} goBack={() => setScreen("menu")} />
        );
      case "assetCreation":
        return isDM(session) ? (
          <AssetCreationScreen goBack={() => setScreen("menu")} session={session} onLogout={logout} onNavigate={setScreen} currentScreen={screen} />
        ) : (
          <LoginScreen onLoggedIn={handleLoggedIn} goBack={() => setScreen("menu")} />
        );
      case "login":
        return <LoginScreen onLoggedIn={handleLoggedIn} goBack={() => setScreen("menu")} />;
      case "player":
        // White screen placeholder for Player with a logout/user badge in the corner
        return (
          <div className="w-screen h-screen bg-white relative">
            <div className="absolute top-2 right-2">
              <UserBadge session={session} onLogout={logout} />
            </div>
          </div>
        );
      default:
        return <MainMenuScreen setScreen={setScreen} session={session} onLogout={logout} />;
    }
  };

  return (
    <div className="w-screen h-screen bg-gray-900 text-white">
      {renderScreen()}
    </div>
  );
}

export default App;
