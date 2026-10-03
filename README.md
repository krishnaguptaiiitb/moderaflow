# ModeraFlow

AI-Assisted Content Moderation & Appeals Workbench.

ModeraFlow is a human-in-the-loop moderation system that combines deterministic checks with AI-assisted policy analysis. The system helps moderators review potentially problematic content while keeping final moderation and appeal decisions under human control.

## Features

- Moderation queue for posts and comments
- Deterministic moderation checks
- AI-assisted content analysis using Gemini
- Policy clause citations for AI findings
- Evidence extracted directly from submitted content
- Severity and confidence assessment
- Explicit human-review requirement
- Moderator approval, rejection, and modification
- Versioned moderation policies
- Moderation decision history
- Author appeals
- Independent second-level appeal review
- Policy re-evaluation after policy changes
- Complete audit trail
- AI failure handling
- Loading and error states

## Moderation Workflow

```text
Content
   ↓
Deterministic Checks
   ↓
AI Policy Analysis
   ↓
Findings + Evidence + Confidence
   ↓
Human Moderator Review
   ↓
Approve / Reject / Modify
   ↓
Audit Trail
```

### Appeal Workflow

```text
Rejected / Modified Content
   ↓
Author Appeal
   ↓
Appeal Review
   ↓
Second Human Review
   ↓
Upheld / Reversed / Modified
   ↓
Audit Trail
```

AI recommendations are advisory only. The AI does not directly remove content, reject appeals, or make final moderation decisions.

## AI-Assisted Moderation

The moderation agent evaluates content against the currently active policy version.

For each potential finding, the system records:

- Policy clause
- Category
- Evidence
- Explanation
- Severity
- Confidence
- Whether the finding is certain
- Whether human interpretation is required

The AI is instructed to use only policy clauses supplied by the application and to avoid treating deterministic checks as proof of a violation.

The current model is:

`gemini-2.5-flash`

## Policy Versioning

Policies are versioned and stored independently.

Every moderation decision records the exact policy version used for that analysis.

When a new policy version becomes active, previous decisions remain unchanged.

Content can be explicitly re-evaluated against the new policy version. Re-evaluation creates a new moderation decision rather than overwriting the previous decision.

This preserves the historical context of every moderation decision.

## Appeals

Authors can appeal rejected or modified content.

The appeal workflow uses a separate human review process:

1. Appeal submitted
2. Appeal enters `PENDING`
3. Reviewer starts the second review
4. Appeal enters `UNDER_REVIEW`
5. Reviewer selects `UPHELD`, `REVERSED`, or `MODIFIED`
6. Outcome is stored in the audit trail

The original moderation decision remains preserved even when an appeal changes the final content status.

## Audit Trail

Important workflow events are recorded in the audit log, including:

- AI analysis
- AI analysis failures
- Moderator decisions
- Policy creation
- Policy activation
- Policy re-evaluation
- Appeal submission
- Appeal review
- Appeal outcomes

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- Next.js Server Actions
- Prisma ORM
- SQLite

### AI

- Google Gemini
- `@google/genai`

### Validation

- Zod

### Development

- Git
- GitHub
- ESLint
- TypeScript

## Project Structure

```text
moderaflow/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── appeals/
│   │   ├── audit/
│   │   ├── policies/
│   │   └── queue/
│   └── lib/
│       ├── moderation/
│       │   ├── ai.ts
│       │   ├── analyze.ts
│       │   └── deterministic.ts
│       └── prisma.ts
├── AGENT_USAGE.md
├── prisma7.config.ts
├── .env.example
└── README.md
```

## Getting Started

### Prerequisites

- Node.js
- npm
- A Gemini API key

### Installation

Clone the repository:

```bash
git clone https://github.com/krishnaguptaiiitb/moderaflow.git
cd moderaflow
```

Install dependencies:

```bash
npm install
```

Create an environment file:

```bash
copy .env.example .env
```

Configure:

```env
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY="your_gemini_api_key_here"
```

### Database

Generate the Prisma client:

```bash
npx prisma generate
```

Apply migrations:

```bash
npx prisma migrate dev
```

Seed the database:

```bash
npx prisma db seed
```

### Run the application

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Production Build

To verify the production build:

```bash
npm run build
```

The application currently builds successfully with Next.js production compilation and TypeScript validation.

## Responsible AI Design

ModeraFlow intentionally keeps AI inside an advisory workflow.

The AI:

- Does not directly remove content
- Does not directly reject appeals
- Does not directly ban users
- Does not make final moderation decisions
- Must cite supplied policy clauses
- Must provide content-based evidence
- Must distinguish certainty from interpretation
- Must identify cases requiring human judgment

Moderators remain responsible for final decisions.

## Testing

Deterministic moderation rules have been tested against representative threat, harassment, and non-matching content.

The main production build also validates the application through:

```bash
npm run build
```

which includes TypeScript validation.

## Environment Variables

The repository includes `.env.example` as a template.

Actual environment files containing API credentials are intentionally excluded from Git.

Never commit API keys or other secrets to the repository.

## Documentation

See [AGENT_USAGE.md](./AGENT_USAGE.md) for details about:

- AI responsibilities
- Deterministic checks
- Human-in-the-loop controls
- Policy versioning
- Appeals
- Auditability
- Failure handling
- AI safety constraints