# ⚡ Quick Start Guide

Get RepoDoc running in **5 minutes**!

## Prerequisites Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] PostgreSQL running
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

## 🚀 Setup Steps

### 1. Clone & Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/yourusername/repodoc.git
cd repodoc

# Install dependencies
npm install
```

### 2. Environment Setup (2 minutes)

Create `.env` file:

```env
# Required - Get from https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Required - Get from https://aistudio.google.com/app/apikey
GOOGLE_API_KEY=AIzaSyXXXXXXXXXXXXXX

# Required - Your database
DATABASE_URL="postgresql://user:pass@localhost:5432/repodoc"

# Optional - Get from https://github.com/settings/tokens
GITHUB_TOKEN=ghp_xxxxx
```

### 3. Database Setup (1 minute)

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate:dev
```

### 4. Run the App! (< 1 minute)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 🎯 First Steps After Setup

### 1. Create Your Account
1. Go to `/sign-up`
2. Create account with email
3. Verify email

### 2. Connect a Repository
1. Click "Create Project"
2. Enter GitHub URL
3. Wait for processing (~30 seconds)

### 3. Try the Chat
1. Go to Chat page
2. Ask: "How does authentication work?"
3. Get AI-powered answer with code refs!

---

## 🧪 Verify Everything Works

Run the validation script:

```bash
npm run validate
```

This runs:
- ✅ Type checking
- ✅ Linting
- ✅ Tests
- ✅ Build verification

All should pass! ✅

---

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Make sure PostgreSQL is running
pg_ctl status

# Or use Docker:
docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
```

### Clerk Auth Not Working
1. Check your Clerk keys are correct
2. Verify URLs in Clerk dashboard match your local:
   - Sign In URL: `/sign-in`
   - Sign Up URL: `/sign-up`
   - Redirect URLs: `/dashboard`

### Port Already in Use
```bash
# Change port in package.json or kill process
lsof -ti:3000 | xargs kill -9
```

### Missing API Keys
Get free keys from:
- Clerk: https://clerk.com (Free tier)
- Google AI: https://aistudio.google.com (Free tier)
- GitHub: https://github.com/settings/tokens (Personal Access Token)

---

## 📚 Useful Commands

```bash
# Development
npm run dev                 # Start dev server
npm run build               # Build for production
npm run start               # Start production server

# Database
npm run db:studio           # Open Prisma Studio
npm run db:generate         # Generate Prisma client
npm run db:migrate:dev      # Create migration

# Testing
npm test                    # Run tests (watch mode)
npm run test:ci             # Run tests (CI mode)
npm run test:coverage       # Generate coverage report

# Code Quality
npm run lint                # Check linting
npm run lint:fix            # Fix linting issues
npm run format              # Format code
npm run type-check          # Check TypeScript

# Maintenance
npm run security:audit      # Check for vulnerabilities
npm run clean               # Clean build artifacts
```

---

## 🎓 Learn More

- [Full Documentation](README.md)
- [API Reference](API.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Architecture Details](PROJECT_IMPROVEMENTS.md)

---

## 💬 Need Help?

- 🐛 [Report Issues](https://github.com/yourusername/repodoc/issues)
- 💬 [Join Discord](https://discord.gg/repodoc)
- 📧 [Email Support](mailto:support@repodoc.dev)

---

## ✅ Next Steps

Once running:

1. **Customize**: Update logo, colors, branding
2. **Deploy**: Push to Vercel (one-click deployment)
3. **Monitor**: Set up Sentry for error tracking
4. **Showcase**: Create demo video and screenshots
5. **Share**: Add to portfolio and resume

**You're all set! 🚀**
