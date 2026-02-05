import { useLoginFormState } from "./login/useLoginFormState.js";
import { useLoginSubmission } from "./login/useLoginSubmission.js";

export function useLoginController({ login, signup, getSession, setSession, onLoggedIn }) {
  const { state, actions, helpers } = useLoginFormState(getSession);

  const submit = useLoginSubmission({
    login,
    signup,
    setSession,
    onLoggedIn,
    formState: state,
    formHelpers: helpers,
  });

  return {
    state,
    actions: {
      ...actions,
      submit,
    },
  };
}
