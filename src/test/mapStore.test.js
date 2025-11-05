import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createMapStore, useMapStore } from "../state/mapStore";

const createStore = () => {
  const store = createMapStore({ rows: 2, cols: 2, fill: 0 });
  return store;
};

describe("map store", () => {
  let store;
  beforeEach(() => {
    store = createStore();
  });

  afterEach(() => {
    store?.destroy?.();
    useMapStore.getState().reset();
  });

  it("updates the active layer and ignores invalid entries", () => {
    const api = store.getState();
    api.setActiveLayer("base");
    expect(store.getState().activeLayer).toBe("base");
    api.setActiveLayer("unknown");
    expect(store.getState().activeLayer).toBe("background");
  });

  it("applies tile mutations immutably", () => {
    const { applyTile } = store.getState();
    applyTile("background", 0, 0, 42);
    const maps = store.getState().maps;
    expect(maps.background[0][0]).toBe(42);
    expect(maps.background[0][1]).toBe(0);
  });

  it("tracks history for undo and redo", () => {
    const { applyTile, commit, undo, redo } = store.getState();
    applyTile("background", 0, 0, 1);
    commit();
    applyTile("background", 0, 0, 2);
    commit();

    undo();
    expect(store.getState().maps.background[0][0]).toBe(1);

    redo();
    expect(store.getState().maps.background[0][0]).toBe(2);
  });

  it("resets to the initial state", () => {
    const { applyTile, reset } = store.getState();
    applyTile("background", 1, 1, 7);
    reset();
    expect(store.getState().maps.background[1][1]).toBe(0);
    expect(store.getState().history).toHaveLength(0);
  });

  it("exposes reactive selectors to React components", () => {
    const { result, unmount } = renderHook(() => useMapStore((state) => state.activeLayer));

    expect(result.current).toBe("background");

    act(() => {
      useMapStore.getState().setActiveLayer("sky");
    });

    expect(result.current).toBe("sky");

    act(() => {
      useMapStore.getState().reset();
    });

    expect(result.current).toBe("background");
    unmount();
  });
});
