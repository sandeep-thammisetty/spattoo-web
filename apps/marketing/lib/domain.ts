import { notFound } from "next/navigation";

// Environment wiring for the marketing site.
// Base domain per deploy (spattoo.dev in dev, spattoo.com in prod); defaults to
// prod so an unset prod build is safe. NEXT_PUBLIC_ so it's inlined client-side.
export const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "spattoo.com";

// The baker app (sign-in) URL on the matching environment.
export const APP_URL = `https://app.${BASE_DOMAIN}`;

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
