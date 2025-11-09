import React from "react";
import { SCREENS } from "../../screens.js";

function PlayerPlaceholder({ session, onLogout, UserBadge }) {
  if (!UserBadge) return null;

  return (
    <div className="w-screen h-screen bg-white relative">
      <div className="absolute top-2 right-2">
        <UserBadge session={session} onLogout={onLogout} />
      </div>
    </div>
  );
}

export default function AppScreenRenderer({
  container,
  screen,
  session,
  onNavigate,
  onLogout,
  onLoggedIn,
}) {
  const {
    auth: { LoginScreen, UserBadge },
    mapBuilder: { MapBuilderScreen },
    assets: { AssetCreationScreen },
    session: { SessionManagerScreen },
    shared: { MainMenu },
  } = container;

  switch (screen) {
    case SCREENS.MAP_BUILDER:
      return session?.role === "DM" ? (
        <MapBuilderScreen
          goBack={() => onNavigate?.(SCREENS.MENU)}
          session={session}
          onLogout={onLogout}
          onNavigate={onNavigate}
          currentScreen={screen}
        />
      ) : (
        <LoginScreen onLoggedIn={onLoggedIn} goBack={() => onNavigate?.(SCREENS.MENU)} />
      );
    case SCREENS.START_SESSION:
      return session?.role === "DM" ? (
        <SessionManagerScreen
          goBack={() => onNavigate?.(SCREENS.MENU)}
          session={session}
          onLogout={onLogout}
          onNavigate={onNavigate}
          currentScreen={screen}
        />
      ) : (
        <LoginScreen onLoggedIn={onLoggedIn} goBack={() => onNavigate?.(SCREENS.MENU)} />
      );
    case SCREENS.ASSET_CREATION:
      return session?.role === "DM" ? (
        <AssetCreationScreen
          goBack={() => onNavigate?.(SCREENS.MENU)}
          session={session}
          onLogout={onLogout}
          onNavigate={onNavigate}
          currentScreen={screen}
        />
      ) : (
        <LoginScreen onLoggedIn={onLoggedIn} goBack={() => onNavigate?.(SCREENS.MENU)} />
      );
    case SCREENS.LOGIN:
      return <LoginScreen onLoggedIn={onLoggedIn} goBack={() => onNavigate?.(SCREENS.MENU)} />;
    case SCREENS.PLAYER:
      return <PlayerPlaceholder session={session} onLogout={onLogout} UserBadge={UserBadge} />;
    default:
      return <MainMenu setScreen={onNavigate} session={session} onLogout={onLogout} />;
  }
}
