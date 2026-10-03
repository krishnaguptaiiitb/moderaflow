import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.appeal.deleteMany();
  await prisma.agentRun.deleteMany();
  await prisma.deterministicCheck.deleteMany();
  await prisma.finding.deleteMany();
  await prisma.moderationDecision.deleteMany();
  await prisma.userReport.deleteMany();
  await prisma.content.deleteMany();
  await prisma.policyClause.deleteMany();
  await prisma.policyVersion.deleteMany();
  await prisma.policy.deleteMany();

  const policy = await prisma.policy.create({
    data: {
      name: "Community Content Safety Policy",
      description:
        "Rules for maintaining a safe and respectful community across posts and comments.",
    },
  });

  const policyVersion = await prisma.policyVersion.create({
    data: {
      policyId: policy.id,
      version: "2.1",
      isActive: true,
      clauses: {
        create: [
          {
            code: "HAR-01",
            title: "Direct harassment",
            description:
              "Content that directly targets a person with abusive, degrading, or threatening language is prohibited.",
            severity: "HIGH",
          },
          {
            code: "THR-01",
            title: "Threats of harm",
            description:
              "Content expressing a credible threat of physical harm toward another person is prohibited.",
            severity: "CRITICAL",
          },
          {
            code: "HAT-01",
            title: "Hateful attacks",
            description:
              "Content attacking a protected group through degrading or dehumanizing language is prohibited.",
            severity: "HIGH",
          },
          {
            code: "SPM-01",
            title: "Repeated promotional spam",
            description:
              "Repeated unsolicited promotional content that disrupts normal community discussion is prohibited.",
            severity: "MEDIUM",
          },
          {
            code: "CNT-01",
            title: "Contextual discussion",
            description:
              "Discussion of controversial subjects is allowed when it does not itself violate another policy clause.",
            severity: "LOW",
          },
        ],
      },
    },
    include: {
      clauses: true,
    },
  });

  const post1 = await prisma.content.create({
    data: {
      type: "POST",
      text: "The new update is confusing. I hope the team explains the changes more clearly.",
      authorName: "Aarav",
      status: "APPROVED",
    },
  });

  const post2 = await prisma.content.create({
    data: {
      type: "POST",
      text: "You are completely useless. Nobody wants you here. Stop posting.",
      authorName: "Rohan",
      status: "NEEDS_REVIEW",
    },
  });

  const post3 = await prisma.content.create({
    data: {
      type: "POST",
      text: "I disagree with this policy, but I think we should discuss the reasoning behind it.",
      authorName: "Meera",
      status: "APPROVED",
    },
  });

  const post4 = await prisma.content.create({
    data: {
      type: "COMMENT",
      text: "Buy my premium course now. Message me privately. Buy now. Buy now.",
      authorName: "Vikram",
      status: "NEEDS_REVIEW",
    },
  });

  const post5 = await prisma.content.create({
    data: {
      type: "POST",
      text: "I will find you and hurt you if you keep spreading this.",
      authorName: "Kabir",
      status: "NEEDS_REVIEW",
    },
  });

  const harassmentClause = policyVersion.clauses.find(
    (clause) => clause.code === "HAR-01"
  );

  const threatClause = policyVersion.clauses.find(
    (clause) => clause.code === "THR-01"
  );

  const spamClause = policyVersion.clauses.find(
    (clause) => clause.code === "SPM-01"
  );

  if (!harassmentClause || !threatClause || !spamClause) {
    throw new Error("Required policy clauses were not created");
  }

  const approvedDecision = await prisma.moderationDecision.create({
    data: {
      contentId: post1.id,
      policyVersionId: policyVersion.id,
      status: "APPROVED",
      recommendedAction: "APPROVE",
      moderatorName: "Priya Sharma",
      moderatorNotes: "No policy violation found.",
      checks: {
        create: [
          {
            name: "Blocked phrase check",
            status: "PASSED",
            details: "No prohibited phrase detected.",
          },
          {
            name: "Spam pattern check",
            status: "PASSED",
            details: "No repeated promotional pattern detected.",
          },
        ],
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      entityType: "CONTENT",
      entityId: post1.id,
      action: "APPROVED",
      actorName: "Priya Sharma",
      details: "Content approved after policy review.",
    },
  });

  const harassmentDecision = await prisma.moderationDecision.create({
    data: {
      contentId: post2.id,
      policyVersionId: policyVersion.id,
      status: "NEEDS_REVIEW",
      recommendedAction: "MODIFY",
      checks: {
        create: [
          {
            name: "Blocked phrase check",
            status: "FLAGGED",
            details: "Potential abusive language detected.",
          },
          {
            name: "Spam pattern check",
            status: "PASSED",
            details: "No spam pattern detected.",
          },
        ],
      },
      findings: {
        create: [
          {
            policyClauseId: harassmentClause.id,
            category: "Harassment",
            evidence: "You are completely useless. Nobody wants you here.",
            explanation:
              "The content directly targets another person with degrading language.",
            severity: "HIGH",
            confidence: 0.94,
            isCertain: true,
          },
        ],
      },
      agentRuns: {
        create: {
          model: "moderation-model",
          promptVersion: "moderation-v1",
          inputSummary: "Post submitted for policy review.",
          outputSummary: "Possible direct harassment detected.",
          success: true,
        },
      },
    },
  });

  await prisma.userReport.create({
    data: {
      contentId: post2.id,
      reporterName: "Neha",
      reason: "Personal harassment",
    },
  });

  await prisma.auditLog.create({
    data: {
      entityType: "CONTENT",
      entityId: post2.id,
      action: "FLAGGED_FOR_REVIEW",
      actorName: "Moderation Agent",
      details: "Potential harassment detected under HAR-01.",
    },
  });

  const spamDecision = await prisma.moderationDecision.create({
    data: {
      contentId: post4.id,
      policyVersionId: policyVersion.id,
      status: "NEEDS_REVIEW",
      recommendedAction: "MODIFY",
      checks: {
        create: [
          {
            name: "Repeated promotion check",
            status: "FLAGGED",
            details: "Repeated promotional language detected.",
          },
        ],
      },
      findings: {
        create: [
          {
            policyClauseId: spamClause.id,
            category: "Spam",
            evidence: "Buy now. Buy now.",
            explanation:
              "The comment contains repeated unsolicited promotional language.",
            severity: "MEDIUM",
            confidence: 0.91,
            isCertain: true,
          },
        ],
      },
      agentRuns: {
        create: {
          model: "moderation-model",
          promptVersion: "moderation-v1",
          inputSummary: "Comment submitted for policy review.",
          outputSummary: "Promotional spam pattern detected.",
          success: true,
        },
      },
    },
  });

  await prisma.userReport.create({
    data: {
      contentId: post4.id,
      reporterName: "Ananya",
      reason: "Promotional spam",
    },
  });

  const threatDecision = await prisma.moderationDecision.create({
    data: {
      contentId: post5.id,
      policyVersionId: policyVersion.id,
      status: "NEEDS_REVIEW",
      recommendedAction: "REJECT",
      checks: {
        create: [
          {
            name: "Threat detection check",
            status: "FLAGGED",
            details: "Potential threat language detected.",
          },
        ],
      },
      findings: {
        create: [
          {
            policyClauseId: threatClause.id,
            category: "Threat",
            evidence: "I will find you and hurt you",
            explanation:
              "The statement expresses an apparent threat of physical harm.",
            severity: "CRITICAL",
            confidence: 0.97,
            isCertain: true,
          },
        ],
      },
      agentRuns: {
        create: {
          model: "moderation-model",
          promptVersion: "moderation-v1",
          inputSummary: "Post submitted for policy review.",
          outputSummary: "Potential threat of physical harm detected.",
          success: true,
        },
      },
    },
  });

  await prisma.userReport.create({
    data: {
      contentId: post5.id,
      reporterName: "Arjun",
      reason: "Threatening language",
    },
  });

  const appeal = await prisma.appeal.create({
    data: {
      contentId: post2.id,
      decisionId: harassmentDecision.id,
      reason:
        "The author believes the comment was criticism of the discussion and not intended as personal harassment.",
      evidence:
        "The author provided the surrounding conversation as additional context.",
      status: "PENDING",
    },
  });

  await prisma.auditLog.create({
    data: {
      entityType: "APPEAL",
      entityId: appeal.id,
      action: "APPEAL_SUBMITTED",
      actorName: "Rohan",
      details: "Appeal submitted for second review.",
    },
  });

  await prisma.auditLog.create({
    data: {
      entityType: "CONTENT",
      entityId: post4.id,
      action: "FLAGGED_FOR_REVIEW",
      actorName: "Moderation Agent",
      details: "Potential spam detected under SPM-01.",
    },
  });

  await prisma.auditLog.create({
    data: {
      entityType: "CONTENT",
      entityId: post5.id,
      action: "FLAGGED_FOR_REVIEW",
      actorName: "Moderation Agent",
      details: "Potential threat detected under THR-01.",
    },
  });

  console.log("Seed data created successfully");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });