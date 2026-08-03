// =============================================================================
// Next.js Instrumentation
// =============================================================================
// Runs once when the server process starts. We use it to fix a common Windows
// + Node.js issue where fetch() to external APIs (like the World Bank) hangs
// with UND_ERR_HEADERS_TIMEOUT.
//
// Root cause: undici (Node's fetch engine) tries IPv6 first. If the local
// network / ISP has flaky IPv6, the connection stalls. autoSelectFamily makes
// it race IPv4 and IPv6 and use whichever connects first.
//
// This file is automatically loaded by Next.js — no import needed anywhere.
// Requires Next.js 15 (instrumentation is stable there).
// =============================================================================

export async function register() {
  // Only run in the Node.js server runtime (not edge/browser)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { setGlobalDispatcher, Agent } = await import("undici");

    setGlobalDispatcher(
      new Agent({
        // Race IPv4/IPv6 — fixes the Windows IPv6 stall
        connect: {
          timeout: 15_000, // 15s connection timeout
        },
        // Allow more time for slow upstreams like the World Bank API
        headersTimeout: 30_000, // 30s to receive headers
        bodyTimeout: 30_000, // 30s to receive body
        // Enable the happy-eyeballs family autoselection
        autoSelectFamily: true,
      })
    );

    console.log(
      "[instrumentation] undici dispatcher configured (autoSelectFamily, 30s timeouts)"
    );
  }
}