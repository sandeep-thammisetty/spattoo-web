// Security response headers — ONE definition shared by both Next apps.
//
// Imported from `apps/app/next.config.ts` and `apps/marketing/next.config.ts`
// (build-time Node code, never bundled into the browser). It lives at the repo
// root rather than inside an app because a copy-pasted policy is a policy that
// drifts: the moment the two apps disagree about which origins are allowed, one
// of them is either broken or unprotected, and nobody notices until a customer
// hits it. `lib/domain.ts` already got copy-pasted into both apps and diverged —
// don't repeat that here.
//
// Every allowed origin is DERIVED FROM ENV, not hardcoded, so the same code
// produces the right policy on dev (spattoo.dev / api.spattoo.dev) and prod
// (spattoo.com / api.spattoo.com) with no edit. See spattoo-docs
// security/spattoo-web-SECURITY_ACTION_PLAN.md → SEC-WEB-3.
//
// ── Rollout ────────────────────────────────────────────────────────────────
// CSP ships as `Content-Security-Policy-Report-Only` by default: the browser
// evaluates the policy and reports violations to the console but BLOCKS
// NOTHING. Set `CSP_ENFORCE=true` in the deploy env to switch to the enforcing
// header once the violation list is clean. Flipping enforcement is therefore a
// config change, not a code change.

/** Origin (scheme://host[:port]) of a URL, or null if unset/unparseable. */
function originOf(url) {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * Build the CSP directives as an ordered map. Exported separately from the
 * header list so tests (and a future report-collector) can assert on it.
 *
 * @param {NodeJS.ProcessEnv} env
 */
export function buildCsp(env = process.env) {
  const isDev = env.NODE_ENV !== "production";

  const api = originOf(env.NEXT_PUBLIC_API_URL);
  const supabase = originOf(env.NEXT_PUBLIC_SUPABASE_URL);
  const assets = originOf(env.NEXT_PUBLIC_ASSETS_BASE);
  const sentry = originOf(env.NEXT_PUBLIC_SENTRY_DSN);

  // Supabase realtime (live co-design, auth refresh) upgrades to a WebSocket on
  // the same host — wss: is a distinct scheme and is NOT covered by the https:
  // entry, so it must be listed explicitly.
  const supabaseWs = supabase ? supabase.replace(/^https:/, "wss:") : null;

  // Cloudflare Turnstile: serves its widget script and runs the challenge in an
  // iframe, so it needs script-src AND frame-src.
  const TURNSTILE = "https://challenges.cloudflare.com";

  const directives = {
    "default-src": ["'self'"],

    // No <base> injection, no plugins, no framing of this app by anyone, and
    // forms may only post back to our own origin.
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
    "frame-ancestors": ["'none'"],
    "form-action": ["'self'"],

    // NOTE: 'unsafe-inline' is deliberately ABSENT here for the report-only
    // pass. Next.js injects inline hydration scripts, so this WILL report
    // violations — that is the point: the report tells us exactly how many
    // inline scripts exist and whether a nonce-based policy is viable before we
    // decide to fall back to 'unsafe-inline'. Do not add it without reading the
    // report first.
    // 'unsafe-eval' is dev-only: the webpack/turbopack HMR runtime needs it,
    // production builds do not.
    "script-src": ["'self'", TURNSTILE, ...(isDev ? ["'unsafe-eval'"] : [])],

    // Inline styles are unavoidable and low-risk here: per-baker brand colours
    // are computed per render and applied as style attributes by design (see
    // the reuse/config-driven rule in CLAUDE.md), and Tailwind v4 + Next inject
    // inline <style>. 'unsafe-inline' for STYLES does not enable script exec.
    "style-src": ["'self'", "'unsafe-inline'"],

    // data: — canvas-generated thumbnails and inlined SVG/icon data URIs.
    // blob:  — designer share cards + client-side canvas snapshots.
    "img-src": ["'self'", "data:", "blob:", assets],

    "font-src": ["'self'", "data:"],

    // The browser talks to: our API, Supabase (REST + auth + realtime), the
    // asset CDN (GLB models / textures fetched by three.js), Sentry ingest,
    // and Turnstile's verification endpoint. blob: covers loaders that fetch
    // an object URL they just created.
    "connect-src": [
      "'self'",
      "blob:",
      "data:",
      api,
      supabase,
      supabaseWs,
      assets,
      sentry,
      TURNSTILE,
    ],

    // three.js decoders (KTX2 / Draco) instantiate their workers from blob:
    // URLs — without this the compressed-asset path fails at runtime.
    "worker-src": ["'self'", "blob:"],

    "media-src": ["'self'", "blob:", "data:"],
    "frame-src": [TURNSTILE],
    "manifest-src": ["'self'"],
  };

  return Object.entries(directives)
    .map(([name, values]) => {
      const allowed = values.filter(Boolean);
      return allowed.length ? `${name} ${[...new Set(allowed)].join(" ")}` : null;
    })
    .filter(Boolean)
    .join("; ");
}

/**
 * The full header list for a Next `headers()` block.
 *
 * Everything except CSP is enforcing from day one — none of these can break a
 * working page. `X-Frame-Options` is deliberately NOT set: `frame-ancestors`
 * in the (currently report-only) CSP covers the same ground, and shipping the
 * legacy header would enforce a framing ban immediately, before we've confirmed
 * no baker is expected to embed their storefront in their own site.
 *
 * @param {NodeJS.ProcessEnv} env
 */
export function securityHeaders(env = process.env) {
  const enforce = env.CSP_ENFORCE === "true";

  return [
    {
      key: enforce ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only",
      value: buildCsp(env),
    },
    // Don't let the browser second-guess a declared Content-Type (a .txt upload
    // sniffed as HTML is a stored-XSS vector).
    { key: "X-Content-Type-Options", value: "nosniff" },
    // Send the full URL only to ourselves; cross-origin gets the origin alone,
    // so a storefront path never leaks to a third party via Referer.
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // Drop access to device APIs this product never uses.
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
    // HTTPS-only for the base domain and every tenant subdomain. No `preload` —
    // that is submitted to a browser-vendor list and is genuinely hard to undo.
    { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  ];
}

/** Ready-made `headers()` entry: apply the above to every route. */
export function securityHeadersConfig(env = process.env) {
  return [{ source: "/:path*", headers: securityHeaders(env) }];
}
