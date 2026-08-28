#!/usr/bin/env node
// ── the CSP must know every host the page actually calls ─────────────────────
// A Content-Security-Policy that is missing an origin does not fail loudly. It is report-only here,
// so today the request goes through and a violation is logged where nobody is looking; the day
// CSP_ENFORCE is turned on, the feature simply stops working — and the symptom is a form that does
// nothing, on a page nobody changed.
//
// That already happened: `NEXT_PUBLIC_API_URL` is set on the baker app and NOT on marketing, which
// never called the API until the demo form did. Marketing builds its own API URL from the base
// domain, so connect-src came out as `'self' blob: data: <turnstile>` and every submission logged a
// violation.
//
// Pure — buildCsp reads only the env object it is handed, so this needs no network and no build.
// Run via `npm run check:csp`.
import { buildCsp } from "../shared/securityHeaders.mjs";

let failures = 0;
const ok = (cond, label, extra = "") => {
  if (cond) return;
  failures++;
  console.error(`✗ ${label}${extra ? `  — ${extra}` : ""}`);
};

const csp = (env) => {
  const out = buildCsp({ NODE_ENV: "production", ...env });
  return typeof out === "string" ? out : JSON.stringify(out);
};

// ── marketing: no NEXT_PUBLIC_API_URL, only a base domain ────────────────────
// This is the deploy that broke. The demo form posts to `https://api.${BASE_DOMAIN}`, derived in
// apps/marketing/lib/domain.ts exactly as APP_URL is, so the CSP has to reach the same answer from
// the same input or the two drift apart again the moment either is edited.
{
  const dev = csp({ NEXT_PUBLIC_BASE_DOMAIN: "spattoo.dev" });
  ok(dev.includes("api.spattoo.dev"), "a base-domain-only deploy admits its own API", dev.slice(0, 160));

  const prod = csp({ NEXT_PUBLIC_BASE_DOMAIN: "spattoo.com" });
  ok(prod.includes("api.spattoo.com"), "and does so per environment, not hardcoded to one");
  ok(!prod.includes("api.spattoo.dev"), "a prod deploy does not admit the dev API");
}

// ── the app: an explicit var still wins ──────────────────────────────────────
// The baker app sets NEXT_PUBLIC_API_URL and must be entirely unaffected by the fallback above.
{
  const app = csp({ NEXT_PUBLIC_API_URL: "https://api.spattoo.com" });
  ok(app.includes("api.spattoo.com"), "an explicit API URL is still honoured");

  // Both set and disagreeing: the explicit one is the deliberate statement, so it wins.
  const both = csp({ NEXT_PUBLIC_API_URL: "https://api.example.test", NEXT_PUBLIC_BASE_DOMAIN: "spattoo.com" });
  ok(both.includes("api.example.test"), "an explicit API URL beats the derived one");
}

// ── neither set ──────────────────────────────────────────────────────────────
// Must not invent an origin, and must not throw. A build with no config should produce a policy
// that is merely tight, not one that admits somebody else's host.
{
  const bare = csp({});
  ok(!/api\.(undefined|null)/.test(bare), "no API origin is invented from an unset base domain", bare.slice(0, 160));
}

// ── the captcha's own hosts ──────────────────────────────────────────────────
// The widget loads a script from Cloudflare and renders in an iframe. Miss either and there is no
// widget, no token, and an API that correctly refuses every submission — which reads as a broken
// form rather than a missing directive.
{
  const c = csp({ NEXT_PUBLIC_BASE_DOMAIN: "spattoo.dev" });
  ok(c.includes("challenges.cloudflare.com"), "Turnstile's host is admitted");
  ok(/frame-src[^;]*challenges\.cloudflare\.com/.test(c), "…including frame-src, which the widget needs");
}

if (failures) {
  console.error(`\n✗ check:csp — ${failures} rule(s) broken.`);
  process.exit(1);
}
console.log("✓ check:csp — every host the page calls is in the policy");
