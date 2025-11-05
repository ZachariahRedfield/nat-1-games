import { useEffect, useRef, type DependencyList } from "react";

export interface ChunkingOptions<T> {
  chunkSize?: number;
  dependencies?: DependencyList;
  onComplete?: () => void;
  resetOnChange?: boolean;
  scheduler?: (task: () => void) => number;
  cancelScheduler?: (id: number) => void;
  transform?: (item: T, index: number) => T;
}

const defaultScheduler = (task: () => void) => requestAnimationFrame(task);
const defaultCancel = (id: number) => cancelAnimationFrame(id);

export function useChunkedProcessing<T>(
  items: T[],
  callback: (item: T, index: number) => void,
  options: ChunkingOptions<T> = {}
) {
  const {
    chunkSize = 128,
    dependencies = [items],
    onComplete,
    resetOnChange = true,
    scheduler = defaultScheduler,
    cancelScheduler = defaultCancel,
    transform,
  } = options;
  const indexRef = useRef(0);

  useEffect(() => {
    if (resetOnChange) {
      indexRef.current = 0;
    }

    let frame = 0;
    const total = items.length;

    const run = () => {
      const sliceSize = Math.max(1, chunkSize);
      let processed = 0;
      while (indexRef.current < total && processed < sliceSize) {
        const currentIndex = indexRef.current;
        const item = transform ? transform(items[currentIndex], currentIndex) : items[currentIndex];
        callback(item, currentIndex);
        indexRef.current += 1;
        processed += 1;
      }

      if (indexRef.current < total) {
        frame = scheduler(run);
      } else if (onComplete) {
        onComplete();
      }
    };

    run();
    return () => {
      if (frame) {
        cancelScheduler(frame);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}
