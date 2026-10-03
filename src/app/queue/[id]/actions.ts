"use server";

import { revalidatePath } from "next/cache";
import { ReviewAction } from "../../../../generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function submitModerationDecision(formData: FormData) {
  const contentId = String(formData.get("contentId"));
  const action = String(formData.get("action"));
  const notes = String(formData.get("notes") ?? "").trim();

  if (!["APPROVE", "REJECT", "MODIFY"].includes(action)) {
    throw new Error("Invalid moderation action");
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
    },
  });

  if (!content) {
    throw new Error("Content not found");
  }

  const decision = content.decisions[0];

  if (!decision) {
    throw new Error("No moderation decision exists for this content");
  }

  const status =
    action === "APPROVE"
      ? "APPROVED"
      : action === "REJECT"
        ? "REJECTED"
        : "MODIFIED";

  await prisma.$transaction([
    prisma.moderationDecision.update({
      where: {
        id: decision.id,
      },
      data: {
        status,
        recommendedAction: action as ReviewAction,
        moderatorName: "Demo Moderator",
        moderatorNotes: notes || null,
      },
    }),

    prisma.content.update({
      where: {
        id: contentId,
      },
      data: {
        status,
      },
    }),

    prisma.auditLog.create({
      data: {
        entityType: "CONTENT",
        entityId: contentId,
        action: `MODERATION_${action}`,
        actorName: "Demo Moderator",
        details: notes || `Moderator selected ${action}.`,
      },
    }),
  ]);

  revalidatePath("/queue");
  revalidatePath(`/queue/${contentId}`);
  revalidatePath("/");
}