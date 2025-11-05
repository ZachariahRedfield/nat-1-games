import React from "react";
import SiteHeader from "../../../components/common/SiteHeader";

export default function StartSession({ goBack, session, onLogout, onNavigate, currentScreen }) {
  return (
    <div className="w-full h-full flex flex-col">
      <SiteHeader session={session} onLogout={onLogout} onNavigate={onNavigate} currentScreen={currentScreen || 'startSession'} />
      
      <main className="flex-1 flex items-center justify-center">
        <p className="text-gray-400">[Session setup will go here]</p>
      </main>
    </div>
  );
}
