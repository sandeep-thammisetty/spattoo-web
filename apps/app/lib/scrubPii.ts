// SEC-WEB-6 — strip credential- and PII-shaped substrings before anything leaves
// the browser for Sentry.
//
// Sentry is errors-only here (`tracesSampleRate: 0`) and `sendDefaultPii` is off,
// so nothing deliberately sends user data. The risk is INCIDENTAL: an error
// message, a stack frame or a URL that happens to embed an email, a phone number
// or an access token — e.g. a failed request whose URL carried a token, or a
// thrown string built from a customer record. Once that reaches Sentry it is
// third-party-hosted personal data we did not intend to export (and, for a token,
// a live credential sitting in an issue tracker).
//
// ⚠️ MIRROR — the same rule exists in `spattoo-core` (`src/telemetry/scrub.js`,
// SEC-CORE-5) because the two runtimes initialise their own SDKs and cannot share
// a module. Keep them in sync. This mirrors the convention already used for
// `safeHref` (spattoo-core `storefrontKit.js` ↔ spattoo-api `src/lib/safeUrl.js`).

const RULES: Array<[RegExp, string]> = [
  // JSON Web Tokens — Supabase access/refresh tokens are JWTs. Matched first and
  // by shape, so it catches a bare token that carries no giveaway label.
  [/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+/g, "[redacted-jwt]"],
  // Credential-ish query/body params: token=…, access_token=…, apikey=…, password=…
  [/\b(access_token|refresh_token|id_token|token|apikey|api_key|key|secret|password|pwd)=[^&\s"']+/gi, "$1=[redacted]"],
  // Authorization: Bearer <value>
  [/\b(bearer)\s+[A-Za-z0-9._~+/-]+=*/gi, "$1 [redacted]"],
  // Email addresses.
  [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[redacted-email]"],
  // Phone numbers — optional +, 8-15 digits with spaces/dashes/parens. Deliberately
  // after the others so it can't eat part of a token.
  [/(?<![\w.])\+?\d[\d\s().-]{7,17}\d(?![\w.])/g, "[redacted-phone]"],
];

/** Redact credential/PII-shaped substrings from a single string. */
export function scrubString(value: string): string {
  let out = value;
  for (const [re, replacement] of RULES) out = out.replace(re, replacement);
  return out;
}

/**
 * Deep-scrub any value. Walks plain objects/arrays and rewrites strings; leaves
 * other primitives alone. `depth` bounds the walk so a cyclic or pathological
 * payload can never hang the error path — telemetry must never break the app.
 */
export function scrubValue<T>(value: T, depth = 6): T {
  if (typeof value === "string") return scrubString(value) as unknown as T;
  if (depth <= 0 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => scrubValue(v, depth - 1)) as unknown as T;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = scrubValue(v, depth - 1);
  }
  return out as unknown as T;
}

/**
 * Sentry `beforeSend` hook. Scrubs the places free text realistically reaches:
 * the message, exception values, the request URL, and breadcrumb text.
 * Never throws — on any failure the event is dropped rather than sent unscrubbed,
 * because a lost error report is strictly cheaper than a leaked credential.
 */
export function scrubEvent<E>(event: E): E | null {
  try {
    return scrubValue(event);
  } catch {
    return null;
  }
}
