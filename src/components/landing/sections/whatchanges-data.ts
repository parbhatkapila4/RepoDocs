export interface ModuleData {
  id: string;
  label: string;
  description: string;
  filePath: string;
  startLine: number;
  body: string;
  highlight?: { from: number; to: number };
  isCenter?: boolean;
}

export const MODULES: ModuleData[] = [
  {
    id: "repo",
    label: "your repo",
    description: "Connected on GitHub. Indexed on every commit.",
    filePath: "package.json",
    startLine: 1,
    body: `{
  "name": "repodoc",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "prisma generate && next dev",
    "build": "prisma generate && next build",
    "db:migrate": "prisma migrate deploy"
  }
}`,
    isCenter: true,
  },
  {
    id: "ui",
    label: "ui",
    description: "Frontend pages and chat surface.",
    filePath: "src/app/(protected)/chat/page.tsx",
    startLine: 14,
    body: `export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);

  async function ask(question: string) {
    setStreaming(true);
    const res = await fetch("/api/query", {
      method: "POST",
      body: JSON.stringify({ question, projectId }),
    });
    const data = await res.json();
    setMessages((prev) => [...prev, data.answer]);
  }
}`,
    highlight: { from: 19, to: 22 },
  },
  {
    id: "api",
    label: "api",
    description: "RAG endpoint that answers user queries.",
    filePath: "src/app/api/query/route.ts",
    startLine: 23,
    body: `export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { question, projectId } = await req.json();
  await rateLimiter.consume(userId);

  const result = await queryCodebase(projectId, question);
  await recordQueryMetrics({ ... });

  return NextResponse.json(result);
}`,
    highlight: { from: 30, to: 31 },
  },
  {
    id: "auth",
    label: "auth",
    description: "Clerk middleware. Gates every route by default.",
    filePath: "src/middleware.ts",
    startLine: 30,
    body: `export default clerkMiddleware(async (auth, req) => {
  if (isServerActionPost(req)) {
    await auth();
    return NextResponse.next();
  }
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});`,
    highlight: { from: 35, to: 37 },
  },
  {
    id: "services",
    label: "services",
    description: "Background indexing worker, leased on Postgres.",
    filePath: "src/lib/indexing-worker-run.ts",
    startLine: 11,
    body: `async function findEligibleJob() {
  const leaseExpiry = new Date(
    Date.now() - JOB_LEASE_DURATION_MS,
  );
  return prisma.indexingJob.findMany({
    where: {
      OR: [
        { status: "queued", lockedAt: null },
        { status: "processing", lockedAt: { lt: leaseExpiry } },
      ],
    },
  });
}`,
    highlight: { from: 17, to: 20 },
  },
  {
    id: "database",
    label: "database",
    description: "Postgres + pgvector. Source of truth for everything.",
    filePath: "prisma/schema.prisma",
    startLine: 50,
    body: `model SourceCodeEmbeddings {
  id               String                 @id @default(uuid())
  fileName         String
  sourceCode       String
  Summary          String
  summaryEmbedding Unsupported("vector")?
  projectId        String

  @@index([projectId])
}`,
    highlight: { from: 55, to: 55 },
  },
];

export const CONNECTIONS: ReadonlyArray<readonly [string, string]> = [
  ["repo", "ui"],
  ["repo", "api"],
  ["repo", "auth"],
  ["repo", "services"],
  ["repo", "database"],
  ["ui", "api"],
  ["api", "auth"],
  ["api", "services"],
  ["services", "database"],
  ["api", "database"],
];

const CENTER = { x: 50, y: 50 };
const RADIUS = 32;
const OUTER_ORDER: ReadonlyArray<string> = [
  "ui",
  "api",
  "auth",
  "services",
  "database",
];

export const POSITIONS: Record<string, { x: number; y: number }> = {
  repo: CENTER,
};

OUTER_ORDER.forEach((id, i) => {
  const angle = (i / OUTER_ORDER.length) * Math.PI * 2 - Math.PI / 2;
  POSITIONS[id] = {
    x: CENTER.x + Math.cos(angle) * RADIUS,
    y: CENTER.y + Math.sin(angle) * RADIUS,
  };
});

export function moduleById(id: string): ModuleData | undefined {
  return MODULES.find((m) => m.id === id);
}

export function connectionsOf(id: string): string[] {
  const out = new Set<string>();
  for (const [a, b] of CONNECTIONS) {
    if (a === id) out.add(b);
    if (b === id) out.add(a);
  }
  return [...out];
}
