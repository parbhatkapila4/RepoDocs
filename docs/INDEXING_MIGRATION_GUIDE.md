> **Historical work log - do not follow these instructions.**
> Kept for history, not as documentation. Known to be stale in at least three
> ways: it calls Upstash Redis "required" (it is optional, with an in-memory
> fallback), it tells you to generate a migration that already exists
> (`20260219210000_add_indexing_job`), it says the worker picks jobs up "within
> 1 minute" (the cron is daily at `0 6 * * *`, plus on-demand kicks), and its
> "FIX 3" says token encryption was *not* implemented - it since has been
> (AES-256-GCM, `src/lib/secret-crypto.ts`). See `README.md` for current state.

# Indexing Job System - Migration Guide

This guide explains the changes made to implement a production-grade serverless job leasing system.

## 🎯 What Changed

The codebase now uses a **Postgres-backed job queue** with **Vercel cron triggers** instead of fire-and-forget async calls.

### Architecture

- **Source of Truth**: Postgres `IndexingJob` table
- **Coordination**: Postgres lease-based locking (lockedAt/lockedBy)
- **Trigger**: Vercel cron (every minute via vercel.json)
- **Workers**: Multiple workers can run concurrently (no global lock)
- **Redis**: ONLY for auxiliary locking (NOT used for job state)

---

## 📦 Database Migration

### Step 1: Generate Prisma Client

```bash
npx prisma generate
```

### Step 2: Apply Database Changes

**Option A: Using Prisma Migrate (Recommended for production)**
```bash
npx prisma migrate dev --name add_indexing_jobs
```

**Option B: Using Push (For development/testing)**
```bash
# WARNING: May cause data loss if User table columns differ
npx prisma db push --accept-data-loss
```

### Step 3: Verify Schema

The following should be created:

- **Table**: `IndexingJob` with fields: id, projectId, status, progress, error, lockedAt, lockedBy, createdAt, updatedAt
- **Enum**: `IndexingJobStatus` with values: queued, processing, completed, failed
- **Relation**: `Project.indexingJob` (one-to-one)
- **Indexes**: `[status, lockedAt]`, `[projectId]`

---

## 🔐 Environment Variables

Add to `.env`:

```env
# Upstash Redis (required for distributed locking)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=AxxxxxxxxxxxxxxxxxxxQ==

# Existing variables (keep as-is)
DATABASE_URL=postgresql://...
GEMINI_API_KEY=...
GITHUB_TOKEN=...
```

---

## 🚀 Deployment Checklist

### 1. Deploy to Vercel

The `vercel.json` cron configuration will automatically:
- Trigger `/api/indexing-worker` every minute
- Process one job per worker invocation
- Allow multiple workers to run concurrently (different jobs)

### 2. Verify Cron Setup

After deployment:
1. Go to Vercel Dashboard → Your Project → Cron Jobs
2. Verify: `* * * * *` schedule for `/api/indexing-worker`
3. Check logs for worker invocations

### 3. Test the System

**Create a project:**
```bash
# Project creation now queues an IndexingJob (status=queued)
# Worker picks it up within 1 minute
```

**Check job status:**
```sql
SELECT * FROM "IndexingJob" WHERE "projectId" = 'your-project-id';
```

**Monitor logs:**
```
[Worker worker-sfo1-1234567890-abc123] Invoked
[Worker worker-sfo1-1234567890-abc123] Processing job xxx for project yyy
[Worker worker-sfo1-1234567890-abc123] Job xxx progress: 25%
[Worker worker-sfo1-1234567890-abc123] Job xxx completed successfully
```

---

## 🔧 3 FIXES APPLIED

### FIX 1: Honest Documentation (Non-Resumability)

**Problem**: Comments incorrectly implied indexing could resume from where it left off.

**Fix**: Updated all comments to explicitly state:
- `indexGithubRepository()` ALWAYS runs from the beginning
- NO cursor/checkpoint/resume capability exists
- If worker times out or crashes, entire indexing restarts
- This is acceptable for MVP with bounded repo sizes

**Files Changed**:
- `src/app/api/indexing-worker/route.ts` (lines 10-23)
- `src/lib/github.ts` (lines 37-48)
- `src/lib/actions-indexing.ts` (lines 109-113)
- `src/lib/actions.ts` (line 1218)

---

### FIX 2: Removed Global Worker Lock (Scalability)

**Problem**: Redis global lock (`worker:indexing:global`) limited system to one worker total.

**Fix**: Removed global lock entirely. Multiple workers can now run concurrently:
- Each worker processes ONE job per invocation
- Postgres lease-based locking prevents job conflicts
- Different jobs can be processed in parallel

**What Was Removed**:
- `WORKER_LOCK_KEY` constant
- `acquireLock()` / `releaseLock()` calls in worker
- Global coordination via Redis

**What Remains**:
- Postgres `lockedAt` / `lockedBy` fields (per-job locking)
- Lease expiry logic (5 minutes)
- Redis utilities (available for future use, but not used for job coordination)

**Files Changed**:
- `src/app/api/indexing-worker/route.ts` (removed lock acquisition logic)
- `src/lib/redis.ts` (utilities kept but not used for global locking)

---

### FIX 3: GitHub Token Security (Awareness Fix)

**Problem**: GitHub tokens were logged in plaintext, no security awareness signals.

**Fix**: 
1. **Never log token values** - Only log `Has token: true/false`
2. **Added TODO comments** at all token usage points:
   ```typescript
   // TODO: Encrypt GitHub tokens at rest using KMS / envelope encryption
   ```
3. **Security documentation** in function signatures

**What Was NOT Done** (intentionally):
- Token encryption implementation (future work)
- Schema changes (tokens still stored as plaintext)
- KMS integration (requires infrastructure setup)

**Files Changed**:
- `src/app/api/indexing-worker/route.ts` (lines 112-114, 126)
- `src/lib/github.ts` (lines 42-44)
- `src/lib/queries.ts` (line 162)
- `src/lib/actions.ts` (lines 583-584, 1219, 1342)

---

## 📊 Monitoring Queries

### Check Job Status Distribution
```sql
SELECT status, COUNT(*) as count
FROM "IndexingJob"
GROUP BY status;
```

### Find Stuck Jobs (Lease Expired)
```sql
SELECT *
FROM "IndexingJob"
WHERE status = 'processing'
  AND "lockedAt" < NOW() - INTERVAL '10 minutes';
```

### Recent Failures
```sql
SELECT "projectId", error, "updatedAt"
FROM "IndexingJob"
WHERE status = 'failed'
  AND "updatedAt" > NOW() - INTERVAL '24 hours'
ORDER BY "updatedAt" DESC;
```

### Average Indexing Duration
```sql
SELECT AVG("updatedAt" - "createdAt") as avg_duration
FROM "IndexingJob"
WHERE status = 'completed'
  AND "updatedAt" > NOW() - INTERVAL '7 days';
```

---

## 🐛 Troubleshooting

### Jobs Stuck in "queued"
- **Check**: Is cron running? (Vercel Dashboard → Cron Jobs)
- **Check**: Worker logs for errors
- **Fix**: Manually trigger: `curl https://your-app.vercel.app/api/indexing-worker`

### Jobs Stuck in "processing"
- **Likely**: Worker timed out (>60s on Vercel Hobby)
- **Fix**: Lease will expire after 5 minutes, job becomes eligible again
- **Long-term**: Upgrade to Vercel Pro (300s timeout)

### Worker Errors
- **Check**: Environment variables (UPSTASH_REDIS_*, DATABASE_URL, GEMINI_API_KEY)
- **Check**: GitHub token validity
- **Check**: Vercel function logs

### Duplicate Jobs
- **Prevented by**: `@unique` constraint on `projectId`
- **Behavior**: `upsert()` resets existing job to queued

---

## 🎓 Understanding the System

### Job Lifecycle

```
1. User creates project
   ↓
2. IndexingJob created (status=queued)
   ↓
3. Vercel cron triggers worker (every minute)
   ↓
4. Worker finds eligible job
   ↓
5. Worker leases job (status=processing, lockedAt=now, lockedBy=workerId)
   ↓
6. Worker calls indexGithubRepository() with progress callback
   ↓
7a. SUCCESS → status=completed, progress=100
7b. FAILURE → status=failed, error=message
7c. TIMEOUT → lease expires (5min) → job becomes eligible again
```

### Lease-Based Locking

```typescript
// Eligible jobs query
WHERE (
  (status = 'queued' AND lockedAt IS NULL)           // Never started
  OR
  (status = 'processing' AND lockedAt < 5_min_ago)  // Lease expired
)
```

This ensures:
- Only one worker processes a job at a time
- Crashed workers don't block jobs forever
- No need for global worker coordination

---

## 📝 Testing

### Local Testing (Without Cron)

```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Simulate cron
while true; do
  curl http://localhost:3000/api/indexing-worker
  sleep 60
done
```

### Manual Job Creation

```typescript
// In server action or API route
await prisma.indexingJob.create({
  data: {
    projectId: "test-project-id",
    status: "queued",
    progress: 0,
  },
});
```

### Manual Worker Trigger

```bash
curl https://your-app.vercel.app/api/indexing-worker
```

---

## 🚨 Important Notes

1. **Indexing is NOT resumable** - Always restarts from the beginning
2. **No global worker lock** - Multiple workers can run concurrently
3. **Postgres is source of truth** - Redis is only for auxiliary locking
4. **Tokens are NOT encrypted yet** - TODO item for production
5. **Vercel Hobby timeout is 60s** - Upgrade to Pro if needed
6. **Cron runs every minute** - Adjust in vercel.json if needed

---

## 📚 Files Modified

### Created (7 files)
- `src/lib/redis.ts` - Upstash REST client with lock primitives
- `src/app/api/indexing-worker/route.ts` - Serverless worker
- `src/lib/actions-indexing.ts` - Server actions for UI
- `vercel.json` - Cron configuration
- `INDEXING_MIGRATION_GUIDE.md` - This file

### Modified (4 files)
- `prisma/schema.prisma` - Added IndexingJob model
- `src/lib/queries.ts` - Replaced fire-and-forget with job queue
- `src/lib/actions.ts` - Replaced 3 fire-and-forget calls with job queue
- `src/lib/github.ts` - Added progress callback, security comments

---

## ✅ Verification Checklist

- [ ] Prisma migration applied
- [ ] Prisma client generated
- [ ] Environment variables set (UPSTASH_REDIS_*)
- [ ] Deployed to Vercel
- [ ] Cron job visible in Vercel Dashboard
- [ ] Created test project (IndexingJob created)
- [ ] Worker logs show job processing
- [ ] Job completes successfully (status=completed)
- [ ] Retry works (manually set status=failed, then retry)

---

## 🔮 Future Enhancements

1. **Token Encryption** - Use KMS or Vault for GitHub tokens
2. **Resumable Indexing** - Add checkpoint/cursor mechanism
3. **Job Priority** - Add priority field for urgent repos
4. **Dead Letter Queue** - Handle permanently failed jobs
5. **Metrics Dashboard** - Visualize job throughput/failures
6. **Rate Limiting** - Throttle user-triggered retries
7. **Batch Workers** - Process multiple jobs per invocation
