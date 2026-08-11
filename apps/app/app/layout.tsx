import type { Metadata } from "next";
import { Quicksand, Montserrat, Pacifico, Cormorant_Garamond, Parisienne, Lora } from "next/font/google";
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

// SEC-WEB-7 follow-up — the storefront FONT_THEMES fonts. The designer's storefront
// (and the baker-app theme preview, which renders the same component) picks its
// typography at RUNTIME from the baker's saved `font_key`, choosing among these
// families by their LITERAL names in inline styles (storefrontKit.js FONT_THEMES /
// templates.js). next/font registers each `@font-face` under its real family name
// (verified: it emits `font-family: Quicksand`, not a hashed alias), so those literal
// names resolve. The bug this fixes: these were NEVER loaded — the comment in
// FONT_THEMES claimed the host apps did, none did, so even the DEFAULT theme
// (`montserrat`, needing Montserrat + Pacifico) rendered in a system fallback.
//
// `preload: false` on all three: which theme a given storefront uses isn't known at
// build time, and on the baker app they're only touched when the Settings theme
// preview opens — so preloading would download fonts most page views never show.
// With `display: swap` they load on first use behind a fallback, which is correct for
// theme-conditional typography. Quicksand (the always-on chrome) stays preloaded above.
//
// Weights match what the storefront styles actually request:
//   Montserrat — body + most headings, at 400/600/700/800 (variable, one file).
//   Pacifico   — the bakery wordmark only, single weight 400 (script, not variable).
//   Cormorant Garamond — the "Classic serif" theme's headings, at 600/700.
//   Lora — the Patisserie theme's BODY face, at 400/600. Montserrat is a geometric sans
//     with even stroke weight; next to ink linework and a copperplate wordmark it was the
//     one element still reading as a web app. Lora has brush-drawn roots and real
//     thick/thin, so the page matches the drawing.
//   Parisienne — the Patisserie theme's wordmark only, single weight 400. A fine
//     copperplate script: that theme is hand-drawn ink-and-watercolour, and Pacifico
//     (thick, rounded, single-stroke) fights it — the wordmark is the one place the
//     theme's whole premise is either believed or not.
const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: false,
  variable: "--font-storefront-sans",
});
const pacifico = Pacifico({
  subsets: ["latin", "latin-ext"],
  weight: ["400"],
  display: "swap",
  preload: false,
  variable: "--font-storefront-brand",
});
const lora = Lora({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600"],
  display: "swap",
  preload: false,
  variable: "--font-storefront-body",
});
const parisienne = Parisienne({
  subsets: ["latin", "latin-ext"],
  weight: ["400"],
  display: "swap",
  preload: false,
  variable: "--font-storefront-script",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700"],
  display: "swap",
  preload: false,
  variable: "--font-storefront-serif",
});

const fontVariables = [
  quicksand.variable,
  montserrat.variable,
  pacifico.variable,
  cormorant.variable,
  parisienne.variable,
  lora.variable,
].join(" ");

export const metadata: Metadata = {
  title: "Spattoo",
  description: "Design your cake, request a quote.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables}>
      <body className={quicksand.className}>{children}</body>
    </html>
  );
}
