export interface DocSectionSpec {
  num: number;
  header: string;
  instructions: string;
}

export const DOC_SECTION_COUNT = 17;

export const DOC_SECTION_SPECS: DocSectionSpec[] = [
  {
    num: 1,
    header: "## 1. 📘 Product Understanding",
    instructions:
      "What this project IS, the problem it solves and for whom, how it works at a high level (the main workflows, step by step), key differentiators, and realistic use cases with concrete outcomes. Product-pitch tone, but every claim grounded in the codebase summaries.",
  },
  {
    num: 2,
    header: "## 2. 🧩 Core Value Proposition",
    instructions:
      "A markdown table `| Module / Area | Business Function (non-technical) | Technical Highlight | Business Impact |` with one row per major module the summaries support (aim for 8-12 rows when the codebase is large enough; fewer is correct for small repos). 1-2 sentences per cell.",
  },
  {
    num: 3,
    header: "## 3. 🧱 Architecture Intelligence",
    instructions:
      "Architecture type and main layers, design rationale and trade-offs, directory structure and code organization, data flow between components, the role of each major technology, and the scalability approach - all with real component and file names. Include a ```mermaid``` `graph TD` diagram of the real top-level components; skip the diagram only if no real components can be named from the summaries.",
  },
  {
    num: 4,
    header: "## 4. ⚙️ Data & AI Flow Explanation",
    instructions:
      "A step-by-step walkthrough from user input to final output: the data transformations, the components and functions involved, AI/model integration (which models, how they are called, request/response shapes), storage and retrieval, error handling, and async/concurrent processing. Include a ```mermaid``` `sequenceDiagram` of the main flow.",
  },
  {
    num: 5,
    header: "## 5. 🔌 Integration Potential",
    instructions:
      "How a company plugs this into their stack: actual API endpoints (method and purpose), the extension and configuration surface, authentication and rate limiting, webhooks or events if present, the data model relevant to integrators, and deployment requirements. Business-actionable and concrete.",
  },
  {
    num: 6,
    header: "## 6. 🧠 Technical Edge",
    instructions:
      "5-8 specific technical insights or design advantages that make this codebase stand out. For each: what it is, why it matters, and its impact - 1-2 sentences each.",
  },
  {
    num: 7,
    header: "## 7. 📈 Scalability & Production Readiness",
    instructions:
      "**Already production-ready:** a list of what is genuinely in place (concurrency, caching, logging, CI/CD, testing, error handling, security), each with how and where it is implemented (file paths). **Needs work:** the real gaps, why each matters, and what addressing it would take.",
  },
  {
    num: 8,
    header: "## 8. 🔐 Security & Reliability",
    instructions:
      "Authentication/authorization, secrets and env-variable management, input validation, error handling and monitoring, and encryption / rate limiting / security headers as actually observed - then the known gaps, stated honestly with recommendations.",
  },
  {
    num: 9,
    header: "## 9. 🧮 Tech Stack Summary",
    instructions:
      "A markdown table `| Layer | Technology | Version | Why it's used | Key Features Used |` with rows only for technologies actually observed (Frontend / Backend / AI-ML / Database / Infra / Testing / Build as applicable). 1-2 sentences on why each was chosen.",
  },
  {
    num: 10,
    header: "## 10. 🪄 Example Usage",
    instructions:
      "3-5 realistic examples drawn from real entrypoints observed in the code (an API call, CLI command, or code snippet). For each: a 2-3 sentence explanation, the code/commands, and the expected behavior or output.",
  },
  {
    num: 11,
    header: "## 11. 🧩 Extensibility Map",
    instructions:
      "Where new features can be added: new endpoints or models, UI modules, database models, auth methods, and configuration - with actual file paths and the existing patterns to follow, plus the testing expectations for new code.",
  },
  {
    num: 12,
    header: "## 12. 🔍 AI Commentary (Senior Engineer Review)",
    instructions:
      "A Staff engineer's candid review for a founder: strengths with concrete examples, code quality and maintainability, weaknesses and technical debt with locations, the key architectural trade-offs, and overall readiness with recommendations.",
  },
  {
    num: 13,
    header: "## 13. 💡 Business Applications",
    instructions:
      "Realistic startup use cases this codebase actually supports (aim for 8-12 when the code supports them). For each: what it is, how this repo enables it, the required modifications, implementation complexity, and the business value.",
  },
  {
    num: 14,
    header: "## 14. 📊 Roadmap & Growth Potential",
    instructions:
      "**Short-term (1-3 months):** quick fixes and critical polish. **Medium-term (3-6 months):** architectural improvements, features, integrations. **Long-term (6-12+ months):** scaling and ecosystem strategies. Every item grounded in actual gaps and opportunities observed in the code.",
  },
  {
    num: 15,
    header: "## 15. 🧾 License & Deployment Details",
    instructions:
      "The license as observed in the repository (or 'License not detected in repository'), deployment targets and CI/CD as configured, required environment variables, database setup and migrations, and monitoring/logging as present - sourced from the actual configuration files.",
  },
  {
    num: 16,
    header: "## 16. ⚡ TL;DR: Founder Summary",
    instructions:
      "For a non-technical founder: what this repo gives them today, how close it is to production, its key strengths and weaknesses, the effort required to make it production-ready, its differentiators, and a final recommendation with risk factors. Specific and honest.",
  },
  {
    num: 17,
    header: "## 17. 🗺️ Complete System Flow Diagram",
    instructions:
      "START IMMEDIATELY (no introductory text) with ONE comprehensive ASCII-art diagram inside a ``` code fence, using box-drawing characters (┌ ┐ └ ┘ │ ─ ├ ┤ ┬ ┴) and arrows (→ ← ↑ ↓ ▼), showing the complete end-to-end flow with REAL component, route, and table names from the summaries - including error paths and background jobs where they exist. After the diagram, a short walkthrough of the flow. This is the final section of the document.",
  },
];

export const DOC_HEADER_SPEC = `DOCUMENT HEADER
Start the document with an H1 in exactly this form:
# 📘 [Project Name]: [Short Tagline] - Technical Documentation

Optionally follow it with ONE row of shields.io badges. A badge is a factual claim about this repository: emit a badge ONLY for a technology the codebase summaries actually show (conventional colors: TypeScript #3178c6, Python #3776ab, JavaScript #f7df1e, Next.js black, React #61dafb, green for databases, purple for auth providers, red for AI/ML). Never infer a technology from the project name or description. Never emit an AI/ML badge without direct evidence (a model SDK import, an inference call, an embedding model, a vector store). Never emit placeholder badges. If no badges are grounded, omit the badge row entirely - a header with no badges is a correct header.`;

export interface ParsedDocContent {
  preamble: string;
  sections: Map<number, string>;
}

const SECTION_HEADER_RE = /^##\s+(\d{1,2})\.\s/;
const FENCE_RE = /^\s*(```|~~~)/;

export function parseDocSections(content: string): ParsedDocContent {
  const lines = (content ?? "").split("\n");
  const sections = new Map<number, string>();
  const preambleLines: string[] = [];
  let currentNum: number | null = null;
  let currentLines: string[] = [];
  let inFence = false;

  const flush = () => {
    if (currentNum === null) return;
    const text = currentLines.join("\n").trim();
    const existing = sections.get(currentNum);
    if (text && (!existing || text.length > existing.length)) {
      sections.set(currentNum, text);
    }
  };

  for (const line of lines) {
    const isFenceMarker = FENCE_RE.test(line);
    const headerMatch =
      !inFence && !isFenceMarker ? line.match(SECTION_HEADER_RE) : null;
    if (headerMatch) {
      const num = parseInt(headerMatch[1], 10);
      if (num >= 1 && num <= DOC_SECTION_COUNT) {
        flush();
        currentNum = num;
        currentLines = [line];
        continue;
      }
    }
    if (isFenceMarker) inFence = !inFence;
    if (currentNum === null) {
      preambleLines.push(line);
    } else {
      currentLines.push(line);
    }
  }
  flush();

  return { preamble: preambleLines.join("\n").trim(), sections };
}

export function findMissingDocSections(
  sections: ReadonlyMap<number, string>,
): number[] {
  const missing: number[] = [];
  for (let n = 1; n <= DOC_SECTION_COUNT; n++) {
    if (!sections.has(n)) missing.push(n);
  }
  return missing;
}

export function hasUnclosedCodeFence(sectionText: string): boolean {
  const markers = sectionText.match(/^\s*(```|~~~)/gm) || [];
  return markers.length % 2 === 1;
}

export function assembleDocContent(
  preamble: string,
  sections: ReadonlyMap<number, string>,
): string {
  const ordered = [...sections.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, text]) => text);
  return [preamble.trim(), ...ordered].filter(Boolean).join("\n\n");
}
