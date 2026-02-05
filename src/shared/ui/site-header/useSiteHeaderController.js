import { useCallback, useMemo, useState } from "react";
import { useAppNavigation, useAppSession } from "../../../app/AppContext.jsx";
import { SCREENS } from "../../../app/screens.js";
import { buildHeaderNavItems } from "./headerNavItems.js";

export function useSiteHeaderController({ session, onLogout, currentScreen, onNavigate }) {
  const navigation = useAppNavigation();
  const { session: contextSession } = useAppSession();

  const [menuOpen, setMenuOpen] = useState(false);

  const resolvedSession = session ?? contextSession;
  const isDM = resolvedSession?.role === "DM";
  const activeScreen = currentScreen ?? navigation?.screen ?? SCREENS.MENU;
  const goTo = onNavigate || navigation?.navigate;
  const handleLogout = onLogout || navigation?.logout;

  const navItems = useMemo(
    () => buildHeaderNavItems(activeScreen, isDM),
    [activeScreen, isDM]
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
      if (!isDM) {
        return;
      }
      goTo?.(screen);
    },
    [closeMenu, goTo, isDM]
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
