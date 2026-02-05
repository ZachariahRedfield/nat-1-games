import { useSyncExternalStore } from "react";
import { getToasts, subscribeToToasts } from "../../infrastructure/notifications/toastStore.js";

export function useToastStore() {
  return useSyncExternalStore(subscribeToToasts, getToasts, getToasts);
}

export default useToastStore;
