const ensureCommand = (command) => {
  if (!command || typeof command.type !== "string" || !command.type.trim()) {
    throw new Error("Command must include a non-empty `type` string.");
  }
  return { ...command, type: command.type.trim() };
};

const cloneCommand = (command) => ({
  type: command.type,
  payload: command.payload,
  meta: command.meta ?? {},
});

export class CommandBus {
  constructor({ onError } = {}) {
    this.handlers = new Map();
    this.middlewares = [];
    this.onError = typeof onError === "function" ? onError : null;
  }

  register(type, handler) {
    if (typeof handler !== "function") {
      throw new Error("Command handler must be a function.");
    }
    const key = String(type || "").trim();
    if (!key) {
      throw new Error("Command type must be a non-empty string.");
    }
    if (this.handlers.has(key)) {
      throw new Error(`Handler already registered for command type \"${key}\".`);
    }
    this.handlers.set(key, handler);
    return () => {
      if (this.handlers.get(key) === handler) {
        this.handlers.delete(key);
      }
    };
  }

  unregister(type) {
    const key = String(type || "").trim();
    this.handlers.delete(key);
  }

  use(middleware) {
    if (typeof middleware !== "function") {
      throw new Error("Middleware must be a function.");
    }
    this.middlewares.push(middleware);
    return () => {
      const idx = this.middlewares.indexOf(middleware);
      if (idx >= 0) this.middlewares.splice(idx, 1);
    };
  }

  clear() {
    this.handlers.clear();
    this.middlewares.length = 0;
  }

  async dispatch(rawCommand) {
    const command = ensureCommand(rawCommand);
    const handler = this.handlers.get(command.type);
    if (!handler) {
      const error = new Error(`No handler registered for command type \"${command.type}\".`);
      if (this.onError) {
        this.onError(error, cloneCommand(command));
        return undefined;
      }
      throw error;
    }

    const runHandler = async (cmd) => {
      const safeCommand = cloneCommand(cmd);
      return await handler(safeCommand.payload, safeCommand.meta ?? {});
    };

    const runMiddleware = async (index, cmd) => {
      if (index >= this.middlewares.length) {
        return await runHandler(cmd);
      }
      const mw = this.middlewares[index];
      return await mw(cloneCommand(cmd), async (nextCmd = cmd) =>
        runMiddleware(index + 1, nextCmd),
      );
    };

    try {
      return await runMiddleware(0, command);
    } catch (error) {
      if (this.onError) {
        this.onError(error, cloneCommand(command));
        return undefined;
      }
      throw error;
    }
  }
}

export const createCommandBus = (options) => new CommandBus(options);
