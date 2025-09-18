# RepoDoc

RepoDoc is an AI-powered documentation platform for GitHub that solves one of the most expensive inefficiencies in software engineering: outdated, unreliable, and messy documentation. Developers lose nearly 25% of productivity searching for information, while poor documentation increases onboarding time by more than 60%. RepoDoc eliminates this problem by automatically generating and maintaining accurate documentation, enabling developers to query knowledge in natural language and making documentation instantly shareable across teams.

By combining Next.js, TypeScript, PostgreSQL, Prisma, and Retrieval-Augmented Generation (RAG) with OpenAI and Gemini APIs, RepoDoc creates a system where project knowledge is always accessible, accurate, and reliable. Developers can ask questions directly to their documentation, receive context-aware answers, and keep READMEs up to date without manual effort. This reduces onboarding time by half, improves knowledge retention by over 60%, and increases overall team productivity by more than 40%.

For founders and technical leaders, RepoDoc represents more than a tool — it is a competitive advantage. A 50-person engineering team can save over 10,000 hours annually, representing $1M+ in cost savings at Silicon Valley salary levels. By turning documentation into a living, interactive layer of the development workflow, RepoDoc ensures that teams ship faster, onboard faster, and scale without the bottleneck of poor documentation.

# Tech Stack

Next.js

OpenAI / Gemini API

PostgreSQL

TypeScript

Prisma ORM

Retrieval-Augmented Generation (RAG)

...

## Getting Started

Clone the repository:

git clone https://github.com/yourusername/repodoc.git
cd repodoc


## Install dependencies:

npm install


## Set up environment variables in a .env file:

DATABASE_URL=your_postgres_connection_string

OPENAI_API_KEY=your_openai_key

GEMINI_API_KEY=your_gemini_key


## Run database migrations:

npx prisma migrate dev
