import History from "./History";
import {
  CommandPayload,
  CommandType,
  HistorySnapshot,
  commandPayloadSchemas,
  CommandHandler,
} from "./types";

export default class CommandBus {
  private handlers = new Map<CommandType, CommandHandler<any>>();

  constructor(private history: History) {}

  register<TType extends CommandType>(
    type: TType,
    handler: CommandHandler<TType>
  ) {
    this.handlers.set(type, handler as CommandHandler<any>);
    return () => {
      const current = this.handlers.get(type);
      if (current === handler) {
        this.handlers.delete(type);
      }
    };
  }

  execute<TType extends CommandType>(type: TType, payload: CommandPayload<TType>) {
    const schema = commandPayloadSchemas[type];
    const parsed = schema.parse(payload);
    const handler = this.handlers.get(type) as CommandHandler<TType> | undefined;
    if (!handler) {
      return false;
    }
    const result = handler(parsed);
    if (!result) {
      return false;
    }
    if (result.skipHistory) {
      return true;
    }
    const entry: HistorySnapshot = {
      type,
      payload: parsed,
      label: result.label,
      undo: result.undo,
      redo: result.redo,
    };
    this.history.push(entry);
    return true;
  }

  undo() {
    return this.history.undo();
  }

  redo() {
    return this.history.redo();
  }

  canUndo() {
    return this.history.canUndo();
  }

  canRedo() {
    return this.history.canRedo();
  }

  subscribe(listener: Parameters<History["subscribe"]>[0]) {
    return this.history.subscribe(listener);
  }
}
