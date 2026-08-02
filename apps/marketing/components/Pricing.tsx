"use client";

import { useState } from "react";
import StartCta from "./StartCta";

// ── Spark is a TRIAL, not a tier ────────────────────────────────────────────────────────────────
// Deliberately NOT in `tiers`, and this is the whole point of the layout (spattoo-core
// docs/SUBSCRIPTION_TIERS.md, "Spark is a TRIAL, not a tier").
//
// As the first of four columns, a reader ran their eye across the rows, saw ✓/✓/✓/✓ on designer,
// storefront, branding and orders, and concluded Flame added nothing. That was not a product
// problem — it was manufactured by the layout. Flame looked like a paywall because it was being
// measured against a free tier that has everything.
//
// So Spark is a strip above the table: visibly a different KIND of thing, an on-ramp rather than a
// competitor, with MESSAGING instead of a feature list. Flame is then measured against what a baker
// actually uses today — a notebook, a phone gallery, Instagram DMs — which it beats comfortably.
//
// The copy only works because the trial equals ONE tier (decided 2026-08-02: Flame for 30 days).
// "Everything in Flame except three things you have not heard of yet" is not a sentence anyone can
// put on a card.
const trial = {
  headline: "Every plan starts free for 30 days",
  body: "Everything in Flame — your storefront, the 3D designer, unlimited orders and quotes — plus a starter allowance of smart-tool credits. No credit card required.",
  foot: "After 30 days, pick a plan. Nothing is charged until you do.",
  accent: "#6b8f7e",
  border: "rgba(107,143,126,0.25)",
  glow: "rgba(107,143,126,0.08)",
  cta: "Start free",
};

// ── The plans ───────────────────────────────────────────────────────────────────────────────────
// Every value here mirrors seed_plan_entitlements.sql, which is what the API actually enforces.
// Where the two disagreed, the SEED won and this file changed: the page must never promise more
// than a baker gets. Corrected 2026-08-02 — Blaze seats 5→4, Forge "Unlimited"→10 (a deliberate
// anti-resale cap, not an oversight), and Spark's fictional "10 total orders" removed with the
// column (no plan has an order cap; a trial is bounded by TIME).
const tiers = [
  {
    name: "Flame",
    tagline: "Less than the price of one cake",
    monthly: 999,
    annual: 9999,
    accent: "#c4852a",
    border: "rgba(196,133,42,0.3)",
    glow: "rgba(196,133,42,0.07)",
    features: [
      { label: "Storefront + 3D designer", value: "✓" },
      { label: "Orders & quotes", value: "Unlimited" },
      { label: "Saved templates", value: "30" },
      { label: "Custom templates", value: "—" },
      { label: "X-Ray reports", value: "From photos" },
      { label: "Background removal", value: "—" },
      { label: "Smart tool credits", value: "300 / mo" },
      { label: "Buy extra credits", value: "—" },
      { label: "Support", value: "Email" },
    ],
    cta: "Start with Flame",
    ctaVariant: "ghost" as const,
  },
  {
    name: "Blaze",
    tagline: "Your brand. Your templates. Your rules.",
    monthly: 2499,
    annual: 24999,
    accent: "#c4512a",
    border: "rgba(196,81,42,0.5)",
    glow: "rgba(196,81,42,0.12)",
    recommended: true,
    features: [
      { label: "Storefront + 3D designer", value: "✓" },
      { label: "Orders & quotes", value: "Unlimited" },
      { label: "Saved templates", value: "Unlimited" },
      { label: "Custom templates", value: "✓" },
      { label: "X-Ray reports", value: "+ your 3D designs" },
      { label: "Background removal", value: "✓" },
      { label: "Smart tool credits", value: "800 / mo" },
      { label: "Buy extra credits", value: "✓" },
      { label: "Support", value: "Priority Chat" },
    ],
    cta: "Start with Blaze",
    ctaVariant: "filled" as const,
  },
  {
    name: "Forge",
    tagline: "No limits. Everything on. We've got your back.",
    monthly: 4999,
    annual: 49999,
    accent: "#8b3a2a",
    border: "rgba(139,58,42,0.4)",
    glow: "rgba(139,58,42,0.08)",
    features: [
      { label: "Storefront + 3D designer", value: "✓" },
      { label: "Orders & quotes", value: "Unlimited" },
      { label: "Saved templates", value: "Unlimited" },
      { label: "Custom templates", value: "✓" },
      { label: "X-Ray reports", value: "+ your 3D designs" },
      { label: "Background removal", value: "✓" },
      { label: "Smart tool credits", value: "2,000 / mo" },
      { label: "Buy extra credits", value: "✓" },
      { label: "Support", value: "Account Manager" },
    ],
    cta: "Start with Forge",
    ctaVariant: "ghost" as const,
  },
];

function formatPrice(amount: number) {
  if (amount === 0) return "Free";
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="pt-14 pb-6 px-4 md:px-8 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-2 text-[#edeae3]">
          Start free. Grow at your pace.
        </h2>


        {/* ── The trial ──────────────────────────────────────────────────────────────────────
            Full width, above everything, in its own colour. It cannot be mistaken for a fourth
            column, which is the entire reason it is shaped this way — see the note on `trial`. */}
        <div
          className="mt-8 rounded-2xl p-6 md:p-7 flex flex-col md:flex-row md:items-center gap-5 md:gap-8"
          style={{
            border: `1px solid ${trial.border}`,
            background: `radial-gradient(ellipse at left, ${trial.glow}, transparent 70%), #111111`,
          }}
        >
          <div className="flex-1">
            <p className="text-lg md:text-xl font-bold text-[#edeae3]">{trial.headline}</p>
            <p className="text-sm text-[#edeae3]/65 mt-1.5 leading-relaxed">{trial.body}</p>
            <p className="text-xs text-[#edeae3]/45 mt-2">{trial.foot}</p>
          </div>
          <StartCta
            className="block shrink-0 text-center px-7 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            style={{ backgroundColor: trial.accent, color: "#fff" }}
          >
            {trial.cta}
          </StartCta>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8 mt-6">
          <span className={`text-sm transition-colors ${!annual ? "text-[#edeae3]" : "text-[#edeae3]/40"}`}>
            Monthly
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className="relative w-12 h-6 rounded-full transition-colors cursor-pointer"
            style={{ backgroundColor: annual ? "#6b8f7e" : "rgba(255,255,255,0.1)" }}
          >
            <span
              className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
              style={{ left: annual ? "28px" : "4px" }}
            />
          </button>
          <span className={`text-sm transition-colors ${annual ? "text-[#edeae3]" : "text-[#edeae3]/40"}`}>
            Annual
            <span className="ml-2 text-xs text-[#6b8f7e] font-medium">save 2 months</span>
          </span>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className="relative rounded-2xl p-6 flex flex-col gap-6 transition-all"
              style={{
                border: `1px solid ${tier.border}`,
                background: `radial-gradient(ellipse at top, ${tier.glow}, transparent 70%), #111111`,
                ...(tier.recommended && {
                  boxShadow: `0 0 40px ${tier.glow}, 0 0 0 1px ${tier.border}`,
                }),
              }}
            >
              {/* Recommended badge */}
              {tier.recommended && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: tier.accent }}
                >
                  Most Popular
                </div>
              )}

              {/* Name + tagline */}
              <div className="relative">
                <p
                  className="text-5xl font-black leading-none select-none"
                  style={{ color: tier.accent, opacity: 0.25 }}
                >
                  {tier.name}
                </p>
                <p className="text-xs text-[#edeae3]/60 leading-relaxed mt-1">{tier.tagline}</p>
              </div>

              {/* Price */}
              <div>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-black text-[#edeae3]">
                    {formatPrice(annual ? tier.annual : tier.monthly)}
                  </span>
                  {(annual ? tier.annual : tier.monthly) > 0 && (
                    <span className="text-[#edeae3]/55 text-sm mb-1">
                      /{annual ? "yr" : "mo"}
                    </span>
                  )}
                </div>
              </div>

              {/* CTA */}
              <StartCta
                className="block w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                style={
                  tier.ctaVariant === "filled"
                    ? { backgroundColor: tier.accent, color: "#fff" }
                    : {
                        border: `1px solid ${tier.border}`,
                        color: tier.accent,
                        backgroundColor: "transparent",
                      }
                }
              >
                {tier.cta}
              </StartCta>

              {/* Divider */}
              <div className="h-px bg-white/5" />

              {/* Features */}
              <ul className="flex flex-col gap-3">
                {tier.features.map(({ label, value }) => (
                  <li key={label} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-[#edeae3]/65">{label}</span>
                    <span
                      className="text-xs font-medium shrink-0"
                      style={{ color: value === "—" ? "rgba(237,234,227,0.4)" : tier.accent }}
                    >
                      {value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Credits footnote — the two credit rows above are meaningless without it.
            No job counts ("≈50 photo reads"): what an action costs is DATA that can move, and the
            app shows the live price list. A number printed here would go stale silently. */}
        <p className="text-center text-[#edeae3]/45 text-xs mt-8 max-w-2xl mx-auto leading-relaxed">
          Credits power the smart tools — reading a reference photo into an X-Ray report, and
          working out how a decoration was made. Your monthly credits refresh on the 1st. Credits
          you buy never expire and are only used once the monthly ones are gone.
        </p>

        {/* Data retention note */}
        <p className="text-center text-[#edeae3]/45 text-xs mt-4">
          Cancel anytime. Your designs are retained for 30 days after cancellation.
        </p>

      </div>
    </section>
  );
}
