# 🚀 RepoDoc - AI-Powered Code Documentation & Chat Platform

<div align="center">

![RepoDoc Logo](./public/RepoDoc%20Logo.png)

**Transform your GitHub repositories into interactive, intelligent documentation**

[![CI/CD](https://github.com/yourusername/repodoc/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/yourusername/repodoc/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)

[Demo](https://repodoc.vercel.app) · [Documentation](https://docs.repodoc.dev) · [Report Bug](https://github.com/yourusername/repodoc/issues)

</div>

---

## ✨ Features

### 🤖 AI-Powered Code Understanding
- **Intelligent Chat Interface**: Ask questions about your codebase in natural language
- **Semantic Code Search**: Find code by meaning, not just keywords
- **Context-Aware Responses**: Get answers with file references and code snippets

### 📚 Automatic Documentation
- **Auto-Generated Docs**: Create comprehensive documentation from your code
- **Interactive Wiki**: Browse and search through your codebase structure
- **README Enhancement**: Improve your README with AI suggestions

### 🔍 Repository Analytics
- **Language Statistics**: Visualize your tech stack
- **Code Metrics**: Track repository size, stars, forks, and activity
- **Dependency Insights**: Understand your project dependencies

### 🛡️ Enterprise-Ready
- **Rate Limiting**: Protect your API with built-in rate limiting
- **Error Tracking**: Integrated monitoring and error reporting
- **Secure Authentication**: OAuth integration with Clerk
- **Performance Monitoring**: Track and optimize application performance

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ Chat UI      │  │ Dashboard    │  │ Documentation      │   │
│  │              │  │              │  │ Generation         │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ REST API
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      API Routes (Next.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ /api/query   │  │ /api/docs    │  │ /api/github        │   │
│  │              │  │              │  │                     │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────┐  ┌──────────────┐  ┌──────────────┐
│  Vector DB      │  │  PostgreSQL  │  │  GitHub API  │
│  (Embeddings)   │  │  (Metadata)  │  │              │
└─────────────────┘  └──────────────┘  └──────────────┘
          │                  │
          │                  │
          ▼                  ▼
┌──────────────────────────────────────────────┐
│         AI/ML Services                       │
│  ┌──────────────┐  ┌────────────────────┐   │
│  │ Google       │  │ OpenRouter         │   │
│  │ Gemini       │  │ (Multi-Model)      │   │
│  └──────────────┘  └────────────────────┘   │
└──────────────────────────────────────────────┘
```

### Tech Stack

#### Frontend
- **Framework**: Next.js 15.5 (App Router)
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS 4.1
- **UI Components**: Radix UI
- **State Management**: Redux Toolkit
- **Forms**: React Hook Form + Zod

#### Backend
- **Runtime**: Node.js 20
- **Database**: PostgreSQL (Prisma ORM)
- **Vector Storage**: Custom implementation with embeddings
- **Authentication**: Clerk
- **API**: Next.js API Routes

#### AI/ML
- **LLM**: Google Gemini + OpenRouter
- **Embeddings**: LangChain
- **Vector Search**: Custom RAG implementation

#### DevOps
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel
- **Monitoring**: Sentry (configured)
- **Testing**: Jest + React Testing Library

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database
- GitHub account
- Clerk account (for authentication)
- Google AI API key or OpenRouter API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/repodoc.git
cd repodoc
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/repodoc"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# AI APIs
GOOGLE_API_KEY=your_google_api_key
OPENROUTER_API_KEY=your_openrouter_key

# GitHub
GITHUB_TOKEN=ghp_xxxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Set up the database**
```bash
npm run db:generate
npm run db:migrate
```

5. **Run the development server**
```bash
npm run dev
```

6. **Open your browser**
```
http://localhost:3000
```

---

## 📖 Usage

### 1. Connect Your Repository

1. Sign in with your GitHub account
2. Click "Create Project" in the dashboard
3. Enter your repository URL
4. Wait for the initial processing

### 2. Chat with Your Codebase

1. Navigate to the Chat page
2. Ask questions like:
   - "How does authentication work?"
   - "Explain the database schema"
   - "Where is error handling implemented?"
3. Get instant answers with code references

### 3. Generate Documentation

1. Go to the Docs page
2. Click "Generate Documentation"
3. Review and customize the generated docs
4. Export or share your documentation

### 4. Explore Analytics

1. Visit the Dashboard
2. View repository statistics
3. Analyze language distribution
4. Track activity trends

---

## 🧪 Testing

### Run all tests
```bash
npm test
```

### Run tests in CI mode
```bash
npm run test:ci
```

### Check test coverage
```bash
npm test -- --coverage
```

### Type checking
```bash
npm run type-check
```

---

## 🏗️ Project Structure

```
repodoc/
├── .github/
│   └── workflows/           # CI/CD pipelines
├── __tests__/               # Test files
│   ├── components/
│   ├── lib/
│   └── api/
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Database migrations
├── public/                  # Static assets
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── (app)/          # Public pages
│   │   ├── (auth)/         # Auth pages
│   │   ├── (protected)/    # Protected pages
│   │   └── api/            # API routes
│   ├── components/          # React components
│   │   ├── ui/             # UI primitives
│   │   └── landing/        # Landing page components
│   ├── context/            # React contexts
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utility libraries
│   │   ├── actions.ts      # Server actions
│   │   ├── github.ts       # GitHub integration
│   │   ├── rag.ts          # RAG implementation
│   │   ├── monitoring.ts   # Error tracking
│   │   └── rate-limiter.ts # Rate limiting
│   └── provider/           # Context providers
├── .env.example            # Environment variables template
├── jest.config.js          # Jest configuration
├── next.config.ts          # Next.js configuration
└── package.json            # Dependencies
```

---

## 🔒 Security

### Security Features

- ✅ Rate limiting on all API endpoints
- ✅ Input validation with Zod
- ✅ SQL injection protection (Prisma)
- ✅ XSS protection (Next.js built-in)
- ✅ CSRF protection
- ✅ Secure authentication (Clerk)
- ✅ Environment variable validation

### Reporting Security Issues

If you discover a security vulnerability, please email security@repodoc.dev. Do not create public GitHub issues for security vulnerabilities.

---

## 📊 Performance

### Optimization Techniques

- ✅ Server-side rendering (SSR)
- ✅ Static site generation (SSG)
- ✅ Image optimization (Next.js Image)
- ✅ Code splitting
- ✅ Tree shaking
- ✅ Compression (gzip/brotli)
- ✅ CDN caching
- ✅ Database query optimization
- ✅ Redis caching (planned)

### Performance Metrics

- Lighthouse Score: 95+
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.0s
- Total Blocking Time: < 200ms

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow the existing code style
- Run `npm run lint` before committing
- Write tests for new features
- Update documentation as needed

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Vercel](https://vercel.com/) - Hosting Platform
- [Clerk](https://clerk.dev/) - Authentication
- [Google AI](https://ai.google.dev/) - AI/ML Services
- [Radix UI](https://www.radix-ui.com/) - UI Components
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

## 📞 Support

- 📧 Email: support@repodoc.dev
- 💬 Discord: [Join our community](https://discord.gg/repodoc)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/repodoc/issues)
- 📖 Docs: [Documentation](https://docs.repodoc.dev)

---

<div align="center">

**Made with ❤️ by [Your Name](https://github.com/yourusername)**

[⬆ Back to Top](#-repodoc---ai-powered-code-documentation--chat-platform)

</div>
