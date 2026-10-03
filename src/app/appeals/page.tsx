import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AppealsPage() {
  const appeals = await prisma.appeal.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      content: true,
      decision: {
        include: {
          policyVersion: true,
        },
      },
    },
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
            APPEALS
          </p>

          <h1 className="mt-2 text-3xl font-semibold">
            Appeals Workbench
          </h1>

          <p className="mt-2 max-w-2xl text-slate-400">
            Review author appeals against moderation decisions while preserving
            the original decision, policy version, evidence, and final outcome.
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-5">
            <h2 className="font-semibold">Appeal Queue</h2>

            <p className="mt-1 text-sm text-slate-500">
              {appeals.length} appeal{appeals.length === 1 ? "" : "s"} recorded
            </p>
          </div>

          <div className="divide-y divide-slate-800">
            {appeals.map((appeal) => (
              <Link
                key={appeal.id}
                href={`/appeals/${appeal.id}`}
                className="block px-6 py-5 transition hover:bg-slate-800/40"
              >
                <div className="flex items-start justify-between gap-8">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-400">
                        {appeal.content.type}
                      </span>

                      <span className="text-xs text-slate-500">
                        {appeal.content.authorName ?? "Unknown author"}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          appeal.status === "PENDING"
                            ? "bg-amber-400/10 text-amber-300"
                            : appeal.status === "REVERSED"
                              ? "bg-emerald-400/10 text-emerald-300"
                              : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {appeal.status.replace("_", " ")}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-200">
                      {appeal.reason}
                    </p>

                    {appeal.evidence && (
                      <p className="mt-2 text-xs text-slate-500">
                        Evidence: {appeal.evidence}
                      </p>
                    )}
                  </div>

                  <div className="w-36 shrink-0 text-right">
                    <p className="text-xs text-slate-500">
                      Policy {appeal.decision.policyVersion.version}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      Original: {appeal.decision.status.replace("_", " ")}
                    </p>

                    <p className="mt-3 text-xs text-indigo-400">
                      Review appeal →
                    </p>
                  </div>
                </div>
              </Link>
            ))}

            {appeals.length === 0 && (
              <div className="px-6 py-16 text-center">
                <p className="font-medium">No appeals</p>
                <p className="mt-2 text-sm text-slate-500">
                  There are currently no author appeals to review.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}