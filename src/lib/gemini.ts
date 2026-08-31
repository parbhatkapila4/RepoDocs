import { log } from "./logger";
import { Document } from "@langchain/core/documents";
import { openrouterSingleMessage } from "@/lib/openrouter";
import { GoogleGenAI } from "@google/genai";
import type { GitHubRepoInfo } from "@/lib/github";
import {
  DOC_HEADER_SPEC,
  DOC_SECTION_SPECS,
  assembleDocContent,
  findMissingDocSections,
  hasUnclosedCodeFence,
  parseDocSections,
  type DocSectionSpec,
  type ParsedDocContent,
} from "@/lib/docs-sections";

function getGeminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || null;
}

let _genAi: GoogleGenAI | null = null;
function getGenAi(): GoogleGenAI {
  if (_genAi) return _genAi;
  const key = getGeminiApiKey();
  if (!key) {
    throw new Error(
      "Missing GEMINI_API_KEY or GOOGLE_GENAI_API_KEY environment variable",
    );
  }
  _genAi = new GoogleGenAI({ apiKey: key });
  return _genAi;
}

const OPENROUTER_DOCS_MODIFY_MODEL =
  process.env.OPENROUTER_DOCS_MODIFY_MODEL?.trim() || "google/gemini-2.5-flash";
const OPENROUTER_README_MODEL =
  process.env.OPENROUTER_README_MODEL?.trim() || "google/gemini-2.5-pro";

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

    const result = await openrouterSingleMessage(prompt);
    return result.content;
  } catch (error) {
    console.error("Error summarising code for ", doc.metadata.source, error);
    return "";
  }
}

export async function getGenerateEmbeddings(
  summary: string,
  useCache: boolean = true,
) {
  if (useCache) {
    try {
      const { cache } = await import("./cache");
      const cached = await cache.getCachedEmbedding(summary);
      if (cached) {
        return cached;
      }
    } catch (cacheError) {
      log.warn("[embeddings] Cache read failed, recomputing:", cacheError);
    }
  }

  if (!getGeminiApiKey()) {
    throw new Error(
      "GEMINI_API_KEY or GOOGLE_GENAI_API_KEY is not set in environment variables",
    );
  }

  try {
    const response = await getGenAi().models.embedContent({
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
      } catch (cacheError) {
        log.warn("[embeddings] Cache write failed:", cacheError);
      }
    }

    return embeddingValues;
  } catch (error) {
    console.error("Error generating embeddings:", {
      error: error instanceof Error ? error.message : "Unknown error",
      hasApiKey: !!getGeminiApiKey(),
      summaryLength: summary?.length || 0,
      errorDetails: error,
    });
    throw new Error(
      `Failed to generate embeddings: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function generateReadmeFromCodebase(
  projectName: string,
  sourceCodeSummaries: string[],
  repoInfo: Partial<GitHubRepoInfo> | null,
) {
  try {
    const codebaseContext = sourceCodeSummaries.join("\n\n");
    const hasCodebaseAnalysis = sourceCodeSummaries.length > 0;

    const prompt = `You are a Staff+ engineer writing the README for ${projectName}. Output ONE complete README.md in pure GitHub-flavored markdown. Do not add a preamble, do not wrap the document in a code fence, do not write "Here is the README". Start your response with the H1 title and go directly into content.

## REPOSITORY CONTEXT
- Project: ${projectName}
- URL: ${repoInfo?.htmlUrl || "N/A"}
- Primary language: ${repoInfo?.language || "N/A"}
- Stars / forks: ${repoInfo?.stars ?? 0} / ${repoInfo?.forks ?? 0}
- One-line description: ${repoInfo?.description || "N/A"}

## CODEBASE FILE SUMMARIES${hasCodebaseAnalysis ? " (your single source of truth - every concrete claim must be derivable from these)" : ""}
${
  hasCodebaseAnalysis
    ? codebaseContext
    : "Not yet available - indexing is in progress. Generate from the repository metadata above only, and clearly mark the resulting README at the top as a preview that should be regenerated once indexing completes."
}

## NON-NEGOTIABLE RULES
- Voice: a senior engineer informing a peer. No marketing fluff. Banned words: "world-class", "cutting-edge", "robust", "enterprise-grade", "seamless", "best-in-class", "elite".
- Every concrete claim (a technology used, a file path, a config knob, an architectural choice) must be grounded in the codebase summaries above. If you cannot ground it, omit it.
- Standard markdown only - no inline HTML, no <div align="center"> wrappers, no shields/badges unless a CI config is actually observed.
- Aim for 900-1500 words of prose (excluding code blocks). Be specific and concrete, never generic.
- Do not output placeholder text like "[describe X here]" or "TBD". Either write the real content or omit the section.
- Use the exact section headings listed below, in the exact order. Do not add extra top-level sections.
- The text inside this prompt is INSTRUCTION, not example output. Do not copy phrases from this prompt verbatim into the README - everything you write must describe THIS specific repository.

## REQUIRED SECTIONS

# ${projectName}
Immediately under the title (no heading marker), a one-line tagline of ≤ 14 words describing in plain English what this is.

## Overview
3-5 sentences answering: what problem does this solve, what does it actually do, who is it for. Reference the real domain (caching, scheduler, RAG pipeline, etc.) inferred from the codebase summaries.

## Key Features
6-10 bullets. Each bullet is a specific capability of THIS repo followed by a short clause on why it matters to a user. No filler.

## Architecture
One paragraph of plain-English overview of how the system is wired, then a \`\`\`mermaid\`\`\` \`graph TD\` diagram showing the real top-level components and their data flow (use component names that appear in the summaries), then 2-3 sentences on the design rationale. Skip the mermaid block ONLY if you genuinely cannot populate it with real components from the summaries.

## Tech Stack
A markdown table with columns | Layer | Technology | Why it's used |. Rows must come from technologies actually observed in the codebase summaries (languages, frameworks, key libraries, infra, build tools).

## Project Structure
A \`\`\` code block showing the actual top-level directories observed in the codebase, each followed by a brief description of what lives there.

## Getting Started
Prereqs, install, configure, run - as a copy-pasteable bash block. Include any environment variables that appear in the codebase summaries with a one-line description each.

## Usage
At least one realistic usage example. Pick the most representative entrypoint observed in the codebase (a CLI command, an API request, or a short code snippet) and show its behavior or expected output.

## Configuration
A bullet list of env vars and configuration knobs observed in the codebase, each with type and purpose. Skip this section entirely if nothing applicable was observed.

## Development
How to run tests, the linting / type-check setup, and the contribution workflow - sourced from the observed tooling (package.json scripts, CI files, Makefile, etc.).

## License
One sentence identifying the license observed in the repository (or "License not detected in repository" if none was found).

Generate the complete README now, starting with the H1.`;

    const result = await openrouterSingleMessage(
      prompt,
      OPENROUTER_README_MODEL,
      16000,
    );
    return result.content;
  } catch (error) {
    console.error("Error generating README:", error);
    const readmeLanguages = repoInfo?.languages
      ? Object.entries(repoInfo.languages)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([name]) => name)
          .join(", ")
      : null;

    const readmeFacts: string[] = [
      `| Project | ${projectName} |`,
      `| Files indexed | ${sourceCodeSummaries.length} |`,
    ];
    if (repoInfo?.htmlUrl)
      readmeFacts.push(`| Repository | ${repoInfo.htmlUrl} |`);
    if (repoInfo?.description)
      readmeFacts.push(`| GitHub description | ${repoInfo.description} |`);
    if (repoInfo?.language)
      readmeFacts.push(`| Primary language | ${repoInfo.language} |`);
    if (readmeLanguages)
      readmeFacts.push(`| Languages detected | ${readmeLanguages} |`);
    if (repoInfo?.defaultBranch)
      readmeFacts.push(`| Default branch | ${repoInfo.defaultBranch} |`);
    if (typeof repoInfo?.stars === "number")
      readmeFacts.push(`| Stars | ${repoInfo.stars} |`);
    if (typeof repoInfo?.forks === "number")
      readmeFacts.push(`| Forks | ${repoInfo.forks} |`);

    return `# ${projectName}

> **README generation failed.** The model call did not complete, so no README
> was written for this repository. Everything below is GitHub metadata only -
> nothing here describes the code, its structure, its licence, or how to run
> it, because none of that was generated.

## What is known

| Field | Value |
| --- | --- |
${readmeFacts.join("\n")}

## What is missing

Overview, features, architecture, tech stack, project structure, setup
instructions and licence. None of these were generated, and this fallback
does not guess at them - a wrong licence or a wrong install command is worse
than none.

## Next step

Regenerate the README. If it keeps failing, the server logs record the
underlying error against this project.
`;
  }
}

export async function modifyReadmeWithQuery(
  currentReadme: string,
  userQuery: string,
  projectName: string,
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

    const result = await openrouterSingleMessage(
      prompt,
      "google/gemini-2.5-flash",
    );
    return result.content;
  } catch (error) {
    console.error("Error modifying README:", error);
    throw new Error("Failed to modify README with AI");
  }
}

const OPENROUTER_DOCS_MODEL =
  process.env.OPENROUTER_DOCS_MODEL?.trim() || "google/gemini-2.5-flash";

const DOCS_CHUNK_RANGES: [number, number][] = [
  [1, 6],
  [7, 12],
  [13, 17],
];
const DOCS_CHUNK_MAX_TOKENS = 20000;
const DOCS_REPAIR_ATTEMPTS = 2;

function buildDocsSharedContext(
  projectName: string,
  codebaseContext: string,
  hasCodebaseAnalysis: boolean,
  repoInfo: Partial<GitHubRepoInfo> | null,
): string {
  return `You are a Staff-level engineer writing ONE internal technical document about the repository "${projectName}" for two readers at once: a non-technical founder who needs to understand what it is and why it matters, and a senior engineer who needs the architecture, data flow, and operational reality. The full document has 17 numbered sections; this call generates only the slice specified at the end.

GROUNDING RULES (non-negotiable):
- The codebase summaries below are your single source of truth. Every concrete claim - a technology, file path, endpoint, config knob, architectural choice, trade-off - must be derivable from them. If you cannot ground it, omit it.
- Length follows content, never the reverse. A section of three grounded sentences is a correct section. Never pad with invented detail, examples, comparisons, or timelines.
- If the summaries do not support a section, say plainly in a sentence or two what is not determinable from the code, then move on. Do not fill the gap with plausible-sounding generalities.
- Voice: a senior engineer informing a peer. No marketing fluff. Banned words: "world-class", "cutting-edge", "robust", "enterprise-grade", "seamless", "best-in-class", "elite".
- No placeholder text like "[describe X here]" or "TBD". Standard markdown only - no HTML tags.
- When inferring, say "appears to" or "likely". Include real file paths, function names, and code patterns from the repository wherever relevant.
- The text of this prompt is INSTRUCTION, not example output. Never copy its phrases verbatim.

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
Indexing is in progress! We're currently indexing the codebase, which typically takes 5-15 minutes to complete.

This is a DEMO/PREVIEW documentation generated from repository metadata only. Once indexing is ready, the documentation should be regenerated to get comprehensive, codebase-aware analysis. Generate from the repository metadata above only, keep sections short, and make clear where full analysis is pending.`
}`;
}

function buildDocsChunkPrompt(
  shared: string,
  specs: DocSectionSpec[],
  includeHeader: boolean,
): string {
  const sectionBlocks = specs
    .map((s) => `${s.header}\n${s.instructions}`)
    .join("\n\n");
  const firstHeader = specs[0]?.header;
  const lastHeader = specs[specs.length - 1]?.header;

  const task =
    specs.length > 0
      ? `${includeHeader ? `${DOC_HEADER_SPEC}\n\nAfter the header, generate` : "Generate"} ONLY the following ${specs.length} section(s) of the document, in this order:

${sectionBlocks}

OUTPUT RULES FOR THIS CALL:
- ${includeHeader ? `Start with the document H1 (and badge row only if grounded), then continue with \`${firstHeader}\`` : `Start directly with \`${firstHeader}\` - no introduction, no preamble`}.
- Use every section header EXACTLY as written above (same number, emoji, and title).
- Generate no sections other than those listed - the rest of the document is produced separately.
- End immediately after the content of \`${lastHeader}\`.
- Completing every listed section matters more than length: if output budget runs low, shorten sections rather than dropping any.`
      : `${DOC_HEADER_SPEC}

OUTPUT RULES FOR THIS CALL:
- Generate ONLY the document header (H1 and, if grounded, one badge row). No numbered sections.`;

  return `${shared}

---

YOUR TASK IN THIS CALL

${task}`;
}

async function generateDocsChunk(opts: {
  shared: string;
  specs: DocSectionSpec[];
  includeHeader: boolean;
  maxTokens?: number;
}): Promise<ParsedDocContent> {
  const { shared, specs, includeHeader } = opts;
  const maxTokens = opts.maxTokens ?? DOCS_CHUNK_MAX_TOKENS;
  if (specs.length === 0 && !includeHeader) {
    return { preamble: "", sections: new Map() };
  }

  const prompt = buildDocsChunkPrompt(shared, specs, includeHeader);
  const systemInstruction = `You are generating one slice of a larger technical document. Generate exactly the sections requested - all of them, with their exact headers - and nothing else. Completing every requested section matters more than per-section length; if the output budget runs low, shorten sections rather than dropping any. Ground every claim in the provided codebase analysis.`;

  const result = await openrouterSingleMessage(
    prompt,
    OPENROUTER_DOCS_MODEL,
    maxTokens,
    systemInstruction,
  );
  const parsed = parseDocSections(result.content ?? "");

  const assigned = new Set(specs.map((s) => s.num));
  for (const num of [...parsed.sections.keys()]) {
    if (!assigned.has(num)) parsed.sections.delete(num);
  }
  const hitCap = (result.usage?.completion_tokens ?? 0) >= maxTokens - 64;
  if (parsed.sections.size > 0) {
    const maxNum = Math.max(...parsed.sections.keys());
    const lastText = parsed.sections.get(maxNum) ?? "";
    if (hitCap || hasUnclosedCodeFence(lastText)) {
      log.debug(
        `⚠️ Docs chunk output looks truncated (cap hit: ${hitCap}); dropping section ${maxNum} for regeneration`,
      );
      parsed.sections.delete(maxNum);
    }
  }

  if (!includeHeader) {
    parsed.preamble = "";
  } else if (!/^#\s/m.test(parsed.preamble)) {
    parsed.preamble = "";
  }
  return parsed;
}

export async function generateDocsFromCodebase(
  projectName: string,
  sourceCodeSummaries: string[],
  repoInfo: Partial<GitHubRepoInfo> | null,
) {
  try {
    const maxCodebaseContextLength = 100000;
    let codebaseContext = sourceCodeSummaries.join("\n\n");
    const hasCodebaseAnalysis = codebaseContext.length > 0;

    if (codebaseContext.length > maxCodebaseContextLength) {
      const summariesToKeep = Math.max(
        100,
        Math.floor(sourceCodeSummaries.length * 0.8),
      );
      const recentSummaries = sourceCodeSummaries.slice(-summariesToKeep);
      codebaseContext = recentSummaries.join("\n\n");

      if (codebaseContext.length > maxCodebaseContextLength) {
        codebaseContext =
          codebaseContext.substring(0, maxCodebaseContextLength) +
          "\n\n[... codebase context truncated for token limit ...]";
      }
    }

    const shared = buildDocsSharedContext(
      projectName,
      codebaseContext,
      hasCodebaseAnalysis,
      repoInfo,
    );

    log.debug(
      `📊 Docs generation: model ${OPENROUTER_DOCS_MODEL}, context ${codebaseContext.length} chars, ${DOCS_CHUNK_RANGES.length} parallel chunks × ${DOCS_CHUNK_MAX_TOKENS} max output tokens`,
    );

    const chunkResults = await Promise.all(
      DOCS_CHUNK_RANGES.map(([from, to], idx) =>
        generateDocsChunk({
          shared,
          specs: DOC_SECTION_SPECS.slice(from - 1, to),
          includeHeader: idx === 0,
        }),
      ),
    );

    let preamble = chunkResults[0].preamble;
    const sections = new Map<number, string>();
    for (const result of chunkResults) {
      for (const [num, text] of result.sections) {
        if (!sections.has(num)) sections.set(num, text);
      }
    }

    let missing = findMissingDocSections(sections);
    log.debug(
      `📊 Generated docs validation: Found ${sections.size}/17 sections. Sections found: ${[...sections.keys()].sort((a, b) => a - b).join(", ")}`,
    );

    for (
      let attempt = 1;
      attempt <= DOCS_REPAIR_ATTEMPTS && (missing.length > 0 || !preamble);
      attempt++
    ) {
      log.debug(
        `🔁 Docs repair attempt ${attempt}: regenerating ${missing.length > 0 ? `sections ${missing.join(", ")}` : "document header"}`,
      );
      const repairSpecs = DOC_SECTION_SPECS.filter((s) =>
        missing.includes(s.num),
      );
      try {
        const repair = await generateDocsChunk({
          shared,
          specs: repairSpecs,
          includeHeader: !preamble,
          maxTokens: Math.min(30000, Math.max(8000, repairSpecs.length * 6000)),
        });
        if (!preamble && repair.preamble) preamble = repair.preamble;
        for (const [num, text] of repair.sections) {
          if (!sections.has(num)) sections.set(num, text);
        }
      } catch (repairError) {
        console.error(`Docs repair attempt ${attempt} failed:`, repairError);
      }
      missing = findMissingDocSections(sections);
    }

    if (missing.length > 0) {
      const found = [...sections.keys()].sort((a, b) => a - b).join(", ");
      console.error(
        `❌ CRITICAL: Missing sections after repair: ${missing.join(", ")}. Expected all 17 sections (1-17), but got: ${found}`,
      );
      throw new Error(
        `Documentation generation incomplete. Missing sections: ${missing.join(", ")}. Expected all 17 sections (1-17) but only got sections: ${found}. Please try regenerating the documentation.`,
      );
    }

    if (!preamble) {
      preamble = `# 📘 ${projectName} - Technical Documentation`;
    }

    const docsContent = assembleDocContent(preamble, sections);
    if (docsContent.length < 1000) {
      throw new Error(
        "Generated documentation is too short or empty. Please try regenerating.",
      );
    }

    log.debug(`✅ Docs assembled: 17/17 sections, ${docsContent.length} chars`);
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
${sourceCodeSummaries.slice(0, 40).join("\n\n").substring(0, 40000)}

Create ONE markdown document containing ALL of these numbered sections, in order, each starting with its exact header:

${DOC_SECTION_SPECS.map((s) => s.header).join("\n")}

Keep every section grounded in the codebase summary above; keep sections short where the evidence is thin. Use markdown tables for sections 2 and 9, mermaid diagrams for sections 3 and 4, and an ASCII-art diagram in a code fence for section 17. Completing all 17 sections matters more than length.`;

      const fallbackResult = await openrouterSingleMessage(
        fallbackPrompt,
        OPENROUTER_DOCS_MODEL,
        30000,
        "Generate the complete 17-section document. Shorter but complete beats long but incomplete.",
      );
      if (fallbackResult.content && fallbackResult.content.length > 1000) {
        log.debug(
          `⚠️ Docs fallback single-pass used (${fallbackResult.content.length} chars)`,
        );
        return fallbackResult.content;
      }
    } catch (fallbackError) {
      console.error("Fallback docs generation also failed:", fallbackError);
    }

    const languageBreakdown = repoInfo?.languages
      ? Object.entries(repoInfo.languages)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([name]) => name)
          .join(", ")
      : null;

    const facts: string[] = [
      `| Project | ${projectName} |`,
      `| Files indexed | ${sourceCodeSummaries.length} |`,
    ];
    if (repoInfo?.htmlUrl) facts.push(`| Repository | ${repoInfo.htmlUrl} |`);
    if (repoInfo?.description)
      facts.push(`| GitHub description | ${repoInfo.description} |`);
    if (repoInfo?.language)
      facts.push(`| Primary language | ${repoInfo.language} |`);
    if (languageBreakdown)
      facts.push(`| Languages detected | ${languageBreakdown} |`);
    if (repoInfo?.defaultBranch)
      facts.push(`| Default branch | ${repoInfo.defaultBranch} |`);
    if (typeof repoInfo?.stars === "number")
      facts.push(`| Stars | ${repoInfo.stars} |`);
    if (typeof repoInfo?.forks === "number")
      facts.push(`| Forks | ${repoInfo.forks} |`);
    if (repoInfo?.pushedAt) facts.push(`| Last push | ${repoInfo.pushedAt} |`);

    return `# ${projectName}

> **Documentation generation failed.** Both the primary and fallback model
> calls did not complete, so no analysis of this repository was produced.
> Everything below is repository metadata only. Nothing here describes the
> code, its architecture, or its quality, because none of that was generated.

## What is known

| Field | Value |
| --- | --- |
${facts.join("\n")}

## What is missing

The full document covers product understanding, architecture, data flow,
integration surface, scalability, security, and the rest. None of those
sections were generated, and this fallback deliberately does not guess at
them.

## Next step

Regenerate the documentation. If it keeps failing, the server logs record the
underlying error against this project.
`;
  }
}

export async function modifyDocsWithQuery(
  currentDocs: string,
  userQuery: string,
  projectName: string,
) {
  try {
    const sectionMatches =
      currentDocs.match(/^##\s+\d+\.\s+[^\n]+/gm) ||
      currentDocs.match(/^#\s+\d+\.\s+[^\n]+/gm) ||
      [];
    const sectionHeaders = sectionMatches.map((match) => match.trim());
    const sectionCount = sectionHeaders.length;
    const originalLength = currentDocs.length;

    const isRemovalRequest =
      /remove|delete|drop/i.test(userQuery) && /section/i.test(userQuery);

    const sectionsList = sectionHeaders
      .map((header, idx) => `${idx + 1}. ${header}`)
      .join("\n");

    const prompt = `You are editing an existing technical document for "${projectName}". Apply the user's request as a surgical edit and return the complete document.

CURRENT DOCUMENT (${sectionCount} numbered sections):
${sectionsList}

${currentDocs}

USER REQUEST:
${userQuery}

EDITING CONTRACT:
- This is an edit, not a rewrite. Sections the request does not touch must be copied through verbatim - same wording, same formatting, same length.
- ${
      isRemovalRequest
        ? `The request removes content: delete only the section(s) it names and return every other section unchanged (${sectionCount - 1} sections expected).`
        : `The request modifies content: change only the section(s) it names and return all ${sectionCount} sections.`
    }
- Return the complete document from the first line to the last, in the original section order, with no truncation.
- Output the document only - no explanations, no commentary, no HTML tags, standard markdown throughout.`;

    const maxModifyOutputTokens = Math.min(
      60000,
      Math.max(16000, Math.ceil(originalLength / 3) + 8000),
    );

    log.debug(
      `📝 Modifying docs: Original length: ${originalLength} chars (~${sectionCount} sections), Model: ${OPENROUTER_DOCS_MODIFY_MODEL}, Max output tokens: ${maxModifyOutputTokens}`,
    );

    const systemInstruction = `You edit existing documents surgically. Untouched sections are copied through verbatim - never regenerated, summarized, or truncated. The complete document comes back every time.`;

    const modifiedResult = await openrouterSingleMessage(
      prompt,
      OPENROUTER_DOCS_MODIFY_MODEL,
      maxModifyOutputTokens,
      systemInstruction,
    );

    const rawContent = modifiedResult?.content;
    if (rawContent == null || typeof rawContent !== "string") {
      throw new Error(
        "AI returned no content. The model response was empty or invalid. Please try again.",
      );
    }
    let modifiedDocs = rawContent.trim() || currentDocs;

    const expectedSections = isRemovalRequest
      ? Array.from({ length: sectionCount - 1 }, (_, i) => i + 2)
      : Array.from({ length: sectionCount }, (_, i) => i + 1);

    let modifiedLength = modifiedDocs.length;
    const lengthRatio = modifiedLength / originalLength;
    const modifiedSectionMatches =
      modifiedDocs.match(/^##\s+(\d+)\./gm) ||
      modifiedDocs.match(/^#\s+(\d+)\./gm) ||
      [];
    let modifiedSectionCount = modifiedSectionMatches.length;
    let modifiedSectionNumbers = modifiedSectionMatches
      .map((m) => {
        const match = m.match(/^##\s+(\d+)\./);
        return match ? parseInt(match[1]) : 0;
      })
      .sort((a, b) => a - b);

    let missingSections = expectedSections.filter(
      (num) => !modifiedSectionNumbers.includes(num),
    );
    let hasGaps = missingSections.length > 0;

    log.debug(
      `📊 Modification result: Original ${originalLength} chars (${sectionCount} sections) → Modified ${modifiedLength} chars (${modifiedSectionCount} sections), Ratio: ${(lengthRatio * 100).toFixed(1)}%`,
    );

    if (hasGaps) {
      console.error(
        `❌ CRITICAL: Missing sections detected! Expected sections: ${expectedSections.join(", ")}, Got: ${modifiedSectionNumbers.join(", ")}, Missing: ${missingSections.join(", ")}`,
      );
    }

    if (
      lengthRatio < 0.6 ||
      modifiedSectionCount < sectionCount * 0.8 ||
      hasGaps
    ) {
      console.warn(
        `⚠️ Modified docs may be incomplete or has missing sections. Attempting retry with stronger instructions...`,
      );

      const issues = [
        hasGaps ? `sections ${missingSections.join(", ")} were missing` : "",
        modifiedSectionCount < sectionCount * 0.8
          ? `only ${modifiedSectionCount} of ${isRemovalRequest ? sectionCount - 1 : sectionCount} sections came back`
          : "",
        lengthRatio < 0.6
          ? `the output was ${(lengthRatio * 100).toFixed(0)}% of the original length, which means content was dropped`
          : "",
      ]
        .filter(Boolean)
        .join("; ");

      const retryPrompt = `${prompt}

RETRY NOTE: Your previous attempt was incomplete - ${issues}. Apply the edit again and return the complete document: sections ${expectedSections.join(", ")}, in order, with every untouched section copied through verbatim.`;

      try {
        const retryResult = await openrouterSingleMessage(
          retryPrompt,
          OPENROUTER_DOCS_MODIFY_MODEL,
          maxModifyOutputTokens,
          systemInstruction,
        );
        const retryDocs = retryResult.content;
        const retryLength = retryDocs.length;
        const retrySectionMatches =
          retryDocs.match(/^##\s+(\d+)\./gm) ||
          retryDocs.match(/^#\s+(\d+)\./gm) ||
          [];
        const retrySectionCount = retrySectionMatches.length;
        const retrySectionNumbers = retrySectionMatches
          .map((m) => {
            const match = m.match(/^##\s+(\d+)\./);
            return match ? parseInt(match[1]) : 0;
          })
          .sort((a, b) => a - b);
        const retryMissingSections = expectedSections.filter(
          (num) => !retrySectionNumbers.includes(num),
        );
        const retryHasGaps = retryMissingSections.length > 0;

        if (
          retryLength > modifiedLength &&
          retrySectionCount >= modifiedSectionCount &&
          !retryHasGaps
        ) {
          log.debug(
            `✅ Retry successful: ${retryLength} chars (${retrySectionCount} sections: ${retrySectionNumbers.join(", ")})`,
          );
          modifiedDocs = retryDocs;
          modifiedLength = retryLength;
          modifiedSectionCount = retrySectionCount;
          modifiedSectionNumbers = retrySectionNumbers;
          missingSections = retryMissingSections;
          hasGaps = retryHasGaps;
        } else if (retryHasGaps) {
          console.error(
            `❌ Retry still has missing sections: ${retryMissingSections.join(", ")}`,
          );
        }
      } catch (retryError) {
        console.error("Retry failed, using original response:", retryError);
      }
    }

    if (sectionCount > 0 && hasGaps) {
      console.error(
        `❌ ERROR: Final response has missing sections! Expected: ${expectedSections.join(", ")}, Got: ${modifiedSectionNumbers.join(", ")}, Missing: ${missingSections.join(", ")}`,
      );
      throw new Error(
        `Documentation modification resulted in missing sections: ${missingSections.join(", ")}. Expected ${isRemovalRequest ? sectionCount - 1 : sectionCount} sections but got ${modifiedSectionCount}. Please try again or regenerate the documentation.`,
      );
    }

    if (
      sectionCount > 0 &&
      isRemovalRequest &&
      modifiedSectionCount < sectionCount - 1
    ) {
      console.error(
        `❌ ERROR: Removal request resulted in too few sections. Expected ${sectionCount - 1}, got ${modifiedSectionCount}`,
      );
      throw new Error(
        `Documentation modification removed too many sections. Expected ${sectionCount - 1} sections after removal, but got ${modifiedSectionCount}. Please try again or regenerate the documentation.`,
      );
    }

    return modifiedDocs;
  } catch (error) {
    console.error("Error modifying docs:", error);
    if (
      error instanceof Error &&
      error.message !== "Failed to modify docs with AI"
    ) {
      throw error;
    }
    throw new Error(
      error instanceof Error
        ? `Failed to modify docs with AI: ${error.message}`
        : "Failed to modify docs with AI",
    );
  }
}
