import { Source } from "./chat/MessageList";

export const getFaviconUrl = async (
  url: string,
  title?: string
): Promise<string | null> => {
  try {
    if (
      url.includes("vertexaisearch.cloud.google.com/grounding-api-redirect/")
    ) {
      const actualUrl = await resolveRedirectUrl(url);
      if (actualUrl) {
        const domain = new URL(actualUrl).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=512`;
      }
      // If can't resolve, try title as domain
      if (title && isLikelyDomain(title)) {
        return `https://www.google.com/s2/favicons?domain=${title}&sz=512`;
      }
      // Fallback
      return "https://www.google.com/s2/favicons?domain=google.com&sz=512";
    }
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=512`;
  } catch {
    // Try title as domain
    if (title && isLikelyDomain(title)) {
      return `https://www.google.com/s2/favicons?domain=${title}&sz=512`;
    }
    return "https://www.google.com/s2/favicons?domain=google.com&sz=512";
  }
};

// Function to resolve redirect URLsS
const resolveRedirectUrl = async (
  redirectUrl: string
): Promise<string | null> => {
  try {
    // Method 1: Try to follow the redirect with a HEAD request
    const response = await fetch(redirectUrl, {
      method: "HEAD",
      redirect: "follow",
    });

    // Return the final URL after redirects
    return response.url;
  } catch (error) {
    console.warn("Could not resolve redirect URL:", error);
    return null;
  }
};

// Alternative synchronous version that falls back to a generic icon
export const getFaviconUrlSync = (url: string): string => {
  try {
    // Check if it's a Google redirect URL
    if (
      url.includes("vertexaisearch.cloud.google.com/grounding-api-redirect/")
    ) {
      // Fall back to a generic search/AI icon or Google's favicon
      return "https://www.google.com/s2/favicons?domain=google.com&sz=512";
    }

    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=512`;
  } catch {
    // Return a generic icon for invalid URLs
    return "https://www.google.com/s2/favicons?domain=google.com&sz=512";
  }
};

// Enhanced version that tries multiple fallback strategies
export const getFaviconUrlWithFallbacks = (url: string): string => {
  try {
    // Check if it's a Google redirect URL
    if (
      url.includes("vertexaisearch.cloud.google.com/grounding-api-redirect/")
    ) {
      // Try to extract domain from the redirect parameter if possible
      // This is a heuristic approach since the URL is encoded

      // Option 1: Use a generic AI/search icon
      return "https://www.google.com/s2/favicons?domain=google.com&sz=512";

      // Option 2: You could also use a custom icon for AI-generated content
      // return '/icons/ai-generated-content.svg';
    }

    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=512`;
  } catch {
    return "https://www.google.com/s2/favicons?domain=google.com&sz=512";
  }
};

function isLikelyDomain(str: string): boolean {
  // Simple check: contains a dot and no spaces
  return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(str.trim());
}

export const getSourceDisplayInfo = async (source: Source) => {
  const faviconUrl = await getFaviconUrl(source.url || "", source.title);
  let displayTitle = source.title || source.url || "Unknown Source";

  // Truncate long titles
  if (displayTitle.length > 60) {
    displayTitle = displayTitle.substring(0, 57) + "...";
  }

  let domain = "";
  try {
    if (
      source.url?.includes(
        "vertexaisearch.cloud.google.com/grounding-api-redirect/"
      )
    ) {
      domain = "AI-generated content";
    } else {
      domain =
        source.title ||
        (source.url
          ? new URL(source.url).hostname.replace("www.", "")
          : "Unknown domain");
    }
  } catch {
    domain = source.title || "Unknown domain";
  }

  return { faviconUrl, displayTitle, domain };
};

// Synchronous version for immediate use
export const getSourceDisplayInfoSync = (source: Source) => {
  const faviconUrl = getFaviconUrlSync(source.url || "");
  let displayTitle = source.title || source.url || "Unknown Source";

  // Truncate long titles
  if (displayTitle.length > 60) {
    displayTitle = displayTitle.substring(0, 57) + "...";
  }

  // Use the title instead of the domain for display
  let domain = "";
  try {
    if (
      source.url?.includes(
        "vertexaisearch.cloud.google.com/grounding-api-redirect/"
      )
    ) {
      domain = "AI-generated content";
    } else {
      domain =
        source.title ||
        (source.url
          ? new URL(source.url).hostname.replace("www.", "")
          : "Unknown domain");
    }
  } catch {
    domain = source.title || "Unknown domain";
  }

  return { faviconUrl, displayTitle, domain };
};
