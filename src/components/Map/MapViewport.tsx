import type { AppSession } from "../../app/routes/Root";

type MapViewportProps = {
  session: AppSession | null;
};

export default function MapViewport({ session }: MapViewportProps) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-950 text-slate-400">
      <div className="rounded border border-slate-800 bg-slate-900/70 px-6 py-4 text-center shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Viewport</p>
        <p className="mt-3 text-lg font-medium text-slate-200">Interactive map rendering coming soon.</p>
        {session?.username && (
          <p className="mt-2 text-xs text-slate-400">Signed in as {session.username}</p>
        )}
      </div>
    </div>
  );
}
