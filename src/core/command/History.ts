import { CommandType, HistoryEvent, HistorySnapshot } from "./types";

type Snapshot = HistorySnapshot<CommandType>;

type Listener = (event: HistoryEvent) => void;

export default class History {
  private undoStack: Snapshot[] = [];
  private redoStack: Snapshot[] = [];
  private listeners = new Set<Listener>();

  push(entry: Snapshot) {
    this.undoStack.push(entry);
    this.redoStack = [];
    this.emit({ kind: "push", entry, undoCount: this.undoStack.length, redoCount: this.redoStack.length });
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  undo() {
    const entry = this.undoStack.pop();
    if (!entry) return false;
    try {
      entry.undo();
    } finally {
      this.redoStack.push(entry);
      this.emit({ kind: "undo", entry, undoCount: this.undoStack.length, redoCount: this.redoStack.length });
    }
    return true;
  }

  redo() {
    const entry = this.redoStack.pop();
    if (!entry) return false;
    try {
      entry.redo();
    } finally {
      this.undoStack.push(entry);
      this.emit({ kind: "redo", entry, undoCount: this.undoStack.length, redoCount: this.redoStack.length });
    }
    return true;
  }

  clear() {
    if (!this.undoStack.length && !this.redoStack.length) return;
    this.undoStack = [];
    this.redoStack = [];
    this.emit({ kind: "clear", undoCount: 0, redoCount: 0 });
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener({ kind: "push", undoCount: this.undoStack.length, redoCount: this.redoStack.length });
    return () => this.listeners.delete(listener);
  }

  private emit(event: HistoryEvent) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
