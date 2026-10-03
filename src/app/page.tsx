import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [pendingCount, appealCount, activePolicy, recentContent] =
    await Promise.all([
      prisma.content.count({
        where: {
          status: {
            in: ["PENDING", "NEEDS_REVIEW"],
          },
        },
      }),
      prisma.appeal.count({
        where: {
          status: "PENDING",
        },
      }),
      prisma.policyVersion.findFirst({
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          policy: true,
        },
      }),
      prisma.content.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        include: {
          decisions: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
      }),
    ]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-8 py-10">
        <div className="mb-10">
          <p className="text-sm font-medium tracking-wide text-indigo-400">
            MODERAFLOW
          </p>

          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            Content Moderation Workbench
          </h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            Review flagged content, inspect AI findings, manage appeals, and
            preserve every moderation decision with a complete audit trail.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Pending Review</p>
            <p className="mt-2 text-3xl font-semibold">{pendingCount}</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Open Appeals</p>
            <p className="mt-2 text-3xl font-semibold">{appealCount}</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Active Policy</p>

            <p className="mt-2 text-3xl font-semibold">
              {activePolicy?.version ?? "—"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {activePolicy?.policy.name ?? "No active policy"}
            </p>
          </div>
        </div>

        <section className="mt-10 rounded-xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-5">
            <h2 className="text-lg font-semibold">Recent Content</h2>

            <p className="mt-1 text-sm text-slate-400">
              Latest content entering the moderation workflow.
            </p>
          </div>

          <div className="divide-y divide-slate-800">
            {recentContent.map((content) => {
              const decision = content.decisions[0];

              return (
                <div
                  key={content.id}
                  className="flex items-center justify-between gap-6 px-6 py-5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-400">
                        {content.type}
                      </span>

                      <span className="text-xs text-slate-500">
                        {content.authorName ?? "Unknown author"}
                      </span>
                    </div>

                    <p className="mt-2 truncate text-sm text-slate-200">
                      {content.text}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs">
                      {content.status.replace("_", " ")}
                    </span>

                    {decision?.recommendedAction && (
                      <p className="mt-2 text-xs text-slate-500">
                        AI: {decision.recommendedAction}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}