import Script from "next/script";
import { GA_ID } from "@/lib/domain";

// Google Analytics 4, on the marketing site.
//
// Renders NOTHING when NEXT_PUBLIC_GA_ID is unset, which is the state locally and on
// any deploy that has not opted in. The CSP gates on the same variable, so an
// unmeasured build carries no Google origin either — the two cannot disagree.
//
// ── Why the plain gtag snippet, and no dependency ────────────────────────────────
// The usual reason to reach for `@next/third-parties` is that App Router client-side
// navigation does not reload the page, so a single `config` call would report one
// pageview for a whole session. That problem does not exist here: this site uses NO
// `next/link` anywhere — every route is reached by a plain `<a href>`, so each
// navigation is a real document load and fires its own `page_view`. Checked, not
// assumed; if a `next/link` is ever introduced, this comment stops being true and
// route-change pageviews have to be handled deliberately.
//
// ⚠️ Do NOT also send a manual `page_view` on route change. GA4's Enhanced
// measurement already reports history-based page changes by default, so a manual one
// on top DOUBLE-COUNTS — and a doubled number is worse than a missing one, because
// nothing about it looks wrong.
//
// `afterInteractive` deliberately, not `beforeInteractive`: analytics must never sit
// in front of the page a visitor came to read. `beforeInteractive` also forces the
// script into the document head before hydration, which would make Google a hard
// dependency of the first paint.
export default function Analytics() {
  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      {/* `id` is required — Next uses it to guarantee the inline script runs once. */}
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
