"use server";

import { revalidatePath } from "next/cache";
import { analyzeContent } from "@/lib/moderation/analyze";

export async function analyzeModerationContent(formData: FormData) {
  const contentId = String(formData.get("contentId"));

  if (!contentId) {
    throw new Error("Content ID is required");
  }

  await analyzeContent(contentId);

  revalidatePath("/queue");
  revalidatePath(`/queue/${contentId}`);
  revalidatePath("/audit");
  revalidatePath("/");
}