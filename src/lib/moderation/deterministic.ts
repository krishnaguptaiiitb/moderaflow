import { CheckStatus } from "../../../generated/prisma/client";

type ModerationCheck = {
  name: string;
  status: CheckStatus;
  details?: string;
};

const URL_PATTERN = /https?:\/\/\S+/i;

const THREAT_PATTERNS = [
  /\bi('ll| will)?\s+(hurt|harm|kill)\s+you\b/i,
  /\byou\s+(should|need\s+to)\s+die\b/i,
  /\bfind\s+you\s+and\s+(hurt|harm)\s+you\b/i,
];

const HARASSMENT_PATTERNS = [
  /\bidiot\b/i,
  /\bstupid\b/i,
  /\bshut\s+up\b/i,
];

export function runDeterministicChecks(
  text: string,
): ModerationCheck[] {
  const checks: ModerationCheck[] = [];

  checks.push({
    name: "Threat language",
    status: THREAT_PATTERNS.some((pattern) => pattern.test(text))
      ? CheckStatus.FLAGGED
      : CheckStatus.PASSED,
    details: THREAT_PATTERNS.some((pattern) => pattern.test(text))
      ? "Potential threat language detected."
      : "No configured threat pattern matched.",
  });

  checks.push({
    name: "Harassment language",
    status: HARASSMENT_PATTERNS.some((pattern) => pattern.test(text))
      ? CheckStatus.FLAGGED
      : CheckStatus.PASSED,
    details: HARASSMENT_PATTERNS.some((pattern) => pattern.test(text))
      ? "Potentially abusive language detected."
      : "No configured harassment pattern matched.",
  });

  checks.push({
    name: "External links",
    status: URL_PATTERN.test(text)
      ? CheckStatus.FLAGGED
      : CheckStatus.PASSED,
    details: URL_PATTERN.test(text)
      ? "Content contains an external URL."
      : "No external URL detected.",
  });

  return checks;
}