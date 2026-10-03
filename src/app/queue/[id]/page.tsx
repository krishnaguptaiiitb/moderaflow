import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { submitModerationDecision } from "./actions";
import { analyzeModerationContent } from "./analyze-action";
import { submitAppeal } from "../../appeals/submit-action";
import { reevaluateModerationContent } from "./reevaluate-action";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReviewPage({ params }: PageProps) {
  const { id } = await params;

  const content = await prisma.content.findUnique({
    where: {
      id,
    },
    include: {
      reports: true,
      decisions: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          findings: {
            include: {
              policyClause: true,
            },
          },
          checks: true,
          agentRuns: true,
          policyVersion: {
            include: {
              policy: true,
              clauses: true,
            },
          },
        },
      },
    },
  });

  if (!content) {
    notFound();
  }

  const decision = content.decisions[0];

  const activePolicyVersion = await prisma.policyVersion.findFirst({
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const shouldReevaluate =
    Boolean(activePolicyVersion) &&
    Boolean(decision) &&
    decision?.policyVersionId !== activePolicyVersion?.id;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-8 py-10">
        <Link
          href="/queue"
          className="text-sm text-slate-500 hover:text-slate-300"
        >
          ← Moderation Queue
        </Link>

        <div className="mt-6">
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-400">
              {content.type}
            </span>

            <span className="text-sm text-slate-500">
              {content.authorName ?? "Unknown author"}
            </span>

            <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs text-amber-300">
              {content.status.replace("_", " ")}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold">Content Review</h1>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-sm font-medium text-slate-400">
                Original Content
              </h2>

              <p className="mt-4 text-lg leading-8 text-slate-100">
                {content.text}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900">
              <div className="border-b border-slate-800 px-6 py-5">
                <h2 className="font-semibold">Deterministic Checks</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Rules that ran before the AI review.
                </p>
              </div>

              <div className="divide-y divide-slate-800">
                {decision?.checks.map((check) => (
                  <div
                    key={check.id}
                    className="flex items-center justify-between px-6 py-4"
                  >
                    <div>
                      <p className="text-sm text-slate-200">{check.name}</p>

                      {check.details && (
                        <p className="mt-1 text-xs text-slate-500">
                          {check.details}
                        </p>
                      )}
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        check.status === "FLAGGED"
                          ? "bg-red-400/10 text-red-300"
                          : "bg-emerald-400/10 text-emerald-300"
                      }`}
                    >
                      {check.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900">
              <div className="border-b border-slate-800 px-6 py-5">
                <h2 className="font-semibold">User Reports</h2>
              </div>

              <div className="divide-y divide-slate-800">
                {content.reports.map((report) => (
                  <div key={report.id} className="px-6 py-4">
                    <div className="flex justify-between gap-4">
                      <p className="text-sm text-slate-300">{report.reason}</p>

                      <span className="text-xs text-slate-500">
                        {report.reporterName ?? "Anonymous"}
                      </span>
                    </div>
                  </div>
                ))}

                {content.reports.length === 0 && (
                  <p className="px-6 py-5 text-sm text-slate-500">
                    No user reports.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium tracking-wide text-indigo-400">
                    AI REVIEW
                  </p>

                  <h2 className="mt-1 text-lg font-semibold">
                    Recommended Assessment
                  </h2>

                    <form action={analyzeModerationContent} className="mt-4">
                    <input
                        type="hidden"
                        name="contentId"
                        value={content.id}
                    />

                    <button
                        type="submit"
                        className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-300 transition hover:bg-indigo-500/20"
                    >
                        Run AI Review
                    </button>
                    </form>
                                      {shouldReevaluate && (
                    <form
                      action={reevaluateModerationContent}
                      className="mt-3"
                    >
                      <input
                        type="hidden"
                        name="contentId"
                        value={content.id}
                      />

                      <button
                        type="submit"
                        className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-300 transition hover:bg-amber-500/20"
                      >
                        Re-evaluate with Policy{" "}
                        {activePolicyVersion?.version}
                      </button>
                    </form>
                  )}
                </div>

                {decision?.recommendedAction && (
                  <span className="rounded-full bg-indigo-400/10 px-3 py-1 text-xs text-indigo-300">
                    {decision.recommendedAction}
                  </span>
                )}
              </div>

                {decision && (
                <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                    <p className="text-sm font-medium text-amber-300">
                    {decision.humanReviewRequired
                        ? "Human review required"
                        : "Human review not required"}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                    AI output is advisory. A moderator must make the final decision.
                    </p>
                </div>
                )}

              <div className="mt-6 space-y-5">
                {decision?.findings.map((finding) => (
                  <div
                    key={finding.id}
                    className="rounded-lg border border-slate-800 bg-slate-950/60 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-slate-100">
                          {finding.category}
                        </p>

                        {finding.policyClause && (
                          <p className="mt-1 text-xs text-indigo-400">
                            {finding.policyClause.code} ·{" "}
                            {finding.policyClause.title}
                          </p>
                        )}
                      </div>

                      <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-400">
                        {Math.round(finding.confidence * 100)}% confidence
                      </span>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Evidence
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {finding.evidence}
                      </p>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Explanation
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {finding.explanation}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-400">
                        {finding.severity}
                      </span>

                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          finding.isCertain
                            ? "bg-emerald-400/10 text-emerald-300"
                            : "bg-amber-400/10 text-amber-300"
                        }`}
                      >
                        {finding.isCertain
                          ? "Confirmed evidence"
                          : "Human interpretation required"}
                      </span>
                    </div>
                  </div>
                ))}

                {!decision && (
                  <p className="text-sm text-slate-500">
                    No AI assessment is available yet.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="font-semibold">Policy Context</h2>

              <div className="mt-4 rounded-lg bg-slate-950 p-4">
                <p className="text-sm font-medium text-slate-200">
                  {decision?.policyVersion.policy.name}
                </p>

                <p className="mt-1 text-xs text-indigo-400">
                  Version {decision?.policyVersion.version}
                </p>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {decision?.policyVersion.policy.description}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="font-semibold">Moderator Decision</h2>

              <p className="mt-2 text-sm text-slate-500">
                AI recommendations are advisory. A moderator must make the
                final decision.
              </p>
                <form action={submitModerationDecision} className="mt-5">
                <input type="hidden" name="contentId" value={content.id} />

                <textarea
                    name="notes"
                    placeholder="Add moderator notes..."
                    className="min-h-24 w-full resize-none rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-500"
                />

                <div className="mt-4 grid grid-cols-3 gap-3">
                    <button
                    type="submit"
                    name="action"
                    value="APPROVE"
                    className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 transition hover:bg-emerald-500/20"
                    >
                    Approve
                    </button>

                    <button
                    type="submit"
                    name="action"
                    value="REJECT"
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 transition hover:bg-red-500/20"
                    >
                    Reject
                    </button>

                    <button
                    type="submit"
                    name="action"
                    value="MODIFY"
                    className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300 transition hover:bg-amber-500/20"
                    >
                    Modify
                    </button>
                </div>
                </form>
            </div>

            <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div>
                <p className="text-sm font-medium tracking-wide text-indigo-400">
                MODERATION HISTORY
                </p>
                <h2 className="mt-2 text-lg font-semibold">
                Previous decisions
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                Every moderation evaluation is preserved with the policy version used.
                </p>
            </div>

            <div className="mt-5 space-y-3">
                {content.decisions.length === 0 ? (
                <p className="text-sm text-slate-500">
                    No moderation decisions recorded.
                </p>
                ) : (
                content.decisions.map((item, index) => (
                    <div
                    key={item.id}
                    className="rounded-lg border border-slate-800 bg-slate-950 p-4"
                    >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                        <p className="text-sm font-medium text-slate-200">
                            Decision {content.decisions.length - index}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            {item.createdAt.toLocaleString()}
                        </p>
                        </div>

                        <div className="flex items-center gap-2">
                        <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300">
                            Policy {item.policyVersion.version}
                        </span>

                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                            {item.status.replace("_", " ")}
                        </span>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                        <div>
                        <p className="text-xs text-slate-500">Recommended action</p>
                        <p className="mt-1 text-slate-300">
                            {item.recommendedAction ?? "Not available"}
                        </p>
                        </div>

                        <div>
                        <p className="text-xs text-slate-500">Moderator</p>
                        <p className="mt-1 text-slate-300">
                            {item.moderatorName ?? "Not reviewed"}
                        </p>
                        </div>

                        <div>
                        <p className="text-xs text-slate-500">Human review</p>
                        <p className="mt-1 text-slate-300">
                            {item.humanReviewRequired ? "Required" : "Not required"}
                        </p>
                        </div>
                    </div>

                    {item.moderatorNotes && (
                        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900 p-3">
                        <p className="text-xs text-slate-500">Moderator notes</p>
                        <p className="mt-1 text-sm text-slate-300">
                            {item.moderatorNotes}
                        </p>
                        </div>
                    )}
                    </div>
                ))
                )}
            </div>
            </section>

            {(content.status === "REJECTED" || content.status === "MODIFIED") &&
                decision && (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="font-semibold">Author Appeal</h2>

                <p className="mt-2 text-sm text-slate-500">
                  The author can submit additional context or evidence for a second review.
                </p>

                <form action={submitAppeal} className="mt-5 space-y-4">
                  <input
                    type="hidden"
                    name="contentId"
                    value={content.id}
                  />

                  <textarea
                    name="reason"
                    required
                    placeholder="Why should this moderation decision be reconsidered?"
                    className="min-h-24 w-full resize-none rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-500"
                  />

                  <textarea
                    name="evidence"
                    placeholder="Additional evidence or context (optional)..."
                    className="min-h-24 w-full resize-none rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-500"
                  />

                  <button
                    type="submit"
                    className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-300 transition hover:bg-indigo-500/20"
                  >
                    Submit Appeal
                  </button>
                </form>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}