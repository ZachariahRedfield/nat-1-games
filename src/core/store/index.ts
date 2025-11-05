import { useSyncExternalStore } from "react";

export type StateListener<TState> = (state: TState, prevState: TState) => void;

export interface StoreApi<TState> {
  getState: () => TState;
  setState: (
    partial: Partial<TState> | ((state: TState) => Partial<TState>),
    replace?: boolean
  ) => void;
  subscribe: (listener: StateListener<TState>) => () => void;
}

export type StateCreator<TState> = (
  set: StoreApi<TState>["setState"],
  get: StoreApi<TState>["getState"]
) => TState;

export function createStore<TState>(initializer: StateCreator<TState>): StoreApi<TState> {
  let state: TState;
  const listeners = new Set<StateListener<TState>>();

  const getState = () => state;

  const setState: StoreApi<TState>["setState"] = (partial, replace = false) => {
    const prev = state;
    const nextPartial = typeof partial === "function" ? (partial as (state: TState) => Partial<TState>)(state) : partial;
    state = replace ? (nextPartial as TState) : { ...state, ...nextPartial };
    listeners.forEach((listener) => listener(state, prev));
  };

  state = initializer(setState, getState);

  const subscribe: StoreApi<TState>["subscribe"] = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return { getState, setState, subscribe };
}

export function useStore<TState, TSlice>(store: StoreApi<TState>, selector: (state: TState) => TSlice): TSlice {
  return useSyncExternalStore(
    (listener) => store.subscribe(() => listener()),
    () => selector(store.getState()),
    () => selector(store.getState())
  );
}
