import { useCallback, useRef, useState } from "react";
import { dismissToast, notifyToast } from "../../../../../shared/infrastructure/notifications/toastStore.js";
import { useToastStore } from "../../../../../shared/ui/notifications/useToastStore.js";

export function useFeedbackState() {
  const toasts = useToastStore();

  const handleDismissToast = useCallback((id) => {
    dismissToast(id);
  }, []);

  const showToast = useCallback((text, kind = "info", ttl = 2500) => {
    notifyToast(text, kind, ttl);
  }, []);

  const promptResolverRef = useRef(null);
  const [promptState, setPromptState] = useState(null);
  const promptInputRef = useRef(null);

  const requestPrompt = useCallback((title, defaultValue = "") => {
    return new Promise((resolve) => {
      promptResolverRef.current = resolve;
      setPromptState({
        title,
        defaultValue: defaultValue ?? "",
      });
    });
  }, []);

  const submitPrompt = useCallback((value) => {
    const resolver = promptResolverRef.current;
    promptResolverRef.current = null;
    if (resolver) {
      resolver(value);
    }
    setPromptState(null);
  }, []);

  const cancelPrompt = useCallback(() => {
    const resolver = promptResolverRef.current;
    promptResolverRef.current = null;
    if (resolver) {
      resolver(null);
    }
    setPromptState(null);
  }, []);

  const confirmResolverRef = useRef(null);
  const [confirmState, setConfirmState] = useState(null);

  const requestConfirm = useCallback((message, { title = "Confirm", okText = "OK", cancelText = "Cancel" } = {}) => {
    return new Promise((resolve) => {
      confirmResolverRef.current = resolve;
      setConfirmState({
        message,
        title,
        okText,
        cancelText,
      });
    });
  }, []);

  const respondToConfirm = useCallback((choice) => {
    const resolver = confirmResolverRef.current;
    confirmResolverRef.current = null;
    if (resolver) {
      resolver(Boolean(choice));
    }
    setConfirmState(null);
  }, []);

  const cancelConfirm = useCallback(() => {
    respondToConfirm(false);
  }, [respondToConfirm]);

  const approveConfirm = useCallback(() => {
    respondToConfirm(true);
  }, [respondToConfirm]);

  return {
    toasts,
    showToast,
    dismissToast: handleDismissToast,
    promptState,
    promptInputRef,
    requestPrompt,
    submitPrompt,
    cancelPrompt,
    confirmState,
    requestConfirm,
    approveConfirm,
    cancelConfirm,
  };
}
