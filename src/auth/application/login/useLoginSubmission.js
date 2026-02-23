import { useCallback } from "react";

export function useLoginSubmission({
  login,
  signup,
  setSession,
  onLoggedIn,
  formState,
  formHelpers,
}) {
  const { username, password, role, mode } = formState;
  const { setFeedback, setLoading, setMode, setPassword, setUsername } = formHelpers;

  return useCallback(
    async (event) => {
      event?.preventDefault?.();
      setFeedback(null);
      setLoading(true);

      try {
        const trimmedUsername = username.trim();
        const rawPassword = password;

        if (!trimmedUsername || !rawPassword) {
          throw new Error("Username and password required");
        }

        if (mode === "signup") {
          if (!role) {
            throw new Error("Role is required for sign up");
          }
          const signupResult = await signup?.(trimmedUsername, rawPassword, role);
          if (!signupResult?.ok) {
            throw new Error(signupResult?.error || "Signup failed");
          }
          setMode("login");
          setFeedback({ type: "info", message: "Account created. Please log in." });
          return;
        }

        const loginResult = await login?.(trimmedUsername, rawPassword);
        if (!loginResult?.ok) {
          throw new Error(loginResult?.error || "Login failed");
        }

        const data = loginResult.data;
        if (!data) {
          throw new Error("Login failed");
        }

        const resolvedUsername = data.username || trimmedUsername;
        const resolvedRole = data.role || "Player";
        setUsername(resolvedUsername);
        const session = { username: resolvedUsername, role: resolvedRole, userId: data.userId };
        setSession?.(session);
        setFeedback(null);
        setPassword("");
        onLoggedIn?.(session);
      } catch (err) {
        setFeedback({ type: "error", message: err?.message || "Request failed" });
      } finally {
        setLoading(false);
      }
    },
    [
      login,
      signup,
      username,
      password,
      role,
      mode,
      setSession,
      onLoggedIn,
      setFeedback,
      setLoading,
      setMode,
      setPassword,
      setUsername,
    ]
  );
}
