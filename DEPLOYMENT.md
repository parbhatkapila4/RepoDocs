# Deployment Guide

This guide covers deploying RepoDoc to production.

## Prerequisites

- Vercel account (recommended) or any Node.js hosting
- PostgreSQL database with pgvector extension
- Clerk account for authentication
- Google AI / OpenRouter API keys

## Quick Deploy to Vercel

### 1. Prepare Database

You need a PostgreSQL database with pgvector extension. Options:

**Neon (Recommended)**
```bash
# Create account at neon.tech
# Create new project
# Enable pgvector extension in SQL Editor:
CREATE EXTENSION IF NOT EXISTS vector;
```

**Supabase**
```bash
# Create account at supabase.com
# Create new project
# pgvector is pre-installed
```

**Railway**
```bash
# Create account at railway.app
# Deploy PostgreSQL
# Connect and run:
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Run Migrations

```bash
# Using the database URL from your provider
DATABASE_URL="your-postgres-url" npx prisma migrate deploy

# Run custom migration for indexes
psql your-database-url -f prisma/migrations/add_indexes_and_query_table.sql
```

### 3. Deploy to Vercel

#### Option A: Deploy Button

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/parbhatkapila4/RepoDocs)

#### Option B: CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### 4. Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables:

#### Required Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db?pgbouncer=true
DIRECT_DATABASE_URL=postgresql://user:pass@host:5432/db

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# AI APIs
GEMINI_API_KEY=...
OPENROUTER_API_KEY=...

# GitHub (for private repos)
GITHUB_TOKEN=ghp_...
```

### 5. Set Up Webhooks

#### Clerk Webhook
1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/webhooks/clerk`
3. Subscribe to: `user.created`, `user.updated`, `user.deleted`
4. Copy signing secret to `CLERK_WEBHOOK_SECRET`

## Post-Deployment

### 1. Verify Health

```bash
curl https://your-domain.vercel.app/api/health
```

Should return:
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "healthy" },
    "cache": { "status": "healthy" },
    ...
  }
}
```

### 2. Test RAG Endpoint

```bash
curl -X POST https://your-domain.vercel.app/api/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "projectId": "...",
    "question": "How does authentication work?"
  }'
```

### 3. Monitor Performance

- Check Vercel Analytics
- Monitor database connections
- Watch API usage in Gemini/OpenRouter dashboards

## Optimization for Production

### 1. Database Connection Pooling

Use PgBouncer with Neon/Supabase:

```bash
# In .env
DATABASE_URL="postgresql://user:pass@host:5432/db?pgbouncer=true&connection_limit=1"
```

### 2. Enable Caching

For better performance, add Redis:

```bash
# Get Upstash Redis
# Add to environment variables:
REDIS_URL=redis://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

Then update `src/lib/cache.ts` to use Redis instead of in-memory cache.

### 3. Rate Limiting

Rate limiting is built-in. Adjust limits in `src/lib/rate-limiter.ts`:

```typescript
// Adjust these values based on your needs
const DEFAULT_LIMITS = {
  embedding: { maxRequests: 100, windowMs: 60000 },
  query: { maxRequests: 50, windowMs: 60000 },
  indexing: { maxRequests: 10, windowMs: 3600000 },
};
```

### 4. Cost Optimization

Monitor API costs:
- Check `/api/health` for cost tracking
- Use Gemini Flash instead of GPT-4 (cheaper)
- Enable caching to reduce embedding regeneration
- Implement incremental indexing for large repos

## Monitoring

### 1. Error Tracking

Add Sentry for production error tracking:

```bash
npm install @sentry/nextjs

# Initialize
npx @sentry/wizard -i nextjs

# Add SENTRY_DSN to environment variables
```

Update `src/lib/errors.ts` to use Sentry:

```typescript
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  Sentry.captureException(error, { extra: errorInfo });
}
```

### 2. Analytics

Add PostHog or Mixpanel:

```bash
npm install posthog-js

# Add to environment variables:
NEXT_PUBLIC_POSTHOG_KEY=...
NEXT_PUBLIC_POSTHOG_HOST=...
```

### 3. Uptime Monitoring

Use:
- UptimeRobot (free)
- Better Uptime
- Pingdom

Monitor these endpoints:
- `https://your-domain.vercel.app/api/health`
- `https://your-domain.vercel.app/`

## Scaling Considerations

### When to Scale

Consider scaling when:
- Database connections exceed 20-30 concurrent
- Query latency > 5 seconds consistently
- Memory usage > 512MB regularly
- Cost per month > $50

### How to Scale

1. **Upgrade Database**
   - Increase connection pool size
   - Add read replicas
   - Use connection pooler (PgBouncer)

2. **Add Redis**
   - Reduces database queries
   - Faster embedding retrieval
   - Better rate limiting

3. **Background Jobs**
   - Use Inngest or BullMQ
   - Process indexing asynchronously
   - Handle large repos better

4. **CDN & Edge**
   - Use Vercel Edge functions for static queries
   - Cache generated docs on CDN
   - Implement ISR for documentation pages

## Security Checklist

- [ ] All environment variables are set
- [ ] Database connection uses SSL
- [ ] Clerk webhooks are verified
- [ ] Rate limiting is enabled
- [ ] CORS is properly configured
- [ ] No sensitive data in logs
- [ ] Regular database backups enabled

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql "your-database-url"

# Check connection pooling
SELECT count(*) FROM pg_stat_activity;
```

### API Rate Limits

```bash
# Check rate limit status
curl https://your-domain.vercel.app/api/health

# Response includes rate limit info
```

### Slow Queries

```bash
# Check slow queries in PostgreSQL
SELECT query, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Support

If you encounter issues:

1. Check logs in Vercel Dashboard
2. Verify environment variables
3. Test database connection
4. Check API quotas (Gemini/OpenRouter)
5. Open an issue on GitHub

---

**Need help?** Contact [@parbhatkapila4](https://github.com/parbhatkapila4)

