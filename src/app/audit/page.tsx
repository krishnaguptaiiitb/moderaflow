import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AuditPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-8 py-10">
        <Link
          href="/"
          className="text-sm text-slate-500 hover:text-slate-300"
        >
          ← Dashboard
        </Link>

        <div className="mt-6">
          <p className="text-sm font-medium tracking-wide text-indigo-400">
            AUDIT TRAIL
          </p>

          <h1 className="mt-2 text-3xl font-semibold">
            Moderation activity
          </h1>

          <p className="mt-2 max-w-2xl text-slate-400">
            A chronological record of moderation and appeal actions taken by
            human reviewers.
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-5">
            <h2 className="font-semibold">Activity Log</h2>

            <p className="mt-1 text-sm text-slate-500">
              {logs.length} recorded event{logs.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="divide-y divide-slate-800">
            {logs.map((log) => (
              <div
                key={log.id}
                className="px-6 py-5"
              >
                <div className="flex items-start justify-between gap-8">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-400">
                        {log.entityType}
                      </span>

                      <span className="text-sm font-medium text-slate-200">
                        {log.action.replaceAll("_", " ")}
                      </span>
                    </div>

                    {log.details && (
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {log.details}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-slate-600">
                      Entity: {log.entityId}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm text-slate-400">
                      {log.actorName ?? "System"}
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      {log.createdAt.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {logs.length === 0 && (
              <div className="px-6 py-16 text-center">
                <p className="font-medium">No activity recorded</p>

                <p className="mt-2 text-sm text-slate-500">
                  Moderation actions will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}