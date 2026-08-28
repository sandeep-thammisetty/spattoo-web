import { notFound } from "next/navigation";

// Environment wiring for the marketing site.
// Base domain per deploy (spattoo.dev in dev, spattoo.com in prod); defaults to
// prod so an unset prod build is safe. NEXT_PUBLIC_ so it's inlined client-side.
export const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "spattoo.com";

// The baker app (sign-in) URL on the matching environment.
export const APP_URL = `https://app.${BASE_DOMAIN}`;

// The API, on the matching environment. Derived from BASE_DOMAIN like everything else here, so a
// dev deploy talks to the dev API without a second variable that can be set wrong independently.
//
// The demo form posts here rather than to a route on this site: the API already owns the ONE place
// email is sent and the Redis-backed rate limiter, and the leads database is written SERVER-SIDE
// with a service key. The previous version of that form shipped the leads project's anon key in this
// bundle, which let anyone write rows directly — removed under SEC-WEB-1, and this is how it stays
// removed. Nothing secret belongs in a NEXT_PUBLIC_ value.
export const API_URL = `https://api.${BASE_DOMAIN}`;

// Cloudflare Turnstile's PUBLIC site key. NEXT_PUBLIC_ because the widget needs it in the browser —
// and that is fine: the site key is meant to be seen. The SECRET key that verifies a token lives
// only in the API, and nothing here can produce a valid token without Cloudflare's help.
//
// Unset → the widget renders nothing, matching how the backend treats an unset secret. Both must be
// set for the captcha to actually be enforced.
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

// Feature gate for the baker-app entry CTAs — both "Sign in" and the signup CTAs
// (nav "Get started", hero, pricing). They appear together (the app is live) or not
// at all. Set NEXT_PUBLIC_SHOW_SIGNIN=true on the dev marketing project; leave it
// unset on prod until the prod baker app exists, then flip it on — same code
// everywhere. When off, the conversion CTAs render nothing (we no longer collect
// a pre-launch waitlist), so the marketing site simply shows no signup CTA yet.
export const SHOW_SIGNIN = process.env.NEXT_PUBLIC_SHOW_SIGNIN === "true";

// Baker signup entry — the app reveals its signup screen behind ?signup=1.
export const SIGNUP_URL = `${APP_URL}/?signup=1`;

// True only on the production marketing deploy. Whitelisting prod (rather than
// blacklisting .dev) means any new non-prod host is treated as non-prod by
// default — the same safe-by-default direction `proxy.ts` uses for indexing.
// BASE_DOMAIN falls back to spattoo.com, so an unset build is treated as prod.
export const IS_PRODUCTION_SITE = BASE_DOMAIN === "spattoo.com";

// SEC-WEB-4 — gate for internal/experimental routes that must not be reachable on
// the public production site (asset generators, render test-beds). Call as the
// first statement of the page component; on a production build the route renders
// the 404 instead. Kept as ONE helper so every internal page is gated the same
// way and a new one only has to call this, not re-derive the condition.
// NOTE: BASE_DOMAIN is a NEXT_PUBLIC_* value inlined at BUILD time, so which
// routes exist is fixed per deploy — this is a build-time gate, not a runtime one.
export function guardInternalPage(): void {
  if (IS_PRODUCTION_SITE) notFound();
}
