# NexFaster

A minimal template showcasing React Router integration within Next.js for client-side routing

![nexfaster](./public/og.png)

## 🚀 Quick Start

```bash
git clone https://github.com/rudrodip/nexfaster
cd nexfaster
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🏗️ Architecture

NexFaster combines Next.js with React Router for pure client-side routing:

1. **Route Redirection**: All routes redirect to `/shell` via `next.config.ts`
2. **Shell Loading**: Shell page loads React Router app with `ssr: false`
3. **Client Routing**: React Router handles all navigation client-side

## 📁 Key Files

- `next.config.ts` - Route redirection configuration
- `src/app/shell/page.tsx` - Loads React Router app
- `src/frontend/app.tsx` - Main React Router application
- `src/config/site.config.ts` - Site configuration
- `src/components/boilerplate.tsx` - Layout and page components

## 🔧 Adding Routes

Add new routes in `src/frontend/app.tsx`:

```tsx
<Route path="/your-page" element={<YourPage />} />
```

## 🎨 Features

- ⚡ Lightning fast client-side routing
- 🎯 Zero-config React Router integration
- 🎨 Modern UI with Tailwind CSS
- 🌙 Dark mode support
- 📱 Responsive design
- 🔧 TypeScript support

## 🛠️ Tech Stack

- **Framework**: Next.js 15
- **Routing**: React Router 7
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Language**: TypeScript

## 📖 Usage Examples

### Multi-page App

```tsx
<Route path="/products" element={<ProductList />} />
<Route path="/products/:id" element={<ProductDetail />} />
<Route path="/cart" element={<ShoppingCart />} />
```

### Protected Routes

```tsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### Nested Layouts

```tsx
<Route path="/admin" element={<AdminLayout />}>
  <Route path="users" element={<UserManagement />} />
  <Route path="settings" element={<Settings />} />
</Route>
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

BSD Zero Clause License - see [LICENSE](LICENSE) for details.

## 👤 Author

Created by [rds_agi](https://rdsx.dev) • [GitHub](https://github.com/rudrodip/nexfaster) • [Twitter](https://x.com/rds_agi)

## Authentication Setup

This project uses Better Auth with Drizzle ORM for authentication. Here's how to set it up:

1. Create a PostgreSQL database and set the connection string in your `.env` file:

```bash
# Database
DATABASE_URL=postgres://username:password@localhost:5432/nexfaster
```

2. Generate a secure secret key for Better Auth:

```bash
bun add -g @better-auth/cli
npx @better-auth/cli secret
```

3. Copy the generated secret to your `.env` file:

```bash
# Better Auth
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-generated-secret-key
```

4. Run database migrations to create the tables:

```bash
bun drizzle-kit push
```

Now you should be able to sign up, sign in, and access protected routes in your application!
