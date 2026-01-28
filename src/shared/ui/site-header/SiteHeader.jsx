import React from "react";
import SiteHeaderNavigation from "./SiteHeaderNavigation.jsx";
import SiteHeaderTitleButton from "./SiteHeaderTitleButton.jsx";
import SiteHeaderUserMenu from "./SiteHeaderUserMenu.jsx";
import { useSiteHeaderController } from "./useSiteHeaderController.js";
import { useStorageMenuController } from "./useStorageMenuController.js";

export default function SiteHeader(props) {
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

  return (
    <header className="px-3 py-1.5 sm:px-4 sm:py-3 bg-gray-800 text-white grid grid-cols-[1fr_auto_1fr] items-center">
      <div className="justify-self-start">
        <SiteHeaderTitleButton onNavigateHome={navigateHome} />
      </div>
      <div className="justify-self-center">
        <SiteHeaderNavigation items={navItems} onNavigate={navigateTo} />
      </div>
      <div className="justify-self-end">
        <SiteHeaderUserMenu
          username={username}
          menuOpen={menuOpen}
          onToggleMenu={toggleMenu}
          onNavigateHome={navigateHome}
          onLogout={logout}
          homeActive={homeActive}
          storageMenu={storageMenu}
        />
      </div>
    </header>
  );
}
