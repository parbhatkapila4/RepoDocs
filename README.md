<div align="center">

# RepoDoc

### The AI infrastructure for understanding code.

**Connect any GitHub repository. Ask questions in plain English. Get answers with exact file and line references.**

[Live Demo](https://repodoc.parbhat.dev/) • [Get Started](https://repodoc.parbhat.dev/sign-up) • [Pricing](https://repodoc.parbhat.dev/pricing)

<br />

![RepoDoc Demo](./public/repodoc.png)

</div>

---

## The Problem

Developers spend **~80% of their time** reading and understanding code rather than writing it.

Onboarding to new codebases takes weeks. Finding where specific logic lives means grep-ing through thousands of files. Documentation is always outdated.

## The Solution

RepoDoc indexes your entire codebase into a vector database, then lets you query it conversationally with AI.

- Ask *"How does authentication work?"* → Get the answer with links to `src/lib/auth.ts:45-89`
- Ask *"Where are API rate limits configured?"* → Instantly see the relevant files
- Generate production-ready READMEs and technical docs in one click

**No more digging through files. No more outdated wikis. Just ask.**

---

## How It Works

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   1. CONNECT          2. INDEX              3. QUERY                    │
│   ───────────         ─────────             ─────────                   │
│   Paste your          Every file gets       Ask anything.               │
│   GitHub URL          summarized, embedded  RAG retrieves relevant      │
│                       and stored in         code + LLM generates        │
│                       PostgreSQL/pgvector   answers with citations      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Under the hood:**

1. **Ingestion** → LangChain's `GithubRepoLoader` pulls all files from your repo
2. **Summarization** → Each file is summarized by Gemini to capture its purpose
3. **Embedding** → Summaries are converted to 768-dim vectors using `text-embedding-004`
4. **Storage** → Vectors stored in PostgreSQL with pgvector extension for similarity search
5. **Retrieval** → When you ask a question, we embed your query and find the top 5 most similar code chunks
6. **Generation** → Retrieved context + your question → Gemini 2.5 Flash generates a detailed answer

---

## Features

### 💬 Conversational Code Search

Chat with your codebase like you'd chat with a senior engineer who knows every line. Ask follow-up questions. Get code snippets with syntax highlighting. See exactly which files informed each answer.

### 📄 One-Click Documentation

Generate comprehensive technical documentation from your codebase automatically. The AI analyzes your code structure, patterns, and architecture to produce docs that actually reflect your implementation.

### 📝 README Generation

Get professional README files generated from your code. Includes proper sections for installation, usage, API references, and more — all inferred from your actual implementation.

### 📊 Repository Analytics

Visualize your codebase at a glance:
- Language distribution with percentages
- File counts and project metrics
- Stars, forks, and activity from GitHub
- Dependency insights

### 🔗 Shareable Documentation

Generate public links to share your documentation with teammates, contributors, or the world. Each link is tokenized and can be revoked anytime.

### 🔄 Iterative Refinement

Don't like something in the generated docs? Ask the AI to modify it. *"Add a troubleshooting section"* or *"Update the API examples"* — the docs evolve through conversation.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router, React 18) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4.1, Radix UI |
| **State** | Redux Toolkit |
| **Database** | PostgreSQL + pgvector |
| **ORM** | Prisma 6 |
| **AI/LLM** | Google Gemini 2.5 Flash, OpenRouter |
| **Embeddings** | text-embedding-004 (768 dimensions) |
| **Auth** | Clerk |
| **Payments** | Stripe |
| **Forms** | React Hook Form + Zod |
| **Animation** | Motion (Framer Motion) |
| **Testing** | Jest, React Testing Library |
| **Deployment** | Vercel |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              NEXT.JS APP ROUTER                              │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │    Chat     │  │  Dashboard  │  │    Docs     │  │      README         │  │
│  │   Page      │  │    Page     │  │    Page     │  │    Generation       │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                │                     │            │
│         └────────────────┴────────────────┴─────────────────────┘            │
│                                    │                                         │
│                           ┌────────▼────────┐                                │
│                           │   API Routes    │                                │
│                           │                 │                                │
│                           │  /api/query     │ ← RAG Pipeline                 │
│                           │  /api/search    │ ← Vector Search                │
│                           │  /api/analytics │ ← Metrics Aggregation          │
│                           └────────┬────────┘                                │
└────────────────────────────────────┼─────────────────────────────────────────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
          ▼                          ▼                          ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────────┐
│    PostgreSQL       │  │    GitHub API       │  │      AI Services        │
│    + pgvector       │  │    (Octokit)        │  │                         │
│                     │  │                     │  │  • Gemini 2.5 Flash     │
│  • Users            │  │  • Repo metadata    │  │  • text-embedding-004   │
│  • Projects         │  │  • File contents    │  │  • OpenRouter fallback  │
│  • Embeddings       │  │  • Languages        │  │                         │
│  • Docs/READMEs     │  │  • Stats            │  │                         │
│  • Share tokens     │  │                     │  │                         │
└─────────────────────┘  └─────────────────────┘  └─────────────────────────┘
```

---

## Database Schema

```prisma
model User {
  id           String    @id @default(uuid())
  emailAddress String    @unique
  credits      Int       @default(150)
  plan         String    @default("starter")  // starter | professional | enterprise
  projects     Project[]
}

model Project {
  id                   String                 @id @default(uuid())
  name                 String
  repoUrl              String
  userId               String
  sourceCodeEmbiddings SourceCodeEmbiddings[]
  docs                 Docs?
  readme               Readme?
}

model SourceCodeEmbiddings {
  id               String                  @id @default(uuid())
  fileName         String
  sourceCode       String
  Summary          String
  summaryEmbedding Unsupported("vector")?  // pgvector
  projectId        String
}

model Docs {
  id          String      @id @default(uuid())
  content     String
  projectId   String      @unique
  qnaHistory  DocsQna[]
  publicShare DocsShare?
}

model Readme {
  id          String       @id @default(uuid())
  content     String  
  projectId   String       @unique
  qnaHistory  ReadmeQna[]
  publicShare ReadmeShare?
}
```

---

## RAG Pipeline

The core intelligence lives in `src/lib/rag.ts`:

```typescript
// 1. Embed the user's question
const queryEmbedding = await getGenerateEmbeddings(query);

// 2. Vector similarity search with pgvector
const results = await prisma.$queryRaw`
  SELECT 
    "fileName",
    "sourceCode",
    "Summary",
    1 - ("summaryEmbedding" <=> ${queryEmbedding}::vector) as similarity
  FROM "SourceCodeEmbiddings"
  WHERE "projectId" = ${projectId}
  ORDER BY "summaryEmbedding" <=> ${queryEmbedding}::vector
  LIMIT 5
`;

// 3. Build context from retrieved chunks
const codeContext = results.map((code, idx) => `
  [Source ${idx + 1}: ${code.fileName}] (Relevance: ${(code.similarity * 100).toFixed(1)}%)
  Summary: ${code.summary}
  Code: ${code.sourceCode.slice(0, 1000)}
`).join('\n\n');

// 4. Generate answer with Gemini
const answer = await openrouterChatCompletion({
  model: "google/gemini-2.5-flash",
  messages: [
    { role: "system", content: systemPrompt + codeContext },
    ...conversationHistory,
    { role: "user", content: question }
  ],
  temperature: 0.3
});
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL with pgvector extension
- GitHub account
- Clerk account
- Google AI API key (Gemini)

### Installation

```bash
# Clone the repository
git clone https://github.com/parbhatkapila4/repodoc.git
cd repodoc

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/repodoc"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...

# AI Services
GOOGLE_API_KEY=your_gemini_api_key
OPENROUTER_API_KEY=your_openrouter_key

# GitHub
GITHUB_TOKEN=ghp_...

# Stripe (Optional)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Open Prisma Studio
npm run db:studio
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint
```

---

## Project Structure

```
repodoc/
├── src/
│   ├── app/
│   │   ├── (app)/              # Landing page
│   │   ├── (auth)/             # Sign in/up, user sync
│   │   ├── (protected)/        # Authenticated routes
│   │   │   ├── chat/           # AI chat interface
│   │   │   ├── dashboard/      # Project management
│   │   │   ├── docs/           # Documentation viewer
│   │   │   ├── readme/         # README editor
│   │   │   ├── analytics/      # Platform analytics
│   │   │   └── search/         # Semantic search
│   │   └── api/
│   │       ├── query/          # RAG endpoint
│   │       ├── search/         # Vector search
│   │       ├── analytics/      # Metrics API
│   │       ├── create-checkout/# Stripe checkout
│   │       └── webhooks/       # Clerk & Stripe webhooks
│   ├── components/
│   │   ├── ui/                 # Radix-based primitives
│   │   └── landing/            # Marketing components
│   ├── lib/
│   │   ├── rag.ts              # RAG implementation
│   │   ├── github.ts           # GitHub integration
│   │   ├── gemini.ts           # AI embeddings & generation
│   │   ├── openrouter.ts       # LLM fallback
│   │   ├── prisma.ts           # Database client
│   │   ├── actions.ts          # Server actions
│   │   └── rate-limiter.ts     # API protection
│   └── hooks/                  # Custom React hooks
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Migration history
└── __tests__/                  # Jest test suites
```

---

## Pricing

| Plan | Price | Projects | Features |
|------|-------|----------|----------|
| **Starter** | $10/mo | 3 | AI chat, README generation, docs generation, basic analytics |
| **Professional** | $20/mo | 10 | Everything in Starter + public sharing, priority processing, email support |
| **Enterprise** | $49/mo | Unlimited | Everything in Professional + team features, SLA, custom integrations |

---

## API Reference

### POST `/api/query`

Query your codebase with natural language.

```typescript
// Request
{
  "projectId": "uuid",
  "question": "How does authentication work?",
  "conversationHistory": [
    { "role": "user", "content": "previous question" },
    { "role": "assistant", "content": "previous answer" }
  ]
}

// Response
{
  "answer": "Authentication in this codebase is handled by...",
  "sources": [
    {
      "fileName": "src/lib/auth.ts",
      "similarity": 0.89,
      "summary": "Handles user authentication..."
    }
  ]
}
```

### POST `/api/search`

Semantic search across your codebase.

```typescript
// Request
{
  "projectId": "uuid",
  "query": "rate limiting",
  "limit": 10
}

// Response
{
  "results": [
    {
      "fileName": "src/lib/rate-limiter.ts",
      "sourceCode": "...",
      "summary": "...",
      "similarity": 0.92
    }
  ]
}
```

---

## Security

- **Authentication**: All routes protected by Clerk middleware
- **Input validation**: Zod schemas on all API inputs
- **SQL injection**: Prevented by Prisma parameterized queries
- **Rate limiting**: Token bucket algorithm on API endpoints
- **XSS protection**: Next.js built-in escaping
- **CSRF protection**: Same-origin verification

---

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

```bash
# Fork the repo
git checkout -b feature/your-feature
git commit -m "Add your feature"
git push origin feature/your-feature
# Open a PR
```

---

## Roadmap

- [ ] Support for GitLab and Bitbucket
- [ ] Self-hosted deployment option
- [ ] Team workspaces with shared projects
- [ ] VS Code extension
- [ ] GitHub App for automatic syncing
- [ ] Custom embedding models
- [ ] Streaming responses


---

<div align="center">

**Built by [Parbhat Kapila](https://github.com/parbhatkapila4)**

[Website](https://www.parbhat.dev/) • [Twitter](https://x.com/Parbhat03) • [Email](mailto:parbhat@parbhat.dev)

</div>
