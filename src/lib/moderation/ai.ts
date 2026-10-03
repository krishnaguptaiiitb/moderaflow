import "dotenv/config";
import { GoogleGenAI, Type } from "@google/genai";
import { CheckStatus } from "../../../generated/prisma/client";

type PolicyClause = {
  code: string;
  title: string;
  description: string;
  severity: string;
};

type DeterministicCheck = {
  name: string;
  status: CheckStatus;
  details?: string;
};

export type ModerationFinding = {
  category: string;
  policyClauseCode: string | null;
  evidence: string;
  explanation: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  isCertain: boolean;
};

export type ModerationAssessment = {
  recommendedAction: "APPROVE" | "REJECT" | "MODIFY";
  findings: ModerationFinding[];
  humanReviewRequired: boolean;
  summary: string;
};

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured");
}

const ai = new GoogleGenAI({
  apiKey,
});

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    recommendedAction: {
      type: Type.STRING,
      enum: ["APPROVE", "REJECT", "MODIFY"],
    },
    findings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: {
            type: Type.STRING,
          },
          policyClauseCode: {
            type: Type.STRING,
            nullable: true,
          },
          evidence: {
            type: Type.STRING,
          },
          explanation: {
            type: Type.STRING,
          },
          severity: {
            type: Type.STRING,
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
          },
          confidence: {
            type: Type.NUMBER,
            minimum: 0,
            maximum: 1,
          },
          isCertain: {
            type: Type.BOOLEAN,
          },
        },
        required: [
          "category",
          "policyClauseCode",
          "evidence",
          "explanation",
          "severity",
          "confidence",
          "isCertain",
        ],
      },
    },
    humanReviewRequired: {
      type: Type.BOOLEAN,
    },
    summary: {
      type: Type.STRING,
    },
  },
  required: [
    "recommendedAction",
    "findings",
    "humanReviewRequired",
    "summary",
  ],
};

export async function buildModerationAssessment({
  content,
  clauses,
  checks,
}: {
  content: string;
  clauses: PolicyClause[];
  checks: DeterministicCheck[];
}): Promise<ModerationAssessment> {
  const policyText = clauses
    .map(
      (clause) =>
        `${clause.code} - ${clause.title} (${clause.severity}): ${clause.description}`,
    )
    .join("\n");

  const checkText = checks
    .map(
      (check) =>
        `${check.name}: ${check.status}${check.details ? ` - ${check.details}` : ""}`,
    )
    .join("\n");

  const prompt = `
You are a content moderation review assistant.

Your job is to analyze one piece of user-generated text against the supplied policy clauses.

Important rules:
- Do not invent policy clauses.
- Only cite a policy clause code supplied in the policy list.
- Evidence must come directly from the supplied content.
- Distinguish confirmed evidence from interpretation.
- Confidence must be between 0 and 1.
- Confidence represents the model's confidence in the finding, not certainty that a human moderator should have.
- Do not use 1.0 confidence unless the supplied evidence and policy clause make the violation unambiguous.
- Prefer confidence below 1.0 for normal moderation decisions.
- isCertain should be true only when the evidence directly and unambiguously establishes the finding.
- If context, intent, sarcasm, quotation, or interpretation could materially change the decision, set isCertain to false.
- If the content contains a potential violation but human context is still needed, set humanReviewRequired to true.
- HumanReviewRequired must be true whenever there is a potential violation or meaningful ambiguity.
- You are making a recommendation only. A human moderator will make the final decision.
- Never claim that an account should be banned.
- Do not treat deterministic checks as proof by themselves.
- APPROVE means the content appears compliant.
- REJECT means there is strong evidence of a serious violation.
- MODIFY means the content may be problematic but could potentially be addressed without full removal.

POLICY CLAUSES:
${policyText}

DETERMINISTIC CHECKS:
${checkText}

CONTENT:
${content}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.1,
    },
  });

  if (!response.text) {
    throw new Error("Gemini returned an empty response");
  }

  let result: ModerationAssessment;

  try {
    result = JSON.parse(response.text) as ModerationAssessment;
  } catch {
    throw new Error("Gemini returned invalid JSON");
  }

  if (
    !["APPROVE", "REJECT", "MODIFY"].includes(
      result.recommendedAction,
    )
  ) {
    throw new Error("Invalid moderation recommendation");
  }

  if (!Array.isArray(result.findings)) {
    throw new Error("Invalid moderation findings");
  }

  for (const finding of result.findings) {
    if (
      finding.confidence < 0 ||
      finding.confidence > 1
    ) {
      throw new Error("Invalid confidence value");
    }

    if (
      !["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(
        finding.severity,
      )
    ) {
      throw new Error("Invalid severity value");
    }

    if (
      finding.policyClauseCode &&
      !clauses.some(
        (clause) => clause.code === finding.policyClauseCode,
      )
    ) {
      throw new Error(
        `Unknown policy clause: ${finding.policyClauseCode}`,
      );
    }
  }

  return result;
}