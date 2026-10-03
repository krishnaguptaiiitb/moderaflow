"use server";

import { revalidatePath } from "next/cache";
import { Severity } from "../../../generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function createPolicyVersion(formData: FormData) {
  const policyId = String(formData.get("policyId"));
  const version = String(formData.get("version")).trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!policyId || !version) {
    throw new Error("Policy and version are required");
  }

  const existingVersion = await prisma.policyVersion.findFirst({
    where: {
      policyId,
      version,
    },
  });

  if (existingVersion) {
    throw new Error("This policy version already exists");
  }

  await prisma.policyVersion.create({
    data: {
      policyId,
      version,
      isActive: false,
      clauses: {
        create: [
          {
            code: "HAR-01",
            title: "Harassment",
            description:
              "Content that targets a person with abusive or degrading language.",
            severity: Severity.MEDIUM,
          },
          {
            code: "THR-01",
            title: "Threats",
            description:
              "Content containing credible threats of physical harm.",
            severity: Severity.CRITICAL,
          },
          {
            code: "HAT-01",
            title: "Hateful Conduct",
            description:
              "Content attacking protected groups or characteristics.",
            severity: Severity.HIGH,
          },
          {
            code: "SPM-01",
            title: "Spam",
            description:
              "Repeated, deceptive, or unwanted promotional content.",
            severity: Severity.LOW,
          },
          {
            code: "CNT-01",
            title: "Contextual Content",
            description:
              "Content requiring contextual human judgment before moderation.",
            severity: Severity.MEDIUM,
          },
        ],
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      entityType: "POLICY",
      entityId: policyId,
      action: "POLICY_VERSION_CREATED",
      actorName: "Policy Administrator",
      details: `Created policy version ${version}.`,
    },
  });

  revalidatePath("/policies");
  revalidatePath("/audit");
}

export async function activatePolicyVersion(formData: FormData) {
  const policyVersionId = String(formData.get("policyVersionId"));

  if (!policyVersionId) {
    throw new Error("Policy version is required");
  }

  const policyVersion = await prisma.policyVersion.findUnique({
    where: {
      id: policyVersionId,
    },
  });

  if (!policyVersion) {
    throw new Error("Policy version not found");
  }

  await prisma.$transaction([
    prisma.policyVersion.updateMany({
      where: {
        policyId: policyVersion.policyId,
      },
      data: {
        isActive: false,
      },
    }),
    prisma.policyVersion.update({
      where: {
        id: policyVersionId,
      },
      data: {
        isActive: true,
      },
    }),
    prisma.auditLog.create({
      data: {
        entityType: "POLICY",
        entityId: policyVersion.policyId,
        action: "POLICY_VERSION_ACTIVATED",
        actorName: "Policy Administrator",
        details: `Activated policy version ${policyVersion.version}.`,
      },
    }),
  ]);

  revalidatePath("/policies");
  revalidatePath("/queue");
  revalidatePath("/audit");
}