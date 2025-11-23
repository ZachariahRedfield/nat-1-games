import { useCallback, useEffect, useState } from "react";

export function useLoginFormState(getSession) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Player");
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const session = getSession?.();
    if (!session) return;
    if (session.role) {
      setRole(session.role);
    }
    if (session.username) {
      setUsername(session.username);
    }
  }, [getSession]);

  const clearFeedback = useCallback(() => setFeedback(null), []);

  const updateUsername = useCallback(
    (value) => {
      setUsername(value);
      clearFeedback();
    },
    [clearFeedback]
  );

  const updatePassword = useCallback(
    (value) => {
      setPassword(value);
      clearFeedback();
    },
    [clearFeedback]
  );

  const updateRole = useCallback(
    (value) => {
      setRole(value);
      clearFeedback();
    },
    [clearFeedback]
  );

  const changeMode = useCallback(
    (nextMode) => {
      setMode(nextMode === "signup" ? "signup" : "login");
      clearFeedback();
    },
    [clearFeedback]
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
    },
    helpers: {
      setUsername,
      setPassword,
      setRole,
      setMode,
      setFeedback,
      setLoading,
    },
  };
}
