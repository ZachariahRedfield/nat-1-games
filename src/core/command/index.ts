export type CommandHandler<TPayload = unknown> = (payload: TPayload) => void | Promise<void>;

interface CommandRegistration<TPayload = unknown> {
  command: string;
  handler: CommandHandler<TPayload>;
}

export class CommandBus {
  private readonly registry = new Map<string, Set<CommandHandler<unknown>>>();

  register<TPayload = unknown>({ command, handler }: CommandRegistration<TPayload>): () => void {
    const handlers = this.registry.get(command) ?? new Set();
    handlers.add(handler as CommandHandler<unknown>);
    this.registry.set(command, handlers);

    return () => {
      const current = this.registry.get(command);
      if (!current) return;
      current.delete(handler as CommandHandler<unknown>);
      if (current.size === 0) {
        this.registry.delete(command);
      }
    };
  }

  once<TPayload = unknown>({ command, handler }: CommandRegistration<TPayload>): () => void {
    const unsubscribe = this.register({
      command,
      handler: (payload: TPayload) => {
        unsubscribe();
        return handler(payload);
      },
    });
    return unsubscribe;
  }

  async dispatch<TPayload = unknown>(command: string, payload: TPayload): Promise<void> {
    const handlers = this.registry.get(command);
    if (!handlers || handlers.size === 0) return;

    await Promise.all([...handlers].map((handler) => handler(payload)));
  }

  clear(command?: string) {
    if (command) {
      this.registry.delete(command);
      return;
    }
    this.registry.clear();
  }
}

export const commandBus = new CommandBus();
