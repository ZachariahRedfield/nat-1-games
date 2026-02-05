import { SCREENS } from "../../../app/screens.js";

const NAV_ITEMS = [
  { key: SCREENS.MAP_BUILDER, label: "Map Builder" },
  { key: SCREENS.START_SESSION, label: "Start Session" },
  { key: SCREENS.ASSET_CREATION, label: "Asset Creation" },
];

export function buildHeaderNavItems(activeScreen, isDM) {
  return NAV_ITEMS.map((item) => ({
    ...item,
    active: activeScreen === item.key,
    disabled: !isDM,
    title: isDM ? item.label : `${item.label} (DM only)`,
  }));
}
