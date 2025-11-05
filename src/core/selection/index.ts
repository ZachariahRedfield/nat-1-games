export type Selectable = { id: string };

export function createSelection(initialIds: string[] = []) {
  const selected = new Set(initialIds);
  return {
    has: (id: string) => selected.has(id),
    toggle: (id: string) => {
      if (selected.has(id)) {
        selected.delete(id);
      } else {
        selected.add(id);
      }
      return new Set(selected);
    },
    clear: () => {
      selected.clear();
      return new Set(selected);
    },
    replace: (ids: string[]) => {
      selected.clear();
      ids.forEach((id) => selected.add(id));
      return new Set(selected);
    },
    values: () => [...selected],
  };
}

export function toggleSelection<T extends Selectable>(items: T[], id: string) {
  return items.map((item) =>
    item.id === id
      ? { ...item, selected: !("selected" in item ? (item as T & { selected?: boolean }).selected : false) }
      : item
  );
}

export function ensureSelection<T extends Selectable>(items: T[], ids: string[]) {
  const idSet = new Set(ids);
  return items.map((item) => ({
    ...item,
    selected: idSet.has(item.id),
  }));
}
