import React from "react";
import { clearCurrentProjectDir } from "../../../application/save-load/index.js";
import LegacyMapBuilderLayout from "./layout/LegacyMapBuilderLayout.jsx";
import { useLegacyMapBuilderController } from "./useLegacyMapBuilderController.js";

export default function MapBuilder({ goBack, session, onLogout, onNavigate, currentScreen }) {
  const viewModel = useLegacyMapBuilderController();

  const onBackClick = () => {
    try {
      clearCurrentProjectDir();
    } catch (error) {
      console.warn("Failed to clear Map Builder project directory", error);
    }
    goBack?.();
  };

  return (
    <LegacyMapBuilderLayout
      {...viewModel}
      session={session}
      onLogout={onLogout}
      onNavigate={onNavigate}
      currentScreen={currentScreen}
      onBack={onBackClick}
    />
  );
}
