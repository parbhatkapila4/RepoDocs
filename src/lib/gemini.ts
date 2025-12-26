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
          "\n\n[... codebase context truncated for token limit to ensure all 16 sections are generated ...]";
      }
    }

    const prompt = `You are an expert Staff-level AI/full-stack engineer who also thinks like a startup founder and CTO. ${hasCodebaseAnalysis ? "You have FULL access to the current repository: code files, architecture, configs, and metadata." : "You are generating documentation based on repository metadata. The codebase is currently being indexed, so detailed code analysis is not yet available."}

Your mission: Generate ONE EXTREMELY COMPREHENSIVE, DETAILED, and LENGTHY technical document that explains this repo in EXHAUSTIVE detail so that:
- A non-technical founder instantly understands what this project does, why it exists, how it works, what technologies it uses, what problems it solves, who it serves, and why it matters - explained in EXTENSIVE detail with multiple paragraphs and examples.
- A senior engineer immediately understands the COMPLETE architecture, ALL technologies used, database structure, API endpoints, security measures, performance considerations, code patterns, file organization, dependencies, strengths, weaknesses, and extension points - explained in DEPTH with technical details.
- Both can see the business value, technical implementation, scalability, production readiness, and every aspect of this system without reading a single line of code - because the documentation is SO COMPREHENSIVE and DETAILED.

**CRITICAL: Make this documentation EXTREMELY LENGTHY and DETAILED. Each section should be 5-10+ paragraphs long. Explain EVERYTHING in depth. Use multiple examples. Be exhaustive. Length is NOT a concern - detail and comprehensiveness ARE.**

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
Provide a comprehensive and detailed explanation in 5-6 paragraphs covering:
- Paragraph 1: What this project IS - explain the product, its purpose, and core functionality in detail
- Paragraph 2: What problem it solves - describe the pain points addressed and use cases with specific examples
- Paragraph 3: Who it serves and the outcome it delivers - explain target users and tangible benefits
- Paragraph 4: How it works at a high level - explain the main workflows and user journeys
- Paragraph 5: Key differentiators - what makes this project unique or better than alternatives
- Paragraph 6 (optional): Real-world impact and use cases - specific scenarios where this project provides value

Tone: product pitch, not engineering blog. Be detailed, precise, and based on actual codebase analysis. Write 5-6 paragraphs with substantial detail.

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
Provide a comprehensive architectural analysis in 5-6 paragraphs covering:
- Paragraph 1: Architecture type (monolith, modular, microservice, event-driven, etc.) and main layers/services with specific details
- Paragraph 2: Design rationale and trade-offs - why it's designed this way, what problems this solves
- Paragraph 3: Directory structure and code organization patterns - actual folder structure and how code is organized
- Paragraph 4: Data flow and component interactions - how different parts communicate
- Paragraph 5: Technology choices and their roles - why specific technologies were chosen for each layer
- Paragraph 6 (optional): Scalability considerations and architectural patterns used

Be detailed and precise based on actual codebase structure. Write 5-6 paragraphs with substantial detail.

Include a Mermaid diagram reflecting real structure, for example:
\`\`\`mermaid
graph TD
    A[Client] --> B[Frontend]
    B --> C[Backend API]
    C --> D[AI / LLM Layer]
    C --> E[Database]
\`\`\`

## 4. ⚙️ Data & AI Flow Explanation
Provide a comprehensive explanation in 5-6 paragraphs of how data and intelligence flow through the system:
- Paragraph 1: Step-by-step flow from user input to final output - detailed walkthrough
- Paragraph 2: Data transformations and key components involved - what happens at each stage
- Paragraph 3: AI/ML model integration - how AI is used, which models, how they're called
- Paragraph 4: Data storage and retrieval - database interactions, caching, data persistence
- Paragraph 5: Error handling and performance considerations - how errors are handled, optimization strategies
- Paragraph 6 (optional): Real-time vs batch processing, async operations, and concurrency handling

Be detailed and precise based on actual codebase. Write 5-6 paragraphs with substantial detail.

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
Provide comprehensive practical ways this repo can integrate into a company's stack in 5-6 paragraphs:
- Paragraph 1: API endpoints and services available for integration - list actual endpoints with methods
- Paragraph 2: Modules that can be extended and configuration requirements - what can be customized
- Paragraph 3: Authentication, rate limiting, and SDK availability (if applicable) - security and access control
- Paragraph 4: Webhook support and event-driven integrations - how external systems can be notified
- Paragraph 5: Database schema and data model for integration - how to connect external databases
- Paragraph 6 (optional): Deployment options and infrastructure requirements for integration

Keep it business-actionable and detailed. Write 5-6 paragraphs with substantial detail based on actual codebase.

## 6. 🧠 Technical Edge (What's actually smart here)
List 5-8 specific technical insights or design advantages that make this codebase stand out. For EACH insight, provide:
- What it is (1-2 sentences)
- Why it matters (1-2 sentences)
- Example or impact (1 sentence)

Be concise and focused. List 5-8 key insights.

## 7. 📈 Scalability & Production Readiness
Provide comprehensive analysis in 5-6 paragraphs with detailed explanations:

**Already production-ready (2-3 paragraphs):** 
- Paragraph 1: List 5-8 items that are production-ready (concurrency, caching, logging, CI/CD, testing, error handling, security, etc.)
- For each item: 2-3 sentences explaining what it is, how it's implemented, and why it matters
- Paragraph 2: Deep dive into the most critical production-ready features with specific examples from codebase
- Paragraph 3 (optional): Performance optimizations and monitoring capabilities already in place

**Needs work (2-3 paragraphs):**
- Paragraph 4: List 3-5 items that need improvement (missing features, bottlenecks, security gaps, scalability concerns, etc.)
- For each item: 2-3 sentences explaining what's missing, why it matters, and potential impact
- Paragraph 5: Detailed analysis of scalability bottlenecks and how they might affect growth
- Paragraph 6 (optional): Recommendations for addressing gaps and timeline estimates

Be detailed and precise based on actual codebase analysis. Write 5-6 paragraphs total with substantial detail.

## 8. 🔐 Security & Reliability
Provide comprehensive security documentation in 5-6 paragraphs explaining how the system handles:
- Paragraph 1: Authentication/authorization and env variables/secrets management - detailed implementation
- Paragraph 2: Input validation/sanitization and error handling/monitoring - specific validation rules and patterns
- Paragraph 3: Encryption, rate limiting, security headers, and vulnerability management - what's implemented
- Paragraph 4: Data protection and privacy measures - how sensitive data is handled
- Paragraph 5: Security testing and audit practices - what security measures are tested
- Paragraph 6 (optional): Known security gaps and recommendations for improvement

State what's missing if gaps exist. Be detailed and precise based on actual codebase. Write 5-6 paragraphs with substantial detail.

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

Explain where new features can be added easily in 5-6 paragraphs:
- Paragraph 1: New AI models, endpoints, and API extensions - specific file locations and patterns
- Paragraph 2: New UI modules, dashboards, and database models - where to add components and how
- Paragraph 3: New authentication methods and integrations - extension points for auth and third-party services
- Paragraph 4: Plugin system or extension architecture (if any) - how to add plugins or extensions
- Paragraph 5: Configuration and environment variable extensions - how to add new config options
- Paragraph 6 (optional): Testing and validation requirements for new features

Use detailed explanations with actual file paths and code patterns from the repository. Write 5-6 paragraphs with substantial detail.

**START THIS SECTION WITH: ## 11. 🧩 Extensibility Map**

## 12. 🔍 AI Commentary (Senior Engineer Review)
**YOU MUST INCLUDE THIS SECTION - IT IS MANDATORY**

Write a comprehensive review in 5-6 paragraphs as if a Staff engineer is reviewing the architecture for a founder:
- Paragraph 1: Strengths and what's done well - specific technical achievements and good patterns
- Paragraph 2: Code quality and maintainability - how maintainable the codebase is
- Paragraph 3: Weaknesses and areas for improvement - specific technical debt and issues
- Paragraph 4: Architecture decisions and trade-offs - analysis of key architectural choices
- Paragraph 5: Overall readiness and recommendations - production readiness assessment
- Paragraph 6 (optional): Long-term sustainability and technical roadmap considerations

Be detailed, precise, and based on actual codebase analysis. Write 5-6 paragraphs with substantial detail.

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

Provide comprehensive roadmap analysis in 5-6 paragraphs:

**Short-term (1-3 months) - 2 paragraphs:**
- Paragraph 1: List 3-5 quick fixes, polish items, and critical bug fixes (2-3 sentences each explaining why they're important)
- Paragraph 2: Detailed explanation of immediate priorities and their business impact

**Medium-term (3-6 months) - 2 paragraphs:**
- Paragraph 3: List 3-5 architectural improvements, new features, and integrations (2-3 sentences each with implementation considerations)
- Paragraph 4: Analysis of how these improvements will enhance the product and technical foundation

**Long-term (6-12+ months) - 1-2 paragraphs:**
- Paragraph 5: List 2-3 scaling strategies, observability improvements, and ecosystem integrations (2-3 sentences each)
- Paragraph 6 (optional): Vision for long-term growth and how the architecture supports it

Be detailed and based on actual codebase gaps and opportunities. Write 5-6 paragraphs total with substantial detail.

**START THIS SECTION WITH: ## 14. 📊 Roadmap & Growth Potential**

## 15. 🧾 License & Deployment Details
**YOU MUST INCLUDE THIS SECTION - IT IS MANDATORY**

Provide comprehensive documentation in 5-6 paragraphs:
- Paragraph 1: License type and deployment targets (Docker, Vercel, Render, AWS, etc.) - specific details about license and supported platforms
- Paragraph 2: CI/CD configuration and environment variables - actual CI/CD setup, pipeline stages, required env vars
- Paragraph 3: Infrastructure requirements and deployment process - step-by-step deployment instructions
- Paragraph 4: Database setup and migration process - how to set up and migrate databases
- Paragraph 5: Monitoring, logging, and observability setup - what monitoring tools are used and how
- Paragraph 6 (optional): Scaling considerations and production deployment best practices

Be detailed and precise based on actual repository configuration files. Write 5-6 paragraphs with substantial detail.

**START THIS SECTION WITH: ## 15. 🧾 License & Deployment Details**

## 16. ⚡ TL;DR – Founder Summary
**YOU MUST INCLUDE THIS SECTION - IT IS MANDATORY**

Write a comprehensive summary in 5-6 paragraphs for a non-technical founder:
- Paragraph 1: What this repo gives them today and how easily it fits their product - detailed value proposition
- Paragraph 2: How close it is to production and key strengths/weaknesses - production readiness assessment
- Paragraph 3: Why it's a strong or weak base for real use - foundation quality analysis
- Paragraph 4: Time and resource requirements to make it production-ready - what's needed
- Paragraph 5: Competitive advantages and unique selling points - what makes this special
- Paragraph 6 (optional): Final recommendation and risk assessment

Be detailed, honest, and based on actual codebase analysis. Write 5-6 paragraphs with substantial detail.

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

🚨🚨🚨 CRITICAL: YOU MUST GENERATE ALL 16 SECTIONS - NO EXCEPTIONS 🚨🚨🚨

MANDATORY SECTION CHECKLIST - YOU MUST INCLUDE ALL OF THESE:
✅ Section 1: 📘 Product Understanding (3 paragraphs)
✅ Section 2: 🧩 Core Value Proposition (table with 8-12 modules)
✅ Section 3: 🧱 Architecture Intelligence (3 paragraphs + Mermaid diagram)
✅ Section 4: ⚙️ Data & AI Flow Explanation (3 paragraphs + sequence diagram)
✅ Section 5: 🔌 Integration Potential (3 paragraphs)
✅ Section 6: 🧠 Technical Edge (5-8 insights)
✅ Section 7: 📈 Scalability & Production Readiness (3 paragraphs)
✅ Section 8: 🔐 Security & Reliability (3 paragraphs)
✅ Section 9: 🧮 Tech Stack Summary (table)
✅ Section 10: 🪄 Example Usage (3-5 examples)
✅ Section 11: 🧩 Extensibility Map (3 paragraphs) - **MANDATORY - DO NOT SKIP**
✅ Section 12: 🔍 AI Commentary (3 paragraphs) - **MANDATORY - DO NOT SKIP**
✅ Section 13: 💡 Business Applications (5-8 use cases) - **MANDATORY - DO NOT SKIP**
✅ Section 14: 📊 Roadmap & Growth Potential (3 paragraphs) - **MANDATORY - DO NOT SKIP**
✅ Section 15: 🧾 License & Deployment Details (3 paragraphs) - **MANDATORY - DO NOT SKIP**
✅ Section 16: ⚡ TL;DR – Founder Summary (5-6 paragraphs) - **MANDATORY - DO NOT SKIP**
✅ Section 17: 🗺️ Complete System Flow Diagram (comprehensive ASCII art diagram + 2-3 paragraphs) - **MANDATORY - DO NOT SKIP - THIS IS THE FINAL SECTION**

🚨 CRITICAL INSTRUCTIONS FOR SECTIONS 11-17:
- Sections 11-17 are ABSOLUTELY REQUIRED - you MUST generate them
- Do NOT stop after section 10 - continue to sections 11, 12, 13, 14, 15, 16, and 17
- Each of sections 11-17 MUST be included with their exact headers
- If you run out of tokens, prioritize completing all 17 sections over length
- Generate sections 11-17 even if they are shorter - they MUST be present
- Section 17 (Complete System Flow Diagram) is the FINAL section and MUST be included

SECTION-BY-SECTION REQUIREMENTS:
- Each section MUST be 5-6 paragraphs (except sections 2, 6, 9, 10, 13 which use tables/lists)
- Be detailed and comprehensive - explain key points with substantial depth
- Use examples extensively - provide real code examples and file paths from the actual repository
- Provide detailed code examples and file paths when relevant - be specific and precise
- Be thorough and explanatory - cover all aspects of each topic
- The total documentation should be comprehensive and detailed
- Every section should be complete with substantial detail
- Explain the "why" behind the "what" in depth - provide context and reasoning
- Focus on precision and accuracy - base everything on actual codebase analysis, no fluff or lies
- Include specific file paths, function names, and code patterns from the repository
- Be honest about what exists and what doesn't - no fabricated features or capabilities

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
1. You MUST generate ALL 17 sections (1 through 17) - sections 11-17 are MANDATORY
2. Do NOT stop after section 10 - you MUST continue to sections 11, 12, 13, 14, 15, 16, and 17
3. Each section must be 5-6 paragraphs (except sections 2, 6, 9, 10, 13 which use tables/lists, and section 17 which has a diagram + 2-3 paragraphs)
4. You have ${maxOutputTokens} tokens available - use them ALL to generate complete, detailed documentation
5. Do NOT truncate or stop early - generate ALL sections from 1 to 17 in order with full detail
6. Sections 11-17 are CRITICAL - they MUST be included with full detail
7. The documentation MUST include these exact section headers:
   - ## 11. 🧩 Extensibility Map
   - ## 12. 🔍 AI Commentary (Senior Engineer Review)
   - ## 13. 💡 Business Applications
   - ## 14. 📊 Roadmap & Growth Potential
   - ## 15. 🧾 License & Deployment Details
   - ## 16. ⚡ TL;DR – Founder Summary
   - ## 17. 🗺️ Complete System Flow Diagram (THIS IS THE FINAL SECTION)
8. Be DETAILED and PRECISE - base everything on actual codebase analysis, no fluff or lies
9. Include specific file paths, function names, and code patterns from the repository
10. Generate sections 1-10 first with 5-6 paragraphs each, then IMMEDIATELY continue with sections 11-16 (also 5-6 paragraphs each), and FINALLY section 17 with comprehensive ASCII art diagram
11. Section 17 MUST include a comprehensive ASCII art diagram showing the complete system flow from start to end - START IMMEDIATELY with the diagram, no text descriptions first
12. Do NOT end your response until section 17 is complete with the diagram and explanation

REMEMBER: Incomplete documentation (missing sections 11-17) is WORSE than shorter but complete documentation. Every section must be detailed and based on actual codebase analysis. Section 17 is the FINAL section and must include a complete ASCII art system flow diagram.`;

    let docsContent = await openrouterSingleMessage(
      prompt,
      "anthropic/claude-3-haiku",
      maxOutputTokens,
      systemInstruction
    );

    const trimmedContent = docsContent?.trim() || "";
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

    const sectionCount = trimmedContent.split("##").length - 1;
    const hasInsufficientSections =
      sectionCount < 12 && trimmedContent.length > 3000;

    const isTruncated =
      !docsContent ||
      docsContent.length < 2000 ||
      endsWithIncompleteTable ||
      endsWithIncompleteSection ||
      missingKeySections ||
      hasInsufficientSections;

    if (isTruncated && docsContent && docsContent.length > 500) {
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

      const missingSectionDetails = missingSections
        .map((s) => {
          const num = s.match(/\d+/)?.[0];
          const details: Record<string, string> = {
            "11": "## 11. 🧩 Extensibility Map - Explain where new features can be added (3 paragraphs)",
            "12": "## 12. 🔍 AI Commentary (Senior Engineer Review) - Staff engineer review (3 paragraphs)",
            "13": "## 13. 💡 Business Applications - List 5-8 realistic startup use cases",
            "14": "## 14. 📊 Roadmap & Growth Potential - Short/medium/long-term roadmap (3 paragraphs)",
            "15": "## 15. 🧾 License & Deployment Details - License, deployment, CI/CD (3 paragraphs)",
            "16": "## 16. ⚡ TL;DR – Founder Summary - 3 paragraph summary for founders",
          };
          return details[num || ""] || `Section ${num}`;
        })
        .join("\n");

      const retryPrompt = `${prompt}

🚨🚨🚨 CRITICAL: The previous response was INCOMPLETE and MISSING REQUIRED SECTIONS 🚨🚨🚨

YOU MUST GENERATE THE COMPLETE DOCUMENTATION INCLUDING:
- ALL 16 sections (1. Product Understanding through 16. TL;DR – Founder Summary)
${missingSections.length > 0 ? `\n🚨 MISSING SECTIONS THAT MUST BE GENERATED (THESE ARE MANDATORY):\n${missingSectionDetails}\n` : ""}
- ALL Mermaid diagrams for architecture and data flow
- ALL tables for Core Value Proposition and Tech Stack Summary
- Proper closing for all tables, code blocks, and sections
- Complete all sentences and paragraphs - do not leave tables, sections, or content incomplete

⚠️ SPECIAL FOCUS ON SECTIONS 11-16:
These sections are CRITICAL and were missing from your previous response. You MUST include them now:
- Section 11: Extensibility Map (3 paragraphs)
- Section 12: AI Commentary (3 paragraphs)
- Section 13: Business Applications (5-8 use cases)
- Section 14: Roadmap & Growth Potential (3 paragraphs)
- Section 15: License & Deployment Details (3 paragraphs)
- Section 16: TL;DR – Founder Summary (3 paragraphs)

Do NOT truncate the response. Generate the FULL, COMPLETE 16-section Founder Edition documentation from start to finish with proper endings. ALL 16 SECTIONS MUST BE PRESENT.`;

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

        const missingSectionNumbers = missingSections
          .map((s) => s.match(/\d+/)?.[0])
          .join(", ");
        const retrySystemInstruction = `🚨🚨🚨 CRITICAL RETRY: YOU MUST COMPLETE ALL MISSING SECTIONS 🚨🚨🚨

ABSOLUTE REQUIREMENTS:
1. You MUST generate ALL missing sections: ${missingSectionNumbers || "SECTIONS 11-16"}
2. You have ${maxRetryOutputTokens} tokens - use EVERY token to complete ALL 16 sections
3. Do NOT stop until ALL 16 sections are complete - especially sections 11-16
4. Generate sections ${missingSectionNumbers || "11-16"} in full detail with their exact headers
5. Prioritize completing ALL sections over length - shorter but complete is better than long but incomplete
6. Sections 11-16 are MANDATORY - include them even if brief
7. Your response MUST end with section 16 complete - do not stop early
8. If you have ${maxRetryOutputTokens} tokens, you have MORE than enough for all 16 sections`;

        const retryContent = await openrouterSingleMessage(
          retryPrompt,
          "anthropic/claude-3-haiku",
          maxRetryOutputTokens,
          retrySystemInstruction
        );

        const retryTrimmed = retryContent?.trim() || "";
        const retryEndsWithTable =
          retryTrimmed.endsWith("|") ||
          retryTrimmed.endsWith("||") ||
          /^\|.*\|$/.test(retryTrimmed.split("\n").pop() || "");
        const retryEndsWithSection =
          retryTrimmed.endsWith("##") || retryTrimmed.endsWith("###");
        const retryIsComplete =
          !retryEndsWithTable &&
          !retryEndsWithSection &&
          retryContent.length > docsContent.length;

        if (
          retryContent &&
          retryIsComplete &&
          retryContent.split("##").length >= docsContent.split("##").length
        ) {
          docsContent = retryContent;
        } else if (
          retryContent &&
          retryContent.length > docsContent.length * 1.2
        ) {
          docsContent = retryContent;
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

    const finalRequiredSections = [
      { num: "11", keywords: ["Extensibility", "## 11"] },
      { num: "12", keywords: ["AI Commentary", "Senior Engineer", "## 12"] },
      { num: "13", keywords: ["Business Applications", "## 13"] },
      { num: "14", keywords: ["Roadmap", "Growth Potential", "## 14"] },
      { num: "15", keywords: ["License", "Deployment Details", "## 15"] },
      { num: "16", keywords: ["TL;DR", "Founder Summary", "## 16"] },
      {
        num: "17",
        keywords: ["Complete System Flow Diagram", "System Flow", "## 17"],
      },
    ];

    const missingFinalSections: string[] = [];
    for (const section of finalRequiredSections) {
      const hasSection =
        section.keywords.some((keyword) => finalTrimmed.includes(keyword)) ||
        finalTrimmed.includes(`## ${section.num}.`) ||
        finalTrimmed.includes(`## ${section.num} `);

      if (!hasSection) {
        missingFinalSections.push(section.num);
      }
    }

    if (missingFinalSections.length > 0) {
      console.log(
        `⚠️ CRITICAL: Sections 11-17 are missing: ${missingFinalSections.join(", ")}. Forcing final retry...`
      );

      const finalRetryPrompt = `${prompt}

🚨🚨🚨 CRITICAL: You MUST generate sections ${missingFinalSections.join(", ")}. These sections are MISSING and MUST be included:

${missingFinalSections.includes("11") ? "- Section 11: 🧩 Extensibility Map - Explain where new features can be added (3 paragraphs)\n" : ""}
${missingFinalSections.includes("12") ? "- Section 12: 🔍 AI Commentary - Senior engineer review (3 paragraphs)\n" : ""}
${missingFinalSections.includes("13") ? "- Section 13: 💡 Business Applications - List 5-8 use cases\n" : ""}
${missingFinalSections.includes("14") ? "- Section 14: 📊 Roadmap & Growth Potential - Short/medium/long-term (3 paragraphs)\n" : ""}
${missingFinalSections.includes("15") ? "- Section 15: 🧾 License & Deployment Details - License, deployment, CI/CD (3 paragraphs)\n" : ""}
${missingFinalSections.includes("16") ? "- Section 16: ⚡ TL;DR – Founder Summary - 5-6 paragraph summary for founders\n" : ""}
${missingFinalSections.includes("17") ? "- Section 17: 🗺️ Complete System Flow Diagram - Comprehensive ASCII art diagram showing complete system flow from start to end + 2-3 paragraphs\n" : ""}

You MUST complete ALL 17 sections. Do NOT stop until sections ${missingFinalSections.join(", ")} are fully generated.`;

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

        const finalRetrySystemInstruction = `🚨🚨🚨 FINAL RETRY - CRITICAL: You MUST generate sections ${missingFinalSections.join(", ")} 🚨🚨🚨

These sections are MISSING and ABSOLUTELY REQUIRED:
${missingFinalSections.includes("11") ? "- Section 11: 🧩 Extensibility Map (3 paragraphs) - MANDATORY\n" : ""}
${missingFinalSections.includes("12") ? "- Section 12: 🔍 AI Commentary (3 paragraphs) - MANDATORY\n" : ""}
${missingFinalSections.includes("13") ? "- Section 13: 💡 Business Applications (5-8 use cases) - MANDATORY\n" : ""}
${missingFinalSections.includes("14") ? "- Section 14: 📊 Roadmap & Growth Potential (3 paragraphs) - MANDATORY\n" : ""}
${missingFinalSections.includes("15") ? "- Section 15: 🧾 License & Deployment Details (3 paragraphs) - MANDATORY\n" : ""}
${missingFinalSections.includes("16") ? "- Section 16: ⚡ TL;DR – Founder Summary (5-6 paragraphs) - MANDATORY\n" : ""}
${missingFinalSections.includes("17") ? "- Section 17: 🗺️ Complete System Flow Diagram (comprehensive ASCII art diagram + 2-3 paragraphs) - MANDATORY - THIS IS THE FINAL SECTION\n" : ""}

You have ${maxFinalRetryOutputTokens} tokens available - this is MORE than enough for all missing sections.
Generate ALL missing sections completely with their exact headers.
Do NOT stop until all 17 sections are done.
Your response MUST include sections ${missingFinalSections.join(", ")} or it will be considered a failure.
Section 17 MUST include a comprehensive ASCII art diagram showing the complete system flow - START IMMEDIATELY with the diagram, no text descriptions first.`;

        const finalRetryContent = await openrouterSingleMessage(
          finalRetryPrompt,
          "anthropic/claude-3-haiku",
          maxFinalRetryOutputTokens,
          finalRetrySystemInstruction
        );

        const finalRetryTrimmed = finalRetryContent?.trim() || "";
        let allSectionsPresent = true;
        for (const section of finalRequiredSections) {
          if (missingFinalSections.includes(section.num)) {
            const hasSection =
              section.keywords.some((keyword) =>
                finalRetryTrimmed.includes(keyword)
              ) ||
              finalRetryTrimmed.includes(`## ${section.num}.`) ||
              finalRetryTrimmed.includes(`## ${section.num} `);
            if (!hasSection) {
              allSectionsPresent = false;
              break;
            }
          }
        }

        if (
          allSectionsPresent &&
          finalRetryContent.length > docsContent.length
        ) {
          docsContent = finalRetryContent;
          console.log(
            `✅ Final retry successful - all sections 11-17 now present`
          );
        } else if (finalRetryContent.length > docsContent.length * 1.1) {
          docsContent = finalRetryContent;
          console.log(
            `⚠️ Using final retry content (${finalRetryContent.length} vs ${docsContent.length} chars)`
          );
        } else {
          console.log(
            `⚠️ Final retry didn't add missing sections. Generating sections ${missingFinalSections.join(", ")} separately...`
          );

          try {
            const sectionsOnlyPrompt = `Generate ONLY the missing sections ${missingFinalSections.join(", ")} for technical documentation.

PROJECT: ${projectName}
REPOSITORY: ${repoInfo?.htmlUrl || "N/A"}
LANGUAGE: ${repoInfo?.language || "N/A"}

CODEBASE CONTEXT:
${codebaseContext.substring(0, 50000)}

Generate ONLY these missing sections with their exact headers:

${
  missingFinalSections.includes("11")
    ? `## 11. 🧩 Extensibility Map
Explain where new features can be added easily in exactly 3 paragraphs:
- Paragraph 1: New AI models, endpoints, and API extensions
- Paragraph 2: New UI modules, dashboards, and database models
- Paragraph 3: New authentication methods and integrations

`
    : ""
}
${
  missingFinalSections.includes("12")
    ? `## 12. 🔍 AI Commentary (Senior Engineer Review)
Write a review in exactly 3 paragraphs as if a Staff engineer is reviewing the architecture for a founder:
- Paragraph 1: Strengths and what's done well
- Paragraph 2: Weaknesses and areas for improvement
- Paragraph 3: Overall readiness and recommendations

`
    : ""
}
${
  missingFinalSections.includes("13")
    ? `## 13. 💡 Business Applications
List 5-8 realistic startup use cases. For EACH use case, provide:
- What it is (1-2 sentences)
- How this repo enables it (1-2 sentences)
- Required modifications (1 sentence)

`
    : ""
}
${
  missingFinalSections.includes("14")
    ? `## 14. 📊 Roadmap & Growth Potential
Provide roadmap analysis in exactly 3 paragraphs:

**Short-term (1-3 months):**
- List 3-5 quick fixes, polish items, and critical bug fixes (1 sentence each)

**Medium-term (3-6 months):**
- List 3-5 architectural improvements, new features, and integrations (1 sentence each)

**Long-term (6-12+ months):**
- List 2-3 scaling strategies, observability improvements, and ecosystem integrations (1 sentence each)

`
    : ""
}
${
  missingFinalSections.includes("15")
    ? `## 15. 🧾 License & Deployment Details
Provide documentation in exactly 3 paragraphs:
- Paragraph 1: License type and deployment targets (Docker, Vercel, Render, AWS, etc.)
- Paragraph 2: CI/CD configuration and environment variables
- Paragraph 3: Infrastructure requirements and deployment process

`
    : ""
}
${
  missingFinalSections.includes("16")
    ? `## 16. ⚡ TL;DR – Founder Summary
Write a comprehensive summary in 5-6 paragraphs for a non-technical founder:
- Paragraph 1: What this repo gives them today and how easily it fits their product
- Paragraph 2: How close it is to production and key strengths/weaknesses
- Paragraph 3: Why it's a strong or weak base for real use
- Paragraph 4: Time and resource requirements to make it production-ready
- Paragraph 5: Competitive advantages and unique selling points
- Paragraph 6 (optional): Final recommendation and risk assessment

`
    : ""
}
${
  missingFinalSections.includes("17")
    ? `## 17. 🗺️ Complete System Flow Diagram
Create a comprehensive ASCII art diagram showing the COMPLETE flow of how the entire repository works from start to end. 
CRITICAL: START IMMEDIATELY with the actual ASCII art diagram using box-drawing characters (┌ ┐ └ ┘ │ ─ ├ ┤ ┬ ┴ ┼) and arrows (→ ← ↑ ↓).
DO NOT write text descriptions first - the diagram must be the first thing after the section header.
Include ALL major components, services, databases, APIs, and external services.
After the diagram, provide 2-3 paragraphs explaining the flow.

`
    : ""
}

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
              `CRITICAL: Generate ONLY sections ${missingFinalSections.join(", ")}. These are missing and must be added. You have ${maxSectionsOnlyOutputTokens} tokens - use them to generate complete sections.`
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

        if (missingFinalSections.length > 0) {
          console.log(
            `⚠️ Attempting to generate sections ${missingFinalSections.join(", ")} separately as last resort...`
          );

          try {
            const emergencyPrompt = `Generate ONLY sections ${missingFinalSections.join(", ")} for ${projectName}:

${missingFinalSections.includes("11") ? `## 11. 🧩 Extensibility Map (3 paragraphs)\n` : ""}
${missingFinalSections.includes("12") ? `## 12. 🔍 AI Commentary (3 paragraphs)\n` : ""}
${missingFinalSections.includes("13") ? `## 13. 💡 Business Applications (5-8 use cases)\n` : ""}
${missingFinalSections.includes("14") ? `## 14. 📊 Roadmap & Growth Potential (3 paragraphs)\n` : ""}
${missingFinalSections.includes("15") ? `## 15. 🧾 License & Deployment Details (3 paragraphs)\n` : ""}
${missingFinalSections.includes("16") ? `## 16. ⚡ TL;DR – Founder Summary (5-6 paragraphs)\n` : ""}
${missingFinalSections.includes("17") ? `## 17. 🗺️ Complete System Flow Diagram (comprehensive ASCII art diagram + 2-3 paragraphs)\n` : ""}

Generate these sections now.`;

            const emergencyContent = await openrouterSingleMessage(
              emergencyPrompt,
              "anthropic/claude-3-haiku",
              100000,
              `Generate ONLY sections ${missingFinalSections.join(", ")}. These are required.`
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
              `⚠️ WARNING: Sections ${missingFinalSections.join(", ")} may be missing from final documentation`
            );
          }
        }
      }
    }

    const finalCheckTrimmed = docsContent?.trim() || "";
    const finalCheckSections = [
      { num: "11", keywords: ["Extensibility", "## 11"] },
      { num: "12", keywords: ["AI Commentary", "Senior Engineer", "## 12"] },
      { num: "13", keywords: ["Business Applications", "## 13"] },
      { num: "14", keywords: ["Roadmap", "Growth Potential", "## 14"] },
      { num: "15", keywords: ["License", "Deployment Details", "## 15"] },
      { num: "16", keywords: ["TL;DR", "Founder Summary", "## 16"] },
      {
        num: "17",
        keywords: ["Complete System Flow Diagram", "System Flow", "## 17"],
      },
    ];

    const stillMissing: string[] = [];
    for (const section of finalCheckSections) {
      const hasSection =
        section.keywords.some((keyword) =>
          finalCheckTrimmed.includes(keyword)
        ) ||
        finalCheckTrimmed.includes(`## ${section.num}.`) ||
        finalCheckTrimmed.includes(`## ${section.num} `);

      if (!hasSection) {
        stillMissing.push(section.num);
      }
    }

    if (stillMissing.length > 0) {
      console.log(
        `🚨 FINAL CHECK: Sections ${stillMissing.join(", ")} are still missing. Attempting one final generation...`
      );

      try {
        const ultraSimplePrompt = `Add these missing sections to the documentation:

${
  stillMissing.includes("11")
    ? `## 11. 🧩 Extensibility Map
Write 3 paragraphs about where new features can be added.

`
    : ""
}
${
  stillMissing.includes("12")
    ? `## 12. 🔍 AI Commentary (Senior Engineer Review)
Write 3 paragraphs reviewing the architecture.

`
    : ""
}
${
  stillMissing.includes("13")
    ? `## 13. 💡 Business Applications
List 5-8 startup use cases.

`
    : ""
}
${
  stillMissing.includes("14")
    ? `## 14. 📊 Roadmap & Growth Potential
Write 3 paragraphs about roadmap.

`
    : ""
}
${
  stillMissing.includes("15")
    ? `## 15. 🧾 License & Deployment Details
Write 3 paragraphs about license and deployment.

`
    : ""
}
${
  stillMissing.includes("16")
    ? `## 16. ⚡ TL;DR – Founder Summary
Write 3 paragraphs summarizing for founders.

`
    : ""
}

Generate ONLY these sections.`;

        const ultraSimpleContent = await openrouterSingleMessage(
          ultraSimplePrompt,
          "anthropic/claude-3-haiku",
          80000,
          `Generate ONLY sections ${stillMissing.join(", ")}. These are required.`
        );

        if (ultraSimpleContent && ultraSimpleContent.trim().length > 200) {
          docsContent = docsContent.trim() + "\n\n" + ultraSimpleContent.trim();
          console.log(
            `✅ Ultra-simple generation successful - appended sections ${stillMissing.join(", ")}`
          );
        }
      } catch (ultraError) {
        console.error("Ultra-simple generation failed:", ultraError);
      }
    }

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
    const prompt = `You are an expert technical writer and software engineer. You need to modify existing technical documentation based on a user's specific request.

PROJECT: ${projectName}

CURRENT DOCUMENTATION CONTENT:
${currentDocs}

USER REQUEST:
${userQuery}

INSTRUCTIONS:
1. Analyze the current documentation content and the user's request
2. Modify the documentation to fulfill the user's request while maintaining:
   - Professional technical writing style
   - Proper markdown formatting
   - All existing valuable information
   - Consistency with the project's documentation style
3. If the user wants to add new sections, make sure they fit naturally with the existing content
4. If the user wants to modify existing sections, preserve the overall structure
5. If the user wants to remove content, be careful to maintain essential information
6. Use ONLY standard markdown formatting - NO HTML tags
7. Ensure the modified documentation remains comprehensive and helpful
8. Maintain technical accuracy and completeness

IMPORTANT: 
- Generate ONLY the complete modified documentation content
- Do not include any explanations or comments
- Do not include HTML tags like <div>, <p>, <br>, etc.
- Use pure markdown syntax only
- Make sure the output is a complete, valid technical documentation file
- Preserve all technical details and accuracy

Generate the modified technical documentation content:`;

    const estimatedModifyInputTokens = Math.ceil(prompt.length / 4);
    const maxModifyOutputTokens = Math.max(
      100000,
      Math.min(180000, 200000 - estimatedModifyInputTokens - 20000)
    );

    const modifiedDocs = await openrouterSingleMessage(
      prompt,
      "anthropic/claude-3-haiku",
      maxModifyOutputTokens
    );
    return modifiedDocs;
  } catch (error) {
    console.error("Error modifying docs:", error);
    throw new Error("Failed to modify docs with AI");
  }
}
