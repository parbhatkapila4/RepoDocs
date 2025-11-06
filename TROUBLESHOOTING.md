# Troubleshooting Guide

## Documentation/README Generation Fails

If you're seeing errors like "Failed to regenerate docs" or "Failed to regenerate README", follow these steps:

### 1. Check Your Environment Variables

Make sure your `.env.local` file has these **required** API keys:

```bash
# At least ONE of these is required:
GEMINI_API_KEY="your-gemini-key-here"
# OR
GOOGLE_GENAI_API_KEY="your-gemini-key-here"

# AND this one is required:
OPENROUTER_API_KEY="your-openrouter-key-here"
```

**Get API Keys:**
- **Gemini**: https://aistudio.google.com/app/apikey
- **OpenRouter**: https://openrouter.ai/keys

### 2. Restart Development Server

After adding environment variables:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### 3. Check Server Console

Look at your **server terminal** (not browser console) for detailed error messages:

```bash
# You should see specific errors like:
Error regenerating project docs: Error: Missing GEMINI_API_KEY
# OR
Error regenerating project docs: Error: API rate limit exceeded
```

### 4. Common Errors & Fixes

#### "Missing GEMINI_API_KEY environment variable"

**Fix:** Add to `.env.local`:
```bash
GEMINI_API_KEY="your-actual-key-here"
```

#### "Missing OPENROUTER_API_KEY environment variable"

**Fix:** Add to `.env.local`:
```bash
OPENROUTER_API_KEY="your-actual-key-here"
```

#### "No source code data found for docs generation"

**Cause:** Project hasn't been indexed yet or indexing failed.

**Fix:**
1. Go to `/create`
2. Add repository again
3. Wait for indexing to complete
4. Check server console for indexing errors

#### "Error fetching repo info"

**Cause:** GitHub API rate limit or invalid repository URL.

**Fix:** 
- Wait a few minutes and try again
- Add `GITHUB_TOKEN` to `.env.local`:
  ```bash
  GITHUB_TOKEN="ghp_your_token_here"
  ```
- Get token at: https://github.com/settings/tokens

#### "API rate limit exceeded"

**Cause:** Too many requests to AI APIs.

**Fix:**
- Wait 60 seconds and try again
- Rate limiting is built-in and will reset
- Check your API quota on Gemini/OpenRouter dashboards

### 5. Test Your Setup

```bash
# 1. Check if env variables are loaded
node -e "console.log(process.env.GEMINI_API_KEY ? 'Gemini ✓' : 'Gemini ✗')"
node -e "console.log(process.env.OPENROUTER_API_KEY ? 'OpenRouter ✓' : 'OpenRouter ✗')"

# 2. Check health endpoint
curl http://localhost:3000/api/health
```

### 6. Still Not Working?

**Enable detailed logging:**

Open `src/lib/actions.ts` and check the console output when you try to generate docs.

The error should now show the **actual** problem instead of generic "Failed to regenerate docs".

### Example `.env.local` File

```bash
# Copy this and fill in your actual keys

# Database
DATABASE_URL="postgresql://..."

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# AI APIs (REQUIRED for docs/readme generation)
GEMINI_API_KEY="AIza..."                    # Get from https://aistudio.google.com/app/apikey
OPENROUTER_API_KEY="sk-or-v1-..."          # Get from https://openrouter.ai/keys

# GitHub (optional, for private repos)
GITHUB_TOKEN="ghp_..."                      # Get from https://github.com/settings/tokens
```

---

## Other Common Issues

### Chat Not Working

**Symptom:** Chat page shows "Project not indexed yet"

**Fix:**
1. Make sure project has been indexed
2. Check database has embeddings:
   ```sql
   SELECT COUNT(*) FROM "SourceCodeEmbiddings" WHERE "projectId" = 'your-project-id';
   ```
3. Should return > 0

### Database Errors

**Symptom:** "Connection refused" or "Database error"

**Fix:**
1. Make sure PostgreSQL is running
2. Check `DATABASE_URL` in `.env.local`
3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

### Build Errors

**Symptom:** TypeScript errors or build fails

**Fix:**
```bash
npm install
npx prisma generate
npm run type-check
```

---

## Getting Help

If none of these work:

1. **Check server console** (terminal where `npm run dev` is running)
2. **Check browser console** (F12 → Console tab)
3. **Copy the full error message**
4. Open an issue on GitHub with:
   - Error message
   - Steps to reproduce
   - Your environment (Node version, OS)

---

**Quick checklist:**
- [ ] Environment variables set in `.env.local`
- [ ] Development server restarted
- [ ] API keys are valid
- [ ] Project has been indexed
- [ ] Database is running and migrated

