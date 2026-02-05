const listeners = new Set();
let toasts = [];
let nextToastId = 1;

function emit() {
  listeners.forEach((listener) => listener(toasts));
}

export function getToasts() {
  return toasts;
}

export function subscribeToToasts(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function dismissToast(id) {
  if (!id) return;
  toasts = toasts.filter((toast) => toast.id !== id);
  emit();
}

export function notifyToast(text, kind = "info", ttl = 2500) {
  const id = nextToastId++;
  toasts = [...toasts, { id, text, kind }];
  emit();
  setTimeout(() => dismissToast(id), ttl);
  return id;
}

export function notifySuccess(text, ttl) {
  return notifyToast(text, "success", ttl);
}

export function notifyWarning(text, ttl) {
  return notifyToast(text, "warning", ttl);
}

export function notifyError(text, ttl) {
  return notifyToast(text, "error", ttl);
}

export function notifyInfo(text, ttl) {
  return notifyToast(text, "info", ttl);
}
