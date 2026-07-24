import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";

// SEC-WEB-7 — the UI font is loaded HERE, by the host app, not by @spattoo/designer.
// The library used to `@import` it from fonts.googleapis.com in 17 places, which put
// two third-party origins (googleapis + gstatic) in the CSP and disclosed every
// visitor's IP to Google on every storefront visit.
//
// `next/font/google` downloads the font AT BUILD TIME and serves it from this app's
// own origin, so it needs no CSP entry at all — `default-src 'self'` covers it — and
// no third party ever sees the request. It also emits `size-adjust` fallback metrics,
// so the swap from the fallback font doesn't shift layout.
//
// Quicksand is a VARIABLE font: Google serves the same file for every requested
// weight, so declaring 400–700 costs no more than one weight. The codebase leans on
// 500/600/700 and uses `fontWeight: 800` in ~138 places — 800 is past Quicksand's
// axis (which stops at 700) and already rendered as 700 before this change, so
// nothing shifts. `latin-ext` is included because baker and customer names carry
// accented characters; omitting it would silently drop those glyphs to a fallback.
const quicksand = Quicksand({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-ui",
});

export const metadata: Metadata = {
  title: "Spattoo",
  description: "Design your cake, request a quote.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={quicksand.variable}>
      <body className={quicksand.className}>{children}</body>
    </html>
  );
}
