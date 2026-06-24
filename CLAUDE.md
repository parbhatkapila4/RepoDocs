# CLAUDE.md — RepoDoc: "Changes Since Indexed" (repo drift)

Implementation brief for the new Diff mode. Read fully before writing code. This is **additive** — the existing manual paste flow at `/diff` must keep working unchanged.

All gating questions are resolved (see §9). Phase 1 mechanism was corrected after a codebase audit — see §3.

---

## 0. Context (what already exists)

RepoDoc is a GitHub RAG pipeline. A project is an indexed repo: source files embedded (`SourceCodeEmbeddings`, pgvector) + durable facts in `RepoMemory`.

Current `/diff` flow (`src/app/(protected)/diff/page.tsx` → `POST /api/analyze-diff`):

1. Guards: Clerk auth → rate limit → project ownership → monthly budget (402 if over `monthlyCostLimitUsd`).
2. `parseDiff` (`src/lib/diff.ts`) → files/hunks.
3. ~500-char retrieval summary from parsed files.
4. `searchCodebase(projectId, summary, 10)` — Gemini embeddings + pgvector → top 10 files.
5. `searchRepoMemory(projectId, embedding, 5)` — top 5 memory entries.
6. LLM: **Gemini 2.5 Flash via OpenRouter**, temp `0.3`, **strict JSON only**.
7. Record metrics, `routeType: "diff"`.
8. Render structured result.

Output schema (keep identical): `summary` (req), `whatChanged` (req), `impactedFiles` (req), `impactedModules?`, `architecturalImpact?`, `riskLevel` (`low|medium|high`, req), `testsToUpdate?`, `possibleRegressions?`.

Truncation already in place: hunks → 800 chars, related snippets → 600 chars.

**Stack:** Next.js 14 (app router), Prisma + Postgres (Supabase) + pgvector, Clerk, Gemini 2.5 Flash via OpenRouter.

---

## 1. What we're building

A second mode on `/diff` that computes the **net diff between the commit the repo was indexed at and the current HEAD of its indexed branch**, then runs the existing analysis pipeline on that diff — no manual paste.

Framing in UI + LLM prompt: this is **drift**. The index (docs, embeddings, memory) was built at the baseline commit; this surfaces how far reality moved and which parts of RepoDoc's understanding are now stale.

Two coexisting modes on the same page: **Paste diff** (existing, untouched) and **Changes since indexed** (new).

---

## 2. Hard constraints

- Do **not** break or fork the manual paste flow. Extract shared logic, don't copy-paste.
- Reuse the analysis core: same retrieval, model, temp, JSON schema, truncation limits.
- Strict JSON + existing best-effort fallback (`riskLevel: "medium"` + parsed paths) on malformed output.
- Same guard stack as `analyze-diff`.
- Metrics with new `routeType: "repo-changes"`.

---

## 3. Data model + baseline capture (Phase 1) — CORRECTED after audit

**Audit finding that invalidated the original mechanism:** the commit SHA is NOT fetched on the fresh-index path. `listGithubRepoPathsForPreindex` (which fetches `getRef heads/${branch}` → `refData.object.sha`) only runs on the **resume/re-index branch** (`if (alreadyIndexed.length > 0)`). A fresh first index uses `GithubRepoLoader`, which never surfaces a SHA. Small/medium repos finish in one pass without ever calling it. So the original "no new GitHub calls — SHA is already fetched" rule was based on a false premise and is **void**. Capturing a baseline for *any* repo requires one explicit `getRef`.

### Decision (locked)
1. **SHA capture → one `getRef` at index start.** Add a single lightweight `getRef heads/${branch}` early in `indexGithubRepository`, on the **always-run path** (before the fresh-vs-resume fork), so every successful index — fresh, small, or resumed — pins a baseline. The pinned SHA = HEAD at index start.
2. **Branch storage → new `IndexingJob.indexedBranch` column.** Store the branch on the job alongside the SHA at capture time; mirror to Project on success. (Re-resolving the branch at mirror time was rejected: adds a GitHub call + can drift.)

### Capture must be idempotent
The `getRef` + persist runs **only if this index run has no baseline yet** — never overwrite on a resume pass. A resumed index keeps the SHA pinned at the original index start, not a later HEAD. Guard accordingly (`if (!job.lastCommitSha)`, or carry-forward/skip if resumes create new job rows — match the actual resume model).

### Persist
- Write SHA → `IndexingJob.lastCommitSha` (column exists, currently dead) and branch → `IndexingJob.indexedBranch` (new) at capture.
- **Mirror to `Project` ONLY at the single success site** (audit confirmed: `indexing-worker-run.ts` job-completion, NOT the `BackgroundJob` writes in `actions.ts`). A failed/partial index must not set a baseline.

### `Project` columns (one migration)
| Field | Type | Notes |
|---|---|---|
| `indexedCommitSha` | `String?` | Baseline. Mirrored from job on success. |
| `indexedBranch` | `String?` | Branch indexed. Mirrored from job on success. |
| `indexedAt` | `DateTime?` | Set at mirror. **Do not reuse `updatedAt`** — it bumps on every write and would make the UI "indexed at" date lie. |

### Accepted imprecision
Baseline = HEAD at index start. `GithubRepoLoader` reads the branch tip moments later, so a push in that window means the index can reflect a commit ≤1 newer than the baseline. Acceptable; document in a code comment. Do not attempt to make GitHub + loader transactional.

### Backfill (existing projects, null `indexedCommitSha`) — later phase
Historical SHA unrecoverable. UI offers **Set baseline now** (fetch current HEAD, drift from now — honest caveat: real index reflects an unknown older commit) or **Re-index** (clean baseline). Not part of Phase 1.

---

## 4. New route: `POST /api/repo-changes` (Phase 4)

Body: `{ "projectId": string }`

1. **Guards** — auth, rate limit, ownership, budget. *Extract from `analyze-diff/route.ts` into `src/lib/api-guards.ts`; call from both routes.*
2. Load project → parse `owner`/`repo` from `repoUrl`; read `indexedCommitSha`, `indexedBranch`; resolve token (§5).
3. `indexedCommitSha` null → `409` `{ reason: "no_baseline" }`. **No LLM call.**
4. GitHub compare baseline → current branch HEAD (§5).
5. `ahead_by === 0` → `{ status: "no_changes", baseSha, headSha }`. **No LLM call.**
6. Assemble unified diff from compare `files[]` (§5), file cap + per-file truncation.
7. Reuse **shared analysis core** (`src/lib/analyze.ts`, extracted from `analyze-diff`): retrieval summary → `searchCodebase` → `searchRepoMemory` → Gemini 2.5 Flash → strict JSON. Drift-aware prompt (§5).
8. Record metrics, `routeType: "repo-changes"`.
9. Return analysis JSON + metadata: `baseSha`, `headSha`, `commitCount`, `fileCount`, `truncated`, optional commit list.

---

## 5. GitHub integration + assembly

### Auth (resolved)
Per-project PAT, encrypted, env fallback. No OAuth-for-repo, no GitHub App.
```ts
const token =
  (project.githubToken ? decryptSecret(project.githubToken) : null) ||
  process.env.GITHUB_TOKEN || undefined;
const octokit = createGitHubOctokit(token); // existing helper, src/lib/github.ts
```
Reuse the existing `repoUrl` → `{ owner, repo }` parser. Private repos need `repo` scope; missing/bad token fails at the Octokit call — return a clean error, don't 500.

### Compare
```ts
const { data } = await octokit.rest.repos.compareCommitsWithBasehead({
  owner, repo, basehead: `${indexedCommitSha}...${indexedBranch}`,
});
// data.ahead_by, data.total_commits, data.commits[], data.files[]
```

### Assembly (`src/lib/diff.ts`, new `buildUnifiedDiffFromGithubFiles(files)`)
Each `files[]` entry: `{ filename, status, additions, deletions, patch }`; `patch` is unified diff. Concatenate with synthetic `diff --git a/<f> b/<f>` headers so existing `parseDiff` consumes it. Missing `patch` (large/binary) → stub: `<status> <filename> (+<adds>/-<dels>) [patch omitted]`.

### Limits / budget
- Compare returns ≤300 files; patches may be omitted on large diffs. v1: cap at first 300, set `truncated`.
- Cap files to LLM (top N by `additions + deletions`, or relevance-rank). Apply existing 800/600-char truncation.
- Diff endpoints `base...head` (net change), not intermediate commits. Tradeoff: added-then-deleted files won't appear. Acceptable v1.

### Drift-aware prompt
Clone existing system prompt; tell the model it reviews **cumulative drift since indexing** (baseline `<sha>`, `<N>` commits) and to flag where retrieved indexed code/memory is now stale. Same schema, same risk rules.

---

## 6. UI (`src/app/(protected)/diff/page.tsx`) (Phase 5)

Mode toggle: **Paste diff** | **Changes since indexed**. Keep brutalist mono look (JetBrains Mono, single green accent, dark).

Changes-since-indexed: requires selected project; show `indexed at <short sha> · <relative date>` (from `indexedAt`); **Check for changes** → `POST /api/repo-changes` with loading state.

Result states (reuse existing results component): **Has changes** → standard sections + header (`N commits · M files since <date>`, base→head short SHAs, optional commit list). **No changes** / **No baseline** ([Set baseline now] · [Re-index]) / **GitHub error** (human-readable).

---

## 7. Phasing

- **P1 (this):** data layer — `Project.indexedCommitSha/indexedBranch/indexedAt`, `IndexingJob.indexedBranch`, capture-once at index start, mirror-on-success. No route, no UI.
- **P2:** `compareCommitsWithBasehead` helper + `buildUnifiedDiffFromGithubFiles` (pure, unit-testable).
- **P3:** extract `api-guards.ts` + `analyze.ts` from `analyze-diff`; prove paste flow unchanged.
- **P4:** `/api/repo-changes` route.
- **P5:** UI mode + backfill states.

---

## 8. Phase 1 acceptance

- Migration applies cleanly.
- A fresh index of **any** repo (incl. small single-pass) ends with `Project.indexedCommitSha`, `indexedBranch`, `indexedAt` populated, matching branch HEAD at index start.
- `IndexingJob.lastCommitSha` + `indexedBranch` populated on the job row.
- Resume passes do NOT move the baseline.
- A failed index leaves `Project.indexedCommitSha` untouched.
- Existing projects remain null (backfill is P5).
- Indexing timing/progress otherwise unchanged; only new effect is one `getRef` + the metadata writes.

---

## 9. Resolved facts (codebase audit)

- **GitHub token:** `Project.githubToken`, optional, AES-256-GCM (`encryptSecret`/`decryptSecret`), env fallback `process.env.GITHUB_TOKEN`. Helper `createGitHubOctokit(token)`.
- **Repo identity:** `Project.repoUrl`; parse owner/repo (existing parser).
- **Baseline SHA:** none on Project. `IndexingJob.lastCommitSha` exists but dead. SHA fetched in `listGithubRepoPathsForPreindex` — but that's the **resume path only**; fresh index uses `GithubRepoLoader` (no SHA). → one `getRef` at index start, captured once (§3).
- **Success site:** `indexing-worker-run.ts` job-completion (single). `actions.ts` `status:"completed"` writes are `BackgroundJob`, a different model — not the mirror target.
- **No `indexedAt`:** only `createdAt`/`updatedAt` exist; add a dedicated `indexedAt`.
- **Auth model:** per-project PAT + env fallback. No OAuth repo token, no GitHub App.

## Conventions
- Strict JSON; best-effort fallback on parse failure.
- No new model/temperature — Gemini 2.5 Flash @ 0.3.
- No LLM call on no-changes / no-baseline paths.
- Match existing error-handling, logging, metrics patterns.