import { Document } from "@langchain/core/documents";
import { openrouterSingleMessage } from "@/lib/openrouter";
import { GoogleGenAI } from "@google/genai";
import type { GitHubRepoInfo } from "@/lib/github";

const geminiApiKey =
  process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

if (!geminiApiKey) {
  throw new Error(
    "Missing GEMINI_API_KEY or GOOGLE_GENAI_API_KEY environment variable"
  );
}

const genAi = new GoogleGenAI({ apiKey: geminiApiKey });

export async function getSummariseCode(doc: Document) {
  try {
    const code = doc.pageContent.slice(0, 10000);

    const prompt = `You are an intelligent senior software engineer who specializes in onboarding junior software engineers onto projects.
You are onboarding a junior software engineer and explaining to them the purpose of the ${doc.metadata.source} file.
Here is the code: 
---
${code}
---
Give a summary no more than 100 words of the code above.`;

    return openrouterSingleMessage(prompt);
  } catch (error) {
    console.error("Error summarising code for ", doc.metadata.source, error);
    return "";
  }
}

export async function getGenerateEmbeddings(
  summary: string,
  useCache: boolean = true
) {
  if (useCache) {
    try {
      const { cache } = await import("./cache");
      const cached = await cache.getCachedEmbedding(summary);
      if (cached) {
        return cached;
      }
    } catch {}
  }

  if (!geminiApiKey) {
    throw new Error(
      "GEMINI_API_KEY or GOOGLE_GENAI_API_KEY is not set in environment variables"
    );
  }

  try {
    const response = await genAi.models.embedContent({
      model: "gemini-embedding-001",
      contents: summary as string,
      config: {
        outputDimensionality: 768,
      },
    });

    if (!response?.embeddings) {
      throw new Error("No embeddings returned from API");
    }

    const embeddingValues = response?.embeddings[0]?.values;

    if (!embeddingValues || embeddingValues.length === 0) {
      throw new Error("Invalid embedding values");
    }

    if (useCache) {
      try {
        const { cache } = await import("./cache");
        await cache.cacheEmbedding(summary, embeddingValues);
      } catch (cacheError) {}
    }

    return embeddingValues;
  } catch (error) {
    console.error("Error generating embeddings:", {
      error: error instanceof Error ? error.message : "Unknown error",
      hasApiKey: !!geminiApiKey,
      summaryLength: summary?.length || 0,
      errorDetails: error,
    });
    throw new Error(
      `Failed to generate embeddings: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function generateReadmeFromCodebase(
  projectName: string,
  sourceCodeSummaries: string[],
  repoInfo: Partial<GitHubRepoInfo> | null
) {
  try {
    const codebaseContext = sourceCodeSummaries.join("\n\n");
    const hasCodebaseAnalysis = sourceCodeSummaries.length > 0;

    const prompt = `You are an elite $500K/year Staff+ full-stack engineer who has built and shipped production-grade AI systems, SaaS products, and developer tools at startup speed. You write READMEs the way senior founders, investors, and top engineers expect — precise, structured, and narrative-driven.

${hasCodebaseAnalysis ? "You are inside Cursor with FULL access to this repository." : "You are generating a README based on repository metadata. The codebase is currently being indexed, so detailed code analysis is not yet available."}

Your mission:
Generate a **README.md** that positions this repo as a serious, production-ready, valuable engineering asset — not a toy project.
It must instantly communicate clarity, purpose, architecture, and adoption ease.
Avoid fluff, buzzwords, or filler text. Everything must demonstrate competence, intentionality, and confidence.

PROJECT INFORMATION:
- Project Name: ${projectName}
- Repository URL: ${repoInfo?.htmlUrl || "N/A"}
- Primary Language: ${repoInfo?.language || "N/A"}
- Description: ${repoInfo?.description || "N/A"}
- Stars: ${repoInfo?.stars || 0}
- Forks: ${repoInfo?.forks || 0}

${
  hasCodebaseAnalysis
    ? `CODEBASE ANALYSIS:
${codebaseContext}`
    : `⚠️ IMPORTANT NOTE FOR USER:
This is a DEMO/PREVIEW README generated from repository metadata only. The codebase indexing is currently in progress and typically takes 5-15 minutes to complete (depending on repository size). Once indexing is complete, please regenerate the README to get comprehensive, codebase-aware documentation with full technical analysis. This preview gives you a quick overview, but the full README will be much more detailed and accurate.`
}

---

# ✅ README STRUCTURE AND RULES

## 1. 🧠 Overview
A 2–3 sentence founder-level summary explaining what the project *is*, what problem it solves, and who it's for.
Tone: visionary but grounded.

Example:
> "This repository implements a modular AI inference system designed for real-world SaaS integrations. It combines OpenAI APIs, LangChain orchestration, and scalable Express services to deliver low-latency intelligent responses."

---

## 2. 🚀 Key Features
Bullet points summarizing the system's *capabilities and advantages*, not just features.

Example:
- Plug-and-play AI orchestration layer for any SaaS
- Modular, testable, and Dockerized backend
- Supports multi-provider AI integration (OpenAI, Claude, Gemini)
- Built with scalable architecture for 10K+ concurrent users
- Production-ready CI/CD setup with automatic linting and build pipelines

---

## 3. 🧩 System Architecture
Explain the repo's structure and reasoning behind it.

Include a **Mermaid diagram** showing the overall flow:
\`\`\`mermaid
graph TD
    A[User Request] --> B[API Gateway]
    B --> C[AI Engine / Model Layer]
    C --> D[Database / Vector Store]
    B --> E[Frontend UI]
\`\`\`

Then explain why it's designed that way:
"The backend isolates AI orchestration logic from transport and storage, allowing independent scaling of each layer."

---

## 4. ⚙️ Tech Stack
List technologies by layer and add why each was chosen.

| Layer | Technology | Purpose / Reason |
|-------|------------|------------------|
| Frontend | Next.js | Server-rendered UI for SEO and speed |
| Backend | Node.js (Express) | Lightweight, fast, modular |
| AI / ML | OpenAI API, LangChain | Prompt management and embeddings |
| Database | MongoDB | Flexible schema for dynamic AI outputs |
| Infra | Docker, Vercel | Easy deployment and scalability |

---

## 5. 🧱 Project Structure
Auto-generate a concise structure based on actual codebase:
\`\`\`
/src
  /api         → All REST endpoints
  /ai          → AI orchestration logic
  /components  → UI components
  /db          → Database models and utils
  /utils       → Shared helpers
\`\`\`
Each folder should have a short 1-line explanation.

---

## 6. 🧩 Setup & Installation
Provide clean, professional setup instructions.
\`\`\`bash
# Clone the repository
git clone ${repoInfo?.cloneUrl || "https://github.com/user/repo.git"}

# Install dependencies
npm install

# Set environment variables
cp .env.example .env

# Run the app
npm run dev
\`\`\`

Include short notes for environment variables detected in the codebase.

---

## 7. 💡 Usage Examples
Show real-world usage, not "hello world."
\`\`\`bash
curl -X POST https://api.example.com/generate \\
  -H "Content-Type: application/json" \\
  -d '{"prompt":"Summarize this document"}'
\`\`\`

Example Output:
\`\`\`json
{ "summary": "This document explains..." }
\`\`\`

"You can integrate this endpoint into any product or internal tool to auto-summarize content in real time."

---

## 8. 🧠 Design Philosophy
Add a short section that proves you think like a systems engineer.

"This codebase follows clean modular principles — separating orchestration, inference, and persistence layers. Every design choice favors scalability, testability, and real-world deployment simplicity."

This section differentiates senior developers from juniors.

---

## 9. 📈 Scalability & Extensibility
Use bullet points:
- Modular structure supports multi-model expansion.
- Stateless API layer allows horizontal scaling.
- Can integrate additional providers or databases with minimal refactor.
- Easily containerized for microservice deployment.

---

## 10. 🔐 Security & Reliability
Summarize security and quality measures:
- API keys loaded via env vars only.
- Rate-limiting middleware prevents abuse.
- Request sanitization before AI calls.
- Graceful error handling and retries.

---

## 11. 🧰 Developer Experience
Explain tools that make it easy for contributors:
- ESLint + Prettier configured for consistent code.
- Husky pre-commit hooks for quality control.
- Example .env provided for quick setup.
- CI pipeline auto-runs tests on PR.

---

## 12. 🧾 License
Detect and summarize license (e.g., MIT, Apache 2.0, proprietary).

---

## 13. 💬 Author & Attribution
Add clear credit and credibility:
- Author: [Detect from repo or use placeholder]
- Website: [If available]
- Building scalable AI products with modern full-stack and MLOps tooling.

---

## 14. ⚡ TL;DR Summary
End with a single paragraph written for an investor or founder:

"This project is a foundation for real-world AI product development — modular, clean, and production-ready. It demonstrates strong architecture, practical scalability, and craftsmanship expected from top-tier engineers."

---

🧭 GLOBAL RULES:
- Every section must read like it was written by a $500K+ engineer.
- Be concise, confident, and intentional — zero fluff.
- Explain "why" behind choices.
- Use markdown syntax properly for readability.
- Make the repo look ready for adoption or investment, not experimentation.
- Use ONLY standard markdown formatting - NO HTML tags.
- Base ALL content on the actual codebase analysis provided above.

Generate the complete, elite-level README.md now:`;

    const readmeContent = await openrouterSingleMessage(
      prompt,
      "google/gemini-2.5-flash"
    );
    return readmeContent;
  } catch (error) {
    console.error("Error generating README:", error);
    return `# ${projectName}

## 🧠 Overview
${repoInfo?.description || "A production-ready software project built with modern engineering practices."}

## 🚀 Key Features
- Built with ${repoInfo?.language || "modern technologies"}
- Production-ready architecture
- Scalable and maintainable codebase

## 🧩 System Architecture
\`\`\`mermaid
graph TD
    A[Client] --> B[Application]
    B --> C[Business Logic]
    C --> D[Database]
\`\`\`

## ⚙️ Tech Stack
| Layer | Technology | Purpose |
|-------|------------|---------|
| Primary | ${repoInfo?.language || "N/A"} | Core application logic |

## 🧱 Project Structure
\`\`\`
/src          → Source code
/tests        → Test files
/docs         → Documentation
\`\`\`

## 🧩 Setup & Installation
\`\`\`bash
# Clone the repository
git clone ${repoInfo?.cloneUrl || "https://github.com/user/repo.git"}
cd ${projectName}

# Install dependencies
npm install

# Run the application
npm run dev
\`\`\`

## 🧾 License
This project is licensed under the MIT License.

## ⚡ TL;DR
${projectName} is a well-architected ${repoInfo?.language || "software"} project ready for production use and further development.
`;
  }
}

export async function modifyReadmeWithQuery(
  currentReadme: string,
  userQuery: string,
  projectName: string
) {
  try {
    const prompt = `You are an expert technical writer and software engineer. You need to modify an existing README.md file based on a user's specific request.

PROJECT: ${projectName}

CURRENT README CONTENT:
${currentReadme}

USER REQUEST:
${userQuery}

INSTRUCTIONS:
1. Analyze the current README content and the user's request
2. Modify the README to fulfill the user's request while maintaining:
   - Professional tone and structure
   - Proper markdown formatting
   - All existing valuable information
   - Consistency with the project's style
3. If the user wants to add new sections, make sure they fit naturally with the existing content
4. If the user wants to modify existing sections, preserve the overall structure
5. If the user wants to remove content, be careful to maintain essential information
6. Use ONLY standard markdown formatting - NO HTML tags
7. Ensure the modified README remains comprehensive and helpful

IMPORTANT: 
- Generate ONLY the complete modified README content
- Do not include any explanations or comments
- Do not include HTML tags like <div>, <p>, <br>, etc.
- Use pure markdown syntax only
- Make sure the output is a complete, valid README.md file

Generate the modified README.md content:`;

    const modifiedReadme = await openrouterSingleMessage(
      prompt,
      "google/gemini-2.5-flash"
    );
    return modifiedReadme;
  } catch (error) {
    console.error("Error modifying README:", error);
    throw new Error("Failed to modify README with AI");
  }
}

export async function generateDocsFromCodebase(
  projectName: string,
  sourceCodeSummaries: string[],
  repoInfo: Partial<GitHubRepoInfo> | null
) {
  try {
    const maxCodebaseContextLength = 100000;
    let codebaseContext = sourceCodeSummaries.join("\n\n");

    const hasCodebaseAnalysis = codebaseContext.length > 0;

    if (codebaseContext.length > maxCodebaseContextLength) {
      const summariesToKeep = Math.max(
        100,
        Math.floor(sourceCodeSummaries.length * 0.8)
      );
      const recentSummaries = sourceCodeSummaries.slice(-summariesToKeep);
      codebaseContext = recentSummaries.join("\n\n");

      if (codebaseContext.length > maxCodebaseContextLength) {
        codebaseContext =
          codebaseContext.substring(0, maxCodebaseContextLength) +
          "\n\n[... codebase context truncated for token limit to ensure all 17 sections are generated ...]";
      }
    }

    const prompt = `You are an expert Staff-level AI/full-stack engineer who also thinks like a startup founder and CTO. ${hasCodebaseAnalysis ? "You have FULL access to the current repository: code files, architecture, configs, and metadata." : "You are generating documentation based on repository metadata. The codebase is currently being indexed, so detailed code analysis is not yet available."}

Your mission: Generate ONE EXTREMELY COMPREHENSIVE, DETAILED, and LENGTHY technical document that explains this repo in EXHAUSTIVE detail so that:
- A non-technical founder instantly understands what this project does, why it exists, how it works, what technologies it uses, what problems it solves, who it serves, and why it matters - explained in EXTENSIVE detail with multiple paragraphs and examples.
- A senior engineer immediately understands the COMPLETE architecture, ALL technologies used, database structure, API endpoints, security measures, performance considerations, code patterns, file organization, dependencies, strengths, weaknesses, and extension points - explained in DEPTH with technical details.
- Both can see the business value, technical implementation, scalability, production readiness, and every aspect of this system without reading a single line of code - because the documentation is SO COMPREHENSIVE and DETAILED.

**🚨🚨🚨 CRITICAL LENGTH REQUIREMENTS - ABSOLUTELY MANDATORY 🚨🚨🚨**

**YOU MUST FOLLOW THESE REQUIREMENTS OR THE DOCUMENTATION WILL BE REJECTED:**

1. **EVERY SECTION (except tables/lists) MUST HAVE MINIMUM 5 FULL PARAGRAPHS**
2. **EACH PARAGRAPH MUST BE 100-200 WORDS MINIMUM** - not just 2-3 sentences!
3. **EACH SECTION MUST BE AT LEAST 500-1000 WORDS TOTAL** - sections with less than 50 words are COMPLETELY UNACCEPTABLE
4. **NO SHORT SECTIONS ALLOWED** - if a section has less than 500 words, you have FAILED
5. **EVERY PARAGRAPH MUST BE SUBSTANTIAL** - explain concepts in depth, provide examples, give context, explain why things matter
6. **DO NOT BE CONCISE** - verbosity and detail are REQUIRED, not optional
7. **EXPAND ON EVERY POINT** - don't just state facts, explain them thoroughly with examples and context

**REJECTION CRITERIA:**
- Any section with less than 5 paragraphs = REJECTED
- Any section with less than 500 words = REJECTED  
- Any paragraph with less than 100 words = REJECTED
- Any section that can be read in under 2 minutes = REJECTED

**SUCCESS CRITERIA:**
- Every section has 5-6+ full paragraphs
- Each paragraph is 100-200+ words
- Each section is 500-1000+ words total
- Comprehensive explanations with examples, context, and depth
- Detailed technical analysis with specific code references

**LENGTH IS NOT A CONCERN - DETAIL AND COMPREHENSIVENESS ARE MANDATORY. BE EXHAUSTIVE. BE VERBOSE. BE DETAILED.**

${hasCodebaseAnalysis ? "DO NOT summarize file by file. DO NOT rewrite the README. Your job is to infer PRODUCT, ARCHITECTURE, BUSINESS VALUE, and EXTENSIBILITY from the codebase." : "Since detailed codebase analysis is not yet available, focus on what can be inferred from the repository metadata, description, and general project information. Create a professional technical document that sets expectations and provides structure for when full codebase analysis becomes available."}

PROJECT INFORMATION:
- Project Name: ${projectName}
- Repository URL: ${repoInfo?.htmlUrl || "N/A"}
- Primary Language: ${repoInfo?.language || "N/A"}
- Description: ${repoInfo?.description || "N/A"}
- Stars: ${repoInfo?.stars || 0}
- Forks: ${repoInfo?.forks || 0}

${
  hasCodebaseAnalysis
    ? `DETAILED CODEBASE ANALYSIS:
${codebaseContext}`
    : `⚠️ IMPORTANT NOTE FOR USER:
Indexing is in progress! We're currently indexing your codebase, which typically takes 5-15 minutes to complete (depending on repository size).

This is a DEMO/PREVIEW documentation generated from repository metadata only. We're giving you this demo docs so you can see a preview while indexing completes. Once indexing is ready, please try again (regenerate the documentation) to get comprehensive, codebase-aware documentation with full technical analysis. 

Thank you for your patience!`
}

---

# ✅ OUTPUT STRUCTURE (exact order and titles)

## DOCUMENT HEADER (MUST START WITH THIS)
Start the document with a visually appealing header that includes:
1. An emoji icon (📘) followed by the project name and a short tagline describing what it does
2. A row of badge-style labels showing key technologies, frameworks, and stats

Format it EXACTLY like this (replace with actual project details):
\`\`\`
# 📘 [Project Name]: [Short Tagline] - Comprehensive Technical Documentation

![Project Badge](https://img.shields.io/badge/🏷️_PROJECT_NAME-blue)
![AI Badge](https://img.shields.io/badge/AI_POWERED-orange)
![Language Badge](https://img.shields.io/badge/[PRIMARY_LANGUAGE]-3178c6)
![Framework Badge](https://img.shields.io/badge/[MAIN_FRAMEWORK]-black)
![Database Badge](https://img.shields.io/badge/[DATABASE]-green)
![Auth Badge](https://img.shields.io/badge/[AUTH_PROVIDER]-purple)
![AI/ML Badge](https://img.shields.io/badge/[AI_TECHNOLOGY]-red)
![Stars](https://img.shields.io/badge/STARS-[COUNT]-yellow)
![Forks](https://img.shields.io/badge/FORKS-[COUNT]-gray)
\`\`\`

Use shields.io badges with appropriate colors:
- Blue for project name
- Orange for AI-powered features
- Language-specific colors (TypeScript: #3178c6, Python: #3776ab, JavaScript: #f7df1e, etc.)
- Framework colors (Next.js: black, React: #61dafb, etc.)
- Green for databases (Supabase, PostgreSQL, etc.)
- Purple for auth providers (Clerk, Auth0, etc.)
- Red for AI/ML technologies (LangChain, OpenAI, etc.)

Detect the actual technologies from the codebase and create appropriate badges.

---

## 1. 📘 Product Understanding
**MANDATORY: Write EXACTLY 5-6 FULL PARAGRAPHS, each 100-200 words minimum. Total section must be 500-1000+ words.**

Provide a comprehensive and detailed explanation covering:
- **Paragraph 1 (100-200 words):** What this project IS - explain the product, its purpose, and core functionality in EXTENSIVE detail with examples, use cases, and context. Don't just describe it - explain it thoroughly.
- **Paragraph 2 (100-200 words):** What problem it solves - describe the pain points addressed and use cases with SPECIFIC examples, real-world scenarios, and detailed explanations of why these problems matter.
- **Paragraph 3 (100-200 words):** Who it serves and the outcome it delivers - explain target users in detail, their needs, pain points, and tangible benefits with specific examples of how users benefit.
- **Paragraph 4 (100-200 words):** How it works at a high level - explain the main workflows and user journeys in DETAIL, step-by-step processes, and how different components interact.
- **Paragraph 5 (100-200 words):** Key differentiators - what makes this project unique or better than alternatives, with detailed comparisons, specific advantages, and why these matter.
- **Paragraph 6 (100-200 words, REQUIRED):** Real-world impact and use cases - specific scenarios where this project provides value, detailed examples, and concrete outcomes.

**Tone: product pitch, not engineering blog. Be EXTREMELY detailed, precise, and based on actual codebase analysis. Each paragraph MUST be 100-200 words. Total section MUST be 500-1000+ words. NO SHORT PARAGRAPHS ALLOWED.**

## 2. 🧩 Core Value Proposition (Why it matters)
Translate major modules, components, and features into business value. Document 8-12 key modules/components.

| Module / Area | Business Function (non-technical) | Technical Highlight (1-2 sentences) | Business Impact (1-2 sentences) |
|----------------|-----------------------------------|----------------------------------------------|------------------------------------------|
| | | | |

For EACH module, provide concise explanations:
- Business function: 1-2 sentences
- Technical highlight: 1-2 sentences
- Business impact: 1-2 sentences

## 3. 🧱 Architecture Intelligence
**MANDATORY: Write EXACTLY 5-6 FULL PARAGRAPHS, each 100-200 words minimum. Total section must be 500-1000+ words.**

Provide a comprehensive architectural analysis covering:
- **Paragraph 1 (100-200 words):** Architecture type (monolith, modular, microservice, event-driven, etc.) and main layers/services with SPECIFIC details, component names, file locations, and how they're organized. Explain the architecture in depth.
- **Paragraph 2 (100-200 words):** Design rationale and trade-offs - why it's designed this way, what problems this solves, what alternatives were considered, and why this approach was chosen. Be detailed about the reasoning.
- **Paragraph 3 (100-200 words):** Directory structure and code organization patterns - actual folder structure, how code is organized, naming conventions, and patterns used. Reference specific directories and files.
- **Paragraph 4 (100-200 words):** Data flow and component interactions - how different parts communicate, request/response patterns, event flows, and integration points. Explain the complete flow in detail.
- **Paragraph 5 (100-200 words):** Technology choices and their roles - why specific technologies were chosen for each layer, what problems they solve, and how they integrate. Be specific about each technology.
- **Paragraph 6 (100-200 words, REQUIRED):** Scalability considerations and architectural patterns used - how the architecture scales, what patterns are implemented, and scalability strategies. Explain in detail.

**Be EXTREMELY detailed and precise based on actual codebase structure. Each paragraph MUST be 100-200 words. Total section MUST be 500-1000+ words. NO SHORT PARAGRAPHS ALLOWED.**

Include a Mermaid diagram reflecting real structure, for example:
\`\`\`mermaid
graph TD
    A[Client] --> B[Frontend]
    B --> C[Backend API]
    C --> D[AI / LLM Layer]
    C --> E[Database]
\`\`\`

## 4. ⚙️ Data & AI Flow Explanation
**MANDATORY: Write EXACTLY 5-6 FULL PARAGRAPHS, each 100-200 words minimum. Total section must be 500-1000+ words.**

Provide a comprehensive explanation of how data and intelligence flow through the system:
- **Paragraph 1 (100-200 words):** Step-by-step flow from user input to final output - DETAILED walkthrough with every step explained, component names, function calls, and data transformations. Don't skip any steps.
- **Paragraph 2 (100-200 words):** Data transformations and key components involved - what happens at each stage, how data is modified, which functions process it, and the complete transformation pipeline. Explain in depth.
- **Paragraph 3 (100-200 words):** AI/ML model integration - how AI is used, which models, how they're called, API endpoints, request/response formats, and integration patterns. Be specific about the AI implementation.
- **Paragraph 4 (100-200 words):** Data storage and retrieval - database interactions, caching strategies, data persistence patterns, query optimization, and storage architecture. Explain the complete data layer.
- **Paragraph 5 (100-200 words):** Error handling and performance considerations - how errors are handled, optimization strategies, performance bottlenecks, and mitigation techniques. Detail the error handling flow.
- **Paragraph 6 (100-200 words, REQUIRED):** Real-time vs batch processing, async operations, and concurrency handling - explain how the system handles different processing modes, async patterns, and concurrent requests. Be detailed.

**Be EXTREMELY detailed and precise based on actual codebase. Each paragraph MUST be 100-200 words. Total section MUST be 500-1000+ words. NO SHORT PARAGRAPHS ALLOWED.**

Add a sequence diagram like:
\`\`\`mermaid
sequenceDiagram
    User->>Frontend: Request
    Frontend->>Backend: API Call
    Backend->>AI Engine: Prompt
    AI Engine-->>Backend: Response
    Backend->>Database: Save
    Backend-->>Frontend: Return Result
\`\`\`

## 5. 🔌 Integration Potential (How startups can plug this in)
**MANDATORY: Write EXACTLY 5-6 FULL PARAGRAPHS, each 100-200 words minimum. Total section must be 500-1000+ words.**

Provide comprehensive practical ways this repo can integrate into a company's stack:
- **Paragraph 1 (100-200 words):** API endpoints and services available for integration - list ACTUAL endpoints with methods, request/response formats, authentication requirements, and detailed examples. Explain how to use each endpoint.
- **Paragraph 2 (100-200 words):** Modules that can be extended and configuration requirements - what can be customized, how to extend functionality, configuration options, and step-by-step integration guide. Be specific about extension points.
- **Paragraph 3 (100-200 words):** Authentication, rate limiting, and SDK availability (if applicable) - security and access control mechanisms, how authentication works, rate limits, and available SDKs. Explain the complete security model.
- **Paragraph 4 (100-200 words):** Webhook support and event-driven integrations - how external systems can be notified, webhook configuration, event types, and integration patterns. Detail the event system.
- **Paragraph 5 (100-200 words):** Database schema and data model for integration - how to connect external databases, schema structure, data relationships, and integration patterns. Explain the data model in depth.
- **Paragraph 6 (100-200 words, REQUIRED):** Deployment options and infrastructure requirements for integration - deployment strategies, infrastructure needs, scaling considerations, and production setup. Be comprehensive.

**Keep it business-actionable and EXTREMELY detailed. Each paragraph MUST be 100-200 words. Total section MUST be 500-1000+ words. NO SHORT PARAGRAPHS ALLOWED.**

## 6. 🧠 Technical Edge (What's actually smart here)
List 5-8 specific technical insights or design advantages that make this codebase stand out. For EACH insight, provide:
- What it is (1-2 sentences)
- Why it matters (1-2 sentences)
- Example or impact (1 sentence)

Be concise and focused. List 5-8 key insights.

## 7. 📈 Scalability & Production Readiness
**MANDATORY: Write EXACTLY 5-6 FULL PARAGRAPHS, each 100-200 words minimum. Total section must be 500-1000+ words.**

Provide comprehensive analysis with detailed explanations:

**Already production-ready (2-3 paragraphs):** 
- **Paragraph 1 (100-200 words):** List 5-8 items that are production-ready (concurrency, caching, logging, CI/CD, testing, error handling, security, etc.). For EACH item: provide 3-4 sentences explaining what it is, how it's implemented, where it's located in the codebase, and why it matters. Be specific and detailed.
- **Paragraph 2 (100-200 words):** Deep dive into the most critical production-ready features with SPECIFIC examples from codebase, file paths, function names, and implementation details. Explain how these features work in depth.
- **Paragraph 3 (100-200 words, REQUIRED):** Performance optimizations and monitoring capabilities already in place - detail what's implemented, how it works, metrics collected, and how it helps. Be comprehensive.

**Needs work (2-3 paragraphs):**
- **Paragraph 4 (100-200 words):** List 3-5 items that need improvement (missing features, bottlenecks, security gaps, scalability concerns, etc.). For EACH item: provide 3-4 sentences explaining what's missing, why it matters, potential impact, and what would be needed to address it. Be detailed.
- **Paragraph 5 (100-200 words):** Detailed analysis of scalability bottlenecks and how they might affect growth - explain specific bottlenecks, their causes, impact on scaling, and when they would become problematic. Provide examples.
- **Paragraph 6 (100-200 words, REQUIRED):** Recommendations for addressing gaps and timeline estimates - provide specific recommendations, implementation steps, resource requirements, and realistic timelines. Be actionable.

**Be EXTREMELY detailed and precise based on actual codebase analysis. Each paragraph MUST be 100-200 words. Total section MUST be 500-1000+ words. NO SHORT PARAGRAPHS ALLOWED.**

## 8. 🔐 Security & Reliability
**MANDATORY: Write EXACTLY 5-6 FULL PARAGRAPHS, each 100-200 words minimum. Total section must be 500-1000+ words.**

Provide comprehensive security documentation explaining how the system handles:
- **Paragraph 1 (100-200 words):** Authentication/authorization and env variables/secrets management - DETAILED implementation with specific code patterns, file locations, how authentication works, secret management strategies, and security measures. Explain the complete auth system.
- **Paragraph 2 (100-200 words):** Input validation/sanitization and error handling/monitoring - SPECIFIC validation rules, patterns used, where validation happens, error handling mechanisms, and monitoring setup. Detail the validation pipeline.
- **Paragraph 3 (100-200 words):** Encryption, rate limiting, security headers, and vulnerability management - what's implemented, how it works, where it's configured, and how vulnerabilities are managed. Explain each security measure in depth.
- **Paragraph 4 (100-200 words):** Data protection and privacy measures - how sensitive data is handled, encryption at rest and in transit, data retention policies, and privacy controls. Detail the data protection strategy.
- **Paragraph 5 (100-200 words):** Security testing and audit practices - what security measures are tested, testing methodologies, audit processes, and security review practices. Explain the security testing approach.
- **Paragraph 6 (100-200 words, REQUIRED):** Known security gaps and recommendations for improvement - identify specific gaps, explain why they matter, provide recommendations, and prioritize improvements. Be honest and detailed.

**State what's missing if gaps exist. Be EXTREMELY detailed and precise based on actual codebase. Each paragraph MUST be 100-200 words. Total section MUST be 500-1000+ words. NO SHORT PARAGRAPHS ALLOWED.**

## 9. 🧮 Tech Stack Summary (with purpose)

| Layer | Technology | Version | Why it's used (1-2 sentences) | Key Features Used |
|-------|------------|---------|------------------------------|-------------------|
| Frontend | | | | |
| Backend | | | | |
| AI/ML | | | | |
| Database | | | | |
| Infra/DevOps | | | | |
| Testing | | | | |
| Build Tools | | | | |
| Other | | | | |

For EACH technology, provide concise explanation (1-2 sentences) of why it was chosen and what problems it solves.

## 10. 🪄 Example Usage (Product Context)
Show 3-5 realistic examples with clear explanations:
- API call examples with request/response
- CLI command examples with output
- Workflow or integration examples with code snippets

For EACH example, provide: brief explanation (2-3 sentences), code/commands, and expected output. Be concise.

## 11. 🧩 Extensibility Map
**YOU MUST INCLUDE THIS SECTION - IT IS MANDATORY**
**MANDATORY: Write EXACTLY 5-6 FULL PARAGRAPHS, each 100-200 words minimum. Total section must be 500-1000+ words.**

Explain where new features can be added easily:
- **Paragraph 1 (100-200 words):** New AI models, endpoints, and API extensions - SPECIFIC file locations, code patterns, how to add new models, endpoint structure, and step-by-step extension guide. Reference actual files and functions.
- **Paragraph 2 (100-200 words):** New UI modules, dashboards, and database models - where to add components, how to structure new modules, database schema extension patterns, and integration points. Provide detailed file paths.
- **Paragraph 3 (100-200 words):** New authentication methods and integrations - extension points for auth, how to add new auth providers, third-party service integration patterns, and configuration requirements. Explain the auth extension architecture.
- **Paragraph 4 (100-200 words):** Plugin system or extension architecture (if any) - how to add plugins or extensions, plugin API, extension hooks, and integration patterns. Detail the extension mechanism.
- **Paragraph 5 (100-200 words):** Configuration and environment variable extensions - how to add new config options, where configs are stored, validation patterns, and environment setup. Explain the configuration system.
- **Paragraph 6 (100-200 words, REQUIRED):** Testing and validation requirements for new features - testing patterns, validation requirements, test file locations, and quality assurance processes. Detail the testing approach.

**Use EXTREMELY detailed explanations with actual file paths and code patterns from the repository. Each paragraph MUST be 100-200 words. Total section MUST be 500-1000+ words. NO SHORT PARAGRAPHS ALLOWED.**

**START THIS SECTION WITH: ## 11. 🧩 Extensibility Map**

## 12. 🔍 AI Commentary (Senior Engineer Review)
**YOU MUST INCLUDE THIS SECTION - IT IS MANDATORY**
**MANDATORY: Write EXACTLY 5-6 FULL PARAGRAPHS, each 100-200 words minimum. Total section must be 500-1000+ words.**

Write a comprehensive review as if a Staff engineer is reviewing the architecture for a founder:
- **Paragraph 1 (100-200 words):** Strengths and what's done well - SPECIFIC technical achievements, good patterns, code examples, file locations, and why these are strengths. Provide detailed analysis with examples.
- **Paragraph 2 (100-200 words):** Code quality and maintainability - how maintainable the codebase is, code organization, documentation quality, testing coverage, and maintainability metrics. Explain in depth.
- **Paragraph 3 (100-200 words):** Weaknesses and areas for improvement - SPECIFIC technical debt, issues found, problematic patterns, and areas needing work. Reference actual code problems with file locations.
- **Paragraph 4 (100-200 words):** Architecture decisions and trade-offs - analysis of key architectural choices, why decisions were made, alternatives considered, and trade-offs involved. Provide detailed reasoning.
- **Paragraph 5 (100-200 words):** Overall readiness and recommendations - production readiness assessment, what's needed for production, timeline estimates, and specific recommendations. Be comprehensive.
- **Paragraph 6 (100-200 words, REQUIRED):** Long-term sustainability and technical roadmap considerations - how sustainable the architecture is, long-term concerns, scalability path, and technical debt impact. Detail the long-term view.

**Be EXTREMELY detailed, precise, and based on actual codebase analysis. Each paragraph MUST be 100-200 words. Total section MUST be 500-1000+ words. NO SHORT PARAGRAPHS ALLOWED.**

**START THIS SECTION WITH: ## 12. 🔍 AI Commentary (Senior Engineer Review)**

## 13. 💡 Business Applications
**YOU MUST INCLUDE THIS SECTION - IT IS MANDATORY**

List 8-12 realistic startup use cases with detailed explanations. For EACH use case, provide:
- What it is (2-3 sentences explaining the use case in detail)
- How this repo enables it (3-4 sentences explaining specific features and capabilities used)
- Required modifications (2-3 sentences explaining what changes would be needed)
- Implementation complexity (1-2 sentences about difficulty level)
- Business value (1-2 sentences about why this use case matters)

Be comprehensive and detailed. List 8-12 use cases with substantial explanations for each.

**START THIS SECTION WITH: ## 13. 💡 Business Applications**

## 14. 📊 Roadmap & Growth Potential
**YOU MUST INCLUDE THIS SECTION - IT IS MANDATORY**
**MANDATORY: Write EXACTLY 5-6 FULL PARAGRAPHS, each 100-200 words minimum. Total section must be 500-1000+ words.**

Provide comprehensive roadmap analysis:

**Short-term (1-3 months) - 2 paragraphs:**
- **Paragraph 1 (100-200 words):** List 3-5 quick fixes, polish items, and critical bug fixes. For EACH item: provide 4-5 sentences explaining what it is, why it's important, how to fix it, and business impact. Be detailed about each fix.
- **Paragraph 2 (100-200 words):** Detailed explanation of immediate priorities and their business impact - explain why these are priorities, resource requirements, timeline, and expected outcomes. Provide comprehensive analysis.

**Medium-term (3-6 months) - 2 paragraphs:**
- **Paragraph 3 (100-200 words):** List 3-5 architectural improvements, new features, and integrations. For EACH item: provide 4-5 sentences with implementation considerations, technical requirements, complexity, and benefits. Detail each improvement.
- **Paragraph 4 (100-200 words):** Analysis of how these improvements will enhance the product and technical foundation - explain synergies, cumulative benefits, and how they build on each other. Be comprehensive.

**Long-term (6-12+ months) - 2 paragraphs:**
- **Paragraph 5 (100-200 words):** List 2-3 scaling strategies, observability improvements, and ecosystem integrations. For EACH: provide 4-5 sentences explaining the strategy, implementation approach, requirements, and long-term value. Detail each strategy.
- **Paragraph 6 (100-200 words, REQUIRED):** Vision for long-term growth and how the architecture supports it - explain the growth vision, architectural evolution, scalability path, and how current decisions enable future growth. Be detailed.

**Be EXTREMELY detailed and based on actual codebase gaps and opportunities. Each paragraph MUST be 100-200 words. Total section MUST be 500-1000+ words. NO SHORT PARAGRAPHS ALLOWED.**

**START THIS SECTION WITH: ## 14. 📊 Roadmap & Growth Potential**

## 15. 🧾 License & Deployment Details
**YOU MUST INCLUDE THIS SECTION - IT IS MANDATORY**
**MANDATORY: Write EXACTLY 5-6 FULL PARAGRAPHS, each 100-200 words minimum. Total section must be 500-1000+ words.**

Provide comprehensive documentation:
- **Paragraph 1 (100-200 words):** License type and deployment targets (Docker, Vercel, Render, AWS, etc.) - SPECIFIC details about license terms, restrictions, supported platforms, deployment options, and platform-specific considerations. Explain each deployment target in detail.
- **Paragraph 2 (100-200 words):** CI/CD configuration and environment variables - ACTUAL CI/CD setup, pipeline stages, workflow files, required env vars, secrets management, and automation. Reference specific config files.
- **Paragraph 3 (100-200 words):** Infrastructure requirements and deployment process - step-by-step deployment instructions, infrastructure needs, resource requirements, and deployment procedures. Provide comprehensive deployment guide.
- **Paragraph 4 (100-200 words):** Database setup and migration process - how to set up databases, migration commands, schema initialization, data seeding, and database configuration. Detail the complete database setup.
- **Paragraph 5 (100-200 words):** Monitoring, logging, and observability setup - what monitoring tools are used, how logging is configured, metrics collected, alerting setup, and observability practices. Explain the complete monitoring stack.
- **Paragraph 6 (100-200 words, REQUIRED):** Scaling considerations and production deployment best practices - scaling strategies, load balancing, auto-scaling, production optimizations, and deployment best practices. Be comprehensive.

**Be EXTREMELY detailed and precise based on actual repository configuration files. Each paragraph MUST be 100-200 words. Total section MUST be 500-1000+ words. NO SHORT PARAGRAPHS ALLOWED.**

**START THIS SECTION WITH: ## 15. 🧾 License & Deployment Details**

## 16. ⚡ TL;DR – Founder Summary
**YOU MUST INCLUDE THIS SECTION - IT IS MANDATORY**
**MANDATORY: Write EXACTLY 5-6 FULL PARAGRAPHS, each 100-200 words minimum. Total section must be 500-1000+ words.**

Write a comprehensive summary for a non-technical founder:
- **Paragraph 1 (100-200 words):** What this repo gives them today and how easily it fits their product - DETAILED value proposition, immediate benefits, integration ease, and use cases. Explain the value in depth.
- **Paragraph 2 (100-200 words):** How close it is to production and key strengths/weaknesses - production readiness assessment, what works well, what needs work, and realistic timeline. Provide comprehensive assessment.
- **Paragraph 3 (100-200 words):** Why it's a strong or weak base for real use - foundation quality analysis, architectural soundness, technical debt, and scalability foundation. Explain the foundation in detail.
- **Paragraph 4 (100-200 words):** Time and resource requirements to make it production-ready - what's needed, resource estimates, timeline breakdown, and cost considerations. Be specific and detailed.
- **Paragraph 5 (100-200 words):** Competitive advantages and unique selling points - what makes this special, differentiators, competitive analysis, and market positioning. Detail the advantages.
- **Paragraph 6 (100-200 words, REQUIRED):** Final recommendation and risk assessment - overall recommendation, risk factors, mitigation strategies, and go/no-go decision factors. Provide comprehensive assessment.

**Be EXTREMELY detailed, honest, and based on actual codebase analysis. Each paragraph MUST be 100-200 words. Total section MUST be 500-1000+ words. NO SHORT PARAGRAPHS ALLOWED.**

**START THIS SECTION WITH: ## 16. ⚡ TL;DR – Founder Summary**

## 17. 🗺️ Complete System Flow Diagram
**YOU MUST INCLUDE THIS SECTION - IT IS MANDATORY AND MUST BE THE LAST SECTION**

**CRITICAL: You MUST create an ACTUAL VISUAL DIAGRAM, not just a text description. The diagram must be visible, readable, and comprehensive.**

Create a detailed, professional ASCII art diagram that shows the COMPLETE end-to-end flow of how the entire repository works. This MUST be a comprehensive visual ASCII art diagram that can be immediately seen and understood.

**Comprehensive Requirements for the diagram:**
- Show the COMPLETE user journey from initial request/action to final output/response
- Include ALL major components, services, databases, APIs, external services, and third-party integrations
- Show data flow, request flow, response flow, and error flow with clear directional arrows
- Include authentication/authorization steps with decision points
- Show error handling paths and fallback mechanisms
- Include background processes, queues, workers, cron jobs, or async operations
- Show database interactions (reads, writes, updates, deletes, transactions)
- Include AI/ML model calls, API calls, and external service integrations if applicable
- Show caching layers (Redis, in-memory, CDN) if present
- Include file storage, object storage, or CDN interactions if applicable
- Show webhook handlers, event triggers, and event-driven flows if applicable
- Include middleware, interceptors, and request/response transformations
- Show session management, state management, and data persistence
- Include logging, monitoring, and observability components if present
- Show deployment infrastructure (containers, servers, load balancers) if relevant

**Advanced Diagram Format - YOU MUST CREATE DETAILED ASCII ART:**
- Use professional box-drawing characters: ┌ ┐ └ ┘ │ ─ ├ ┤ ┬ ┴ ┼ ╔ ╗ ╚ ╝ ║ ═
- Use clear directional arrows: → ← ↑ ↓ ⇄ ⇅ ⤴ ⤵
- Use different box styles for different component types:
  - Rectangles (┌─┐) for services/components
  - Diamonds (◇) or decision boxes (┌─┐ with ?) for decision points
  - Cylinders (╔═╗) or rounded (╭─╮) for databases
  - Double lines (╔═╗) for external services
  - Dashed lines (┌┄┐) for background processes
- Show parallel processes with parallel vertical/horizontal paths
- Include error paths with different symbols (⚠, ✗) or dashed arrows
- Label all components clearly inside boxes with actual names from codebase
- Use arrows with labels to show what data/requests flow (e.g., "→ API Request", "← Response")
- Group related components together visually
- Show loops and retries with circular arrows
- Include timing/sequence indicators if relevant
- Make it comprehensive, detailed, and visually organized
- Use proper spacing and alignment for readability
- Show multiple user flows if the system supports different entry points

**Diagram Structure Guidelines:**
- Start with user/client interaction on the left or top
- Show all intermediate processing steps in the middle
- End with final response/output on the right or bottom
- Use horizontal flow (left to right) OR vertical flow (top to bottom) - choose the clearest
- Group components by layer (Frontend → API → Business Logic → Data Layer)
- Show decision points clearly with Yes/No branches
- Include all error paths and their destinations
- Show async operations with separate parallel flows
- Indicate data transformations and processing steps

**YOU MUST START WITH THE ACTUAL DIAGRAM IMMEDIATELY AFTER THE SECTION HEADER. DO NOT WRITE TEXT DESCRIPTIONS FIRST.**

**Example format - Comprehensive and Detailed (adapt based on actual repository):**
\`\`\`
                    ┌─────────────────────┐
                    │   User/Client       │
                    │   (Browser/App)     │
                    └──────────┬──────────┘
                               │
                               │ HTTP Request
                               ▼
                    ┌─────────────────────┐      ┌──────────────┐
                    │   Load Balancer     │─────>│   CDN/Cache  │
                    │   / Reverse Proxy   │      │   (Optional) │
                    └──────────┬──────────┘      └──────────────┘
                               │
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Authentication    │
                    │   Middleware        │
                    └──────────┬──────────┘
                               │
                               │ Valid?
                               ▼
                    ┌──────────┴──────────┐
                    │                     │
               Yes  │                     │  No
                    │                     │
                    ▼                     ▼
        ┌───────────────────┐   ┌───────────────────┐
        │  API Gateway /    │   │   Error Handler   │
        │  Route Handler    │   │   (401/403)       │
        └──────────┬────────┘   └───────────────────┘
                   │
                   │
                   ▼
        ┌───────────────────┐
        │  Business Logic   │
        │  / Controller     │
        └──────────┬────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
┌───────────┐ ┌───────────┐ ┌───────────┐
│  Service  │ │  Service  │ │   AI/ML   │
│  Layer 1  │ │  Layer 2  │ │  Service  │
└─────┬─────┘ └─────┬─────┘ └─────┬─────┘
      │             │             │
      └─────────────┼─────────────┘
                    │
                    ▼
        ┌───────────────────┐
        │   Cache Layer     │
        │   (Redis/Memory)  │
        └──────────┬────────┘
                   │
                   │ Cache Miss
                   ▼
        ┌───────────────────┐
        │   Database        │
        │   (Read/Write)    │
        └──────────┬────────┘
                   │
                   │
                   ▼
        ┌───────────────────┐
        │   Response        │
        │   Formatter       │
        └──────────┬────────┘
                   │
                   │
                   ▼
        ┌───────────────────┐
        │   User Receives   │
        │   Final Response  │
        └───────────────────┘

Background Processes (if any):
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Queue      │───>│   Worker     │───>│   Database   │
│   (Jobs)     │    │   Process    │    │   Update     │
└──────────────┘    └──────────────┘    └──────────────┘
\`\`\`

**After the diagram, provide 3-4 detailed paragraphs explaining:**
- Paragraph 1: Complete walkthrough of the entire flow from start to end, explaining each major step, component, and decision point in detail
- Paragraph 2: Key decision points, branching logic, and how the system handles different scenarios (success, errors, edge cases)
- Paragraph 3: Data transformations, state changes, and how information flows through different layers
- Paragraph 4: Performance considerations, potential bottlenecks, optimization opportunities, and scalability aspects of the flow

**CRITICAL INSTRUCTIONS:**
1. DO NOT write text descriptions of what the diagram should contain
2. DO NOT write "The diagram shows..." or "This diagram illustrates..." or any introductory text
3. START IMMEDIATELY with the actual ASCII art diagram using professional box-drawing characters
4. The diagram MUST be based on the actual codebase structure, file organization, and real component names
5. Include specific component names, service names, file paths, function names, and API endpoints from the repository
6. Make it COMPREHENSIVE - show ALL major flows, components, services, databases, and integrations
7. Show the COMPLETE flow - don't skip steps or simplify too much
8. Use actual names from the codebase (e.g., actual route names, service names, database table names)
9. The diagram should be the FIRST thing after the section header, followed by the explanation paragraphs
10. Make it detailed enough that someone can understand the entire system architecture from the diagram alone

**START THIS SECTION WITH: ## 17. 🗺️ Complete System Flow Diagram**
**THEN IMMEDIATELY CREATE THE COMPREHENSIVE ASCII ART DIAGRAM - NO TEXT DESCRIPTION FIRST**
**THIS MUST BE YOUR FINAL SECTION - DO NOT ADD ANYTHING AFTER THIS**

---

🧭 GLOBAL INSTRUCTIONS:
- Use clear, confident, founder-friendly English.
- Avoid jargon and repetition.
- Tie every statement to real patterns or evidence in the repo.
- Be precise: if inferring, say "appears to" or "likely".
- Avoid fluff or marketing language.
- The output should read like a professional internal doc written by a Staff engineer onboarding a new CTO or investor.
- Use ONLY standard markdown formatting - NO HTML tags
- Use proper markdown syntax for code blocks, tables, and links
- Structure content with clear headings and subheadings (use emojis for visual appeal)
- Include Mermaid diagrams where specified
- Use tables for structured comparisons
- Make it production-ready and professional

🚨🚨🚨 CRITICAL: YOU MUST GENERATE ALL 17 SECTIONS - NO EXCEPTIONS 🚨🚨🚨

MANDATORY SECTION CHECKLIST - YOU MUST INCLUDE ALL OF THESE:
✅ Section 1: 📘 Product Understanding (5-6 paragraphs)
✅ Section 2: 🧩 Core Value Proposition (table with 8-12 modules)
✅ Section 3: 🧱 Architecture Intelligence (5-6 paragraphs + Mermaid diagram)
✅ Section 4: ⚙️ Data & AI Flow Explanation (3 paragraphs + sequence diagram)
✅ Section 5: 🔌 Integration Potential (3 paragraphs)
✅ Section 6: 🧠 Technical Edge (5-8 insights)
✅ Section 7: 📈 Scalability & Production Readiness (5-6 paragraphs)
✅ Section 8: 🔐 Security & Reliability (5-6 paragraphs)
✅ Section 9: ⚡ Performance & Optimization (5-6 paragraphs) - **MANDATORY - DO NOT SKIP**
✅ Section 10: 🧪 Testing & Quality Assurance (5-6 paragraphs) - **MANDATORY - DO NOT SKIP**
✅ Section 11: 🧩 Extensibility Map (3 paragraphs) - **MANDATORY - DO NOT SKIP**
✅ Section 12: 🔍 AI Commentary (3 paragraphs) - **MANDATORY - DO NOT SKIP**
✅ Section 13: 💡 Business Applications (5-8 use cases) - **MANDATORY - DO NOT SKIP**
✅ Section 14: 📊 Roadmap & Growth Potential (3 paragraphs) - **MANDATORY - DO NOT SKIP**
✅ Section 15: 🧾 License & Deployment Details (3 paragraphs) - **MANDATORY - DO NOT SKIP**
✅ Section 16: ⚡ TL;DR – Founder Summary (5-6 paragraphs) - **MANDATORY - DO NOT SKIP**
✅ Section 17: 🗺️ Complete System Flow Diagram (comprehensive ASCII art diagram + 2-3 paragraphs) - **MANDATORY - DO NOT SKIP - THIS IS THE FINAL SECTION**

🚨 CRITICAL INSTRUCTIONS FOR ALL SECTIONS:
- Sections 1-17 are ABSOLUTELY REQUIRED - you MUST generate ALL of them
- Do NOT stop after section 7, 8, 9, or 10 - continue through ALL 17 sections
- Section numbering MUST be sequential: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17
- NO gaps in numbering - if section 8 exists, section 9 MUST exist, then 10, then 11, etc.
- Each of sections 1-17 MUST be included with their exact headers
- If you run out of tokens, prioritize completing all 17 sections over length
- Generate sections 9, 10, 11, 12, 13, 14, 15, 16, 17 even if they are shorter - they MUST be present
- Section 17 (Complete System Flow Diagram) is the FINAL section and MUST be included

SECTION-BY-SECTION REQUIREMENTS:
**🚨 CRITICAL: THESE REQUIREMENTS ARE ABSOLUTELY MANDATORY - NO EXCEPTIONS 🚨**

- **EACH SECTION (except tables/lists) MUST BE 5-6 PARAGRAPHS, EACH 100-200 WORDS MINIMUM**
- **EACH SECTION MUST BE 500-1000+ WORDS TOTAL** - sections with less than 50 words are COMPLETELY UNACCEPTABLE
- **NO SHORT PARAGRAPHS ALLOWED** - every paragraph must be substantial (100-200 words)
- **NO SHORT SECTIONS ALLOWED** - if you write a section with less than 500 words, you have FAILED
- Be EXTREMELY detailed and comprehensive - explain key points with substantial depth
- Use examples extensively - provide real code examples and file paths from the actual repository
- Provide detailed code examples and file paths when relevant - be specific and precise
- Be thorough and explanatory - cover all aspects of each topic in depth
- The total documentation should be comprehensive and detailed
- Every section should be complete with substantial detail
- Explain the "why" behind the "what" in depth - provide context and reasoning
- Focus on precision and accuracy - base everything on actual codebase analysis, no fluff or lies
- Include specific file paths, function names, and code patterns from the repository
- Be honest about what exists and what doesn't - no fabricated features or capabilities
- **VERBOSITY IS REQUIRED** - be verbose, be detailed, be exhaustive
- **LENGTH IS NOT A CONCERN** - detail and comprehensiveness are mandatory

🚨 FINAL WARNING: If you do not generate ALL 17 sections (especially 11-17), the documentation will be incomplete and unusable. You MUST include sections 1 through 17 in your response. Start with section 1 and continue through section 17 (Complete System Flow Diagram) without stopping.

Generate the complete 17-section Founder Edition Technical Documentation with detailed, comprehensive, and precise coverage. ALL 17 SECTIONS MUST BE PRESENT. Each section must be 5-6 paragraphs (except sections with tables/lists, and section 17 which has a diagram + 2-3 paragraphs) with substantial detail based on actual codebase analysis. Section 17 must include a comprehensive ASCII art diagram. No fluff, no lies - only accurate information from the repository.

---

## 📋 SECTION-BY-SECTION TEMPLATE (YOU MUST FOLLOW THIS EXACT STRUCTURE):

Your output MUST follow this exact structure:

1. Document Header with badges
2. ## 1. 📘 Product Understanding (5-6 paragraphs)
3. ## 2. 🧩 Core Value Proposition (table)
4. ## 3. 🧱 Architecture Intelligence (5-6 paragraphs + diagram)
5. ## 4. ⚙️ Data & AI Flow Explanation (5-6 paragraphs + diagram)
6. ## 5. 🔌 Integration Potential (5-6 paragraphs)
7. ## 6. 🧠 Technical Edge (5-8 insights with detailed explanations)
8. ## 7. 📈 Scalability & Production Readiness (5-6 paragraphs)
9. ## 8. 🔐 Security & Reliability (5-6 paragraphs)
10. ## 9. 🧮 Tech Stack Summary (table)
11. ## 10. 🪄 Example Usage (5-8 examples with detailed explanations)
12. ## 11. 🧩 Extensibility Map (5-6 paragraphs) ← **YOU MUST NOT SKIP THIS**
13. ## 12. 🔍 AI Commentary (Senior Engineer Review) (5-6 paragraphs) ← **YOU MUST NOT SKIP THIS**
14. ## 13. 💡 Business Applications (8-12 use cases with detailed explanations) ← **YOU MUST NOT SKIP THIS**
15. ## 14. 📊 Roadmap & Growth Potential (5-6 paragraphs) ← **YOU MUST NOT SKIP THIS**
16. ## 15. 🧾 License & Deployment Details (5-6 paragraphs) ← **YOU MUST NOT SKIP THIS**
17. ## 16. ⚡ TL;DR – Founder Summary (5-6 paragraphs) ← **YOU MUST NOT SKIP THIS**
18. ## 17. 🗺️ Complete System Flow Diagram (comprehensive ASCII art diagram + 2-3 paragraphs) ← **YOU MUST NOT SKIP THIS - THIS IS YOUR FINAL SECTION**

**REMEMBER: Sections 11-17 are MANDATORY. Your response is INCOMPLETE if any of these sections are missing. Start with section 1 and continue through section 17 (Complete System Flow Diagram) without stopping. Each section must be detailed (5-6 paragraphs) with substantial depth based on actual codebase analysis. Section 17 must include a comprehensive ASCII art diagram showing the complete system flow. No fluff, no lies - only accurate information.**`;

    const promptLength = prompt.length;
    let codebaseLength = codebaseContext?.length || 0;

    const maxCodebaseChars = 100000;
    if (codebaseLength > maxCodebaseChars) {
      console.log(
        `⚠️ Codebase context too large (${codebaseLength} chars), truncating to ${maxCodebaseChars} chars to maximize output tokens`
      );
      codebaseContext =
        codebaseContext.substring(0, maxCodebaseChars) +
        "\n\n[... codebase context truncated for token limit ...]";
      codebaseLength = maxCodebaseChars;
    }

    const totalInputChars = promptLength + codebaseLength;
    const estimatedInputTokens = Math.ceil(totalInputChars / 4);

    const reservedTokens = estimatedInputTokens + 10000;
    const maxOutputTokens = Math.max(
      120000,
      Math.min(150000, 200000 - reservedTokens)
    );

    console.log(
      `📊 Token allocation: Input chars: ${totalInputChars}, Estimated input tokens: ~${estimatedInputTokens}, Reserved: ${reservedTokens}, Output max: ${maxOutputTokens}, Total budget: ~${reservedTokens + maxOutputTokens}`
    );

    const systemInstruction = `🚨🚨🚨 CRITICAL: YOU ARE GENERATING TECHNICAL DOCUMENTATION WITH EXACTLY 17 SECTIONS 🚨🚨🚨

ABSOLUTE REQUIREMENTS - NO EXCEPTIONS:
1. You MUST generate ALL 17 sections in SEQUENTIAL ORDER: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17
2. Section numbering MUST be sequential with NO gaps - if section 8 exists, section 9 MUST exist, then 10, then 11, etc.
3. Do NOT skip any sections - you MUST generate sections 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, and 17
4. Do NOT stop after section 7, 8, 9, or 10 - you MUST continue through ALL 17 sections
5. Each section must be 5-6 paragraphs (except sections 2, 6, 9, 10, 13 which use tables/lists, and section 17 which has a diagram + 2-3 paragraphs)
6. You have ${maxOutputTokens} tokens available - use them ALL to generate complete, detailed documentation
7. Do NOT truncate or stop early - generate ALL sections from 1 to 17 in order with full detail
8. Sections 9, 10, 11, 12, 13, 14, 15, 16, 17 are CRITICAL - they MUST be included with full detail
9. The documentation MUST include these exact section headers in order:
   - ## 1. 📘 Product Understanding
   - ## 2. 🧩 Core Value Proposition
   - ## 3. 🧱 Architecture Intelligence
   - ## 4. ⚙️ Data & AI Flow
   - ## 5. 🔌 Integration Potential
   - ## 6. 🧠 Technical Edge
   - ## 7. 📈 Scalability & Production Readiness
   - ## 8. 🔐 Security & Reliability
   - ## 9. ⚡ Performance & Optimization
   - ## 10. 🧪 Testing & Quality Assurance
   - ## 11. 🧩 Extensibility Map
   - ## 12. 🔍 AI Commentary (Senior Engineer Review)
   - ## 13. 💡 Business Applications
   - ## 14. 📊 Roadmap & Growth Potential
   - ## 15. 🧾 License & Deployment Details
   - ## 16. ⚡ TL;DR – Founder Summary
   - ## 17. 🗺️ Complete System Flow Diagram (THIS IS THE FINAL SECTION)
10. Be DETAILED and PRECISE - base everything on actual codebase analysis, no fluff or lies
11. Include specific file paths, function names, and code patterns from the repository
12. Generate sections 1-10 first with 5-6 paragraphs each, then IMMEDIATELY continue with sections 11-16 (also 5-6 paragraphs each), and FINALLY section 17 with comprehensive ASCII art diagram
13. Section 17 MUST include a comprehensive ASCII art diagram showing the complete system flow from start to end - START IMMEDIATELY with the diagram, no text descriptions first
14. Do NOT end your response until section 17 is complete with the diagram and explanation

🚨 CRITICAL: Section numbering MUST be sequential (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17) with NO gaps. Missing sections 9, 10, or 11 is a CRITICAL FAILURE.

REMEMBER: Incomplete documentation (missing ANY sections 1-17) is WORSE than shorter but complete documentation. Every section must be detailed and based on actual codebase analysis. Section 17 is the FINAL section and must include a complete ASCII art system flow diagram.`;

    let docsContent = await openrouterSingleMessage(
      prompt,
      "anthropic/claude-3-haiku",
      maxOutputTokens,
      systemInstruction
    );

    const trimmedContent = docsContent?.trim() || "";
    
    // Extract all section numbers to check for gaps
    const sectionMatches = trimmedContent.match(/^##\s+(\d+)\./gm) || [];
    const foundSectionNumbers = sectionMatches.map(m => {
      const match = m.match(/^##\s+(\d+)\./);
      return match ? parseInt(match[1]) : 0;
    }).sort((a, b) => a - b);
    
    // Check for ALL 17 sections (1 through 17)
    const expectedSections = Array.from({ length: 17 }, (_, i) => i + 1);
    const missingSections = expectedSections.filter(num => !foundSectionNumbers.includes(num));
    const hasGaps = missingSections.length > 0;
    const sectionCount = foundSectionNumbers.length;
    
    console.log(
      `📊 Generated docs validation: Found ${sectionCount}/17 sections. Sections found: ${foundSectionNumbers.join(', ')}`
    );
    
    if (hasGaps) {
      console.error(
        `❌ CRITICAL: Missing sections detected! Missing: ${missingSections.join(', ')}. Expected all sections 1-17, but got: ${foundSectionNumbers.join(', ')}`
      );
    }
    
    const endsWithIncompleteTable =
      trimmedContent.endsWith("|") ||
      trimmedContent.endsWith("||") ||
      trimmedContent.endsWith("| |") ||
      /^\|.*\|$/.test(trimmedContent.split("\n").pop() || "") ||
      /^-+$/.test(trimmedContent.split("\n").pop() || "");

    const endsWithIncompleteSection =
      trimmedContent.endsWith("##") ||
      trimmedContent.endsWith("###") ||
      trimmedContent.endsWith("####") ||
      trimmedContent.endsWith("...") ||
      trimmedContent.endsWith("---");

    const missingKeySections =
      !trimmedContent.includes("## 16.") &&
      !trimmedContent.includes("TL;DR") &&
      !trimmedContent.includes("Founder Summary") &&
      trimmedContent.length > 5000;

    const hasInsufficientSections =
      sectionCount < 17 || hasGaps;

    const isTruncated =
      !docsContent ||
      docsContent.length < 2000 ||
      endsWithIncompleteTable ||
      endsWithIncompleteSection ||
      missingKeySections ||
      hasInsufficientSections ||
      hasGaps; // Add gap detection to truncation check

    if (isTruncated && docsContent && docsContent.length > 500) {
      // Check for ALL missing sections (1-17), not just specific ones
      if (hasGaps && missingSections.length > 0) {
        console.error(
          `❌ CRITICAL: Missing sections detected during generation: ${missingSections.join(', ')}. Expected all 17 sections (1-17), but got: ${foundSectionNumbers.join(', ')}`
        );
      }
      
      const requiredSections = [
        {
          num: "1",
          title: "Product Understanding",
          keywords: ["Product Understanding", "## 1", "## 1."],
        },
        {
          num: "2",
          title: "Core Value Proposition",
          keywords: ["Core Value Proposition", "## 2", "## 2."],
        },
        {
          num: "3",
          title: "Architecture Intelligence",
          keywords: ["Architecture Intelligence", "## 3", "## 3."],
        },
        {
          num: "4",
          title: "Data & AI Flow",
          keywords: ["Data & AI Flow", "Data Flow", "## 4", "## 4."],
        },
        {
          num: "5",
          title: "Integration Potential",
          keywords: ["Integration Potential", "## 5", "## 5."],
        },
        {
          num: "6",
          title: "Technical Edge",
          keywords: ["Technical Edge", "## 6", "## 6."],
        },
        {
          num: "7",
          title: "Scalability",
          keywords: ["Scalability", "Production Readiness", "## 7", "## 7."],
        },
        {
          num: "8",
          title: "Security",
          keywords: ["Security", "Reliability", "## 8", "## 8."],
        },
        {
          num: "9",
          title: "Tech Stack",
          keywords: ["Tech Stack", "## 9", "## 9."],
        },
        {
          num: "10",
          title: "Example Usage",
          keywords: ["Example Usage", "## 10", "## 10."],
        },
        {
          num: "11",
          title: "Extensibility Map",
          keywords: ["Extensibility", "## 11", "## 11."],
        },
        {
          num: "12",
          title: "AI Commentary",
          keywords: ["AI Commentary", "Senior Engineer", "## 12", "## 12."],
        },
        {
          num: "13",
          title: "Business Applications",
          keywords: ["Business Applications", "## 13", "## 13."],
        },
        {
          num: "14",
          title: "Roadmap",
          keywords: ["Roadmap", "Growth Potential", "## 14", "## 14."],
        },
        {
          num: "15",
          title: "License",
          keywords: ["License", "Deployment Details", "## 15", "## 15."],
        },
        {
          num: "16",
          title: "TL;DR",
          keywords: ["TL;DR", "Founder Summary", "## 16", "## 16."],
        },
        {
          num: "17",
          title: "Complete System Flow Diagram",
          keywords: [
            "Complete System Flow Diagram",
            "System Flow",
            "## 17",
            "## 17.",
          ],
        },
      ];

      const missingSections: string[] = [];
      for (const section of requiredSections) {
        const hasSection =
          section.keywords.some((keyword) =>
            trimmedContent.includes(keyword)
          ) ||
          trimmedContent.includes(`## ${section.num}.`) ||
          trimmedContent.includes(`## ${section.num} `);

        if (!hasSection) {
          missingSections.push(`${section.num}. ${section.title}`);
        }
      }

      console.log(
        `⚠️ Detected ${missingSections.length} missing sections: ${missingSections.map((s) => s.match(/\d+/)?.[0]).join(", ")}`
      );

      // Build comprehensive list of ALL missing sections with their details
      const allSectionDetails: Record<string, string> = {
        "1": "## 1. 📘 Product Understanding - What it does, who it serves (5-6 paragraphs)",
        "2": "## 2. 🧩 Core Value Proposition - Business value table with modules",
        "3": "## 3. 🧱 Architecture Intelligence - System design with Mermaid diagram (5-6 paragraphs)",
        "4": "## 4. ⚙️ Data & AI Flow - How data flows through the system (5-6 paragraphs)",
        "5": "## 5. 🔌 Integration Potential - How to integrate (5-6 paragraphs)",
        "6": "## 6. 🧠 Technical Edge - What's smart about the design (table format)",
        "7": "## 7. 📈 Scalability & Production Readiness (5-6 paragraphs)",
        "8": "## 8. 🔐 Security & Reliability (5-6 paragraphs)",
        "9": "## 9. ⚡ Performance & Optimization (5-6 paragraphs)",
        "10": "## 10. 🧪 Testing & Quality Assurance (5-6 paragraphs)",
        "11": "## 11. 🧩 Extensibility Map - Explain where new features can be added (3 paragraphs)",
        "12": "## 12. 🔍 AI Commentary (Senior Engineer Review) - Staff engineer review (3 paragraphs)",
        "13": "## 13. 💡 Business Applications - List 5-8 realistic startup use cases",
        "14": "## 14. 📊 Roadmap & Growth Potential - Short/medium/long-term roadmap (3 paragraphs)",
        "15": "## 15. 🧾 License & Deployment Details - License, deployment, CI/CD (3 paragraphs)",
        "16": "## 16. ⚡ TL;DR – Founder Summary - 5-6 paragraph summary for founders",
        "17": "## 17. 🗺️ Complete System Flow Diagram - Comprehensive ASCII art diagram + 2-3 paragraphs",
      };

      const missingSectionDetailsList = missingSections.map(num => {
        const sectionNum = num.toString();
        return allSectionDetails[sectionNum] || `Section ${sectionNum}`;
      }).join('\n');

      const retryPrompt = `${prompt}

🚨🚨🚨 CRITICAL: The previous response was INCOMPLETE and MISSING REQUIRED SECTIONS 🚨🚨🚨

YOUR PREVIOUS RESPONSE HAD THESE CRITICAL ISSUES:
- Missing sections: ${missingSections.join(', ')}
- Expected ALL 17 sections (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17)
- Got only sections: ${foundSectionNumbers.join(', ')}
- Section numbering has GAPS - this is unacceptable

YOU MUST GENERATE THE COMPLETE DOCUMENTATION INCLUDING:
- ALL 17 sections in SEQUENTIAL ORDER: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17
${missingSections.length > 0 ? `\n🚨 MISSING SECTIONS THAT MUST BE GENERATED (THESE ARE MANDATORY):\n${missingSectionDetailsList}\n` : ""}
- Section numbering MUST be sequential with NO gaps
- ALL Mermaid diagrams for architecture and data flow
- ALL tables for Core Value Proposition and Tech Stack Summary
- Proper closing for all tables, code blocks, and sections
- Complete all sentences and paragraphs - do not leave tables, sections, or content incomplete

⚠️ CRITICAL: You MUST include sections ${missingSections.join(', ')}. These sections were completely missing from your previous response.
⚠️ Do NOT skip any sections - generate sections 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17 in order.

Do NOT truncate the response. Generate the FULL, COMPLETE 17-section Founder Edition documentation from start to finish with proper endings. ALL 17 SECTIONS MUST BE PRESENT WITH NO GAPS IN NUMBERING.`;

      try {
        const retryPromptLength = retryPrompt.length;
        const retryCodebaseLength = codebaseContext?.length || 0;
        const retryTotalInputChars = retryPromptLength + retryCodebaseLength;
        const estimatedRetryInputTokens = Math.ceil(retryTotalInputChars / 4);
        const retryReservedTokens = estimatedRetryInputTokens + 10000;
        const maxRetryOutputTokens = Math.max(
          120000,
          Math.min(150000, 200000 - retryReservedTokens)
        );

        const missingSectionNumbers = missingSections.join(", ");
        const retrySystemInstruction = `🚨🚨🚨 CRITICAL RETRY: YOU MUST COMPLETE ALL MISSING SECTIONS 🚨🚨🚨

ABSOLUTE REQUIREMENTS:
1. You MUST generate ALL missing sections: ${missingSectionNumbers || "ALL SECTIONS 1-17"}
2. You have ${maxRetryOutputTokens} tokens - use EVERY token to complete ALL 17 sections
3. Do NOT stop until ALL 17 sections are complete - sections ${missingSectionNumbers || "9, 10, 11, 12, 13, 14, 15, 16, 17"} are MISSING
4. Generate sections ${missingSectionNumbers || "ALL MISSING"} in full detail with their exact headers
5. Section numbering MUST be sequential: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17
6. NO gaps in numbering - if section 8 exists, section 9 MUST exist, then 10, then 11, etc.
7. Prioritize completing ALL sections over length - shorter but complete is better than long but incomplete
8. Your response MUST include ALL 17 sections (1-17) with NO gaps
9. If you have ${maxRetryOutputTokens} tokens, you have MORE than enough for all 17 sections`;

        const retryContent = await openrouterSingleMessage(
          retryPrompt,
          "anthropic/claude-3-haiku",
          maxRetryOutputTokens,
          retrySystemInstruction
        );

        const retryTrimmed = retryContent?.trim() || "";
        
        // Validate retry response has all sections
        const retrySectionMatches = retryTrimmed.match(/^##\s+(\d+)\./gm) || [];
        const retrySectionNumbers = retrySectionMatches.map(m => {
          const match = m.match(/^##\s+(\d+)\./);
          return match ? parseInt(match[1]) : 0;
        }).sort((a, b) => a - b);
        
        const retryMissingSections = expectedSections.filter(num => !retrySectionNumbers.includes(num));
        const retryHasGaps = retryMissingSections.length > 0;
        
        console.log(
          `📊 Retry validation: Found ${retrySectionNumbers.length}/17 sections: ${retrySectionNumbers.join(', ')}`
        );
        
        if (retryHasGaps) {
          console.error(
            `❌ Retry still has missing sections: ${retryMissingSections.join(', ')}`
          );
        }
        
        const retryEndsWithTable =
          retryTrimmed.endsWith("|") ||
          retryTrimmed.endsWith("||") ||
          /^\|.*\|$/.test(retryTrimmed.split("\n").pop() || "");
        const retryEndsWithSection =
          retryTrimmed.endsWith("##") || retryTrimmed.endsWith("###");
        const retryIsComplete =
          !retryEndsWithTable &&
          !retryEndsWithSection &&
          !retryHasGaps &&
          retryContent.length > docsContent.length;

        if (
          retryContent &&
          retryIsComplete &&
          retrySectionNumbers.length >= foundSectionNumbers.length &&
          !retryHasGaps
        ) {
          console.log(
            `✅ Retry successful - all 17 sections present: ${retrySectionNumbers.join(', ')}`
          );
          docsContent = retryContent;
        } else if (
          retryContent &&
          retryContent.length > docsContent.length * 1.2 &&
          retrySectionNumbers.length > foundSectionNumbers.length
        ) {
          console.log(
            `⚠️ Using retry content (better section count: ${retrySectionNumbers.length} vs ${foundSectionNumbers.length})`
          );
          docsContent = retryContent;
        } else if (retryHasGaps) {
          console.error(
            `❌ Retry failed - still missing sections: ${retryMissingSections.join(', ')}`
          );
        }
      } catch (retryError) {
        console.error("Retry failed, using original response:", retryError);
      }
    }

    const finalTrimmed = docsContent?.trim() || "";
    const stillIncomplete =
      finalTrimmed.endsWith("|") ||
      finalTrimmed.endsWith("||") ||
      finalTrimmed.endsWith("##") ||
      finalTrimmed.endsWith("---") ||
      /^\|.*\|$/.test(finalTrimmed.split("\n").pop() || "");

    if (!docsContent || docsContent.length < 1000) {
      throw new Error(
        "Generated documentation is too short or empty. Please try regenerating."
      );
    }

    // Check for ALL 17 sections, not just 11-17
    const allRequiredSections = Array.from({ length: 17 }, (_, i) => ({
      num: String(i + 1),
      keywords: [
        `## ${i + 1}.`,
        `## ${i + 1} `,
        `## ${i + 1}.`,
      ],
    }));

    // Add specific keywords for known sections
    const sectionTitles: Record<string, string[]> = {
      "1": ["Product Understanding"],
      "2": ["Core Value Proposition"],
      "3": ["Architecture Intelligence"],
      "4": ["Data & AI Flow", "Data Flow"],
      "5": ["Integration Potential"],
      "6": ["Technical Edge"],
      "7": ["Scalability", "Production Readiness"],
      "8": ["Security", "Reliability"],
      "9": ["Performance", "Optimization"],
      "10": ["Testing", "Quality Assurance"],
      "11": ["Extensibility"],
      "12": ["AI Commentary", "Senior Engineer"],
      "13": ["Business Applications"],
      "14": ["Roadmap", "Growth Potential"],
      "15": ["License", "Deployment Details"],
      "16": ["TL;DR", "Founder Summary"],
      "17": ["Complete System Flow Diagram", "System Flow"],
    };

    for (const section of allRequiredSections) {
      if (sectionTitles[section.num]) {
        section.keywords.push(...sectionTitles[section.num]);
      }
    }

    const missingSectionsList: string[] = [];
    for (const section of allRequiredSections) {
      const hasSection =
        section.keywords.some((keyword) => finalTrimmed.includes(keyword)) ||
        finalTrimmed.includes(`## ${section.num}.`) ||
        finalTrimmed.includes(`## ${section.num} `);

      if (!hasSection) {
        missingSectionsList.push(section.num);
      }
    }

    // Keep backward compatibility with missingFinalSections for sections 11-17
    const missingFinalSections = missingSectionsList.filter(num => parseInt(num) >= 11);

    if (missingSectionsList.length > 0) {
      console.error(
        `❌ CRITICAL: Missing sections detected: ${missingSectionsList.join(", ")}. Expected all 17 sections (1-17). Forcing final retry...`
      );

      const finalRetryPrompt = `${prompt}

🚨🚨🚨 CRITICAL: You MUST generate sections ${missingSectionsList.join(", ")}. These sections are MISSING and MUST be included:

ALL MISSING SECTIONS:
${missingSectionsList.map(num => {
  const titles: Record<string, string> = {
    "1": "Product Understanding",
    "2": "Core Value Proposition", 
    "3": "Architecture Intelligence",
    "4": "Data & AI Flow",
    "5": "Integration Potential",
    "6": "Technical Edge",
    "7": "Scalability & Production Readiness",
    "8": "Security & Reliability",
    "9": "Performance & Optimization",
    "10": "Testing & Quality Assurance",
    "11": "Extensibility Map",
    "12": "AI Commentary (Senior Engineer Review)",
    "13": "Business Applications",
    "14": "Roadmap & Growth Potential",
    "15": "License & Deployment Details",
    "16": "TL;DR – Founder Summary",
    "17": "Complete System Flow Diagram",
  };
  return `- Section ${num}: ${titles[num] || `Section ${num}`}`;
}).join('\n')}

You MUST complete ALL 17 sections in sequential order (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17). 
Do NOT skip any sections. Do NOT stop until sections ${missingSectionsList.join(", ")} are fully generated.
CRITICAL: Section numbering MUST be sequential with NO gaps.`;

      try {
        const finalRetryPromptLength = finalRetryPrompt.length;
        const finalRetryCodebaseLength = codebaseContext?.length || 0;
        const finalRetryTotalInputChars =
          finalRetryPromptLength + finalRetryCodebaseLength;
        const estimatedFinalRetryInputTokens = Math.ceil(
          finalRetryTotalInputChars / 4
        );
        const finalRetryReservedTokens = estimatedFinalRetryInputTokens + 10000;
        const maxFinalRetryOutputTokens = Math.max(
          120000,
          Math.min(150000, 200000 - finalRetryReservedTokens)
        );

        const finalRetrySystemInstruction = `🚨🚨🚨 FINAL RETRY - CRITICAL: You MUST generate ALL 17 sections (1-17) 🚨🚨🚨

MISSING SECTIONS THAT MUST BE GENERATED: ${missingSectionsList.join(", ")}

ABSOLUTE REQUIREMENTS:
- You MUST generate sections ${missingSectionsList.join(", ")} with their exact headers (## ${missingSectionsList[0]}. ... etc.)
- Section numbering MUST be sequential: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17
- NO gaps in numbering - if section 8 exists, section 9 MUST exist, then 10, then 11, etc.
- Each section must be complete with 5-6 paragraphs (except tables/lists sections and section 17)
- Section 17 MUST include a comprehensive ASCII art diagram showing the complete system flow - START IMMEDIATELY with the diagram

You have ${maxFinalRetryOutputTokens} tokens available - this is MORE than enough for all missing sections.
Generate ALL missing sections completely with their exact headers.
Do NOT stop until ALL 17 sections (1-17) are present with NO gaps in numbering.
Your response MUST include sections ${missingSectionsList.join(", ")} or it will be considered a failure.`;

        const finalRetryContent = await openrouterSingleMessage(
          finalRetryPrompt,
          "anthropic/claude-3-haiku",
          maxFinalRetryOutputTokens,
          finalRetrySystemInstruction
        );

        const finalRetryTrimmed = finalRetryContent?.trim() || "";
        
        // Check for ALL missing sections, not just 11-17
        const retrySectionMatches = finalRetryTrimmed.match(/^##\s+(\d+)\./gm) || [];
        const retrySectionNumbers = retrySectionMatches.map(m => {
          const match = m.match(/^##\s+(\d+)\./);
          return match ? parseInt(match[1]) : 0;
        }).sort((a, b) => a - b);
        
        const stillMissing = missingSectionsList.filter(num => !retrySectionNumbers.includes(parseInt(num)));
        const allSectionsPresent = stillMissing.length === 0;
        
        console.log(
          `📊 Final retry validation: Found sections ${retrySectionNumbers.join(', ')}, Still missing: ${stillMissing.length > 0 ? stillMissing.join(', ') : 'none'}`
        );

        if (
          allSectionsPresent &&
          finalRetryContent.length > docsContent.length
        ) {
          docsContent = finalRetryContent;
          console.log(
            `✅ Final retry successful - all missing sections (${missingSectionsList.join(', ')}) now present. Total sections: ${retrySectionNumbers.length}/17`
          );
        } else if (finalRetryContent.length > docsContent.length * 1.1) {
          docsContent = finalRetryContent;
          console.log(
            `⚠️ Using final retry content (${finalRetryContent.length} vs ${docsContent.length} chars)`
          );
        } else {
          console.error(
            `❌ Final retry failed - still missing sections: ${stillMissing.join(", ")}. Expected all 17 sections (1-17).`
          );
          
          // If critical sections are still missing, throw error
          if (stillMissing.length > 0) {
            throw new Error(
              `Documentation generation incomplete. Missing sections: ${stillMissing.join(", ")}. Expected all 17 sections (1-17) but only got sections: ${retrySectionNumbers.join(", ")}. Please try regenerating the documentation.`
            );
          }
          
          console.log(
            `⚠️ Final retry didn't add all missing sections. Attempting to generate sections ${stillMissing.join(", ")} separately...`
          );

          try {
            const sectionsOnlyPrompt = `Generate ONLY the missing sections ${stillMissing.join(", ")} for technical documentation.

PROJECT: ${projectName}
REPOSITORY: ${repoInfo?.htmlUrl || "N/A"}
LANGUAGE: ${repoInfo?.language || "N/A"}

CODEBASE CONTEXT:
${codebaseContext.substring(0, 50000)}

Generate ONLY these missing sections with their exact headers. Section numbering MUST be sequential with NO gaps:

${stillMissing.map(num => {
  const sectionTemplates: Record<string, string> = {
    "9": `## 9. ⚡ Performance & Optimization\nExplain performance characteristics and optimization strategies in 5-6 paragraphs based on the codebase.\n\n`,
    "10": `## 10. 🧪 Testing & Quality Assurance\nDescribe testing strategies, test coverage, and quality assurance measures in 5-6 paragraphs based on the codebase.\n\n`,
    "11": `## 11. 🧩 Extensibility Map\nExplain where new features can be added easily in exactly 3 paragraphs:\n- Paragraph 1: New AI models, endpoints, and API extensions\n- Paragraph 2: New UI modules, dashboards, and database models\n- Paragraph 3: New authentication methods and integrations\n\n`,
    "12": `## 12. 🔍 AI Commentary (Senior Engineer Review)\nWrite a review in exactly 3 paragraphs as if a Staff engineer is reviewing the architecture for a founder:\n- Paragraph 1: Strengths and what's done well\n- Paragraph 2: Weaknesses and areas for improvement\n- Paragraph 3: Overall readiness and recommendations\n\n`,
    "13": `## 13. 💡 Business Applications\nList 5-8 realistic startup use cases. For EACH use case, provide:\n- What it is (1-2 sentences)\n- How this repo enables it (1-2 sentences)\n- Required modifications (1 sentence)\n\n`,
    "14": `## 14. 📊 Roadmap & Growth Potential\nProvide roadmap analysis in exactly 3 paragraphs:\n\n**Short-term (1-3 months):**\n- List 3-5 quick fixes, polish items, and critical bug fixes (1 sentence each)\n\n**Medium-term (3-6 months):**\n- List 3-5 architectural improvements, new features, and integrations (1 sentence each)\n\n**Long-term (6-12+ months):**\n- List 2-3 scaling strategies, observability improvements, and ecosystem integrations (1 sentence each)\n\n`,
    "15": `## 15. 🧾 License & Deployment Details\nProvide documentation in exactly 3 paragraphs:\n- Paragraph 1: License type and deployment targets (Docker, Vercel, Render, AWS, etc.)\n- Paragraph 2: CI/CD configuration and environment variables\n- Paragraph 3: Infrastructure requirements and deployment process\n\n`,
    "16": `## 16. ⚡ TL;DR – Founder Summary\nWrite a comprehensive summary in 5-6 paragraphs for a non-technical founder:\n- Paragraph 1: What this repo gives them today and how easily it fits their product\n- Paragraph 2: How close it is to production and key strengths/weaknesses\n- Paragraph 3: Why it's a strong or weak base for real use\n- Paragraph 4: Time and resource requirements to make it production-ready\n- Paragraph 5: Competitive advantages and unique selling points\n- Paragraph 6 (optional): Final recommendation and risk assessment\n\n`,
    "17": `## 17. 🗺️ Complete System Flow Diagram\nCreate a comprehensive ASCII art diagram showing the COMPLETE flow of how the entire repository works from start to end.\nCRITICAL: START IMMEDIATELY with the actual ASCII art diagram using box-drawing characters (┌ ┐ └ ┘ │ ─ ├ ┤ ┬ ┴ ┼) and arrows (→ ← ↑ ↓).\nDO NOT write text descriptions first - the diagram must be the first thing after the section header.\nInclude ALL major components, services, databases, APIs, and external services.\nAfter the diagram, provide 2-3 paragraphs explaining the flow.\n\n`,
  };
  return sectionTemplates[num] || `## ${num}. [Section ${num}]\nGenerate this section with 5-6 paragraphs based on the codebase.\n\n`;
}).join('')}

Generate ONLY these sections. Do not include any other content. Start directly with the first missing section header.`;

            const sectionsOnlyLength = sectionsOnlyPrompt.length;
            const sectionsOnlyCodebaseLength = Math.min(
              codebaseContext.length,
              50000
            );
            const sectionsOnlyTotalInputChars =
              sectionsOnlyLength + sectionsOnlyCodebaseLength;
            const estimatedSectionsOnlyInputTokens = Math.ceil(
              sectionsOnlyTotalInputChars / 4
            );
            const sectionsOnlyReservedTokens =
              estimatedSectionsOnlyInputTokens + 10000;
            const maxSectionsOnlyOutputTokens = Math.max(
              80000,
              Math.min(120000, 200000 - sectionsOnlyReservedTokens)
            );

            const sectionsOnlyContent = await openrouterSingleMessage(
              sectionsOnlyPrompt,
              "anthropic/claude-3-haiku",
              maxSectionsOnlyOutputTokens,
              `CRITICAL: Generate ONLY sections ${stillMissing.join(", ")}. These are missing and must be added. You have ${maxSectionsOnlyOutputTokens} tokens - use them to generate complete sections. Section numbering must be sequential with NO gaps.`
            );

            if (
              sectionsOnlyContent &&
              sectionsOnlyContent.trim().length > 100
            ) {
              docsContent =
                docsContent.trim() + "\n\n" + sectionsOnlyContent.trim();
              console.log(
                `✅ Generated missing sections separately and appended`
              );
            }
          } catch (sectionsOnlyError) {
            console.error(
              "Failed to generate missing sections separately:",
              sectionsOnlyError
            );
          }
        }
      } catch (finalRetryError) {
        console.error("Final retry failed:", finalRetryError);

        if (stillMissing.length > 0) {
          console.error(
            `❌ CRITICAL: Still missing sections after all retries: ${stillMissing.join(", ")}. Attempting emergency generation...`
          );

          try {
            const emergencySectionTemplates: Record<string, string> = {
              "9": `## 9. ⚡ Performance & Optimization (5-6 paragraphs)\n`,
              "10": `## 10. 🧪 Testing & Quality Assurance (5-6 paragraphs)\n`,
              "11": `## 11. 🧩 Extensibility Map (3 paragraphs)\n`,
              "12": `## 12. 🔍 AI Commentary (3 paragraphs)\n`,
              "13": `## 13. 💡 Business Applications (5-8 use cases)\n`,
              "14": `## 14. 📊 Roadmap & Growth Potential (3 paragraphs)\n`,
              "15": `## 15. 🧾 License & Deployment Details (3 paragraphs)\n`,
              "16": `## 16. ⚡ TL;DR – Founder Summary (5-6 paragraphs)\n`,
              "17": `## 17. 🗺️ Complete System Flow Diagram (comprehensive ASCII art diagram + 2-3 paragraphs)\n`,
            };
            
            const emergencyPrompt = `Generate ONLY sections ${stillMissing.join(", ")} for ${projectName}:

${stillMissing.map(num => emergencySectionTemplates[num] || `## ${num}. [Section ${num}]\n`).join('')}

Generate these sections now. Section numbering MUST be sequential with NO gaps.`;

            const emergencyContent = await openrouterSingleMessage(
              emergencyPrompt,
              "anthropic/claude-3-haiku",
              100000,
              `Generate ONLY sections ${stillMissing.join(", ")}. These are required. Section numbering must be sequential.`
            );

            if (emergencyContent && emergencyContent.trim().length > 100) {
              docsContent =
                docsContent.trim() + "\n\n" + emergencyContent.trim();
              console.log(
                `✅ Emergency generation successful - appended missing sections`
              );
            }
          } catch (emergencyError) {
            console.error("Emergency generation also failed:", emergencyError);
            console.warn(
              `❌ ERROR: Sections ${stillMissing.join(", ")} are STILL missing from final documentation after all retry attempts. Documentation is incomplete.`
            );
          }
        }
      }
    }

    const finalCheckTrimmed = docsContent?.trim() || "";
    
    // Final validation: Check for ALL 17 sections (1-17)
    const finalSectionMatches = finalCheckTrimmed.match(/^##\s+(\d+)\./gm) || [];
    const finalSectionNumbers = finalSectionMatches.map(m => {
      const match = m.match(/^##\s+(\d+)\./);
      return match ? parseInt(match[1]) : 0;
    }).sort((a, b) => a - b);
    
    const expectedAllSections = Array.from({ length: 17 }, (_, i) => i + 1);
    const finalMissingSections = expectedAllSections.filter(num => !finalSectionNumbers.includes(num));
    const finalHasGaps = finalMissingSections.length > 0;
    
    console.log(
      `📊 Final validation: Found ${finalSectionNumbers.length}/17 sections: ${finalSectionNumbers.join(', ')}`
    );
    
    if (finalHasGaps) {
      console.error(
        `❌ CRITICAL ERROR: Final documentation is missing sections: ${finalMissingSections.join(', ')}. Expected all 17 sections (1-17), but got: ${finalSectionNumbers.join(', ')}`
      );
      throw new Error(
        `Documentation generation incomplete. Missing sections: ${finalMissingSections.join(", ")}. Expected all 17 sections (1-17) but only got sections: ${finalSectionNumbers.join(", ")}. Please try regenerating the documentation.`
      );
    }

    // If we reach here, all 17 sections are validated and present
    // The error above will throw if any sections are missing

    return docsContent;
  } catch (error) {
    console.error("Error generating docs:", error);

    try {
      const fallbackPrompt = `Generate Founder Edition technical documentation for "${projectName}".

PROJECT INFO:
- Name: ${projectName}
- Repository: ${repoInfo?.htmlUrl || "N/A"}
- Language: ${repoInfo?.language || "N/A"}
- Description: ${repoInfo?.description || "N/A"}

CODEBASE SUMMARY:
${sourceCodeSummaries.slice(0, 5).join("\n\n")}

Create documentation with these sections:
1. 📘 Product Understanding - What it does, who it serves
2. 🧩 Core Value Proposition - Business value table
3. 🧱 Architecture Intelligence - System design with Mermaid diagram
4. ⚙️ Data & AI Flow - How data flows through the system
5. 🔌 Integration Potential - How to integrate
6. 🧠 Technical Edge - What's smart about the design
7. 📈 Scalability & Production Readiness
8. 🔐 Security & Reliability
9. 🧮 Tech Stack Summary - Table with technologies
10. 🪄 Example Usage
11. 🧩 Extensibility Map
12. 🔍 AI Commentary - Senior engineer review
13. 💡 Business Applications
14. 📊 Roadmap & Growth Potential
15. 🧾 License & Deployment Details
16. ⚡ TL;DR – Founder Summary

Use markdown format with clear sections, tables, and Mermaid diagrams.`;

      const fallbackPromptLength = fallbackPrompt.length;
      const fallbackCodebaseLength = sourceCodeSummaries.join("\n\n").length;
      const fallbackTotalInputChars =
        fallbackPromptLength + fallbackCodebaseLength;
      const estimatedFallbackInputTokens = Math.ceil(
        fallbackTotalInputChars / 4
      );
      const fallbackReservedTokens = estimatedFallbackInputTokens + 10000;
      const maxFallbackOutputTokens = Math.max(
        100000,
        Math.min(180000, 200000 - fallbackReservedTokens)
      );

      const fallbackDocs = await openrouterSingleMessage(
        fallbackPrompt,
        "anthropic/claude-3-haiku",
        maxFallbackOutputTokens
      );
      return fallbackDocs;
    } catch (fallbackError) {
      console.error("Fallback docs generation also failed:", fallbackError);
    }

    return `# 📘 ${projectName}: ${repoInfo?.description || "Software Project"} - Comprehensive Technical Documentation

![Project](https://img.shields.io/badge/🏷️_${encodeURIComponent(projectName)}-blue)
![Language](https://img.shields.io/badge/${encodeURIComponent(repoInfo?.language || "Code")}-3178c6)
![Stars](https://img.shields.io/badge/STARS-${repoInfo?.stars || 0}-yellow)
![Forks](https://img.shields.io/badge/FORKS-${repoInfo?.forks || 0}-gray)

---

## 1. 📘 Product Understanding

${projectName} is a ${repoInfo?.language || "software"} project that ${repoInfo?.description || "provides useful functionality for developers"}. It serves developers and teams looking for a modern, well-architected solution.

## 2. 🧩 Core Value Proposition

| Module / Area | Business Function | Technical Highlight |
|---------------|-------------------|---------------------|
| Core Application | Main product functionality | Built with ${repoInfo?.language || "modern technologies"} |
| API Layer | Enables integrations | RESTful endpoints |
| Database | Data persistence | PostgreSQL with Prisma ORM |

## 3. 🧱 Architecture Intelligence

**Architecture Type:** Modular monolith with clear separation of concerns

\`\`\`mermaid
graph TD
    A[Client] --> B[Frontend - Next.js]
    B --> C[API Routes]
    C --> D[Business Logic]
    D --> E[Database - PostgreSQL]
\`\`\`

## 4. ⚙️ Data & AI Flow

\`\`\`mermaid
sequenceDiagram
    User->>Frontend: Request
    Frontend->>API: Call endpoint
    API->>Database: Query/Mutation
    Database-->>API: Result
    API-->>Frontend: Response
    Frontend-->>User: Display
\`\`\`

## 5. 🔌 Integration Potential

- **API Endpoints:** REST API available at \`/api/*\`
- **Database:** PostgreSQL compatible with standard tools
- **Authentication:** Extensible auth system

## 6. 🧠 Technical Edge

- Modern ${repoInfo?.language || "technology"} stack
- Type-safe codebase
- Scalable architecture
- Production-ready configuration

## 7. 📈 Scalability & Production Readiness

**Already production-ready:**
- Database migrations with Prisma
- Environment-based configuration
- Error handling

**Needs work:**
- Comprehensive test coverage
- CI/CD pipeline
- Monitoring and observability

## 8. 🔐 Security & Reliability

- Environment variables for secrets
- Input validation on API routes
- Secure authentication flow

## 9. 🧮 Tech Stack Summary

| Layer | Technology | Why |
|-------|------------|-----|
| Frontend | Next.js | Full-stack React framework |
| Backend | Node.js | JavaScript runtime |
| Database | PostgreSQL | Reliable relational database |
| ORM | Prisma | Type-safe database access |

## 10. 🪄 Example Usage

\`\`\`bash
# Clone and setup
git clone ${repoInfo?.cloneUrl || "https://github.com/user/repo.git"}
cd ${projectName}
npm install
npm run dev
\`\`\`

## 11. 🧩 Extensibility Map

- **New features:** Add to \`src/app/\` directory
- **New API routes:** Create in \`src/app/api/\`
- **New components:** Add to \`src/components/\`

## 12. 🔍 AI Commentary

This codebase demonstrates solid engineering practices with a modern tech stack. The architecture is clean and maintainable. Areas for improvement include test coverage and documentation.

## 13. 💡 Business Applications

- SaaS product foundation
- Internal tooling
- API-first applications
- Developer platforms

## 14. 📊 Roadmap & Growth Potential

**Short-term:** Add tests, improve documentation
**Medium-term:** Enhance features, add integrations
**Long-term:** Scale infrastructure, add analytics

## 15. 🧾 License & Deployment Details

- **License:** MIT (assumed)
- **Deployment:** Vercel, Docker, or any Node.js host
- **CI/CD:** GitHub Actions compatible

## 16. ⚡ TL;DR – Founder Summary

${projectName} is a well-structured ${repoInfo?.language || "software"} project ready for development and iteration. It provides a solid foundation for building products with modern tooling. The codebase is maintainable and can be extended for various use cases.
`;
  }
}

export async function modifyDocsWithQuery(
  currentDocs: string,
  userQuery: string,
  projectName: string
) {
  try {
    // Extract all section headers to track what should be preserved
    const sectionMatches = currentDocs.match(/^##\s+\d+\.\s+[^\n]+/gm) || [];
    const sectionHeaders = sectionMatches.map(match => match.trim());
    const sectionCount = sectionHeaders.length;
    const originalLength = currentDocs.length;

    // Detect if user wants to remove a section
    const removeSectionMatch = userQuery.match(/remove\s+(?:the\s+)?(?:first|1st|section\s+)?(\d+|one|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)/i);
    const isRemovalRequest = /remove|delete|drop/i.test(userQuery) && /section/i.test(userQuery);

    // Build section preservation list
    const sectionsList = sectionHeaders.map((header, idx) => `${idx + 1}. ${header}`).join('\n');

    const prompt = `You are an expert technical writer. You need to modify existing technical documentation based on a user's specific request.

PROJECT: ${projectName}

CURRENT DOCUMENTATION CONTENT:
${currentDocs}

USER REQUEST:
${userQuery}

🚨 CRITICAL: DO NOT REGENERATE CONTENT - ONLY MODIFY WHAT IS REQUESTED 🚨

CURRENT DOCUMENTATION STRUCTURE:
The documentation currently has ${sectionCount} main sections:
${sectionsList}

ABSOLUTE REQUIREMENTS FOR MODIFICATIONS:
1. **PRESERVE ALL SECTIONS** - Unless the user explicitly asks to remove a specific section, you MUST keep ALL sections exactly as they are
2. **If removing a section**: Remove ONLY that specific section, keep ALL other sections completely intact with their original content
3. **If modifying a section**: Modify ONLY that section's content, keep ALL other sections exactly as they are
4. **DO NOT regenerate**: Use the existing content from the original documentation - do NOT rewrite or regenerate sections
5. **DO NOT truncate**: Return the COMPLETE documentation with all sections (except the one being removed if requested)

SPECIFIC INSTRUCTIONS:
${isRemovalRequest 
  ? `⚠️ REMOVAL REQUEST DETECTED:
- Remove ONLY the section(s) explicitly mentioned in the user request
- Keep ALL other sections (${sectionCount - 1} sections) with their EXACT original content
- Do NOT modify, rewrite, or regenerate any other sections
- Simply delete the requested section and return everything else unchanged

EXAMPLE: If user says "remove the first section":
- Delete section "## 1. [First Section Title]" and all its content
- Keep sections 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17 EXACTLY as they are
- Do NOT remove any other sections
- Do NOT regenerate any content`
  : `⚠️ MODIFICATION REQUEST:
- Modify ONLY the section(s) mentioned in the user request
- Keep ALL other sections (${sectionCount} sections) with their EXACT original content
- Do NOT modify, rewrite, or regenerate sections not mentioned in the request

EXAMPLE: If user says "update section 3":
- Modify ONLY section "## 3. [Section Title]" 
- Copy sections 1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17 EXACTLY as they appear in the original
- Do NOT change any other sections`}

OUTPUT REQUIREMENTS:
- Return the COMPLETE documentation with all sections (except removed ones)
- Use the EXACT original content for sections you're not modifying
- Only change what the user explicitly requested
- Maintain all markdown formatting
- Do NOT add explanations, comments, or notes
- Do NOT include HTML tags
- The output must be ${originalLength} characters or more (unless removing a section)

Generate the COMPLETE modified documentation (preserving all unchanged sections exactly as they are):`;

    const estimatedModifyInputTokens = Math.ceil(prompt.length / 4);
    // Reserve more tokens for output to ensure completeness
    const maxModifyOutputTokens = Math.max(
      150000,
      Math.min(200000, 200000 - estimatedModifyInputTokens - 5000)
    );

    console.log(
      `📝 Modifying docs: Original length: ${originalLength} chars (~${sectionCount} sections), Estimated input tokens: ~${estimatedModifyInputTokens}, Max output tokens: ${maxModifyOutputTokens}`
    );

    // Create a system instruction that emphasizes preservation
    const systemInstruction = `🚨 CRITICAL SYSTEM INSTRUCTION 🚨

You are modifying existing documentation. Your job is to:
1. Copy sections EXACTLY as they appear in the original (unless explicitly asked to modify/remove them)
2. Do NOT regenerate, rewrite, or summarize any section
3. Do NOT truncate or cut off content
4. If removing a section: Delete ONLY that section, keep ALL others with their EXACT original text
5. If modifying a section: Change ONLY that section, copy ALL others exactly as they are

The user wants you to PRESERVE existing content, not regenerate it.`;

    // Use a more capable model for modifications to ensure completeness
    let modifiedDocs = await openrouterSingleMessage(
      prompt,
      "anthropic/claude-3.5-sonnet", // Using sonnet instead of haiku for better completeness
      maxModifyOutputTokens,
      systemInstruction
    );

    // Check for missing sections (gaps in numbering)
    const expectedSections = isRemovalRequest 
      ? Array.from({ length: sectionCount - 1 }, (_, i) => i + 2) // Sections 2, 3, 4... (removed section 1)
      : Array.from({ length: sectionCount }, (_, i) => i + 1); // Sections 1, 2, 3...

    // Validate that the response is complete
    let modifiedLength = modifiedDocs.length;
    const lengthRatio = modifiedLength / originalLength;
    const modifiedSectionMatches = modifiedDocs.match(/^##\s+(\d+)\./gm) || [];
    let modifiedSectionCount = modifiedSectionMatches.length;
    let modifiedSectionNumbers = modifiedSectionMatches.map(m => {
      const match = m.match(/^##\s+(\d+)\./);
      return match ? parseInt(match[1]) : 0;
    }).sort((a, b) => a - b);
    
    let missingSections = expectedSections.filter(num => !modifiedSectionNumbers.includes(num));
    let hasGaps = missingSections.length > 0;

    console.log(
      `📊 Modification result: Original ${originalLength} chars (${sectionCount} sections) → Modified ${modifiedLength} chars (${modifiedSectionCount} sections), Ratio: ${(lengthRatio * 100).toFixed(1)}%`
    );
    
    if (hasGaps) {
      console.error(
        `❌ CRITICAL: Missing sections detected! Expected sections: ${expectedSections.join(', ')}, Got: ${modifiedSectionNumbers.join(', ')}, Missing: ${missingSections.join(', ')}`
      );
    }

    // If the response seems significantly truncated OR has missing sections, retry
    if (lengthRatio < 0.6 || modifiedSectionCount < sectionCount * 0.8 || hasGaps) {
      console.warn(
        `⚠️ Modified docs may be incomplete or has missing sections. Attempting retry with stronger instructions...`
      );

      const missingSectionsList = hasGaps 
        ? `\n\n🚨 MISSING SECTIONS DETECTED: ${missingSections.join(', ')} - You MUST include these sections!`
        : '';

      const retryPrompt = `${prompt}

🚨 CRITICAL RETRY INSTRUCTIONS - YOUR PREVIOUS RESPONSE WAS INCOMPLETE 🚨

YOUR PREVIOUS RESPONSE HAD THESE ISSUES:
${hasGaps ? `- Missing sections: ${missingSections.join(', ')}` : ''}
${modifiedSectionCount < sectionCount * 0.8 ? `- Too few sections: Expected ${isRemovalRequest ? sectionCount - 1 : sectionCount}, got ${modifiedSectionCount}` : ''}
${lengthRatio < 0.6 ? `- Response too short: Only ${(lengthRatio * 100).toFixed(1)}% of original length` : ''}

ABSOLUTE REQUIREMENTS:
- The original documentation had ${sectionCount} sections numbered 1 through ${sectionCount}
${isRemovalRequest 
  ? `- After removal, you MUST have sections: ${expectedSections.join(', ')} (${sectionCount - 1} sections total)`
  : `- You MUST have ALL sections: ${expectedSections.join(', ')} (${sectionCount} sections total)`}
- Section numbering MUST be sequential with NO gaps
- For sections you're NOT modifying: Copy them EXACTLY word-for-word as they appear in the original documentation
- Do NOT regenerate, rewrite, or summarize sections - use the EXACT original text
- Only modify/remove the section(s) explicitly mentioned in the user request
${missingSectionsList}

GENERATE THE COMPLETE DOCUMENTATION NOW WITH ALL ${isRemovalRequest ? sectionCount - 1 : sectionCount} SECTIONS IN SEQUENTIAL ORDER:`;

      try {
        const retryDocs = await openrouterSingleMessage(
          retryPrompt,
          "anthropic/claude-3.5-sonnet",
          maxModifyOutputTokens,
          systemInstruction
        );
        const retryLength = retryDocs.length;
        const retrySectionMatches = retryDocs.match(/^##\s+(\d+)\./gm) || [];
        const retrySectionCount = retrySectionMatches.length;
        const retrySectionNumbers = retrySectionMatches.map(m => {
          const match = m.match(/^##\s+(\d+)\./);
          return match ? parseInt(match[1]) : 0;
        }).sort((a, b) => a - b);
        const retryMissingSections = expectedSections.filter(num => !retrySectionNumbers.includes(num));
        const retryHasGaps = retryMissingSections.length > 0;

        if (retryLength > modifiedLength && retrySectionCount >= modifiedSectionCount && !retryHasGaps) {
          console.log(
            `✅ Retry successful: ${retryLength} chars (${retrySectionCount} sections: ${retrySectionNumbers.join(', ')})`
          );
          modifiedDocs = retryDocs;
          // Update validation variables
          modifiedLength = retryLength;
          modifiedSectionCount = retrySectionCount;
          modifiedSectionNumbers = retrySectionNumbers;
          missingSections = retryMissingSections;
          hasGaps = retryHasGaps;
        } else if (retryHasGaps) {
          console.error(
            `❌ Retry still has missing sections: ${retryMissingSections.join(', ')}`
          );
        }
      } catch (retryError) {
        console.error("Retry failed, using original response:", retryError);
      }
    }

    // Final validation - check for missing sections
    if (hasGaps) {
      console.error(
        `❌ ERROR: Final response has missing sections! Expected: ${expectedSections.join(', ')}, Got: ${modifiedSectionNumbers.join(', ')}, Missing: ${missingSections.join(', ')}`
      );
      // If we still have gaps after retry, throw an error to prevent saving incomplete docs
      throw new Error(
        `Documentation modification resulted in missing sections: ${missingSections.join(', ')}. Expected ${isRemovalRequest ? sectionCount - 1 : sectionCount} sections but got ${modifiedSectionCount}. Please try again or regenerate the documentation.`
      );
    }

    if (isRemovalRequest && modifiedSectionCount < sectionCount - 1) {
      console.error(
        `❌ ERROR: Removal request resulted in too few sections. Expected ${sectionCount - 1}, got ${modifiedSectionCount}`
      );
      throw new Error(
        `Documentation modification removed too many sections. Expected ${sectionCount - 1} sections after removal, but got ${modifiedSectionCount}. Please try again or regenerate the documentation.`
      );
    }

    return modifiedDocs;
  } catch (error) {
    console.error("Error modifying docs:", error);
    throw new Error("Failed to modify docs with AI");
  }
}
