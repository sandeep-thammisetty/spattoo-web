import { NextRequest, NextResponse } from "next/server";
import { BASE_DOMAIN } from "./lib/domain";

// Host-based routing for the app surface (base domain is env-driven — spattoo.com
// in prod, spattoo.dev in dev — so this same code serves every environment):
//   {slug}.<base>/*  → /[slug]/*   (the baker's customer storefront)
//   app.<base>/*     → /*          (the baker app; 'app' is reserved)
//   {slug}.localhost → /[slug]/*   (local dev; always supported)
//
// Rewriting (not redirecting) keeps the customer on ONE origin through the whole
// journey, so the Supabase session set during login persists. Subdomains other
// than the reserved ones are treated as a baker slug.
const RESERVED = new Set(["www", "app", "api", "admin", "assets"]);

// SEC-WEB-5 — the slug is taken from the attacker-supplied `Host` header and then
// written into `url.pathname` for the rewrite, so constrain it to the charset a
// real baker slug can actually use before it reaches the routed path. Vercel only
// forwards hosts matching a configured (wildcard) domain and the single-label rule
// below already excludes dots, so this is defence in depth rather than a known
// hole — but a host-derived value flowing into a path deserves an explicit
// allowlist, not an inferred one.
const SLUG_RE = /^[a-z0-9-]+$/;

// Only the production base domain (spattoo.com) is allowed into search indexes.
// Every other host — the spattoo.dev dev environment, Vercel preview URLs,
// localhost — gets X-Robots-Tag: noindex so it stays publicly reachable but
// never ranks and never competes with spattoo.com. Whitelisting prod (instead
// of blacklisting .dev) means any new non-prod host is safe-by-default.
function applyRobots(res: NextResponse, hostname: string): NextResponse {
  const indexable = hostname === "spattoo.com" || hostname.endsWith(".spattoo.com");
  if (!indexable) res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

function bakerSubdomain(hostname: string): string | null {
  // Try the configured base domain first, then localhost (always on for dev).
  for (const base of [BASE_DOMAIN, "localhost"]) {
    const suffix = `.${base}`;
    if (!hostname.endsWith(suffix)) continue;
    const head = hostname.slice(0, -suffix.length);
    // Require exactly ONE label (no nested dots) so a.b.<base> never silently
    // resolves to "a"; reserved labels (app/www/…) are not bakers.
    if (!head || head.includes(".") || RESERVED.has(head)) return null;
    if (!SLUG_RE.test(head)) return null;
    return head;
  }
  return null;
}

export function proxy(req: NextRequest) {
  // Lower-case first: DNS host names are case-insensitive, so `Foo.spattoo.com`
  // and `foo.spattoo.com` are the same tenant. Browsers already send lower-case,
  // but a raw client need not — normalising here means the SEC-WEB-5 charset
  // guard rejects genuinely invalid slugs without also rejecting a valid tenant
  // that merely arrived oddly cased.
  const hostname = (req.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const slug = bakerSubdomain(hostname);
  if (!slug) return applyRobots(NextResponse.next(), hostname);

  const url = req.nextUrl.clone();
  if (url.pathname === `/${slug}` || url.pathname.startsWith(`/${slug}/`)) {
    return applyRobots(NextResponse.next(), hostname);
  }
  url.pathname = `/${slug}${url.pathname === "/" ? "" : url.pathname}`;
  return applyRobots(NextResponse.rewrite(url), hostname);
}

export const config = {
  // Skip Next internals, API routes, and files with extensions.
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
