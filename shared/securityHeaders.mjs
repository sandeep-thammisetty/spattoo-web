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
// NOTHING. Set `CSP_ENFORCE=true` to switch to the enforcing header once the
// violation list is clean. Flipping enforcement is therefore a config change,
// not a code change.
//
// ⚠️ `CSP_ENFORCE` is read at BUILD time, not request time — Next evaluates
// `headers()` during `next build` and bakes the result into the routes
// manifest. Setting it only as a runtime env var on Vercel does NOTHING; it
// must be present for the build, and changing it requires a REDEPLOY, not just
// a restart. (Verified the hard way: a server started without the var kept
// serving the enforcing header from the previous build.)
//
// ⚠️ Violations raised inside a Web Worker never reach a document-level
// `securitypolicyviolation` listener. A page can therefore look perfectly clean
// while a worker is being blocked. When changing this policy, diff the NETWORK
// LOG and check that the designer actually finishes rendering — do not trust an
// empty console. Both third-party-CDN findings here were invisible that way.

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

  // ⚠️ ASSET ORIGINS ARE NOT FULLY KNOWABLE FROM THIS APP'S ENV. The API builds
  // asset URLs as ABSOLUTE strings from ITS OWN `R2_PUBLIC_URL` (spattoo-api:
  // routes/elements.js, templates.js, storefront.js, bakers.js, tags.js) and the
  // designer uses an absolute URL verbatim — `NEXT_PUBLIC_ASSETS_BASE` is only
  // the prefix for BARE KEYS (see CakeDesigner.jsx `new URL(key)` fallback). So:
  //   1. `NEXT_PUBLIC_ASSETS_BASE` here MUST match the API's `R2_PUBLIC_URL`, and
  //   2. rows written under an EARLIER `R2_PUBLIC_URL` still hold that OLD host
  //      forever, because the absolute URL is persisted in the database.
  // Either mismatch blocks every element thumbnail, GLB, template image and baker
  // logo once CSP is enforced. `CSP_EXTRA_ORIGINS` is the escape hatch: a
  // comma/space-separated list of additional origins added to img-src, connect-src
  // and media-src, so an origin can be admitted from deploy config without a code
  // change. Use it for legacy/second asset hosts (e.g. the raw `*.r2.dev` bucket
  // URL alongside the CDN domain).
  const extra = String(env.CSP_EXTRA_ORIGINS || "")
    .split(/[\s,]+/)
    .map((s) => originOf(s.trim()))
    .filter(Boolean);

  // Supabase realtime (live co-design, auth refresh) upgrades to a WebSocket on
  // the same host — wss: is a distinct scheme and is NOT covered by the https:
  // entry, so it must be listed explicitly.
  const supabaseWs = supabase ? supabase.replace(/^https:/, "wss:") : null;

  // Cloudflare Turnstile: serves its widget script and runs the challenge in an
  // iframe, so it needs script-src AND frame-src.
  const TURNSTILE = "https://challenges.cloudflare.com";

  // ── Third-party asset origins (allowlisted; self-hosting is the end state) ──
  // Measured with a report-only pass on 2026-07-24 (see the security action
  // plan, SEC-WEB-3). These are ALLOWLISTED for now so the policy can be
  // enforced; SEC-WEB-7 tracks self-hosting them, after which they come out.
  //
  // Google Fonts — @spattoo/designer pulls Quicksand via an @import in a <style>
  // block. googleapis serves the stylesheet, gstatic serves the .woff2 files.
  const GFONTS_CSS = "https://fonts.googleapis.com";
  const GFONTS_FILES = "https://fonts.gstatic.com";
  // NOTE: cdn.jsdelivr.net USED to be required here — troika-three-text (drei's
  // <Text>) fetched unicode-font-resolver data at runtime. It was removed once
  // @spattoo/designer 0.1.147 bundled the font and passed it explicitly, so the
  // fetch no longer happens. A `check:fonts` gate in spattoo-core fails the build
  // if a <Text> is added without an explicit font, which is what would bring the
  // CDN back. If it ever needs re-adding, remember troika fetches from inside a
  // blob: Web Worker, so the breakage raises NO violation event — diff the
  // NETWORK LOG, not the console.

  const directives = {
    "default-src": ["'self'"],

    // No <base> injection, no plugins, no framing of this app by anyone, and
    // forms may only post back to our own origin.
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
    "frame-ancestors": ["'none'"],
    "form-action": ["'self'"],

    // 'unsafe-inline' — Next.js injects inline hydration/bootstrap scripts (52
    // of them across the surface, measured 2026-07-24). A nonce would be the
    // stronger policy but has to be minted per request in proxy.ts, which
    // forces dynamic rendering and gives up the static prerender the marketing
    // site gets on all its routes. Deliberate trade: the directive that
    // actually blocks token exfiltration is connect-src, and that stays tight.
    // 'wasm-unsafe-eval' — three.js Draco / meshopt / KTX2 decoders instantiate
    // WebAssembly. Without it, compressed 3D assets fail to decode. It permits
    // wasm compilation ONLY, not eval() of JS.
    // 'unsafe-eval' is dev-only: the HMR runtime needs it, prod builds do not.
    // blob: — REQUIRED, and the reason is non-obvious. troika-three-text (drei's
    // <Text>, used by the designer) builds its Web Worker from a blob: URL and
    // then calls importScripts(blob:…) INSIDE that worker. Creating the worker
    // is governed by worker-src, but the importScripts call is governed by
    // script-src, and a worker inherits the document's policy. Without blob:
    // here the worker dies with "failed to rehydrate" and the cake never
    // finishes loading — while raising NO violation event, because violations
    // inside a worker never reach a document-level listener. Verified by
    // driving the real designer under the enforcing policy (2026-07-24).
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      "'wasm-unsafe-eval'",
      "blob:",
      TURNSTILE,
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],

    // Inline styles are unavoidable and low-risk here: per-baker brand colours
    // are computed per render and applied as style attributes by design (see
    // the reuse/config-driven rule in CLAUDE.md), and Tailwind v4 + Next inject
    // inline <style>. 'unsafe-inline' for STYLES does not enable script exec.
    "style-src": ["'self'", "'unsafe-inline'", GFONTS_CSS],

    // data: — canvas-generated thumbnails and inlined SVG/icon data URIs.
    // blob:  — designer share cards + client-side canvas snapshots.
    "img-src": ["'self'", "data:", "blob:", assets, ...extra],

    "font-src": ["'self'", "data:", GFONTS_FILES],

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
      ...extra,
    ],

    // three.js decoders (KTX2 / Draco) instantiate their workers from blob:
    // URLs — without this the compressed-asset path fails at runtime.
    "worker-src": ["'self'", "blob:"],

    "media-src": ["'self'", "blob:", "data:", assets, ...extra],
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
