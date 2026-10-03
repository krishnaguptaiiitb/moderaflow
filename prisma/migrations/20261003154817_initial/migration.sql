-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "authorName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "reporterName" TEXT,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserReport_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PolicyVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "policyId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PolicyVersion_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PolicyClause" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "policyVersionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    CONSTRAINT "PolicyClause_policyVersionId_fkey" FOREIGN KEY ("policyVersionId") REFERENCES "PolicyVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModerationDecision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "policyVersionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEEDS_REVIEW',
    "recommendedAction" TEXT,
    "moderatorName" TEXT,
    "moderatorNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ModerationDecision_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ModerationDecision_policyVersionId_fkey" FOREIGN KEY ("policyVersionId") REFERENCES "PolicyVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Finding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "decisionId" TEXT NOT NULL,
    "policyClauseId" TEXT,
    "category" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "isCertain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Finding_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "ModerationDecision" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Finding_policyClauseId_fkey" FOREIGN KEY ("policyClauseId") REFERENCES "PolicyClause" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeterministicCheck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "decisionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeterministicCheck_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "ModerationDecision" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "decisionId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "inputSummary" TEXT,
    "outputSummary" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentRun_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "ModerationDecision" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Appeal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewerName" TEXT,
    "finalNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appeal_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Appeal_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "ModerationDecision" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorName" TEXT,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
