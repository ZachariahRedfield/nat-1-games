import React from "react";
import AppButton from "../../../shared/ui/button/AppButton.jsx";

export function AuthSubmitButton({ mode, loading }) {
  const label = loading ? "Please wait…" : mode === "signup" ? "Create Account" : "Login";
  return (
    <AppButton type="submit" disabled={loading} block tone="primary" size="large">
      {label}
    </AppButton>
  );
}
