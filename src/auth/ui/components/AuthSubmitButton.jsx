import React from "react";

export function AuthSubmitButton({ mode, loading }) {
  const label = loading ? "Please wait…" : mode === "signup" ? "Create Account" : "Login";
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full px-3 py-2 bg-green-700 hover:bg-green-600 rounded disabled:opacity-60"
    >
      {label}
    </button>
  );
}
