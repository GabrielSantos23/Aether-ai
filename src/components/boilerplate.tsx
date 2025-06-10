import { NavLink, useNavigate } from "react-router";
import { siteConfig } from "@/config/site.config";
import ThemeToggler from "@/components/theme/toggler";
import { Button } from "@/components/ui/button";
import { GithubIcon } from "lucide-react";
import { NavAuth } from "@/components/auth/nav-auth";
import { useEffect } from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <NavLink to="/" className="text-xl font-bold text-primary">
                {siteConfig.name}
              </NavLink>
              <div className="hidden md:flex space-x-6">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `text-sm transition-colors ${
                      isActive
                        ? "text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`
                  }
                >
                  Home
                </NavLink>
                <NavLink
                  to="/docs"
                  className={({ isActive }) =>
                    `text-sm transition-colors ${
                      isActive
                        ? "text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`
                  }
                >
                  Docs
                </NavLink>
                <NavLink
                  to="/examples"
                  className={({ isActive }) =>
                    `text-sm transition-colors ${
                      isActive
                        ? "text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`
                  }
                >
                  Examples
                </NavLink>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NavAuth />
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                asChild
              >
                <a
                  href={siteConfig.socials.github}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GithubIcon className="w-4 h-4" />
                </a>
              </Button>
              <ThemeToggler />
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

export function Home() {
  const navigate = useNavigate();

  return null;
}

export function Docs() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-3">Documentation</h1>
        <p className="text-lg text-muted-foreground">
          React Router inside Next.js with client-side routing
        </p>
      </div>

      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">Setup</h2>
          <div className="bg-muted/50 rounded-lg p-4">
            <pre className="text-sm">
              <code>{`git clone ${siteConfig.socials.github}
cd ${siteConfig.name.toLowerCase()}
bun install
bun dev`}</code>
            </pre>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">How it works</h2>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary mt-0.5">
                1
              </div>
              <div>
                <p className="font-medium">Route redirection</p>
                <p className="text-sm text-muted-foreground">
                  All routes redirect to{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                    /shell
                  </code>{" "}
                  via next.config.ts
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary mt-0.5">
                2
              </div>
              <div>
                <p className="font-medium">Shell loading</p>
                <p className="text-sm text-muted-foreground">
                  Shell page loads React Router app with{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                    ssr: false
                  </code>
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary mt-0.5">
                3
              </div>
              <div>
                <p className="font-medium">Client routing</p>
                <p className="text-sm text-muted-foreground">
                  React Router handles all navigation client-side
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">Key files</h2>
          <div className="grid gap-3">
            <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
              <code className="text-sm font-mono bg-primary/10 px-2 py-1 rounded">
                next.config.ts
              </code>
              <span className="text-sm text-muted-foreground">
                Route redirection config
              </span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
              <code className="text-sm font-mono bg-primary/10 px-2 py-1 rounded">
                src/app/shell/page.tsx
              </code>
              <span className="text-sm text-muted-foreground">
                Loads React Router app
              </span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
              <code className="text-sm font-mono bg-primary/10 px-2 py-1 rounded">
                src/frontend/app.tsx
              </code>
              <span className="text-sm text-muted-foreground">
                Main React Router app
              </span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
              <code className="text-sm font-mono bg-primary/10 px-2 py-1 rounded">
                src/config/site.config.ts
              </code>
              <span className="text-sm text-muted-foreground">
                Site configuration
              </span>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">
            Adding routes
          </h2>
          <div className="bg-muted/50 rounded-lg p-4">
            <pre className="text-sm">
              <code>{`<Route path="/new-page" element={<NewPage />} />`}</code>
            </pre>
          </div>
          <p className="text-sm text-muted-foreground">
            Add new Route components in the Routes section of app.tsx
          </p>
        </section>
      </div>
    </div>
  );
}

export function Examples() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-3">Technical Examples</h1>
        <p className="text-lg text-muted-foreground">
          Real implementations you can build
        </p>
      </div>

      <div className="space-y-6">
        <div className="border rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-3">
            Multi-page app with nested routes
          </h3>
          <div className="space-y-3">
            <div className="bg-muted/50 rounded p-3">
              <code className="text-sm">/products → ProductList</code>
              <br />
              <code className="text-sm">/products/:id → ProductDetail</code>
              <br />
              <code className="text-sm">/cart → ShoppingCart</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Supports URL params, nested layouts, protected routes
            </p>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-3">
            Admin dashboard with auth
          </h3>
          <div className="space-y-3">
            <div className="bg-muted/50 rounded p-3">
              <code className="text-sm">/login → AuthForm</code>
              <br />
              <code className="text-sm">/dashboard → ProtectedDashboard</code>
              <br />
              <code className="text-sm">/dashboard/users → UserManagement</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Route guards, auth context, role-based access
            </p>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-3">
            API integration patterns
          </h3>
          <div className="space-y-3">
            <div className="bg-muted/50 rounded p-3">
              <code className="text-sm">React Query + tRPC</code>
              <br />
              <code className="text-sm">SWR + REST APIs</code>
              <br />
              <code className="text-sm">Zustand state management</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Client-side data fetching, caching, optimistic updates
            </p>
          </div>
        </div>

        <div className="bg-muted/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Quick start</h3>
          <div className="bg-background rounded p-4">
            <pre className="text-sm">
              <code>{`git clone ${siteConfig.socials.github}
cd ${siteConfig.name.toLowerCase()}
bun install
bun dev`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
