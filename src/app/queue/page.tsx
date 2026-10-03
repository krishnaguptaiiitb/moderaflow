import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ModerationQueue() {
  const items = await prisma.content.findMany({
    where: {
      status: {
        in: ["PENDING", "NEEDS_REVIEW"],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      reports: true,
      decisions: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        include: {
          findings: true,
          policyVersion: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-8 py-10">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-slate-500 hover:text-slate-300"
          >
            ← Dashboard
          </Link>

          <div className="mt-5">
            <p className="text-sm font-medium tracking-wide text-indigo-400">
              MODERATION QUEUE
            </p>

            <h1 className="mt-2 text-3xl font-semibold">
              Content requiring review
            </h1>

            <p className="mt-2 text-slate-400">
              Review deterministic checks, AI findings, policy evidence, and
              recommended actions before making a moderation decision.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Review Queue</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {items.length} item{items.length === 1 ? "" : "s"} waiting
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-800">
            {items.map((item) => {
              const decision = item.decisions[0];

              return (
                <Link
                  key={item.id}
                  href={`/queue/${item.id}`}
                  className="block px-6 py-5 transition hover:bg-slate-800/40"
                >
                  <div className="flex items-start justify-between gap-8">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-400">
                          {item.type}
                        </span>

                        <span className="text-xs text-slate-500">
                          {item.authorName ?? "Unknown author"}
                        </span>

                        {item.reports.length > 0 && (
                          <span className="text-xs text-amber-400">
                            {item.reports.length} report
                            {item.reports.length === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-200">
                        {item.text}
                      </p>
                    </div>

                    <div className="w-44 shrink-0 text-right">
                      <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs text-amber-300">
                        {item.status.replace("_", " ")}
                      </span>

                      {decision && (
                        <>
                          <p className="mt-3 text-xs text-slate-500">
                            Policy {decision.policyVersion.version}
                          </p>

                          <p className="mt-1 text-xs text-indigo-400">
                            AI recommends{" "}
                            {decision.recommendedAction ?? "review"}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}

            {items.length === 0 && (
              <div className="px-6 py-16 text-center">
                <p className="font-medium">Queue is clear</p>
                <p className="mt-2 text-sm text-slate-500">
                  No content currently requires moderation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}