# RepoDoc

**AI-powered documentation generation and codebase Q&A for GitHub repositories.**

Transform your GitHub repos into queryable knowledge bases with automatic README generation, comprehensive documentation, and an intelligent chat interface.

🔗 **Live Demo**: https://repodoc.parbhat.dev/

---

## What This Does

RepoDoc analyzes your GitHub repository and provides:

1. **RAG-Powered Codebase Chat** - Ask questions about your code and get accurate answers with source references
2. **Automatic README Generation** - AI-generated README files based on your actual codebase
3. **Comprehensive Documentation** - Detailed technical documentation with API references and architecture overviews
4. **Repository Insights** - GitHub statistics, language breakdown, and repository metadata

---

## Key Features

### ✅ Core Functionality

- **Vector-Based Code Search** - Uses pgvector for semantic similarity search across your codebase
- **AI Code Summarization** - Summarizes each file using Google Gemini Flash and OpenRouter
- **Embedding Generation** - Creates 768-dimensional embeddings with Gemini Embedding-001
- **Interactive Chat Interface** - Query your codebase in natural language with context-aware responses
- **Automatic Documentation** - Generates professional README and docs from code analysis
- **Share Links** - Create public shareable links for your documentation

### 🛠️ Production-Ready Features

- **Error Handling & Retry Logic** - Automatic retries with exponential backoff for API calls
- **Intelligent Caching** - In-memory caching for embeddings and query results (Redis-ready)
- **Rate Limiting** - Built-in rate limiting to prevent API abuse
- **Cost Tracking** - Monitor API usage and estimated costs
- **Batch Processing** - Processes large repositories in manageable batches
- **Responsive UI** - Mobile-first design with dark mode

---

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL with pgvector extension
- **ORM**: Prisma
- **Authentication**: Clerk
- **AI/ML**: 
  - Google Gemini (embedding-001 for embeddings, gemini-2.5-flash for generation)
  - OpenRouter API (multi-model support)
- **Code Analysis**: LangChain GitHub Loader
- **Deployment**: Vercel-ready

---

## Architecture

```
User uploads GitHub repo URL
         ↓
LangChain loads repository files
         ↓
Each file → AI summarization (OpenRouter)
         ↓
Summary → Vector embedding (Gemini)
         ↓
Store in PostgreSQL with pgvector
         ↓
Generate README & Docs (AI)
         ↓
User can query via RAG system
```

### RAG Query Flow

```
User asks question
         ↓
Question → Vector embedding
         ↓
Cosine similarity search in PostgreSQL
         ↓
Retrieve top 5 relevant code snippets
         ↓
Build context + conversation history
         ↓
Send to AI (Gemini Flash)
         ↓
Return answer with source references
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+ with pgvector extension
- Clerk account (for authentication)
- Google AI API key OR OpenRouter API key

### Installation

```bash
# Clone the repository
git clone https://github.com/parbhatkapila4/RepoDocs.git
cd RepoDocs

# Install dependencies
npm install

# Set up environment variables
cp src/env.example .env.local
```

### Environment Variables

Create a `.env.local` file with:

```bash
# Database (required)
DATABASE_URL="postgresql://user:password@localhost:5432/repodoc?pgbouncer=true"

# Authentication (required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# AI APIs (at least one required)
GEMINI_API_KEY="..."           # For embeddings and generation
OPENROUTER_API_KEY="..."        # For code summarization

# GitHub (required for private repos)
GITHUB_TOKEN="ghp_..."          # Personal access token

# Optional: Webhooks
CLERK_WEBHOOK_SECRET="whsec_..."
```

### Database Setup

```bash
# Install pgvector extension in your PostgreSQL database
CREATE EXTENSION IF NOT EXISTS vector;

# Run Prisma migrations
npx prisma migrate deploy

# OR run custom migration with indexes
psql -U your_user -d your_database -f prisma/migrations/add_indexes_and_query_table.sql

# Generate Prisma client
npx prisma generate
```

### Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

---

## Usage

### 1. Create a Project

1. Sign in with Clerk authentication
2. Click "Create" in the sidebar
3. Enter project name and GitHub repository URL
4. The system will automatically:
   - Load all repository files
   - Generate summaries for each file
   - Create vector embeddings
   - Store in PostgreSQL
   - Generate README and comprehensive docs

### 2. Chat with Your Codebase

1. Select a project from the sidebar
2. Navigate to "Chat with Code"
3. Ask questions like:
   - "How does authentication work?"
   - "Explain the database schema"
   - "What API endpoints are available?"
4. Get AI-powered answers with source code references

### 3. View & Share Documentation

- **README**: Auto-generated README files at `/readme`
- **Docs**: Comprehensive documentation at `/docs`
- **Share**: Create public shareable links for your documentation

---

## API Endpoints

### POST `/api/query`

Query your codebase using RAG.

**Request:**
```json
{
  "projectId": "project-uuid",
  "question": "How does authentication work?",
  "conversationHistory": [
    { "role": "user", "content": "previous question" },
    { "role": "assistant", "content": "previous answer" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "answer": "Authentication is implemented using...",
  "sources": [
    {
      "fileName": "src/lib/auth.ts",
      "similarity": 0.89,
      "summary": "Handles user authentication..."
    }
  ],
  "metadata": {
    "sourcesCount": 3,
    "projectName": "MyProject"
  }
}
```

### GET `/api/query?projectId=xxx`

Get query history for a project.

---

## Performance Characteristics

Based on real-world usage:

| Metric | Value | Notes |
|--------|-------|-------|
| Indexing Speed | ~10-15 files/batch | Processes in batches to avoid rate limits |
| Query Latency (p50) | ~2-4 seconds | Includes embedding + search + AI generation |
| Embedding Dimensions | 768 | Gemini embedding-001 |
| Max Context Window | ~8000 tokens | Limited by OpenRouter models |
| Cache Hit Rate | Varies | Depends on query patterns |

---

## Cost Optimization

### API Costs (Approximate)

- **Embedding Generation**: ~$0.00001 per file
- **Code Summarization**: ~$0.00001 per 1K tokens (Gemini Flash)
- **RAG Queries**: ~$0.00005 per query

### For a typical 100-file repository:
- Initial indexing: ~$0.01
- Per query: ~$0.00005

### Tips to Reduce Costs:
- Uses caching to avoid regenerating embeddings
- Batch processing to minimize API calls
- Gemini Flash for most operations (cheaper than GPT-4)
- Only process changed files on updates

---

## Production Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Environment Variables to Set:

- All database and API keys from `.env.local`
- Ensure PostgreSQL with pgvector is accessible
- Set `NEXT_PUBLIC_*` variables in Vercel dashboard

### Database Considerations

1. **Connection Pooling**: Use PgBouncer for better connection management
2. **Vector Index**: HNSW index is created for fast similarity search
3. **Backups**: Regular backups recommended for production

---

## Limitations & Roadmap

### Current Limitations

1. **No Streaming Responses** - Responses are generated in full before returning
2. **Single Language** - Best results with English codebases
3. **Large Repositories** - Very large repos (>1000 files) may take time to index
4. **No Real-time Sync** - No webhook-based automatic re-indexing (manual refresh required)

### Planned Improvements

- [ ] **Streaming AI Responses** - Real-time streaming for better UX
- [ ] **Background Job Queue** - Use BullMQ/Inngest for async processing
- [ ] **Progress Tracking** - Real-time indexing progress updates
- [ ] **GitHub Webhooks** - Auto-sync on code changes
- [ ] **Multi-language Support** - Better handling of non-English comments
- [ ] **Code Diff Analysis** - Only process changed files on updates
- [ ] **Export Options** - Export docs as Markdown, PDF, or static site
- [ ] **Team Collaboration** - Share projects with team members

---

## Development

### Project Structure

```
src/
├── app/
│   ├── (app)/              # Landing page
│   ├── (auth)/             # Auth pages (sign-in, sign-up)
│   ├── (protected)/        # Protected routes
│   │   ├── chat/           # RAG chat interface
│   │   ├── create/         # Project creation
│   │   ├── dashboard/      # Repository info
│   │   ├── docs/           # Documentation viewer
│   │   └── readme/         # README viewer
│   └── api/
│       ├── query/          # RAG query endpoint
│       └── webhooks/       # Clerk webhooks
├── components/
│   ├── landing/            # Landing page components
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── actions.ts          # Server actions
│   ├── cache.ts            # Caching layer
│   ├── errors.ts           # Error handling utilities
│   ├── gemini.ts           # Google Gemini integration
│   ├── github.ts           # GitHub repo loading & indexing
│   ├── openrouter.ts       # OpenRouter API client
│   ├── prisma.ts           # Prisma client
│   ├── queries.ts          # Database queries
│   ├── rag.ts              # RAG query system
│   └── rate-limiter.ts     # Rate limiting
└── hooks/                  # Custom React hooks
```

### Testing

```bash
# Run linter
npm run lint

# Type checking
npx tsc --noEmit
```

---

## Contributing

Contributions are welcome! Areas that need help:

1. **Performance Optimization** - Improve indexing speed
2. **Testing** - Add unit and integration tests
3. **Documentation** - Improve code documentation
4. **Features** - Implement items from the roadmap

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) file for details

---

## Support & Contact

- **Issues**: [GitHub Issues](https://github.com/parbhatkapila4/RepoDocs/issues)
- **LinkedIn**: [Parbhat Kapila](https://www.linkedin.com/in/parbhat-kapila/)
- **Website**: https://repodoc.parbhat.dev/

---

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Authentication by [Clerk](https://clerk.com/)
- Vector search powered by [pgvector](https://github.com/pgvector/pgvector)
- AI models from [Google Gemini](https://ai.google.dev/) and [OpenRouter](https://openrouter.ai/)

---

**Made with ❤️ by [@parbhatkapila4](https://github.com/parbhatkapila4)**
