export function createFeedbackLayerProps(state) {
  return {
    toasts: state.toasts,
    promptState: state.promptState,
    confirmState: state.confirmState,
    promptInputRef: state.promptInputRef,
    onPromptSubmit: state.submitPrompt,
    onPromptCancel: state.cancelPrompt,
    onConfirmApprove: state.approveConfirm,
    onConfirmCancel: state.cancelConfirm,
  };
}
