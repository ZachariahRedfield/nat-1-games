import { SCREENS } from "../screens.js";

const REPRO_SCREEN_BY_PARAM = Object.freeze({
  mapBuilder: SCREENS.MAP_BUILDER,
  startSession: SCREENS.START_SESSION,
  assetCreation: SCREENS.ASSET_CREATION,
});

export function isDevAuthDebugEnabled(env = import.meta.env) {
  return env?.DEV === true && env?.VITE_DEBUG_AUTH === "1";
}

export function getDevAuthDebugConfig(search = "", env = import.meta.env) {
  const enabled = isDevAuthDebugEnabled(env);
  if (!enabled) {
    return {
      enabled: false,
      shouldShowPanel: false,
      targetScreen: null,
      shouldAutoLogin: false,
    };
  }

  const params = new URLSearchParams(search || "");
  const repro = params.get("repro");
  const targetScreen = REPRO_SCREEN_BY_PARAM[repro] || (params.get("autologin") === "1" ? SCREENS.MAP_BUILDER : null);

  return {
    enabled: true,
    shouldShowPanel: params.get("debug") === "1",
    targetScreen,
    shouldAutoLogin: !!targetScreen,
  };
}

export function createDevSeedSession() {
  return {
    userId: "dev-codex",
    username: "codex",
    role: "DM",
    user: {
      username: "codex",
    },
  };
}

