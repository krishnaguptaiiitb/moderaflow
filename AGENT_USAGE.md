# Agent Usage

## Overview

ModeraFlow uses an AI-assisted moderation workflow where Gemini provides moderation recommendations to a human moderator.

The AI does not directly remove content, reject appeals, or apply moderation decisions.

## AI Responsibilities

The moderation agent:

- Reviews submitted content against the active policy version.
- Identifies potential policy violations.
- Cites the specific policy clause used for each finding.
- Extracts evidence directly from the submitted content.
- Explains why the evidence may violate the cited clause.
- Assigns a severity level.
- Provides a confidence score.
- Distinguishes confirmed evidence from situations requiring human interpretation.
- Recommends APPROVE, REJECT, or MODIFY.
- Indicates when human review is required.

## Deterministic Checks

Before the AI review, ModeraFlow runs deterministic checks for configured signals such as:

- Threat language
- Harassment language
- External links

These checks provide additional evidence for the AI workflow but are not treated as proof of a violation by themselves.

## Human-in-the-Loop

Every AI moderation assessment remains advisory.

A moderator must make the final moderation decision using:

- Original content
- Deterministic checks
- AI findings
- Policy clause
- Evidence
- Confidence
- Severity
- Human interpretation requirement

The moderator can:

- Approve
- Reject
- Modify

## Policy Versioning

Every moderation decision stores the policy version used during evaluation.

When the active policy changes, existing decisions are not overwritten.

Content can be explicitly re-evaluated against the newer policy version, creating a new moderation decision while preserving the previous decision history.

## Appeals

Authors can appeal rejected or modified content.

The appeal workflow requires a separate human review:

1. Appeal submitted
2. Appeal enters PENDING state
3. Reviewer starts second review
4. Appeal enters UNDER_REVIEW
5. Reviewer chooses UPHELD, REVERSED, or MODIFIED
6. The outcome is recorded in the audit trail

AI is not used to automatically reject appeals.

## Auditability

Important moderation actions are recorded in the audit trail, including:

- AI analysis
- AI analysis failures
- Moderator decisions
- Policy version creation
- Policy activation
- Appeal submission
- Appeal review
- Appeal outcomes
- Policy re-evaluation

## Failure Handling

AI failures are surfaced to the application rather than silently producing a moderation decision.

Failed analysis attempts are recorded in the audit trail without exposing API credentials or other secrets.

## AI Safety Constraints

The moderation prompt instructs the agent to:

- Use only supplied policy clauses.
- Never invent policy clauses.
- Use evidence directly from the submitted content.
- Avoid treating deterministic checks as proof.
- Avoid claiming certainty when context or interpretation is required.
- Keep human review enabled for ambiguous or potentially violating content.
- Make recommendations only.
- Never directly ban or remove an account.

## Model

The application currently uses:

`gemini-2.5-flash`

The model output is validated before it is persisted as a moderation assessment.