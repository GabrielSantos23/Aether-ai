# Aether-ai

Aether-ai is an advanced AI chat application built with Next.js that supports multiple AI models, web search capabilities, image analysis, and more.

## Features

- **Multi-Model Support**: Compatible with various AI providers including OpenAI, Anthropic Claude, Google Gemini, and others
- **Web Search Integration**: Enable AI to search the web for up-to-date information
- **Image Analysis**: Upload and analyze images with compatible models
- **Image Generation**: Create images using supported models like Gemini
- **Chat History**: Persistent chat threads with automatic saving
- **Message Summaries**: Automatic summarization of messages for easy navigation
- **Thread Management**: Create, view, and manage multiple conversation threads
- **Authentication**: User authentication and profile management
- **Dark/Light Mode**: Toggle between dark and light themes
- **Responsive Design**: Works on desktop and mobile devices
- **Message Reasoning**: View the AI's step-by-step reasoning process (with supported models)
- **Source Citations**: Track and display web search sources used by the AI
- **File Upload**: Share files with AI models that support file analysis

## Supported AI Models

Aether-ai supports a wide range of AI models from different providers:

### Anthropic

- Claude Opus 4
- Claude Sonnet 4
- Claude Sonnet 3.5
- Claude Haiku 3.5

### DeepSeek

- Deepseek R1 0528
- Deepseek V3
- Deepseek V2.5
- Deepseek Coder V2

### Meta

- Llama 4 Maverick
- Llama 3.3 70B
- Llama 3.2 90B Vision
- Llama 3.2 11B Vision
- Llama 3.2 3B
- Llama 3.2 1B

### Google

- Gemini 2.0 Flash Image Generation
- Gemini 2.0 Flash
- Gemini 2.5 Pro
- Gemini 2.5 Flash

### OpenAI

- GPT-4o
- GPT-4.1-mini

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **ORM**: Previously Drizzle ORM (now using Supabase client directly)
- **Authentication**: Supabase Auth
- **State Management**: React hooks, context, and custom stores
- **Local Storage**: Dexie.js (IndexedDB)
- **AI Integration**: AI SDK for seamless model integration
- **Markdown Rendering**: React Markdown with KaTeX support

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Bun package manager (recommended) or npm
- Supabase account and project

### Environment Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/Aether-ai.git
   cd Aether-ai
   ```

2. Create a `.env.local` file in the root directory with the following variables:

   ```
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # API Keys (optional - users can provide their own)
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   GOOGLE_API_KEY=your_google_api_key
   ```

### Installation

1. Install dependencies:

   ```bash
   # Using Bun (recommended)
   bun install

   # Or using npm
   npm install
   ```

2. Set up the database:
   - The application uses Supabase for data storage
   - Database schema is defined in `lib/db/schema.ts` (for reference)
   - Run migrations if needed:
     ```bash
     # If you have migration scripts
     bun run deploy-sql
     ```

### Running Locally

1. Start the development server:

   ```bash
   # Using Bun
   bun run dev

   # Or using npm
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:3000`

## Usage

### Authentication

1. Sign up for a new account or sign in with existing credentials
2. Set up your profile with preferred settings

### Setting up API Keys

1. Navigate to Settings
2. Add your API keys for different providers:
   - OpenAI API Key
   - Anthropic API Key
   - Google API Key
   - OpenRouter API Key (for DeepSeek and Meta models)
   - Groq API Key
3. These keys are stored securely and used for API requests

### Starting a Conversation

1. Create a new thread from the sidebar
2. Select your preferred AI model from the dropdown
3. Start typing your message in the input box
4. Use the toolbar to enable additional features:
   - Web search
   - Image analysis
   - Step-by-step thinking

### Using Advanced Features

#### Web Search

- Enable the web search toggle before sending your message
- The AI will search the web for relevant information
- Sources will be displayed in the right sidebar

#### Image Analysis

- Enable the image analysis toggle
- Upload an image using the attachment button
- Ask questions about the uploaded image

#### Image Generation

- Select an image generation model like "Gemini 2.0 Flash Image Generation"
- Use prompts like "Create an image of..." or "Generate a picture of..."

#### Chat Navigator

- Access summaries of your conversation
- Quickly navigate to specific parts of the conversation

#### Reasoning View

- For supported models, view the step-by-step reasoning process
- Access detailed explanations of how the AI arrived at its response

#### File Sharing

- Upload and share files with AI models that support file analysis
- Discuss document contents with the AI

## Data Storage and Security

### API Key Storage

- API keys are stored in the browser's localStorage using Zustand persist middleware
- Keys are synchronized across browser tabs
- No API keys are stored on the server unless explicitly configured in environment variables
- You can use either your own API keys or the application's default keys (if configured)

### Chat Data Storage

- Chat messages are stored in Supabase PostgreSQL database
- Local fallback using IndexedDB (Dexie.js) when offline or for unauthenticated users
- Message sources, reasoning, and summaries are stored separately for efficient retrieval
- Thread data is associated with user accounts for privacy

## Model Capabilities

Different models have different capabilities:

| Feature               | Supported Models                                          |
| --------------------- | --------------------------------------------------------- |
| Web Search            | Gemini models                                             |
| Vision/Image Analysis | Claude models, Gemini models, GPT-4o, Llama Vision models |
| Step-by-step Thinking | Claude models, Gemini models, Deepseek R1                 |
| Image Generation      | Gemini 2.0 Flash Image Generation, Gemini 2.5 Flash       |
| File Upload           | Claude models, Gemini models, GPT-4o                      |

## Database Schema

The application uses the following database structure:

- **threads**: Stores conversation threads
- **messages**: Stores individual messages within threads
- **messageSources**: Stores sources referenced by AI responses
- **messageSummaries**: Stores summaries of messages for navigation
- **messageReasonings**: Stores reasoning steps from AI models
- **sharedThreads**: Manages thread sharing between users

## Project Structure

- `/app`: Next.js app router components and API routes
- `/components`: React components
- `/frontend`: Frontend-specific components and logic
- `/lib`: Utility functions, database schema, and services
- `/hooks`: Custom React hooks
- `/public`: Static assets

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Conclusion

Aether-ai provides a powerful, flexible interface for interacting with various AI models. With features like web search integration, image analysis, and comprehensive conversation management, it offers a complete solution for both personal and professional AI interactions.

Whether you're using it for research, content creation, or just exploring the capabilities of different AI models, Aether-ai provides the tools you need in an intuitive, user-friendly interface.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
