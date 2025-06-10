# Aether AI

A unified web application for interacting with multiple AI models from a single interface.

## Overview

Aether AI provides access to various AI providers including Gemini, OpenAI (ChatGPT), Claude, DeepSeek, and others through one streamlined platform. Instead of managing multiple accounts and interfaces, you can compare and utilize different AI models from a centralized hub.

## Features

### Multi-Provider AI Access

Switch between different AI models to find the best fit for your specific use case. Each model has unique strengths and capabilities.

### Advanced AI Capabilities

- **Image Generation**: Create visuals from text descriptions
- **Web Browsing**: Access real-time information from the internet
- **Advanced Reasoning**: Get detailed, step-by-step analysis for complex questions
- **Side-by-Side Comparison**: Query multiple AI providers simultaneously to compare responses and approaches
- **Intuitive Interface**: Clean, responsive design optimized for ease of use

## Technical Stack

- **Next.js**: React framework for optimal performance and developer experience
- **React Router**: Client-side routing for smooth navigation
- **Drizzle ORM**: Type-safe database queries and schema management
- **Better Auth**: Secure authentication and user management
- **Supabase**: Backend services including database, authentication, and real-time features

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/) database
- [Supabase](https://supabase.com/) account

### Installation

1. Clone the repository:

```bash
git clone https://github.com/GabrielSantos23/Aether-ai.git
cd aether-ai
```

2. Create a `.env.local` file with the required environment variables:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/nexfaster
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
BETTER_AUTH_SECRET=your_auth_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

3. Install dependencies:

```bash
npm install
# or
bun install
```

4. Run database migrations:

```bash
npx drizzle-kit push
```

5. Start the development server:

```bash
npm run dev
# or
bun run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
bun run build
bun run start
```

## Acknowledgments

Design inspiration from [t3.chat](https://t3.chat).
