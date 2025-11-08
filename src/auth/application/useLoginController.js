import { useCallback, useEffect, useState } from "react";

export function useLoginController({
  login,
  signup,
  getSession,
  setSession,
  supabase,
  onLoggedIn,
}) {
  const [username, setUsernameState] = useState("");
  const [password, setPasswordState] = useState("");
  const [role, setRoleState] = useState("Player");
  const [mode, setModeState] = useState("login");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const session = getSession?.();
    if (session?.role) {
      setRoleState(session.role);
    }
    if (session?.username) {
      setUsernameState(session.username);
    }
  }, [getSession]);

  const updateUsername = useCallback((value) => {
    setUsernameState(value);
    setFeedback(null);
  }, []);

  const updatePassword = useCallback((value) => {
    setPasswordState(value);
    setFeedback(null);
  }, []);

  const updateRole = useCallback((value) => {
    setRoleState(value);
    setFeedback(null);
  }, []);

  const changeMode = useCallback((nextMode) => {
    setModeState(nextMode === "signup" ? "signup" : "login");
    setFeedback(null);
  }, []);

  const submit = useCallback(
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
          await signup?.(trimmedUsername, rawPassword, role);
          setModeState("login");
          setFeedback({ type: "info", message: "Account created. Please log in." });
          return;
        }

        const data = await login?.(trimmedUsername, rawPassword);
        if (!data) {
          throw new Error("Login failed");
        }

        try {
          if (data.userId && supabase) {
            await supabase.from("profiles").update({ role }).eq("id", data.userId);
          }
        } catch (err) {
          console.warn("Failed to update profile role", err);
        }

        const resolvedUsername = data.username || trimmedUsername;
        setUsernameState(resolvedUsername);
        const session = { username: resolvedUsername, role, userId: data.userId };
        setSession?.(session);
        setFeedback(null);
        setPasswordState("");
        onLoggedIn?.(session);
      } catch (err) {
        setFeedback({ type: "error", message: err?.message || "Request failed" });
      } finally {
        setLoading(false);
      }
    },
    [login, signup, username, password, role, mode, supabase, setSession, onLoggedIn]
  );

  return {
    state: {
      username,
      password,
      role,
      mode,
      loading,
      feedback,
    },
    actions: {
      updateUsername,
      updatePassword,
      updateRole,
      changeMode,
      submit,
    },
  };
}
