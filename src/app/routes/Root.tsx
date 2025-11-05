import { useEffect, useState } from "react";
import Login from "../../components/Auth/Login";
import UserBadge from "../../components/Auth/UserBadge";
import MapViewport from "../../components/Map/MapViewport";
import PanelHost from "../../features/settings/components/PanelHost";
import { clearSession, getSession, isDM } from "../../utils/auth";
import { supabase } from "../../utils/supabaseClient";

export type AppSession = {
  username: string;
  role: string;
  userId?: string;
};

type ScreenState = "loading" | "login" | "dm" | "player";

export default function Root() {
  const [screen, setScreen] = useState<ScreenState>("loading");
  const [session, setSession] = useState<AppSession | null>(null);

  useEffect(() => {
    const existing = getSession();
    if (existing) {
      setSession(existing as AppSession);
      setScreen(isDM(existing) ? "dm" : "player");
    } else {
      setScreen("login");
    }
  }, []);

  const handleLoggedIn = (nextSession: AppSession) => {
    setSession(nextSession);
    setScreen(isDM(nextSession) ? "dm" : "player");
  };

  const logout = () => {
    clearSession();
    try {
      supabase.auth.signOut();
    } catch (err) {
      console.warn("Failed to sign out", err);
    }
    setSession(null);
    setScreen("login");
  };

  const renderScreen = () => {
    switch (screen) {
      case "loading":
        return <div className="flex h-full w-full items-center justify-center text-slate-400">Loading…</div>;
      case "login":
        return <Login onLoggedIn={handleLoggedIn} />;
      case "player":
        return (
          <div className="relative flex h-full w-full items-start justify-end bg-white text-slate-900">
            <div className="absolute right-4 top-4">
              <UserBadge session={session} onLogout={logout} />
            </div>
          </div>
        );
      case "dm":
        return (
          <div className="flex flex-1 overflow-hidden">
            <div className="relative flex-1 overflow-hidden bg-slate-950">
              <MapViewport session={session} />
              <div className="absolute right-4 top-4">
                <UserBadge session={session} onLogout={logout} />
              </div>
            </div>
            <PanelHost session={session} className="hidden w-96 shrink-0 border-l border-slate-800 bg-slate-900 text-slate-100 lg:flex" />
          </div>
        );
      default:
        return null;
    }
  };

  return <div className="flex h-screen w-screen flex-col bg-slate-900 text-white">{renderScreen()}</div>;
}
