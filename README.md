# verified.prof

**Structural verification for technical hiring. No hallucinations, no résumé inflation—just AST-grounded developer profiles with a voice-enabled AI twin for recruiter interviews.**

---

## Hackathon Summary

Technical hiring has a trust problem. Developers claim expertise in frameworks they barely touched. Résumés list technologies used once in a tutorial. Recruiters spend hours verifying claims through behavioral interviews that rely on memory and self-reporting.

**verified.prof** solves this by treating source code as ground truth. We parse GitHub commits with Tree-sitter ASTs, extract structural evidence (imports, function complexity, architectural patterns), and build verified developer profiles. Recruiters don't read résumés—they interview an AI Voice Twin trained exclusively on AST-derived metrics.

The Twin uses **Gemini 3 Flash Live API** for real-time voice conversations. When asked "What's your React experience?", it answers with commit-backed evidence: component patterns used, state management implementations, hooks complexity. The system refuses to hallucinate—every response traces to a verified code structure.

This creates a **Structural Grounding** layer between raw code and AI inference. GitHub commits → Tree-sitter parsers → AST analysis → metric extraction → Gemini context. The result: developers get credit for actual work, recruiters get trustworthy technical interviews, and AI cannot fabricate capabilities.

---

## Features

- **AST-Based Code Analysis**: Tree-sitter parses 9+ languages (TypeScript, Python, Go, Rust, PHP, etc.) to extract structural evidence (imports, function definitions, complexity metrics)
- **Core Metrics Dashboard**: Code Impact (0-100), Cycle Time, Logic Density, System Complexity Score, Velocity Percentile, Seniority Rank (Junior → Principal)
- **Tech Stack DNA**: Automatic technology detection (databases, frameworks, cloud services) with mastery levels (MENTIONED/USED/PROFICIENT/EXPERT) based on usage patterns
- **Mission Timeline**: Auto-generated project summaries from commit clusters—design patterns used, architectural decisions, domain context
- **Voice Twin (Gemini Live)**: Real-time bi-directional audio interview agent that answers recruiter questions using only verified profile data
- **Zero Hallucination Guarantee**: Twin context is built from AST evidence—it cannot claim unverified skills
- **Engineering Leadership Metrics**: Architectural layer analysis, mentorship tracking, code review patterns
- **Cryptographic Verification**: S-Tier hash proves metric authenticity
- **Public Developer Profiles**: Shareable URLs with professional presentation (`/:slug`)

---

## 🧠 How We Used Gemini 3

### Gemini 3 (Analysis Pipeline)

- **Core Metrics Calculation**: Receives AST summaries (complexity scores, file counts, import patterns) and generates Code Impact, Logic Density, System Complexity scores
- **Seniority Ranking**: Analyzes commit patterns, architectural decisions, and technical depth to assign Junior/Mid/Senior/Staff/Principal rank
- **Specialization Detection**: Identifies focus areas (e.g., "Backend Infrastructure", "Frontend Architecture") from technology usage
- **Mission Summarization**: Converts commit clusters into narrative project descriptions with achievements and patterns
- **Bio Generation**: Creates developer bio from verified work history
- **Context Caching**: Uses Gemini's context caching for repeated AST analysis tasks to reduce latency and cost

### Gemini Flash Live API (Voice Twin)

- **Real-Time Voice Interviews**: Recruiter speaks questions, Twin responds verbally using Gemini Live's native audio streaming
- **Bi-Directional Audio**: 16kHz input from recruiter microphone, 24kHz output for natural voice responses
- **Structured Context**: Twin system prompt includes Core Metrics, Tech Stack, Mission Timeline—all AST-derived
- **Grounded Responses**: Gemini's reasoning constrained to provided context, preventing hallucinations about technologies not in commit history
- **15-Minute Sessions**: Professional interview format with conversation transcript persistence
- **Browser-Optimized**: Handles Firefox/Chrome audio context differences with adaptive latency strategies

### Why Gemini 3?

- **Native Audio Processing**: Live API eliminates need for separate STT/TTS services
- **Context Window**: Large enough to fit entire developer profile (metrics + missions + tech stack) in single request
- **Structured Reasoning**: Pro model excels at technical analysis from AST data
- **Low Latency**: Flash Live provides near-instant voice responses critical for interview experience

---

## Architecture

### Structural Grounding Pipeline

<p align="center">
  <img src="docs/diagram-profile.png" alt="Structural Grounding Pipeline" />
</p>

### Data Flow

1. **Commit Ingestion**: Octokit fetches user's GitHub commit history (configurable date range)
2. **AST Parsing**: Tree-sitter parses each file diff, extracts function definitions, import statements, control flow complexity
3. **Evidence Aggregation**: Group commits by technology, calculate usage counts, identify patterns (e.g., React hooks, async/await, dependency injection)
4. **Metric Generation**: Gemini Pro receives aggregated AST data, outputs structured metrics (JSON schema validated)
5. **Mission Extraction**: Clustering algorithm groups related commits into "missions" (cohesive work units)
6. **Profile Persistence**: Store all metrics, missions, tech stack in Prisma-managed PostgreSQL
7. **Voice Twin Context**: Build system prompt from profile data, initialize Gemini Live session
8. **Interview Loop**: Real-time audio streaming (WebRTC → Gemini Live → Web Audio API)

### Event-Driven Orchestration

- **NestJS EventEmitter2**: Coordinates 9-stage analysis pipeline (FETCHING_COMMITS → ANALYZING_COMMITS → PERSISTING_DATA → GENERATING_MISSIONS → AI_ANALYSIS → TECH_STACK_DNA → ...)
- **Job Tracking**: Real-time progress UI with stage-level updates
- **Cross-Module Events**: Emit events for triggering downstream services (e.g., `ANALYSIS_PERSISTED` → trigger Tech Stack DNA generation)

---

## Tech Stack

**Backend (Analyzer API)**

- NestJS (TypeScript framework)
- Tree-sitter (multi-language AST parser)
- Octokit (GitHub API client)
- Prisma ORM
- PostgreSQL (profile data, metrics, missions)
- EventEmitter2 (event-driven pipeline)

**Frontend (Web)**

- Next.js 16 (App Router)
- React 19
- TanStack Query (data fetching)
- Three.js (3D voice visualizer)
- Web Audio API (Gemini Live integration)
- Tailwind CSS + DaisyUI

**AI/ML**

- Gemini 3
- Gemini Live API
- Context caching for AST analysis

**Parsers**

- tree-sitter-typescript
- tree-sitter-python
- tree-sitter-javascript
- tree-sitter-go
- tree-sitter-rust
- tree-sitter-php
- tree-sitter-vue
- tree-sitter-zig
- tree-sitter-json

**Infrastructure**

- Nx Monorepo (build orchestration)
- Google Cloud Storage (commit cache)
- Better Auth (GitHub OAuth)

---

## Installation

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- GitHub OAuth App (for authentication)
- Google AI Studio API Key (for Gemini)

### Clone & Install

```bash
git clone https://github.com/yourusername/verified-prof.git
cd verified-prof
npm install
```

### Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

```

---

## Environment Variables

Create `.env` in project root:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/verified_prof

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WORKER_SERVICE_URL=http://localhost:4200
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4200

# Auth
BETTER_AUTH_SECRET=<generate-random-32-char-string>
BETTER_AUTH_URL=http://localhost:3000

# GitHub OAuth
GITHUB_CLIENT_ID=<your-github-oauth-app-id>
GITHUB_CLIENT_SECRET=<your-github-oauth-secret>

# Google Cloud / Gemini
GOOGLE_PROJECT_ID=<your-gcp-project-id>
GOOGLE_PROJECT_REGION=us-central1
GOOGLE_BUCKET_NAME=<your-gcs-bucket-name>
GOOGLE_AI_STUDIO_API_KEY=<your-gemini-api-key>
GOOGLE_APPLICATION_CREDENTIALS=<path-to-service-account-json>
```

**Generate Secrets:**

```bash
# BETTER_AUTH_SECRET
openssl rand -base64 32

# GitHub OAuth App: https://github.com/settings/developers
# Google AI Studio: https://aistudio.google.com/apikey
```

---

## Running Locally

### Start Backend (Analyzer API)

```bash
npm run dev:zer
# Runs on http://localhost:4200
```

### Start Frontend (Web)

```bash
npm run dev:web
# Runs on http://localhost:3000
```

### Hot Reload

Both services support hot reload. Changes to shared libraries (`@verified-prof/shared`) automatically rebuild and reload.

---

## Demo Instructions for Judges

### 1. Connect GitHub

- Visit `http://localhost:3000`
- Click "Connect with GitHub"
- Authorize verified.prof to read repository data

### 2. Trigger Analysis

- Analysis triggered automatically
- Watch real-time progress indicator (9 stages):
  - Fetching commits from GitHub
  - Parsing code with Tree-sitter
  - Extracting AST metrics
  - Running Gemini 3 analysis
  - Generating missions and tech stack
- Expected duration: 2-5 minutes for typical developer profile

### 3. View Verified Profile

- After analysis completes, profile page auto-loads
- **Core Metrics**: Code Impact score, Cycle Time, Logic Density, Seniority Rank
- **Tech Stack DNA**: Languages with expertise percentages, learning curve trend
- **Mission Timeline**: Auto-generated project summaries with design patterns used
- **Technology Stack**: Detected frameworks/databases with mastery levels (click to expand evidence)

### 4. Interview the Voice Twin

- Click **"Live Interview"** button (or visit `/:slug?live=true`)
- Grant microphone permissions when prompted
- **Try these questions:**
  - "What's your experience with [technology from profile]?"
  - "Tell me about your most complex project"
  - "How do you approach system architecture?"
  - "What design patterns do you use regularly?"
- **Listen for grounded responses**: Twin cites specific commits, dates, repositories
- **Test hallucination resistance**: Ask about tech NOT in profile (Twin should acknowledge limitation)

### 5. Share Profile

- Copy profile URL (`/:slug`)
- Open in incognito/private window to see public view
- Share with others to demonstrate portability

### Key Observations for Judges

- **No manual input**: Developer never writes bio or lists skills—all extracted from code
- **Traceable claims**: Every metric/mission links to actual commits
- **Voice naturalness**: Gemini Live provides human-like interview experience
- **Technical depth**: Responses reference specific patterns (e.g., "I used the Repository pattern in your e-commerce mission...")

---

## What Makes This Different

### 1. Structural Grounding = No Hallucinations

Traditional AI agents use embeddings or RAG over unstructured text (résumés, job descriptions). These systems hallucinate because LLMs are probabilistic—they predict plausible tokens, not truth.

**verified.prof** constrains AI reasoning with AST-derived facts:

- Tree-sitter parses code into syntax trees (concrete, deterministic)
- We extract objective metrics: cyclomatic complexity, import counts, function signatures
- Gemini receives **structured data** (JSON), not prose
- Voice Twin's context is 100% commit-backed—it cannot invent experience

**Example:**

- ❌ **Traditional AI**: "I have 5 years of React experience" (unverifiable claim)
- ✅ **verified.prof Twin**: "I've used React in 47 commits across 3 projects, primarily hooks-based components with Context API for state management" (links to commits)

### 2. Action Agent, Not Chatbot

The Voice Twin isn't a customer support bot—it's a technical interview proxy. Recruiters ask real questions, get nuanced answers:

- "How do you handle database migrations?" → Twin references Prisma migration patterns in commits
- "Explain your API design philosophy" → Twin discusses RESTful controllers detected in AST

This is an **agentic workflow** where AI acts on behalf of the developer using verified knowledge.

### 3. Developer-Centric Trust

Most hiring tools serve employers (ATS, screening bots). **verified.prof** gives developers ownership:

- Public profile with shareable URL (like LinkedIn, but verified)
- No manual skill tagging—work speaks for itself

### 4. Real-Time Voice with Gemini Live

Asynchronous chat breaks interview flow. Recruiters need conversational AI that feels human. Gemini Live API provides:

- Sub-second voice latency (critical for natural dialogue)
- Native audio processing (no TTS/STT middleware)
- Interruption handling (recruiter can cut in mid-response)

---

## Roadmap

**Phase 1: Multi-VCS Support** (8 weeks)

- GitLab, Bitbucket, Gitea integrations
- Self-hosted repository support

**Phase 2: Advanced Metrics** (6 weeks)

- Test coverage analysis (detect `test/*.spec.ts` patterns)
- Performance regression detection (benchmark tracking)
- Security vulnerability correlation (CVE mapping)

**Phase 3: Recruiter Portal** (10 weeks)

- Bulk candidate screening
- Custom interview question templates
- Comparative analytics (benchmark developers)

**Phase 4: Enterprise** (12 weeks)

- GDPR compliance (right to deletion, data export)
- SSO/SAML authentication
- On-premise deployment option
- SLA guarantees

**Phase 5: Beyond Code** (exploratory)

- Stack Overflow contribution analysis
- Open-source impact scoring (GitHub stars, PR merges)
- Technical writing evaluation (Medium, dev.to)

---

### Development Setup

```bash
# Install dependencies
npm install

# Start dev servers
npm run dev:zer  # Backend
npm run dev:web  # Frontend

```

### Code Standards

- Follow [AGENTS.md](./AGENTS.md) coding rules

---

**Built with Gemini 3 for Google AI Hackathon 2026**
