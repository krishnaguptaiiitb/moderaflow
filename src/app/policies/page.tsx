import { prisma } from "@/lib/prisma";
import {
  activatePolicyVersion,
  createPolicyVersion,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function PoliciesPage() {
  const policies = await prisma.policy.findMany({
    include: {
      versions: {
        include: {
          clauses: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-8 py-10">
        <div>
          <p className="text-sm font-medium tracking-wide text-indigo-400">
            POLICY MANAGEMENT
          </p>

          <h1 className="mt-2 text-3xl font-semibold">
            Moderation Policies
          </h1>

          <p className="mt-2 text-slate-400">
            Review policy versions and the clauses used by moderation
            decisions.
          </p>
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="font-semibold">Create Policy Version</h2>

            <form action={createPolicyVersion} className="mt-4 grid gap-4 md:grid-cols-3">
                <input
                type="hidden"
                name="policyId"
                value={policies[0]?.id ?? ""}
                />

                <input
                name="version"
                required
                placeholder="Version e.g. 2.2"
                className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-500"
                />

                <input
                name="description"
                placeholder="Version description"
                className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-500"
                />

                <button
                type="submit"
                disabled={!policies[0]}
                className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-300 transition hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                Create Version
                </button>
            </form>
            </div>
        </div>

        <div className="mt-8 space-y-6">
          {policies.map((policy) => (
            <section
              key={policy.id}
              className="rounded-xl border border-slate-800 bg-slate-900 p-6"
            >
              <div>
                <h2 className="text-xl font-semibold">
                  {policy.name}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {policy.description}
                </p>
              </div>

              <div className="mt-6 space-y-4">
                {policy.versions.map((version) => (
                  <div
                    key={version.id}
                    className="rounded-lg border border-slate-800 bg-slate-950 p-5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-slate-200">
                          Version {version.version}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Created{" "}
                          {version.createdAt.toLocaleDateString()}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          version.isActive
                            ? "bg-emerald-400/10 text-emerald-300"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {version.isActive ? "ACTIVE" : "ARCHIVED"}
                      </span>
                        {!version.isActive && (
                        <form action={activatePolicyVersion}>
                            <input
                            type="hidden"
                            name="policyVersionId"
                            value={version.id}
                            />

                            <button
                            type="submit"
                            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300 transition hover:bg-amber-500/20"
                            >
                            Activate
                            </button>
                        </form>
                        )}
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      {version.clauses.map((clause) => (
                        <div
                          key={clause.id}
                          className="rounded-lg border border-slate-800 bg-slate-900 p-4"
                        >
                          <p className="text-sm font-medium text-indigo-300">
                            {clause.code}
                          </p>

                          <p className="mt-1 text-sm font-medium text-slate-200">
                            {clause.title}
                          </p>

                          <p className="mt-2 text-xs leading-5 text-slate-500">
                            {clause.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {policies.length === 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-sm text-slate-500">
              No moderation policies found.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}