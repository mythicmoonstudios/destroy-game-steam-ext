import { ALLOWED_LINK_HOSTS } from "./consts";

export function debounce(fn: () => void, ms: number): () => void {
  let timer: number | undefined;
  return () => {
    if (timer !== undefined) {
      window.clearTimeout(timer);
    }
    timer = window.setTimeout(fn, ms);
  };
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatUpdated(iso: string): string {
  const diffMins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMins < 1) {
    return "Updated just now";
  }
  if (diffMins < 60) {
    return `Updated ${diffMins}m ago`;
  }
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `Updated ${diffHours}h ago`;
  }
  return `Updated ${new Date(iso).toLocaleDateString()}`;
}

export async function sendMessage<T>(message: unknown): Promise<T | null> {
  try {
    return await chrome.runtime.sendMessage<unknown, T>(message);
  } catch (error) {
    console.error("Destroy Game: sendMessage failed:", error);
    return null;
  }
}

// Returns the URL (with utmSource applied) only if its host is allowlisted, else null.
export function toSafeUrl(rawUrl: string, utmSource?: string): string | null {
  try {
    const url = new URL(rawUrl);
    if (!ALLOWED_LINK_HOSTS.has(url.hostname)) return null;
    if (utmSource) {
      url.searchParams.set("utm_source", utmSource);
    }
    return url.toString();
  } catch {
    return null;
  }
}
