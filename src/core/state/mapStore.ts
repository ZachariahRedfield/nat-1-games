import { create } from "zustand";
import { Command, CommandType } from "../command/types";

interface CommandLogState {
  history: Command<CommandType>[];
  append: (entry: Command<CommandType>) => void;
  clear: () => void;
}

export const useCommandLogStore = create<CommandLogState>((set) => ({
  history: [],
  append: (entry) =>
    set((state) => ({ history: [...state.history.slice(-49), entry] })),
  clear: () => set({ history: [] }),
}));
