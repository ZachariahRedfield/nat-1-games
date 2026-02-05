import React from "react";
import {
  getSession,
  setSession,
  login as apiLogin,
  signup as apiSignup,
} from "../services/authService.js";
import { useLoginController } from "../application/useLoginController.js";
import {
  AuthLayout,
  AuthModeToggle,
  AuthCredentialsFields,
  AuthRoleSelect,
  AuthFeedback,
  AuthSubmitButton,
} from "./components/index.js";

export default function LoginScreen({ onLoggedIn, goBack }) {
  const { state, actions } = useLoginController({
    login: apiLogin,
    signup: apiSignup,
    getSession,
    setSession,
    onLoggedIn,
  });

  return (
    <AuthLayout title="Login" goBack={goBack}>
      <form
        onSubmit={actions.submit}
        className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded p-4 space-y-3 text-white"
      >
        <AuthModeToggle mode={state.mode} onChange={actions.changeMode} />
        <AuthCredentialsFields
          username={state.username}
          password={state.password}
          onUsernameChange={actions.updateUsername}
          onPasswordChange={actions.updatePassword}
        />
        {state.mode === "login" && <AuthRoleSelect role={state.role} onChange={actions.updateRole} />}
        <AuthFeedback feedback={state.feedback} />
        <AuthSubmitButton mode={state.mode} loading={state.loading} />
      </form>
    </AuthLayout>
  );
}
