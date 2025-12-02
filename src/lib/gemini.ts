import { Document } from "@langchain/core/documents"
import { openrouterSingleMessage } from "@/lib/openrouter"
import { GoogleGenAI } from "@google/genai";
import type { GitHubRepoInfo } from "@/lib/github";

// Support both GEMINI_API_KEY and GOOGLE_GENAI_API_KEY for backwards compatibility
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

if (!geminiApiKey) {
    throw new Error('Missing GEMINI_API_KEY or GOOGLE_GENAI_API_KEY environment variable');
}

const genAi = new GoogleGenAI({ apiKey: geminiApiKey })


export async function getSummariseCode(doc: Document) {
    console.log("Summarising code for ", doc.metadata.source)
    try {
        const code = doc.pageContent.slice(0, 10000)

        const prompt = `You are an intelligent senior software engineer who specializes in onboarding junior software engineers onto projects.
You are onboarding a junior software engineer and explaining to them the purpose of the ${doc.metadata.source} file.
Here is the code: 
---
${code}
---
Give a summary no more than 100 words of the code above.`

        return openrouterSingleMessage(prompt)
    } catch (error) {
        console.error("Error summarising code for ", doc.metadata.source, error)
        return ""
    }
}

export async function getGenerateEmbeddings(summary: string, useCache: boolean = true) {
    console.log("Generating embeddings")
    
    // Check cache first
    if (useCache) {
        try {
            const { cache } = await import('./cache');
            const cached = await cache.getCachedEmbedding(summary);
            if (cached) {
                console.log("Using cached embedding");
                return cached;
            }
        } catch {
            console.log("Cache miss, generating new embedding");
        }
    }
    
    try {
        const response = await genAi.models.embedContent({
            model: 'gemini-embedding-001',
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

        // Cache the result
        if (useCache) {
            try {
                const { cache } = await import('./cache');
                await cache.cacheEmbedding(summary, embeddingValues);
            } catch (cacheError) {
                console.log("Failed to cache embedding:", cacheError);
            }
        }

        return embeddingValues;
    } catch (error) {
        console.error("Error generating embeddings:", error)
        throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function generateReadmeFromCodebase(projectName: string, sourceCodeSummaries: string[], repoInfo: Partial<GitHubRepoInfo> | null) {
    console.log("Generating README for project:", projectName)
    try {
        const codebaseContext = sourceCodeSummaries.join('\n\n')
        
        const prompt = `You are an expert technical writer and software engineer. Generate a comprehensive, professional README.md file for the project "${projectName}".

PROJECT INFORMATION:
- Project Name: ${projectName}
- Repository URL: ${repoInfo?.htmlUrl || 'N/A'}
- Primary Language: ${repoInfo?.language || 'N/A'}
- Description: ${repoInfo?.description || 'N/A'}
- Stars: ${repoInfo?.stars || 0}
- Forks: ${repoInfo?.forks || 0}

CODEBASE ANALYSIS:
${codebaseContext}

INSTRUCTIONS:
1. Create a comprehensive README.md that includes:
   - Project title and description
   - Features and capabilities
   - Installation instructions
   - Usage examples
   - Project structure overview
   - Contributing guidelines
   - License information
   - Contact/support information

2. Base the content on the actual codebase analysis provided above
3. Make it professional, clear, and helpful for developers
4. Use ONLY standard markdown formatting - NO HTML tags
5. Use proper markdown syntax for badges: [![Alt Text](URL)](Link)
6. Use proper markdown for images: ![Alt Text](URL)
7. Use proper markdown for links: [Text](URL)
8. Ensure all sections are well-structured with proper markdown formatting
9. If the project appears to be a web application, include deployment instructions
10. If it's a library/package, include API documentation examples

IMPORTANT: Generate ONLY markdown content. Do not include any HTML tags like <div>, <p>, <br>, etc. Use pure markdown syntax only.

Generate a complete, production-ready README.md file:`

        const readmeContent = await openrouterSingleMessage(prompt, "google/gemini-2.5-flash")
        return readmeContent
    } catch (error) {
        console.error("Error generating README:", error)
        return `# ${projectName}

A ${repoInfo?.language || 'software'} project.

## Description
${repoInfo?.description || 'This project provides useful functionality for developers.'}

## Installation
\`\`\`bash
# Clone the repository
git clone ${repoInfo?.cloneUrl || 'https://github.com/user/repo.git'}
cd ${projectName}

# Install dependencies
npm install
\`\`\`

## Usage
\`\`\`bash
# Start the application
npm start
\`\`\`

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License.
`
    }
}

export async function modifyReadmeWithQuery(currentReadme: string, userQuery: string, projectName: string) {
    console.log("Modifying README with user query:", userQuery)
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

Generate the modified README.md content:`

        const modifiedReadme = await openrouterSingleMessage(prompt, "google/gemini-2.5-flash")
        return modifiedReadme
    } catch (error) {
        console.error("Error modifying README:", error)
        throw new Error("Failed to modify README with AI")
    }
}

export async function generateDocsFromCodebase(projectName: string, sourceCodeSummaries: string[], repoInfo: Partial<GitHubRepoInfo> | null) {
    console.log("Generating comprehensive Founder Edition docs for project:", projectName)
    try {
        // Limit context size to prevent prompt from being too long (keep last 100 summaries or ~200k chars)
        const maxContextLength = 200000; // ~200k characters
        let codebaseContext = sourceCodeSummaries.join('\n\n')
        
        // If context is too long, truncate intelligently (keep most recent summaries)
        if (codebaseContext.length > maxContextLength) {
            console.log(`Codebase context too long (${codebaseContext.length} chars), truncating to ${maxContextLength} chars`)
            // Keep the most recent summaries (they're usually more relevant)
            const summariesToKeep = Math.max(50, Math.floor(sourceCodeSummaries.length * 0.7))
            const recentSummaries = sourceCodeSummaries.slice(-summariesToKeep)
            codebaseContext = recentSummaries.join('\n\n')
            
            // If still too long, truncate the string itself
            if (codebaseContext.length > maxContextLength) {
                codebaseContext = codebaseContext.substring(0, maxContextLength) + '\n\n[... codebase context truncated for length ...]'
            }
        }
        
        const prompt = `You are an expert Staff-level AI/full-stack engineer who also thinks like a startup founder and CTO. You have FULL access to the current repository: code files, architecture, configs, and metadata.

Your mission: Generate ONE comprehensive technical document that explains this repo clearly enough that:
- A non-technical founder instantly understands what this project does and why it matters.
- A senior engineer immediately understands the architecture, strengths, and extension points.
- Both can see the business value and scalability of this system without reading a single line of code.

DO NOT summarize file by file. DO NOT rewrite the README. Your job is to infer PRODUCT, ARCHITECTURE, BUSINESS VALUE, and EXTENSIBILITY from the codebase.

PROJECT INFORMATION:
- Project Name: ${projectName}
- Repository URL: ${repoInfo?.htmlUrl || 'N/A'}
- Primary Language: ${repoInfo?.language || 'N/A'}
- Description: ${repoInfo?.description || 'N/A'}
- Stars: ${repoInfo?.stars || 0}
- Forks: ${repoInfo?.forks || 0}

DETAILED CODEBASE ANALYSIS:
${codebaseContext}

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
Explain what this project is, what problem it solves, who it serves, and the outcome it delivers. Tone: product pitch, not engineering blog.

## 2. 🧩 Core Value Proposition (Why it matters)
Translate each major module into business value.

| Module / Area | Business Function (non-technical) | Technical Highlight (1 line) |
|----------------|-----------------------------------|-------------------------------|
| | | |

## 3. 🧱 Architecture Intelligence
Describe the architecture *and why it's designed that way*.
- Architecture type (monolith, modular, microservice, event-driven, etc.)
- Main layers or services
- Design rationale or trade-offs

Include a Mermaid diagram reflecting real structure, for example:
\`\`\`mermaid
graph TD
    A[Client] --> B[Frontend]
    B --> C[Backend API]
    C --> D[AI / LLM Layer]
    C --> E[Database]
\`\`\`

## 4. ⚙️ Data & AI Flow Explanation
Describe how data and intelligence flow from input to output. Add a sequence diagram like:
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
List practical ways this repo can integrate into a company's stack:
- API endpoints to call
- Services to embed
- Modules to extend

Keep it business-actionable.

## 6. 🧠 Technical Edge (What's actually smart here)
List 3–6 specific technical insights or design advantages that make this codebase stand out.

## 7. 📈 Scalability & Production Readiness
Separate sections:
- **Already production-ready:** bullet points
- **Needs work:** bullet points

Mention concurrency, caching, logging, CI/CD, testing, modularity, etc.

## 8. 🔐 Security & Reliability
Explain how the system handles:
- Authentication / authorization
- Env variables & secrets
- Input validation / sanitization
- Error handling / monitoring

State what's missing if gaps exist.

## 9. 🧮 Tech Stack Summary (with purpose)

| Layer | Technology | Why it's used |
|-------|------------|---------------|
| Frontend | | |
| Backend | | |
| AI/ML | | |
| Database | | |
| Infra/DevOps | | |

Explain why, not just what.

## 10. 🪄 Example Usage (Product Context)
Show 1–2 realistic examples (API call, CLI command, or workflow) demonstrating actual output or behavior.

## 11. 🧩 Extensibility Map
Explain where new features can be added easily:
- New AI models
- New endpoints
- New dashboards or UI modules

Use bullets like: "Add a provider by extending X and registering in Y."

## 12. 🔍 AI Commentary (Senior Engineer Review)
Write a concise paragraph as if a Staff engineer is reviewing the architecture for a founder:
- Strengths
- Weaknesses
- Overall readiness

## 13. 💡 Business Applications
List 3–6 realistic startup use cases that this repo could directly power or be adapted for (SaaS, internal tools, analytics, automation, etc.).

## 14. 📊 Roadmap & Growth Potential
Group next steps as:
- **Short-term:** quick fixes / polish
- **Medium-term:** architectural improvements / features
- **Long-term:** scaling, observability, or ecosystem integrations

## 15. 🧾 License & Deployment Details
Extract from repo if available:
- License type
- Deployment targets (Docker, Vercel, Render, AWS, etc.)
- CI/CD notes

## 16. ⚡ TL;DR – Founder Summary
A crisp, 3–5 sentence summary written for a non-technical founder:
- What this repo gives them today
- How easily it fits their product
- How close it is to production
- Why it's a strong or weak base for real use

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

Generate the complete 16-section Founder Edition Technical Documentation.`

        // Use higher max_tokens for comprehensive documentation (32000 tokens = ~24000 words)
        let docsContent = await openrouterSingleMessage(prompt, "google/gemini-2.5-flash", 32000)
        
        // Enhanced truncation detection - check for various incomplete patterns
        const trimmedContent = docsContent?.trim() || ''
        const endsWithIncompleteTable = trimmedContent.endsWith('|') || 
                                       trimmedContent.endsWith('||') ||
                                       trimmedContent.endsWith('| |') ||
                                       /^\|.*\|$/.test(trimmedContent.split('\n').pop() || '') || // Last line is table header
                                       /^-+$/.test(trimmedContent.split('\n').pop() || ''); // Last line is dashes (table separator)
        
        const endsWithIncompleteSection = trimmedContent.endsWith('##') ||
                                          trimmedContent.endsWith('###') ||
                                          trimmedContent.endsWith('####') ||
                                          trimmedContent.endsWith('...') ||
                                          trimmedContent.endsWith('---');
        
        // Check for missing key sections in the 16-section Founder Edition format
        const missingKeySections = !trimmedContent.includes('## 16.') && 
                                   !trimmedContent.includes('TL;DR') && 
                                   !trimmedContent.includes('Founder Summary') &&
                                   trimmedContent.length > 5000;
        
        const sectionCount = trimmedContent.split('##').length - 1; // Count major sections
        const hasInsufficientSections = sectionCount < 12 && trimmedContent.length > 3000; // Expect at least 12 of 16 sections
        
        const isTruncated = !docsContent || 
                           docsContent.length < 2000 ||
                           endsWithIncompleteTable ||
                           endsWithIncompleteSection ||
                           missingKeySections ||
                           hasInsufficientSections;
        
        // If truncated, retry with explicit instruction to complete
        if (isTruncated && docsContent && docsContent.length > 500) {
            console.warn("First attempt may be incomplete, retrying with completion instruction...")
            console.log(`Truncation indicators: endsWithTable=${endsWithIncompleteTable}, endsWithSection=${endsWithIncompleteSection}, missingSections=${missingKeySections}, insufficientSections=${hasInsufficientSections}`)
            
            const retryPrompt = `${prompt}

CRITICAL: The previous response was INCOMPLETE and ended abruptly. You MUST generate the COMPLETE documentation including:
- ALL 16 sections (1. Product Understanding through 16. TL;DR – Founder Summary)
- ALL Mermaid diagrams for architecture and data flow
- ALL tables for Core Value Proposition and Tech Stack Summary
- Proper closing for all tables, code blocks, and sections
- Complete all sentences and paragraphs - do not leave tables, sections, or content incomplete

Do NOT truncate the response. Generate the FULL, COMPLETE 16-section Founder Edition documentation from start to finish with proper endings.`
            
            try {
                const retryContent = await openrouterSingleMessage(retryPrompt, "google/gemini-2.5-flash", 32000)
                
                // Enhanced validation for retry content
                const retryTrimmed = retryContent?.trim() || ''
                const retryEndsWithTable = retryTrimmed.endsWith('|') || retryTrimmed.endsWith('||') || /^\|.*\|$/.test(retryTrimmed.split('\n').pop() || '')
                const retryEndsWithSection = retryTrimmed.endsWith('##') || retryTrimmed.endsWith('###')
                const retryIsComplete = !retryEndsWithTable && !retryEndsWithSection && retryContent.length > docsContent.length
                
                // Use retry content if it's more complete
                if (retryContent && retryIsComplete && retryContent.split('##').length >= docsContent.split('##').length) {
                    console.log("Retry successful - using complete documentation")
                    docsContent = retryContent
                } else if (retryContent && retryContent.length > docsContent.length * 1.2) {
                    // If retry is significantly longer, use it even if it has minor issues
                    console.log("Retry is significantly longer, using it despite minor issues")
                    docsContent = retryContent
                } else {
                    console.warn("Retry did not improve completeness, using original response")
                }
            } catch (retryError) {
                console.error("Retry failed, using original response:", retryError)
                // Continue with original content
            }
        }
        
        // Final validation - check if still incomplete after retry
        const finalTrimmed = docsContent?.trim() || ''
        const stillIncomplete = finalTrimmed.endsWith('|') || 
                               finalTrimmed.endsWith('||') ||
                               finalTrimmed.endsWith('##') ||
                               finalTrimmed.endsWith('---') ||
                               /^\|.*\|$/.test(finalTrimmed.split('\n').pop() || '');
        
        if (stillIncomplete && docsContent.length > 5000) {
            console.warn("Documentation still appears incomplete after retry, but proceeding with available content")
        }
        
        if (!docsContent || docsContent.length < 1000) {
            throw new Error("Generated documentation is too short or empty. Please try regenerating.")
        }
        
        return docsContent
    } catch (error) {
        console.error("Error generating docs:", error)
        
        // Try a simpler, faster generation as fallback
        try {
            console.log("Attempting fallback docs generation...")
            const fallbackPrompt = `Generate Founder Edition technical documentation for "${projectName}".

PROJECT INFO:
- Name: ${projectName}
- Repository: ${repoInfo?.htmlUrl || 'N/A'}
- Language: ${repoInfo?.language || 'N/A'}
- Description: ${repoInfo?.description || 'N/A'}

CODEBASE SUMMARY:
${sourceCodeSummaries.slice(0, 5).join('\n\n')}

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

Use markdown format with clear sections, tables, and Mermaid diagrams.`

            const fallbackDocs = await openrouterSingleMessage(fallbackPrompt, "google/gemini-2.5-flash-lite")
            return fallbackDocs
        } catch (fallbackError) {
            console.error("Fallback docs generation also failed:", fallbackError)
        }
        
        return `# 📘 ${projectName}: ${repoInfo?.description || 'Software Project'} - Comprehensive Technical Documentation

![Project](https://img.shields.io/badge/🏷️_${encodeURIComponent(projectName)}-blue)
![Language](https://img.shields.io/badge/${encodeURIComponent(repoInfo?.language || 'Code')}-3178c6)
![Stars](https://img.shields.io/badge/STARS-${repoInfo?.stars || 0}-yellow)
![Forks](https://img.shields.io/badge/FORKS-${repoInfo?.forks || 0}-gray)

---

## 1. 📘 Product Understanding

${projectName} is a ${repoInfo?.language || 'software'} project that ${repoInfo?.description || 'provides useful functionality for developers'}. It serves developers and teams looking for a modern, well-architected solution.

## 2. 🧩 Core Value Proposition

| Module / Area | Business Function | Technical Highlight |
|---------------|-------------------|---------------------|
| Core Application | Main product functionality | Built with ${repoInfo?.language || 'modern technologies'} |
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

- Modern ${repoInfo?.language || 'technology'} stack
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
git clone ${repoInfo?.cloneUrl || 'https://github.com/user/repo.git'}
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

${projectName} is a well-structured ${repoInfo?.language || 'software'} project ready for development and iteration. It provides a solid foundation for building products with modern tooling. The codebase is maintainable and can be extended for various use cases.
`
    }
}

export async function modifyDocsWithQuery(currentDocs: string, userQuery: string, projectName: string) {
    console.log("Modifying docs with user query:", userQuery)
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

Generate the modified technical documentation content:`

        const modifiedDocs = await openrouterSingleMessage(prompt, "google/gemini-2.5-flash")
        return modifiedDocs
    } catch (error) {
        console.error("Error modifying docs:", error)
        throw new Error("Failed to modify docs with AI")
    }
}
