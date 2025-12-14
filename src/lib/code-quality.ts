import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export interface CodeQualityMetrics {
  overallScore: number;
  maintainability: number;
  complexity: number;
  testCoverage: number;
  documentation: number;
  security: number;
}

export interface CodeSmell {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  file: string;
  line: number;
  description: string;
  suggestion: string;
}

export interface CodeQualityReport {
  metrics: CodeQualityMetrics;
  smells: CodeSmell[];
  suggestions: string[];
  strengths: string[];
  securityIssues: Array<{
    type: string;
    severity: string;
    description: string;
    fix: string;
  }>;
  timestamp: Date;
}

export async function analyzeCodeQuality(
  files: Array<{ path: string; content: string }>,
  projectName: string
): Promise<CodeQualityReport> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
Analyze the following codebase for quality, security, and best practices.
Project: ${projectName}
Files analyzed: ${files.length}

Code samples:
${files
  .slice(0, 10)
  .map(
    (f) => `
File: ${f.path}
\`\`\`
${f.content.slice(0, 1000)}
\`\`\`
`
  )
  .join("\n")}

Provide analysis in the following JSON format:
{
  "overallScore": 0-100,
  "maintainability": 0-100,
  "complexity": 0-100,
  "testCoverage": 0-100,
  "documentation": 0-100,
  "security": 0-100,
  "codeSmells": [
    {
      "type": "string",
      "severity": "low|medium|high|critical",
      "file": "string",
      "line": 0,
      "description": "string",
      "suggestion": "string"
    }
  ],
  "suggestions": ["string"],
  "strengths": ["string"],
  "securityIssues": [
    {
      "type": "string",
      "severity": "string",
      "description": "string",
      "fix": "string"
    }
  ]
}

Focus on:
1. Code complexity and maintainability
2. Security vulnerabilities
3. Best practices violations
4. Missing tests or documentation
5. Performance concerns
6. Architectural issues
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return {
      metrics: {
        overallScore: analysis.overallScore || 0,
        maintainability: analysis.maintainability || 0,
        complexity: analysis.complexity || 0,
        testCoverage: analysis.testCoverage || 0,
        documentation: analysis.documentation || 0,
        security: analysis.security || 0,
      },
      smells: analysis.codeSmells || [],
      suggestions: analysis.suggestions || [],
      strengths: analysis.strengths || [],
      securityIssues: analysis.securityIssues || [],
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("Error analyzing code quality:", error);

    return {
      metrics: {
        overallScore: 0,
        maintainability: 0,
        complexity: 0,
        testCoverage: 0,
        documentation: 0,
        security: 0,
      },
      smells: [],
      suggestions: ["Unable to analyze code quality. Please try again."],
      strengths: [],
      securityIssues: [],
      timestamp: new Date(),
    };
  }
}

export async function generatePRDescription(
  changes: Array<{ file: string; additions: number; deletions: number }>,
  commitMessage: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
Generate a comprehensive Pull Request description for the following changes:

Commit Message: ${commitMessage}

Files Changed:
${changes.map((c) => `- ${c.file} (+${c.additions} -${c.deletions})`).join("\n")}

Create a PR description that includes:
1. Summary of changes
2. Technical details
3. Testing done
4. Breaking changes (if any)
5. Checklist

Format in Markdown.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating PR description:", error);
    return `## Changes\n\n${commitMessage}\n\n### Files Modified\n${changes.map((c) => `- ${c.file}`).join("\n")}`;
  }
}

export async function detectSecurityVulnerabilities(
  code: string,
  language: string
): Promise<
  Array<{
    line: number;
    type: string;
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    fix: string;
  }>
> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
Analyze this ${language} code for security vulnerabilities:

\`\`\`${language}
${code}
\`\`\`

Identify:
- SQL injection risks
- XSS vulnerabilities  
- Authentication issues
- Authorization problems
- Data exposure
- Insecure dependencies
- Hardcoded secrets

Return JSON array of vulnerabilities with: line, type, severity, description, fix
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [];
  } catch (error) {
    console.error("Error detecting vulnerabilities:", error);
    return [];
  }
}

export function calculateComplexity(code: string): number {
  let score = 0;

  const controlFlow = (code.match(/\b(if|else|for|while|switch|case)\b/g) || [])
    .length;
  const functions = (code.match(/\bfunction\b|\=\>/g) || []).length;
  const ternary = (code.match(/\?.*:/g) || []).length;
  const logicalOps = (code.match(/\&\&|\|\|/g) || []).length;

  score = controlFlow + functions + ternary + logicalOps;

  return Math.min(Math.round((score / Math.max(functions, 1)) * 10), 100);
}

export async function suggestRefactoring(
  code: string,
  language: string
): Promise<
  Array<{
    type: string;
    description: string;
    before: string;
    after: string;
    benefit: string;
  }>
> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
Analyze this ${language} code and suggest refactoring opportunities:

\`\`\`${language}
${code}
\`\`\`

Suggest improvements for:
- Code duplication
- Long functions
- Complex conditionals
- Magic numbers
- Poor naming
- Missing abstractions

Return JSON array with: type, description, before (code), after (improved), benefit
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [];
  } catch (error) {
    console.error("Error suggesting refactoring:", error);
    return [];
  }
}
