export type EventHandler<TPayload = unknown> = (payload: TPayload) => void;

export class EventBus {
  private listeners = new Map<string, Set<EventHandler<unknown>>>();

  on<TPayload = unknown>(event: string, handler: EventHandler<TPayload>): () => void {
    const handlers = this.listeners.get(event) ?? new Set();
    handlers.add(handler as EventHandler<unknown>);
    this.listeners.set(event, handlers);
    return () => this.off(event, handler);
  }

  off<TPayload = unknown>(event: string, handler: EventHandler<TPayload>) {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    handlers.delete(handler as EventHandler<unknown>);
    if (handlers.size === 0) {
      this.listeners.delete(event);
    }
  }

  emit<TPayload = unknown>(event: string, payload: TPayload): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    handlers.forEach((handler) => handler(payload));
  }

  reset(event?: string) {
    if (event) {
      this.listeners.delete(event);
      return;
    }
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
