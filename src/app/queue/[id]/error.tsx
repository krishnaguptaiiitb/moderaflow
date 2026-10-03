"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-xl px-8 py-20">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
          <p className="text-sm font-medium text-red-400">
            REVIEW ERROR
          </p>

          <h1 className="mt-2 text-xl font-semibold">
            This review could not be completed
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            The moderation workflow encountered an error. No automatic
            moderation decision was applied.
          </p>

          <button
            onClick={() => reset()}
            className="mt-5 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
          >
            Try again
          </button>
        </div>
      </div>
    </main>
  );
}