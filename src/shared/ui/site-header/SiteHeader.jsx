import React from "react";
import SiteHeaderNavigation from "./SiteHeaderNavigation.jsx";
import SiteHeaderTitleButton from "./SiteHeaderTitleButton.jsx";
import SiteHeaderUserMenu from "./SiteHeaderUserMenu.jsx";
import { useSiteHeaderController } from "./useSiteHeaderController.js";
import { useStorageMenuController } from "./useStorageMenuController.js";
import { useResponsiveMode } from "../responsive/useResponsiveMode.js";

export default function SiteHeader(props) {
  const { isCompact } = useResponsiveMode();
  const {
    navItems,
    menuOpen,
    navigateTo,
    navigateHome,
    toggleMenu,
    logout,
    username,
    homeActive,
  } = useSiteHeaderController(props);
  const storageMenu = useStorageMenuController({ menuOpen });
  const showInlineNav = !isCompact;

  return (
    <header className="px-2 py-1.5 sm:px-4 sm:py-3 bg-gray-800 text-white flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <SiteHeaderTitleButton onNavigateHome={navigateHome} size={isCompact ? "compact" : "default"} />
      </div>
      {showInlineNav ? (
        <div className="flex-1 flex justify-center">
          <SiteHeaderNavigation items={navItems} onNavigate={navigateTo} />
        </div>
      ) : (
        <div className="flex-1" />
      )}
      <div className="flex items-center justify-end">
        <SiteHeaderUserMenu
          username={username}
          menuOpen={menuOpen}
          onToggleMenu={toggleMenu}
          onNavigateHome={navigateHome}
          onLogout={logout}
          homeActive={homeActive}
          storageMenu={storageMenu}
          navItems={showInlineNav ? [] : navItems}
          onNavigate={navigateTo}
        />
      </div>
    </header>
  );
}
