import React from "react";

export function AuthLayout({ title, goBack, children }) {
  return (
    <div className="w-full h-full flex flex-col">
      <header className="p-4 bg-gray-800 flex justify-between items-center">
        <h2 className="text-xl font-bold">{title}</h2>
        {goBack ? (
          <button
            type="button"
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            onClick={goBack}
          >
            Back
          </button>
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
