import { useCallback, useMemo, useState } from "react";
import { useAppNavigation, useAppSession } from "../../../app/AppContext.jsx";
import { SCREENS } from "../../../app/screens.js";

const NAV_ITEMS = [
  { key: SCREENS.MAP_BUILDER, label: "Map Builder" },
  { key: SCREENS.START_SESSION, label: "Start Session" },
  { key: SCREENS.ASSET_CREATION, label: "Asset Creation" },
];

export function useSiteHeaderController({ session, onLogout, currentScreen, onNavigate }) {
  const navigation = useAppNavigation();
  const { session: contextSession } = useAppSession();

  const [menuOpen, setMenuOpen] = useState(false);

  const resolvedSession = session ?? contextSession;
  const activeScreen = currentScreen ?? navigation?.screen ?? SCREENS.MENU;
  const goTo = onNavigate || navigation?.navigate;
  const handleLogout = onLogout || navigation?.logout;

  const navItems = useMemo(
    () =>
      NAV_ITEMS.map((item) => ({
        ...item,
        active: activeScreen === item.key,
      })),
    [activeScreen]
  );

  const toggleMenu = useCallback(() => {
    setMenuOpen((value) => !value);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const navigateTo = useCallback(
    (screen) => {
      closeMenu();
      goTo?.(screen);
    },
    [closeMenu, goTo]
  );

  const navigateHome = useCallback(() => {
    navigateTo(SCREENS.MENU);
  }, [navigateTo]);

  const logout = useCallback(() => {
    closeMenu();
    handleLogout?.();
  }, [closeMenu, handleLogout]);

  return {
    activeScreen,
    menuOpen,
    navItems,
    navigateTo,
    navigateHome,
    toggleMenu,
    logout,
    username: resolvedSession?.username ?? "",
    homeActive: activeScreen === SCREENS.MENU,
  };
}

export default useSiteHeaderController;
