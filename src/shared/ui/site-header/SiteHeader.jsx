import React from "react";
import SiteHeaderNavigation from "./SiteHeaderNavigation.jsx";
import SiteHeaderTitleButton from "./SiteHeaderTitleButton.jsx";
import SiteHeaderUserMenu from "./SiteHeaderUserMenu.jsx";
import { useSiteHeaderController } from "./useSiteHeaderController.js";

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

  return (
    <header className="px-4 py-3 bg-gray-800 text-white grid grid-cols-[1fr_auto_1fr] items-center">
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
        />
      </div>
    </header>
  );
}
