import { useCallback, useEffect, useRef, useState } from "react";
import { DM_ONLY_SCREENS, SCREENS, getDefaultScreenForSession } from "../../screens.js";

export async function performLogout({ clearSession, supabase, setSessionState, setScreen }) {
  clearSession?.();

  try {
    await supabase?.auth?.signOut?.();
  } catch (error) {
    console.warn("Supabase signOut failed", error);
  }

  // We always clear local auth state so the app cannot stay in a stale "logged in" UI.
  setSessionState(null);
  setScreen(SCREENS.LOGIN);
}

export function useAppNavigationState(container) {
  const {
    auth: { getSession, clearSession },
    mapBuilder: { clearCurrentProjectDir },
    shared: { supabase },
  } = container;

  const [screen, setScreen] = useState(SCREENS.LOGIN);
  const [sessionState, setSessionState] = useState(null);
  const prevScreenRef = useRef(SCREENS.LOGIN);

  useEffect(() => {
    const existing = getSession?.();
    if (existing) {
      setSessionState(existing);
      setScreen(getDefaultScreenForSession(existing));
    }
  }, [getSession]);

  useEffect(() => {
    const prevScreen = prevScreenRef.current;
    if (prevScreen === SCREENS.MAP_BUILDER && screen !== SCREENS.MAP_BUILDER) {
      try {
        clearCurrentProjectDir?.();
      } catch (error) {
        console.warn("Failed to clear Map Builder project directory", error);
      }
    }
    prevScreenRef.current = screen;
  }, [screen, clearCurrentProjectDir]);

  const logout = useCallback(async () => {
    await performLogout({ clearSession, supabase, setSessionState, setScreen });
  }, [clearSession, supabase]);

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

  const handleLoggedIn = useCallback((session) => {
    if (!session) return;
    setSessionState(session);
    setScreen(getDefaultScreenForSession(session));
  }, []);

  return {
    screen,
    session: sessionState,
    setSession: setSessionState,
    setScreen: navigate,
    navigate,
    logout,
    handleLoggedIn,
  };
}
