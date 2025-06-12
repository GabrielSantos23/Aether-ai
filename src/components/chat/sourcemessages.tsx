import { getSourceDisplayInfo } from "../getFaviconUrl";
import { useState, useEffect } from "react";
import { SidebarTrigger } from "../ui/sidebar";

export interface Source {
  id: string;
  sourceType: string;
  title?: string;
  url?: string;
}

interface SourceInfo {
  id: string;
  sourceType: string;
  title?: string;
  url?: string;
  faviconUrl?: string | null;
  displayTitle?: string;
  domain?: string;
}

interface SourceMessagesProps {
  sources: Source[];
}

export default function SourceMessages({ sources }: SourceMessagesProps) {
  const [processedSources, setProcessedSources] = useState<SourceInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function processSources() {
      if (!sources || sources.length === 0) {
        setProcessedSources([]);
        setLoading(false);
        return;
      }

      const urlSources = sources.filter(
        (source) => source.sourceType === "url"
      );
      const processed = await Promise.all(
        urlSources.map(async (source) => {
          try {
            const info = await getSourceDisplayInfo(source);
            return {
              ...source,
              ...info,
            };
          } catch (error) {
            console.error("Error processing source:", error);
            return {
              ...source,
              faviconUrl: null,
              displayTitle: source.title || "Unknown Source",
              domain: source.url
                ? new URL(source.url).hostname
                : "Unknown Domain",
            };
          }
        })
      );

      setProcessedSources(processed);
      setLoading(false);
    }

    setLoading(true);
    processSources();
  }, [sources]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading sources...</p>
      </div>
    );
  }

  if (!sources || sources.length === 0 || processedSources.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No sources available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pb-2 border-b flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Sources Referenced</h3>
          <p className="text-sm text-muted-foreground">
            {processedSources.length} source
            {processedSources.length !== 1 ? "s" : ""} used
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="divide-y">
          {processedSources.map((source, index) => (
            <div
              key={`${source.id}-${index}`}
              className="group transition-all duration-200"
            >
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-4 space-x-4 w-full hover:bg-muted/50"
              >
                <div className="flex-shrink-0">
                  <div className="relative">
                    {source.faviconUrl ? (
                      <img
                        src={source.faviconUrl}
                        alt={`${source.domain} favicon`}
                        className="w-8 h-8 rounded-lg shadow-sm"
                        onError={(e) => {
                          // Fallback to generic icon if favicon fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          target.nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-8 h-8 ${
                        source.faviconUrl ? "hidden" : ""
                      } bg-primary/10 rounded-lg flex items-center justify-center shadow-sm`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium truncate">
                        {source.displayTitle}
                      </h5>
                      <div className="flex items-center mt-1 space-x-2">
                        <span className="text-xs text-muted-foreground truncate">
                          {source.domain}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            navigator.clipboard.writeText(source.url || "");
                          }}
                          className="p-1.5 rounded-md hover:bg-muted"
                          title="Copy URL"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                      </div>

                      <svg
                        className="w-4 h-4 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
