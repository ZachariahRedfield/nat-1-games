import { describe, it, expect, vi } from "vitest";
import { CommandBus, createCommandBus } from "../engine/commandBus";

describe("CommandBus", () => {
  it("dispatches registered commands and returns handler result", async () => {
    const bus = createCommandBus();
    bus.register("map/update", (payload) => ({ ...payload, handled: true }));

    const result = await bus.dispatch({ type: "map/update", payload: { id: "test" } });

    expect(result).toEqual({ id: "test", handled: true });
  });

  it("runs middleware in order and allows mutation", async () => {
    const bus = new CommandBus();
    const calls = [];

    bus.use(async (command, next) => {
      calls.push(["mw1", command.type]);
      return next({ ...command, payload: { ...command.payload, step: 1 } });
    });

    bus.use((command, next) => {
      calls.push(["mw2", command.payload.step]);
      return next({ ...command, payload: { ...command.payload, step: 2 } });
    });

    const handler = vi.fn().mockImplementation((payload) => payload.step);
    bus.register("grid/apply", handler);

    const result = await bus.dispatch({ type: "grid/apply", payload: { step: 0 } });

    expect(result).toBe(2);
    expect(calls).toEqual([
      ["mw1", "grid/apply"],
      ["mw2", 1],
    ]);
    expect(handler).toHaveBeenCalledWith({ step: 2 }, {});
  });

  it("supports unregistering handlers", async () => {
    const bus = createCommandBus();
    const unregister = bus.register("map/reset", () => true);
    unregister();

    await expect(bus.dispatch({ type: "map/reset" })).rejects.toThrow(/No handler registered/);
  });

  it("propagates errors to custom handler", async () => {
    const onError = vi.fn();
    const bus = createCommandBus({ onError });
    bus.register("map/fail", () => {
      throw new Error("boom");
    });

    await bus.dispatch({ type: "map/fail" });

    expect(onError).toHaveBeenCalled();
    const [error, command] = onError.mock.calls[0];
    expect(error).toBeInstanceOf(Error);
    expect(command.type).toBe("map/fail");
  });
});
