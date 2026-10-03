-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ModerationDecision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "policyVersionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEEDS_REVIEW',
    "recommendedAction" TEXT,
    "humanReviewRequired" BOOLEAN NOT NULL DEFAULT true,
    "moderatorName" TEXT,
    "moderatorNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ModerationDecision_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ModerationDecision_policyVersionId_fkey" FOREIGN KEY ("policyVersionId") REFERENCES "PolicyVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ModerationDecision" ("contentId", "createdAt", "id", "moderatorName", "moderatorNotes", "policyVersionId", "recommendedAction", "status", "updatedAt") SELECT "contentId", "createdAt", "id", "moderatorName", "moderatorNotes", "policyVersionId", "recommendedAction", "status", "updatedAt" FROM "ModerationDecision";
DROP TABLE "ModerationDecision";
ALTER TABLE "new_ModerationDecision" RENAME TO "ModerationDecision";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
