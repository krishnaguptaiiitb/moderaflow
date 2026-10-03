import { prisma } from "@/lib/prisma";
import { runDeterministicChecks } from "./deterministic";
import { buildModerationAssessment } from "./ai";

async function runAnalysis(
  contentId: string,
  auditAction: string,
) {
  const content = await prisma.content.findUnique({
    where: { id: contentId },
  });

  if (!content) {
    throw new Error("Content not found");
  }

  const policyVersion = await prisma.policyVersion.findFirst({
    where: { isActive: true },
    include: {
      clauses: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!policyVersion) {
    throw new Error("No active policy version found");
  }

  const checks = runDeterministicChecks(content.text);

    let assessment;

    try {
    assessment = await buildModerationAssessment({
        content: content.text,
        clauses: policyVersion.clauses,
        checks,
    });
    } catch (error) {
    await prisma.auditLog.create({
        data: {
        entityType: "CONTENT",
        entityId: content.id,
        action: "MODERATION_ANALYSIS_FAILED",
        actorName: "Moderation Agent",
        details:
            error instanceof Error
            ? `Gemini moderation analysis failed: ${error.message}`
            : "Gemini moderation analysis failed.",
        },
    });

    throw error;
    }

  const decision = await prisma.$transaction(async (tx) => {
    const newDecision = await tx.moderationDecision.create({
      data: {
        contentId: content.id,
        policyVersionId: policyVersion.id,
        status: "NEEDS_REVIEW",
        recommendedAction: assessment.recommendedAction,
        humanReviewRequired: assessment.humanReviewRequired,

        checks: {
          create: checks.map((check) => ({
            name: check.name,
            status: check.status,
            details: check.details,
          })),
        },

        findings: {
          create: assessment.findings.map((finding) => {
            const clause = policyVersion.clauses.find(
              (item) => item.code === finding.policyClauseCode,
            );

            return {
              policyClauseId: clause?.id,
              category: finding.category,
              evidence: finding.evidence,
              explanation: finding.explanation,
              severity: finding.severity,
              confidence: finding.confidence,
              isCertain: finding.isCertain,
            };
          }),
        },

        agentRuns: {
          create: {
            model: "gemini-2.5-flash",
            promptVersion: "v1",
            inputSummary: content.text.slice(0, 500),
            outputSummary: assessment.summary,
            success: true,
          },
        },
      },
    });

    await tx.content.update({
      where: {
        id: content.id,
      },
      data: {
        status: "NEEDS_REVIEW",
      },
    });

    await tx.auditLog.create({
      data: {
        entityType: "CONTENT",
        entityId: content.id,
        action: auditAction,
        actorName: "Moderation Agent",
        details: `Gemini analyzed content using policy ${policyVersion.version}.`,
      },
    });

    return newDecision;
  });

  return decision;
}

export async function analyzeContent(contentId: string) {
  return runAnalysis(contentId, "MODERATION_ANALYZED");
}

export async function reevaluateContent(contentId: string) {
  return runAnalysis(contentId, "MODERATION_REEVALUATED");
}