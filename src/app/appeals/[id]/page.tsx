import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  startAppealReview,
  submitAppealDecision,
} from "./actions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AppealReviewPage({ params }: PageProps) {
  const { id } = await params;

  const appeal = await prisma.appeal.findUnique({
    where: {
      id,
    },
    include: {
      content: true,
      decision: {
        include: {
          findings: {
            include: {
              policyClause: true,
            },
          },
          checks: true,
          policyVersion: {
            include: {
              policy: true,
            },
          },
        },
      },
    },
  });

  if (!appeal) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-8 py-10">
        <Link
          href="/appeals"
          className="text-sm text-slate-500 hover:text-slate-300"
        >
          ← Appeals
        </Link>

        <div className="mt-6">
          <p className="text-sm font-medium tracking-wide text-indigo-400">
            APPEAL REVIEW
          </p>

          <h1 className="mt-2 text-3xl font-semibold">
            Review author appeal
          </h1>

          <p className="mt-2 text-slate-400">
            Reconsider the original moderation decision using the appeal
            evidence and the policy version that was active at the time.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Original Content</h2>

                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
                  {appeal.content.type}
                </span>
              </div>

              <p className="mt-5 text-lg leading-8 text-slate-100">
                {appeal.content.text}
              </p>

              <p className="mt-4 text-xs text-slate-500">
                Author: {appeal.content.authorName ?? "Unknown"}
              </p>
            </div>

            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
              <p className="text-xs font-medium tracking-wide text-red-400">
                ORIGINAL DECISION
              </p>

              <div className="mt-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {appeal.decision.status.replace("_", " ")}
                </h2>

                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
                  Policy {appeal.decision.policyVersion.version}
                </span>
              </div>

              {appeal.decision.moderatorName && (
                <p className="mt-2 text-xs text-slate-500">
                  Reviewed by {appeal.decision.moderatorName}
                </p>
              )}

              {appeal.decision.moderatorNotes && (
                <div className="mt-5 rounded-lg bg-slate-950 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Moderator notes
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {appeal.decision.moderatorNotes}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="font-semibold">Original Findings</h2>

              <div className="mt-5 space-y-4">
                {appeal.decision.findings.map((finding) => (
                  <div
                    key={finding.id}
                    className="rounded-lg border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">
                          {finding.category}
                        </p>

                        {finding.policyClause && (
                          <p className="mt-1 text-xs text-indigo-400">
                            {finding.policyClause.code} ·{" "}
                            {finding.policyClause.title}
                          </p>
                        )}
                      </div>

                      <span className="text-xs text-slate-500">
                        {Math.round(finding.confidence * 100)}% confidence
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      {finding.explanation}
                    </p>
                  </div>
                ))}

                {appeal.decision.findings.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No findings recorded.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-6">
              <p className="text-xs font-medium tracking-wide text-indigo-400">
                AUTHOR APPEAL
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Why the author is challenging this decision
              </h2>

              <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950 p-5">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Appeal reason
                </p>

                <p className="mt-2 text-sm leading-7 text-slate-200">
                  {appeal.reason}
                </p>
              </div>

              {appeal.evidence && (
                <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 p-5">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Submitted evidence
                  </p>

                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    {appeal.evidence}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="font-semibold">Policy at Time of Decision</h2>

              <div className="mt-4 rounded-lg bg-slate-950 p-4">
                <p className="font-medium text-slate-200">
                  {appeal.decision.policyVersion.policy.name}
                </p>

                <p className="mt-1 text-xs text-indigo-400">
                  Version {appeal.decision.policyVersion.version}
                </p>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {appeal.decision.policyVersion.policy.description}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-semibold">Second Review</h2>

                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
                  {appeal.status.replace("_", " ")}
                </span>
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                The appeal outcome must be decided by a human reviewer. AI
                analysis can provide context, but cannot resolve the appeal.
              </p>

              {appeal.status === "PENDING" && (
                <form action={startAppealReview} className="mt-5">
                  <input
                    type="hidden"
                    name="appealId"
                    value={appeal.id}
                  />

                  <button
                    type="submit"
                    className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-300 transition hover:bg-indigo-500/20"
                  >
                    Start Second Review
                  </button>
                </form>
              )}

              {appeal.status === "UNDER_REVIEW" && (
                <form action={submitAppealDecision} className="mt-5">
                  <input
                    type="hidden"
                    name="appealId"
                    value={appeal.id}
                  />

                  <textarea
                    name="notes"
                    placeholder="Add final review notes..."
                    className="min-h-28 w-full resize-none rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-500"
                  />

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <button
                      type="submit"
                      name="action"
                      value="UPHELD"
                      className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-300 transition hover:bg-emerald-500/20"
                    >
                      Uphold
                    </button>

                    <button
                      type="submit"
                      name="action"
                      value="REVERSED"
                      className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-3 text-sm text-blue-300 transition hover:bg-blue-500/20"
                    >
                      Reverse
                    </button>

                    <button
                      type="submit"
                      name="action"
                      value="MODIFIED"
                      className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-sm text-amber-300 transition hover:bg-amber-500/20"
                    >
                      Modify
                    </button>
                  </div>
                </form>
              )}

              {appeal.status !== "PENDING" &&
                appeal.status !== "UNDER_REVIEW" && (
                  <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950 p-4">
                    <p className="text-sm text-slate-300">
                      This appeal has already reached a final outcome.
                    </p>

                    {appeal.reviewerName && (
                      <p className="mt-2 text-xs text-slate-500">
                        Reviewed by {appeal.reviewerName}
                      </p>
                    )}

                    {appeal.finalNotes && (
                      <p className="mt-3 text-sm leading-6 text-slate-400">
                        {appeal.finalNotes}
                      </p>
                    )}
                  </div>
                )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}