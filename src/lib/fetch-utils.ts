// =============================================================================
// Fetch with timeout + retry
// =============================================================================
// The World Bank API is occasionally very slow to send response headers,
// which causes Node's undici fetch to hang for minutes (UND_ERR_HEADERS_TIMEOUT).
// This wrapper aborts after a fixed timeout and retries once, so a slow
// upstream fails fast and predictably instead of hanging the whole request.
// =============================================================================

interface FetchWithTimeoutOptions {
  /** Milliseconds before aborting (default 15000) */
  timeoutMs?: number;
  /** Number of retry attempts after the first failure (default 1) */
  retries?: number;
  /** Passed through to fetch (e.g. Next.js revalidate options) */
  init?: RequestInit & { next?: { revalidate?: number } };
}

export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const { timeoutMs = 15000, retries = 1, init = {} } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      // If this was the last attempt, throw below
      if (attempt < retries) {
        // Brief backoff before retrying
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
    }
  }

  throw new Error(
    `Request to ${url} failed after ${retries + 1} attempt(s): ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}