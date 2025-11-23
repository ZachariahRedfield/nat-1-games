import { useLoginFormState } from "./login/useLoginFormState.js";
import { useLoginSubmission } from "./login/useLoginSubmission.js";

export function useLoginController({ login, signup, getSession, setSession, supabase, onLoggedIn }) {
  const { state, actions, helpers } = useLoginFormState(getSession);

  const submit = useLoginSubmission({
    login,
    signup,
    supabase,
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
