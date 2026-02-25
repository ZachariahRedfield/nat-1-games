import React from "react";
import AppButton from "../../../shared/ui/button/AppButton.jsx";

export function AuthLayout({ title, goBack, children }) {
  return (
    <div className="w-full h-full flex flex-col">
      <header className="p-4 bg-gray-800 flex justify-between items-center">
        <h2 className="text-xl font-bold">{title}</h2>
        {goBack ? (
          <AppButton type="button" tone="neutral" size="compact" onClick={goBack}>
            Back
          </AppButton>
        ) : (
          <span />
        )}
      </header>
      <main className="flex-1 flex items-center justify-center p-6 bg-gray-900">
        {children}
      </main>
    </div>
  );
}
