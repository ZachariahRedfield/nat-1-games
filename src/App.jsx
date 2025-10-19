import React, { useEffect, useState } from "react";
import MainMenu from "./components/Menu/MainMenu/MainMenu";
import MapBuilder from "./components/Menu/MapBuilder/MapBuilder";
import StartSession from "./components/Menu/SessonManager/StartSession";
import AssetCreation from "./components/Menu/AssetCreation/AssetCreation";
import Login from "./components/Auth/Login";
import PlayerPlaceholder from "./components/Player/PlayerPlaceholder";
import { getSession, isDM, clearSession } from "./utils/auth";
import { supabase } from "./utils/supabaseClient";

function App() {
  // Default to Login; auto-route if prior session exists
  const [screen, setScreen] = useState("login");
  const [session, setSessionState] = useState(null);

  useEffect(() => {
    const s = getSession();
    if (s) {
      setSessionState(s);
      // Land on Main Menu for both roles after restoring a session
      setScreen('menu');
    }
  }, []);

  const handleLoggedIn = (s) => {
    setSessionState(s);
    // After login, land on Main Menu regardless of role
    setScreen('menu');
  };

  const logout = () => {
    clearSession();
    try { supabase.auth.signOut(); } catch {}
    setSessionState(null);
    setScreen('menu');
  };

  const renderScreen = () => {
    switch (screen) {
      case "mapBuilder":
        return isDM(session) ? (
          <MapBuilder goBack={() => setScreen("menu")} session={session} onLogout={logout} />
        ) : (
          <Login onLoggedIn={handleLoggedIn} goBack={() => setScreen("menu")} />
        );
      case "startSession":
        return isDM(session) ? (
          <StartSession goBack={() => setScreen("menu")} session={session} onLogout={logout} />
        ) : (
          <Login onLoggedIn={handleLoggedIn} goBack={() => setScreen("menu")} />
        );
      case "assetCreation":
        return isDM(session) ? (
          <AssetCreation goBack={() => setScreen("menu")} session={session} onLogout={logout} />
        ) : (
          <Login onLoggedIn={handleLoggedIn} goBack={() => setScreen("menu")} />
        );
      case "login":
        return <Login onLoggedIn={handleLoggedIn} goBack={() => setScreen("menu")} />;
      case "player":
        return <PlayerPlaceholder goBack={() => setScreen("menu")} session={session} onLogout={logout} />;
      default:
        return <MainMenu setScreen={setScreen} session={session} onLogout={logout} />;
    }
  };

  return (
    <div className="w-screen h-screen bg-gray-900 text-white">
      {renderScreen()}
    </div>
  );
}

export default App;
