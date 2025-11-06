import React from "react";

function ToastList({ toasts }) {
  if (!toasts.length) return null;

  return (
    <div className="fixed top-3 right-3 z-[10050] space-y-2">
      {toasts.map((toast) => {
        const tone = toast.kind === "error"
          ? "bg-red-800/90 border-red-600 text-red-50"
          : toast.kind === "success"
            ? "bg-emerald-800/90 border-emerald-600 text-emerald-50"
            : toast.kind === "warning"
              ? "bg-amber-800/90 border-amber-600 text-amber-50"
              : "bg-gray-800/90 border-gray-600 text-gray-50";

        return (
          <div key={toast.id} className={`px-3 py-2 rounded shadow text-sm border ${tone}`}>
            {toast.text}
          </div>
        );
      })}
    </div>
  );
}

function PromptModal({ state, inputRef, onSubmit, onCancel }) {
  if (!state) return null;

  const { title, defaultValue = "" } = state;

  return (
    <div className="fixed inset-0 z-[10060] flex items-center justify-center bg-black/60">
      <div className="w-[90%] max-w-sm bg-gray-800 border border-gray-600 rounded p-4 text-gray-100">
        <div className="font-semibold mb-2">{title || "Input"}</div>
        <input
          autoFocus
          defaultValue={defaultValue || ""}
          ref={inputRef}
          className="w-full p-2 rounded text-black mb-3"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSubmit(event.currentTarget.value);
            }
          }}
        />
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 bg-gray-700 rounded" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="px-3 py-1 bg-blue-600 rounded"
            onClick={() => {
              const value = inputRef && inputRef.current
                ? inputRef.current.value
                : defaultValue || "";
              onSubmit(value);
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ state, onApprove, onCancel }) {
  if (!state) return null;

  const { title = "Confirm", message = "", okText = "OK", cancelText = "Cancel" } = state;

  return (
    <div className="fixed inset-0 z-[10060] flex items-center justify-center bg-black/60">
      <div className="w-[90%] max-w-sm bg-gray-800 border border-gray-600 rounded p-4 text-gray-100">
        <div className="font-semibold mb-2">{title}</div>
        <div className="whitespace-pre-wrap text-sm mb-3">{message}</div>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 bg-gray-700 rounded" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="px-3 py-1 bg-blue-600 rounded" onClick={onApprove}>
            {okText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FeedbackLayer({
  toasts,
  promptState,
  confirmState,
  promptInputRef,
  onPromptSubmit,
  onPromptCancel,
  onConfirmApprove,
  onConfirmCancel,
}) {
  return (
    <>
      <ToastList toasts={toasts} />
      <PromptModal
        state={promptState}
        inputRef={promptInputRef}
        onSubmit={onPromptSubmit}
        onCancel={onPromptCancel}
      />
      <ConfirmModal
        state={confirmState}
        onApprove={onConfirmApprove}
        onCancel={onConfirmCancel}
      />
    </>
  );
}
