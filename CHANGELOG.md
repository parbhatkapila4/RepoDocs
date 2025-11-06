# Changelog

All notable changes to RepoDoc will be documented in this file.

## [2.0.0] - 2024-11-06

### 🚀 Major Features Added

#### RAG Query System
- **Implemented actual RAG querying** with vector similarity search using pgvector
- **Chat interface** for natural language codebase queries
- **Source references** in AI responses with similarity scores
- **Conversation history** support for context-aware responses

#### Production-Ready Infrastructure
- **Comprehensive error handling** with automatic retry logic and exponential backoff
- **Caching layer** for embeddings and query results (in-memory with Redis-ready architecture)
- **Rate limiting** to prevent API abuse
- **Cost tracking** for monitoring API usage
- **Health monitoring** endpoint with performance metrics

### 🔧 Improvements

#### Performance
- **Database indexes** added for faster queries (HNSW index for vector similarity)
- **Batch processing** for repository indexing (10 files per batch)
- **Smart caching** to reduce duplicate API calls
- **Optimized database queries** with proper indexes

#### Code Quality
- **Error handling utilities** with custom error classes
- **Monitoring & logging** system with performance tracking
- **Type safety** improvements throughout codebase
- **Code organization** with better separation of concerns

#### Documentation
- **Honest README** accurately describing implemented features
- **Deployment guide** with step-by-step instructions
- **API documentation** with request/response examples
- **Architecture diagrams** explaining system design

### 🎨 UI/UX Enhancements

#### New Pages
- **Chat with Code** - Interactive codebase Q&A interface
- **Health Dashboard** - System health monitoring (API endpoint)

#### Improvements
- **Better error messages** with actionable feedback
- **Loading states** for better user experience
- **Mobile responsive** chat interface
- **Syntax highlighting** in chat responses

### 🧪 Testing & Quality

- **Test infrastructure** set up with Jest
- **Example tests** for critical functionality
- **Type checking** scripts added
- **Linting** configuration improved

### 📊 Monitoring & Analytics

- **Performance monitoring** with P50, P95, P99 metrics
- **Error tracking** with severity levels
- **API usage tracking** for cost optimization
- **Health check endpoint** for uptime monitoring

### 🐛 Bug Fixes

- Fixed embedding generation error handling
- Improved project deletion with proper cascade
- Better handling of large repositories
- Fixed cache invalidation issues

### 🔒 Security

- Added rate limiting to prevent abuse
- Improved error logging (no sensitive data exposure)
- Better authentication checks
- Webhook signature verification

### ⚡ Performance

- Reduced query latency with proper indexing
- Optimized embedding generation with caching
- Better batch processing for large repos
- Improved memory usage

### 📝 Documentation

- **README.md** - Complete rewrite with accurate feature list
- **DEPLOYMENT.md** - Comprehensive deployment guide
- **CHANGELOG.md** - This file
- Code comments improved throughout

---

## [1.0.0] - Previous Version

### Features
- GitHub repository loading
- File summarization with AI
- Embedding generation
- README generation
- Documentation generation
- Project management
- User authentication with Clerk

---

## What's Next?

See the [README.md](README.md) "Planned Improvements" section for upcoming features.

