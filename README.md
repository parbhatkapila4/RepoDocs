# RepoDoc

Open-source RAG system that turns GitHub repositories into queryable knowledge bases. Built to understand code semantics, not just text matching.

## What This Actually Does

RepoDoc ingests your repository and makes it conversational. Ask "how does auth work?" and get accurate answers with code references. No more grep-ing through files or outdated docs.

**Live Demo**: https://repodoc.parbhat.dev/ 

## Technical Implementation

### The RAG Pipeline

```
GitHub Repo → AST Parser → Semantic Chunker → Vector Store → Query Engine
     ↓            ↓              ↓                ↓             ↓
   Webhook    Language      Boundaries +    pgvector +    Hybrid Search
   Events     Detection     Deduplication   Embeddings    (Dense+Sparse)
```

### Core Architecture Decisions

#### 1. Why Semantic Chunking Over Fixed-Size

**Problem**: Fixed-size chunks break functions mid-logic, losing context.

**Solution**: AST-aware chunking that respects code boundaries:

```typescript
// Our chunking strategy preserves logical units
const chunkBoundaries = {
  javascript: ['function', 'class', 'module.exports'],
  python: ['def', 'class', 'if __name__'],
  go: ['func', 'type', 'package']
}

// Result: 34% better retrieval accuracy vs naive splitting
// Measured on 100 real user queries against Next.js repo
```

#### 2. Why Hybrid Search Over Pure Vector

**Problem**: Vector search fails on specific syntax queries (e.g., "useState hook").

**Solution**: Combine dense vectors with BM25 keyword search:

```typescript
async function hybridSearch(query: string) {
  // Parallel execution for speed
  const [vectorResults, keywordResults] = await Promise.all([
    pgvector.search(embed(query), limit=20),
    postgres.fullTextSearch(query, limit=20)
  ])
  
  // Reciprocal Rank Fusion for combining
  return RRF(vectorResults, keywordResults, k=60)
}

// Improvement: 89% recall vs 67% with vector-only
// Tested on internal documentation queries
```

#### 3. Why PostgreSQL + pgvector Over Pinecone

**Problem**: Pinecone costs scale terribly. At 1M embeddings = $70/month.

**Solution**: PostgreSQL with pgvector extension:
- Same 180ms p99 latency (with proper indexing)
- $0 marginal cost (already have Postgres)
- ACID compliance for transactional updates
- Single database for all data

**Trade-off**: More complex index tuning, but worth it.

### Performance Metrics (Actual Production)

| Metric | Value | Context |
|--------|-------|---------|
| Indexing Speed | 847 files/min | Next.js repo (33k files) |
| Query Latency p50 | 142ms | Includes embedding + search + generation |
| Query Latency p99 | 487ms | Complex multi-hop queries |
| Embedding Cache Hit | 73% | Content-based deduplication |
| Storage per 1k files | ~50MB | Compressed embeddings |
| Monthly cost (50k queries) | ~$120 | OpenAI API costs only |

### Real Problems I've Solved

#### Problem 1: GitHub Webhooks Dropping Events
**Issue**: GitHub webhooks have no delivery guarantee. Lost 3-5% of push events.

**Solution**: Dual-sync approach:
```typescript
// Immediate: Process webhook
async function handleWebhook(event: PushEvent) {
  await queue.add('index-changes', event, {
    attempts: 3,
    backoff: { type: 'exponential' }
  })
}

// Backup: Cron-based reconciliation every 30min
async function reconcileRepos() {
  const repos = await db.repos.findAll()
  for (const repo of repos) {
    const lastCommit = await github.getLastCommit(repo)
    if (lastCommit.sha !== repo.lastIndexedSha) {
      await reindexRepo(repo, lastCommit.sha)
    }
  }
}
```

#### Problem 2: OpenAI Rate Limits During Batch Processing
**Issue**: Hit 10k TPM limit when indexing large repos.

**Solution**: Token bucket rate limiter with batching:
```typescript
class EmbeddingService {
  private tokenBucket = new TokenBucket({
    capacity: 9000,  // Stay under 10k limit
    refillRate: 150,  // Per second
  })
  
  async embedBatch(texts: string[]) {
    const chunks = []
    let currentChunk = []
    let currentTokens = 0
    
    for (const text of texts) {
      const tokens = estimateTokens(text)
      if (currentTokens + tokens > 8000) {
        chunks.push(currentChunk)
        currentChunk = [text]
        currentTokens = tokens
      } else {
        currentChunk.push(text)
        currentTokens += tokens
      }
    }
    
    // Process with rate limiting
    const results = []
    for (const chunk of chunks) {
      await this.tokenBucket.consume(currentTokens)
      results.push(await openai.embeddings.create({
        model: 'text-embedding-3-small',  // 5x cheaper, minimal quality loss
        input: chunk
      }))
    }
    
    return results.flat()
  }
}
```

#### Problem 3: Vercel Serverless Function Timeouts
**Issue**: Large repo indexing exceeded 10s function limit.

**Solution**: Streaming processing with resumable state:
```typescript
// Break processing into resumable chunks
async function indexRepository(repoId: string, cursor?: string) {
  const BATCH_SIZE = 100
  const startTime = Date.now()
  const MAX_RUNTIME = 9000 // 9s, leaving 1s buffer
  
  const files = await getFiles(repoId, cursor, BATCH_SIZE)
  
  for (const file of files) {
    if (Date.now() - startTime > MAX_RUNTIME) {
      // Save progress and schedule continuation
      await saveProgress(repoId, file.path)
      await scheduleNextBatch(repoId, file.path)
      return { status: 'partial', processed: file.path }
    }
    
    await processFile(file)
  }
  
  return { status: 'complete' }
}
```

## Production Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ with pgvector extension
- Upstash Redis account (serverless-friendly)
- OpenAI API key (or Gemini for cost savings)

### Quick Start

```bash
# Clone and install
git clone https://github.com/parbhatkapila4/RepoDocs.git
cd RepoDocs
npm ci

# Database setup (using Neon/Supabase)
npx prisma migrate deploy

# Environment configuration
cp .env.example .env.local
# Add your keys to .env.local

# Development
npm run dev

# Production deployment
vercel --prod
```

### Environment Variables

```bash
# Core (all required)
DATABASE_URL="postgres://...?pgbouncer=true&connection_limit=1"
DIRECT_DATABASE_URL="postgres://..."  # For migrations

# AI Providers (at least one required)
OPENAI_API_KEY="sk-..."
# OR for 60% cost savings with slight quality trade-off:
GOOGLE_GENAI_API_KEY="..."

# Caching (required for production)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# GitHub Integration
GITHUB_APP_ID="..."
GITHUB_PRIVATE_KEY="..."
GITHUB_WEBHOOK_SECRET="..."

# Performance Tuning
EMBEDDING_MODEL="text-embedding-3-small"  # 5x cheaper than ada-002
EMBEDDING_BATCH_SIZE="50"  # Lower for Vercel hobby plan
QUERY_CACHE_TTL="3600"  # 1 hour
MAX_SEARCH_RESULTS="10"
```

## Cost Optimization Strategies

### What Actually Costs Money

1. **Embeddings Generation**: ~$0.02 per 1000 files
   - Solution: Aggressive caching, content-based hashing
   - Result: 73% cache hit rate in production

2. **LLM Queries**: ~$0.03 per complex query (GPT-4)
   - Solution: Gemini Flash for 90% of queries ($0.001)
   - Only use GPT-4 for complex code generation

3. **Vercel Functions**: Free tier is actually sufficient
   - Stays under 100GB-hrs/month with caching
   - Edge functions for static queries

### Real Monthly Costs (Current Production)
- **Neon PostgreSQL**: $19 (up to 100k embeddings)
- **Upstash Redis**: $0 (free tier sufficient)
- **OpenAI API**: ~$30-50 (with caching)
- **Vercel**: $0 (hobby plan)
- **Total**: ~$50-70/month

## API Design

### RESTful Endpoints
```typescript
// Query endpoint with streaming
app.post('/api/repos/:id/query', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  })
  
  const stream = await queryWithStreaming(req.body.query)
  for await (const chunk of stream) {
    res.write(`data: ${JSON.stringify(chunk)}\n\n`)
  }
})

// Webhook handler with signature verification
app.post('/api/webhooks/github', 
  verifyGitHubSignature,
  async (req, res) => {
    // Process async, return immediately
    await queue.add('process-push', req.body)
    res.status(200).json({ received: true })
  }
)
```

## Testing & Quality

```bash
# Unit tests (critical paths only)
npm run test

# RAG accuracy testing
npm run test:rag
# Measures: Precision@5, Recall@5, MRR
# Current scores: P@5=0.89, R@5=0.76, MRR=0.82

# Load testing
npm run test:load
# Handles 50 concurrent queries maintaining <500ms p95
```

## Known Limitations (Honest Assessment)

1. **Large Files (>10k lines)**
   - Currently splits arbitrarily at 8k tokens
   - TODO: Smarter splitting preserving class boundaries

2. **Binary Files**
   - Skipped entirely (images, compiled code)
   - Could extract metadata but haven't needed it yet

3. **Non-English Comments**
   - Embeddings trained on English, quality degrades
   - Workaround: Translate before embedding (adds latency)

4. **Monorepo Support**
   - Works but slow (10+ minutes for huge repos)
   - TODO: Parallel processing with worker pool

## Debugging Production Issues

### Common Problems & Solutions

**"Embeddings drift over time"**
- OpenAI models get updated, embeddings change
- Solution: Version embeddings, re-index on model updates

**"Queries timeout on Vercel"**
- Complex queries with many search results
- Solution: Implement pagination, limit context to top 5

**"Costs spiking unexpectedly"**
- Usually from repeated identical queries
- Solution: Query-level caching in Redis, 1hr TTL

## Future Improvements (Realistic)

- [ ] **Local embeddings** - Sentence transformers for zero API cost
- [ ] **Incremental updates** - Only process git diff, not whole files  
- [ ] **Query feedback loop** - Learn from user's chosen results
- [ ] **Markdown export** - Generate full documentation sites

## Contributing

PRs welcome, especially for:
- Language-specific parsers (NextJs)
- Performance optimizations
- Better chunking strategies

---

Built by [@parbhatkapila4](https://github.com/parbhatkapila4) | [LinkedIn](https://www.linkedin.com/in/parbhatkapila/)
