# Authentication with Better Auth, Prisma, and Supabase

This project uses Better Auth for authentication, with Prisma as the database ORM and Supabase for email services.

## Setup Instructions

### 1. Environment Variables

Make sure to set up the following environment variables in your `.env` file:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Better Auth Configuration
BETTER_AUTH_SECRET="your-better-auth-secret"
```

### 2. Database Setup

Run the following commands to set up the database:

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Create Better Auth tables
npx @better-auth/cli migrate
```

### 3. Social Authentication (Optional)

To enable social authentication, add the following environment variables:

```
# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Usage

### Authentication Routes

The following authentication routes are available:

- `/auth/sign-in` - Sign in page
- `/auth/sign-up` - Sign up page
- `/auth/profile` - User profile page

### Components

The following components are available for authentication:

- `LoginForm` - Form for signing in
- `RegisterForm` - Form for signing up
- `UserProfile` - Component for displaying user profile
- `NavAuth` - Navigation component with authentication links

### API

The authentication API is available at `/api/auth/[...path]`.

## Authentication Flow

1. User signs up with email and password
2. User verifies email via link sent by Supabase
3. User can sign in with email and password
4. User can sign out
5. User can view and update their profile

## Security Considerations

- All passwords are hashed and stored securely
- Authentication tokens are stored in HTTP-only cookies
- Session expiration is handled automatically
- CSRF protection is enabled

## Customization

You can customize the authentication components by modifying the files in `src/components/auth/`.
