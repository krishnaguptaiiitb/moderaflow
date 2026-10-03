export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-8 py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-4 w-32 rounded bg-slate-800" />
          <div className="h-10 w-64 rounded bg-slate-800" />

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="h-72 rounded-xl bg-slate-900" />
            <div className="h-72 rounded-xl bg-slate-900" />
          </div>
        </div>
      </div>
    </main>
  );
}