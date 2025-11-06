import React, { createContext, useContext, useMemo } from "react";

const AppContext = createContext(null);

export function AppProvider({
  container,
  screen,
  setScreen,
  session,
  setSession,
  logout,
  children,
}) {
  const value = useMemo(
    () => ({
      container,
      screen,
      setScreen,
      session,
      setSession,
      logout,
      navigate: setScreen,
    }),
    [container, screen, setScreen, session, setSession, logout]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  return useContext(AppContext);
}

export function useAppContainer() {
  return useAppContext()?.container;
}

export function useAppNavigation() {
  const ctx = useAppContext();
  return {
    screen: ctx?.screen ?? null,
    navigate: ctx?.navigate ?? ctx?.setScreen,
    logout: ctx?.logout,
  };
}

export function useAppSession() {
  const ctx = useAppContext();
  return {
    session: ctx?.session ?? null,
    setSession: ctx?.setSession,
  };
}
