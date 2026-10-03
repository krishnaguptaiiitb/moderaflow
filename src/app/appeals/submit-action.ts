"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function submitAppeal(formData: FormData) {
  const contentId = String(formData.get("contentId"));
  const reason = String(formData.get("reason") ?? "").trim();
  const evidence = String(formData.get("evidence") ?? "").trim();

  if (!contentId) {
    throw new Error("Content ID is required");
  }

  if (!reason) {
    throw new Error("Appeal reason is required");
  }

  const content = await prisma.content.findUnique({
    where: {
      id: contentId,
    },
    include: {
      decisions: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
      appeals: {
        where: {
          status: {
            in: ["PENDING", "UNDER_REVIEW"],
          },
        },
      },
    },
  });

  if (!content) {
    throw new Error("Content not found");
  }

  const decision = content.decisions[0];

  if (!decision) {
    throw new Error("No moderation decision exists for this content");
  }

    if (!["REJECTED", "MODIFIED"].includes(decision.status)) {
    throw new Error("Only rejected or modified content can be appealed");
    }

  if (content.appeals.length > 0) {
    throw new Error("An active appeal already exists for this content");
  }

  const appeal = await prisma.appeal.create({
    data: {
      contentId: content.id,
      decisionId: decision.id,
      reason,
      evidence: evidence || null,
      status: "PENDING",
    },
  });

  await prisma.auditLog.create({
    data: {
      entityType: "APPEAL",
      entityId: appeal.id,
      action: "APPEAL_SUBMITTED",
      actorName: content.authorName ?? "Content Author",
      details: `Appeal submitted against moderation decision ${decision.id}.`,
    },
  });

  revalidatePath("/appeals");
  revalidatePath(`/queue/${content.id}`);
  revalidatePath("/audit");
}