import * as Sentry from "@sentry/nextjs";
import { scrubEvent } from "./lib/scrubPii";

// Client-side Sentry init (runs once at app startup, before app code). No-ops when
// NEXT_PUBLIC_SENTRY_DSN is unset, so dev/local works with zero config. Errors only
// for now — no performance tracing.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0,
    environment: process.env.NEXT_PUBLIC_ENV ?? "development",
    // SEC-WEB-6 — last gate before anything leaves the browser. sendDefaultPii is
    // off and this is errors-only, so nothing is sent deliberately; this catches
    // PII/credentials that ride along INCIDENTALLY in a message, stack or URL.
    beforeSend: scrubEvent,
  });
}

// Lets Sentry tie errors to client-side navigations (App Router).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
