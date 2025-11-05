import { useMemo } from "react";
import LayerList from "../../features/map/components/LayerList";
import MapViewport from "../../features/map/components/MapViewport";
import { createMapStore, type MapStoreApi } from "../../features/map/services/layers";

interface RootProps {
  store?: MapStoreApi;
  onBack?: () => void;
}

export default function Root({ store: providedStore, onBack }: RootProps) {
  const store = useMemo(() => providedStore ?? createMapStore(), [providedStore]);

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100">
      <aside className="flex w-72 flex-col gap-6 border-r border-slate-900/60 bg-slate-900/40 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-wide">Layer Stack</h1>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="rounded-md border border-slate-700 px-2 py-1 text-xs uppercase tracking-wide text-slate-300 hover:border-slate-500"
            >
              Back
            </button>
          ) : null}
        </div>
        <LayerList store={store} />
      </aside>
      <main className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-900/60 bg-slate-900/50 px-6 py-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-slate-300">Viewport</p>
            <p className="text-xs text-slate-500">Chunked rendering keeps large maps responsive.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Tiles</span>
            <div className="rounded border border-slate-800 px-2 py-1">32px</div>
          </div>
        </header>
        <section className="flex flex-1 gap-6 overflow-hidden p-6">
          <div className="flex flex-1 items-center justify-center overflow-hidden rounded-xl border border-slate-900/70 bg-slate-950/80 p-4 shadow-lg shadow-slate-950/30">
            <div className="aspect-square w-full max-w-4xl">
              <MapViewport store={store} />
            </div>
          </div>
          <aside className="w-80 rounded-xl border border-slate-900/70 bg-slate-900/30 p-4">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-300">Inspector</h2>
            <p className="text-sm text-slate-400">
              Select tiles or layers to edit their properties. This panel is a placeholder for the
              upcoming editor forms.
            </p>
          </aside>
        </section>
      </main>
    </div>
  );
}
