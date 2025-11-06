export const SCREENS = Object.freeze({
  LOGIN: "login",
  MENU: "menu",
  MAP_BUILDER: "mapBuilder",
  START_SESSION: "startSession",
  ASSET_CREATION: "assetCreation",
  PLAYER: "player",
});

export function getDefaultScreenForSession(session) {
  if (!session) return SCREENS.LOGIN;
  return session.role === "DM" ? SCREENS.MENU : SCREENS.PLAYER;
}

export function isDmOnly(screen) {
  return (
    screen === SCREENS.MAP_BUILDER ||
    screen === SCREENS.START_SESSION ||
    screen === SCREENS.ASSET_CREATION
  );
}

export const DM_ONLY_SCREENS = new Set([
  SCREENS.MAP_BUILDER,
  SCREENS.START_SESSION,
  SCREENS.ASSET_CREATION,
]);
