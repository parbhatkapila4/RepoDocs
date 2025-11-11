import { Document } from "@langchain/core/documents"
import { openrouterSingleMessage } from "@/lib/openrouter"
import { GoogleGenAI } from "@google/genai";
import { logger } from "./logger";

// Support both GEMINI_API_KEY and GOOGLE_GENAI_API_KEY for backwards compatibility
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

if (!geminiApiKey) {
    throw new Error('Missing GEMINI_API_KEY or GOOGLE_GENAI_API_KEY environment variable');
}

const genAi = new GoogleGenAI({ apiKey: geminiApiKey })


export async function getSummariseCode(doc: Document) {
    const log = logger.scoped("gemini:summarise");
    log.debug("Summarising code", { source: doc.metadata.source });
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
        logger.error("Error summarising code", { source: doc.metadata.source, error })
        return ""
    }
}

export async function getGenerateEmbeddings(summary: string, useCache: boolean = true) {
    const log = logger.scoped("gemini:embed");
    log.debug("Generating embeddings")
    
    // Check cache first
    if (useCache) {
        try {
            const { cache } = await import('./cache');
            const cached = await cache.getCachedEmbedding(summary);
            if (cached) {
                log.debug("Using cached embedding");
                return cached;
            }
        } catch (error) {
            log.debug("Cache miss, generating new embedding");
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
                log.warn("Failed to cache embedding", { error: cacheError });
            }
        }

        return embeddingValues;
    } catch (error) {
        logger.error("Error generating embeddings", { error })
        throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function generateReadmeFromCodebase(projectName: string, sourceCodeSummaries: string[], repoInfo: any) {
    const log = logger.scoped("gemini:readme");
    log.debug("Generating README", { projectName })
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
        logger.error("Error generating README", { projectName, error })
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
    const log = logger.scoped("gemini:readme:modify");
    log.debug("Modifying README with user query", { projectName, userQuery })
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
        logger.error("Error modifying README", { projectName, error })
        throw new Error("Failed to modify README with AI")
    }
}

export async function generateDocsFromCodebase(projectName: string, sourceCodeSummaries: string[], repoInfo: any) {
    const log = logger.scoped("gemini:docs");
    log.debug("Generating docs", { projectName })
    try {
        const codebaseContext = sourceCodeSummaries.join('\n\n')
        
        const prompt = `You are an expert technical writer, software architect, and senior developer with 15+ years of experience. Generate the most comprehensive, detailed, and professional technical documentation possible for the project "${projectName}".

PROJECT INFORMATION:
- Project Name: ${projectName}
- Repository URL: ${repoInfo?.htmlUrl || 'N/A'}
- Primary Language: ${repoInfo?.language || 'N/A'}
- Description: ${repoInfo?.description || 'N/A'}
- Stars: ${repoInfo?.stars || 0}
- Forks: ${repoInfo?.forks || 0}

DETAILED CODEBASE ANALYSIS:
${codebaseContext}

CRITICAL INSTRUCTIONS - Generate EXTREMELY COMPREHENSIVE documentation:

## 📋 **1. PROJECT OVERVIEW & INTRODUCTION**
- **Executive Summary**: Detailed project description, purpose, and value proposition
- **Key Features & Capabilities**: Comprehensive list with detailed explanations
- **Technology Stack**: Complete breakdown of all technologies, frameworks, libraries
- **Architecture Overview**: High-level system design and component relationships
- **Target Audience**: Who should use this and why
- **Use Cases**: Real-world scenarios and applications
- **Performance Characteristics**: Speed, scalability, resource usage
- **Security Features**: Authentication, authorization, data protection
- **Compliance & Standards**: Industry standards, certifications, best practices

## 🏗️ **2. SYSTEM ARCHITECTURE & DESIGN**
- **Architecture Diagrams**: Detailed text-based system architecture
- **Component Architecture**: Individual component breakdown and responsibilities
- **Data Flow Diagrams**: How data moves through the system
- **Database Schema**: Complete database design and relationships
- **API Architecture**: REST/GraphQL endpoints and their relationships
- **Microservices/Modules**: Service boundaries and communication patterns
- **Design Patterns**: Specific patterns used (MVC, Repository, Factory, etc.)
- **Scalability Design**: How the system scales horizontally/vertically
- **Performance Optimization**: Caching, indexing, query optimization
- **Security Architecture**: Security layers, threat modeling, protection mechanisms

## 🚀 **3. INSTALLATION & SETUP**
- **System Requirements**: Hardware, software, OS requirements
- **Prerequisites**: All dependencies, tools, accounts needed
- **Environment Setup**: Development, staging, production environments
- **Step-by-Step Installation**: Detailed installation guide with commands
- **Configuration Management**: All config files and their purposes
- **Database Setup**: Schema creation, migrations, seed data
- **Docker Setup**: Container configuration, docker-compose setup
- **Kubernetes Deployment**: K8s manifests, helm charts
- **CI/CD Pipeline**: GitHub Actions, Jenkins, or other automation
- **Environment Variables**: Complete list with descriptions and examples
- **SSL/TLS Setup**: Certificate configuration and security setup

## 📚 **4. COMPREHENSIVE API DOCUMENTATION**
- **API Overview**: REST/GraphQL API structure and conventions
- **Authentication**: JWT, OAuth, API keys, session management
- **Authorization**: Role-based access control, permissions
- **Endpoint Documentation**: Every endpoint with:
  - HTTP method and URL
  - Request parameters (query, path, body)
  - Request headers
  - Request body schema with examples
  - Response schema with examples
  - Status codes and error responses
  - Rate limiting information
- **Webhook Documentation**: Event triggers, payload formats
- **SDK Documentation**: Client libraries and usage examples
- **API Versioning**: Version strategy and migration guides
- **Error Handling**: Error codes, messages, troubleshooting

## ⚙️ **5. CONFIGURATION & ENVIRONMENT**
- **Environment Variables**: Complete reference with types and defaults
- **Configuration Files**: All config files with detailed explanations
- **Feature Flags**: Toggleable features and their configuration
- **Logging Configuration**: Log levels, formats, destinations
- **Monitoring Setup**: Metrics, alerts, dashboards
- **Third-Party Integrations**: External services and their setup
- **Database Configuration**: Connection strings, pooling, replication
- **Cache Configuration**: Redis, Memcached, in-memory caching
- **Queue Configuration**: Message queues, job processing
- **File Storage**: Local, S3, CDN configuration

## 💻 **6. USAGE EXAMPLES & TUTORIALS**
- **Quick Start Guide**: Get running in 5 minutes
- **Basic Usage**: Simple examples and common patterns
- **Advanced Usage**: Complex scenarios and edge cases
- **Code Examples**: Extensive code snippets in multiple languages
- **Integration Examples**: How to integrate with other systems
- **Real-World Scenarios**: Practical use cases with full examples
- **Performance Examples**: Optimized code patterns
- **Security Examples**: Secure coding practices
- **Testing Examples**: Unit tests, integration tests, e2e tests
- **Debugging Examples**: Common issues and solutions

## 🛠️ **7. DEVELOPMENT GUIDE**
- **Project Structure**: Complete directory structure explanation
- **Code Organization**: How code is organized and why
- **Development Workflow**: Git flow, branching strategy, PR process
- **Local Development**: Setting up local environment
- **Testing Strategy**: Unit, integration, e2e testing approaches
- **Code Style Guide**: Linting, formatting, naming conventions
- **Documentation Standards**: How to write and maintain docs
- **Performance Guidelines**: Code optimization best practices
- **Security Guidelines**: Secure coding practices
- **Contributing Guidelines**: How to contribute to the project
- **Code Review Process**: Review checklist and standards

## 🚀 **8. DEPLOYMENT & OPERATIONS**
- **Production Deployment**: Step-by-step production setup
- **Environment Management**: Dev, staging, prod configurations
- **Database Migrations**: Schema changes and data migrations
- **Backup & Recovery**: Data backup strategies and recovery procedures
- **Monitoring & Alerting**: System health monitoring setup
- **Logging & Debugging**: Log analysis and troubleshooting
- **Performance Monitoring**: Metrics collection and analysis
- **Security Monitoring**: Security event monitoring and response
- **Scaling Procedures**: How to scale the system
- **Disaster Recovery**: Business continuity planning
- **Maintenance Windows**: Scheduled maintenance procedures

## 🔧 **9. TROUBLESHOOTING & SUPPORT**
- **Common Issues**: Frequently encountered problems and solutions
- **Error Codes**: Complete error code reference
- **Debugging Techniques**: How to debug issues effectively
- **Performance Issues**: Common performance problems and fixes
- **Security Issues**: Security vulnerabilities and mitigations
- **Database Issues**: Database-related problems and solutions
- **Network Issues**: Connectivity and communication problems
- **FAQ Section**: Frequently asked questions with detailed answers
- **Support Channels**: How to get help and report issues
- **Community Resources**: Forums, Discord, Stack Overflow

## 📖 **10. COMPLETE REFERENCE**
- **API Reference**: Complete endpoint documentation
- **Configuration Reference**: All configuration options
- **CLI Reference**: Command-line interface documentation
- **Database Schema**: Complete database reference
- **File Formats**: Supported file formats and structures
- **Glossary**: Technical terms and definitions
- **Changelog**: Version history and changes
- **Migration Guides**: How to upgrade between versions
- **Deprecation Notices**: Deprecated features and alternatives
- **License Information**: Usage rights and restrictions

## 🎯 **ADDITIONAL SECTIONS TO INCLUDE:**
- **Performance Benchmarks**: Speed, throughput, latency metrics
- **Security Audit**: Security considerations and recommendations
- **Accessibility**: WCAG compliance and accessibility features
- **Internationalization**: Multi-language support and localization
- **Mobile Support**: Mobile app integration and responsive design
- **Browser Compatibility**: Supported browsers and versions
- **Third-Party Dependencies**: All external libraries and their purposes
- **Known Limitations**: Current limitations and future improvements
- **Roadmap**: Future features and development plans
- **Contributors**: Team members and their contributions

CRITICAL FORMATTING REQUIREMENTS:
- Use ONLY standard markdown formatting - NO HTML tags
- Use proper markdown syntax for code blocks, tables, and links
- Structure content with clear headings and subheadings (use emojis for visual appeal)
- Include extensive code examples with proper syntax highlighting
- Use tables for configuration options, API parameters, and comparisons
- Add detailed explanations for every concept
- Include practical examples for every feature
- Ensure all sections are comprehensive and detailed
- Use consistent formatting throughout
- Make it production-ready and professional

Generate the most comprehensive, detailed, and useful technical documentation possible. This should be the definitive guide that any developer can use to understand, implement, and maintain this project.`

        const docsContent = await openrouterSingleMessage(prompt, "google/gemini-2.5-flash")
        return docsContent
    } catch (error) {
        logger.error("Error generating docs", { projectName, error })
        
        // Try a simpler, faster generation as fallback
        try {
            log.warn("Docs generation failed, attempting fallback", { projectName })
            const fallbackPrompt = `Generate comprehensive technical documentation for "${projectName}".

PROJECT INFO:
- Name: ${projectName}
- Repository: ${repoInfo?.htmlUrl || 'N/A'}
- Language: ${repoInfo?.language || 'N/A'}
- Description: ${repoInfo?.description || 'N/A'}

CODEBASE SUMMARY:
${sourceCodeSummaries.slice(0, 5).join('\n\n')}

Create detailed documentation including:
1. Project Overview & Features
2. Installation & Setup
3. API Documentation
4. Configuration
5. Usage Examples
6. Development Guide
7. Deployment
8. Troubleshooting

Use markdown format with clear sections and code examples.`

            const fallbackDocs = await openrouterSingleMessage(fallbackPrompt, "google/gemini-2.5-flash-lite")
            return fallbackDocs
        } catch (fallbackError) {
            logger.error("Fallback docs generation failed", { projectName, error: fallbackError })
        }
        
        return `# ${projectName} - Technical Documentation

## Project Overview

${projectName} is a ${repoInfo?.language || 'software'} project that provides ${repoInfo?.description || 'useful functionality for developers'}.

### Key Features
- Modern architecture and design patterns
- Scalable and maintainable codebase
- Comprehensive API and configuration options
- Developer-friendly setup and deployment

### Technology Stack
- **Primary Language**: ${repoInfo?.language || 'N/A'}
- **Framework**: Modern web framework
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Secure user management
- **Deployment**: Production-ready configuration

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Git

### Installation Steps

\`\`\`bash
# Clone the repository
git clone ${repoInfo?.cloneUrl || 'https://github.com/user/repo.git'}
cd ${projectName}

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npx prisma migrate dev

# Start the development server
npm run dev
\`\`\`

## API Documentation

### Base URL
\`http://localhost:3000/api\`

### Authentication
All API endpoints require authentication via JWT tokens.

### Endpoints

#### GET /api/projects
Retrieve user projects.

**Response:**
\`\`\`json
{
  "projects": [
    {
      "id": "uuid",
      "name": "Project Name",
      "repoUrl": "https://github.com/user/repo",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
\`\`\`

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| \`DATABASE_URL\` | PostgreSQL connection string | Yes | - |
| \`NEXTAUTH_SECRET\` | Authentication secret | Yes | - |
| \`GEMINI_API_KEY\` | Google Gemini API key | Yes | - |

## Development

### Project Structure
\`\`\`
src/
├── app/                 # Next.js app directory
├── components/          # React components
├── lib/                # Utility functions
├── hooks/              # Custom React hooks
└── types/              # TypeScript type definitions
\`\`\`

### Code Style
- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Write comprehensive tests
- Document all public APIs

## Deployment

### Production Build
\`\`\`bash
npm run build
npm start
\`\`\`

### Docker Deployment
\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

## Troubleshooting

### Common Issues

**Database Connection Error**
- Verify DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check network connectivity

**Authentication Issues**
- Verify NEXTAUTH_SECRET is set
- Check JWT token expiration
- Ensure proper CORS configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.
`
    }
}

export async function modifyDocsWithQuery(currentDocs: string, userQuery: string, projectName: string) {
    const log = logger.scoped("gemini:docs:modify");
    log.debug("Modifying docs with user query", { projectName, userQuery })
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
        logger.error("Error modifying docs", { projectName, error })
        throw new Error("Failed to modify docs with AI")
    }
}
