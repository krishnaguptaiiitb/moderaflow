"use server";

import { revalidatePath } from "next/cache";
import { reevaluateContent } from "@/lib/moderation/analyze";

export async function reevaluateModerationContent(formData: FormData) {
  const contentId = String(formData.get("contentId"));

  if (!contentId) {
    throw new Error("Content ID is required");
  }

  await reevaluateContent(contentId);

  revalidatePath("/queue");
  revalidatePath(`/queue/${contentId}`);
  revalidatePath("/audit");
  revalidatePath("/");
}