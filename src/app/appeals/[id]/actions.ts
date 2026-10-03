"use server";

import { revalidatePath } from "next/cache";
import { AppealStatus } from "../../../../generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function startAppealReview(formData: FormData) {
  const appealId = String(formData.get("appealId"));

  if (!appealId) {
    throw new Error("Appeal ID is required");
  }

  const appeal = await prisma.appeal.findUnique({
    where: {
      id: appealId,
    },
  });

  if (!appeal) {
    throw new Error("Appeal not found");
  }

  if (appeal.status !== "PENDING") {
    throw new Error("Appeal is not pending review");
  }

  await prisma.$transaction([
    prisma.appeal.update({
      where: {
        id: appealId,
      },
      data: {
        status: "UNDER_REVIEW",
        reviewerName: "Appeal Reviewer",
      },
    }),
    prisma.auditLog.create({
      data: {
        entityType: "APPEAL",
        entityId: appealId,
        action: "APPEAL_REVIEW_STARTED",
        actorName: "Appeal Reviewer",
        details: "Appeal moved to second review.",
      },
    }),
  ]);

  revalidatePath("/appeals");
  revalidatePath(`/appeals/${appealId}`);
  revalidatePath("/audit");
}

export async function submitAppealDecision(formData: FormData) {
  const appealId = String(formData.get("appealId"));
  const action = String(formData.get("action"));
  const notes = String(formData.get("notes") ?? "").trim();

  if (!["UPHELD", "REVERSED", "MODIFIED"].includes(action)) {
    throw new Error("Invalid appeal action");
  }

  const appeal = await prisma.appeal.findUnique({
    where: {
      id: appealId,
    },
    include: {
      content: true,
      decision: true,
    },
  });

  if (!appeal) {
    throw new Error("Appeal not found");
  }

  if (appeal.status !== "UNDER_REVIEW") {
    throw new Error("Appeal must be under review before a final decision");
    }

  const contentStatus =
    action === "REVERSED"
      ? "APPROVED"
      : action === "MODIFIED"
        ? "MODIFIED"
        : appeal.content.status;

  await prisma.$transaction([
    prisma.appeal.update({
      where: {
        id: appealId,
      },
      data: {
        status: action as AppealStatus,
        reviewerName: "Appeal Reviewer",
        finalNotes: notes || null,
      },
    }),

    prisma.content.update({
      where: {
        id: appeal.contentId,
      },
      data: {
        status: contentStatus,
      },
    }),

    prisma.auditLog.create({
      data: {
        entityType: "APPEAL",
        entityId: appealId,
        action: `APPEAL_${action}`,
        actorName: "Appeal Reviewer",
        details: notes || `Appeal was ${action.toLowerCase()}.`,
      },
    }),
  ]);

  revalidatePath("/appeals");
  revalidatePath(`/appeals/${appealId}`);
  revalidatePath(`/queue/${appeal.contentId}`);
  revalidatePath("/");
}