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
// So it is the FIRST CARD in the row, visibly a different kind of thing: messaging and a CTA, no
// price row, no ticks, nothing to run an eye across. Flame is then measured against what a baker
// actually uses today — a notebook, a phone gallery, Instagram DMs — which it beats comfortably.
//
// It was a full-width strip above the table until 2026-08-02, and that failed the other way: a
// reader who came for prices scrolled past it into the columns, so the free month — the cheapest
// thing we have to offer — was the one thing they never saw. The rule was never "keep it out of the
// row"; it was "never let it become a comparison column".
//
// The word TRIAL is deliberately absent from the card. "Trial" is what WE call it internally; what
// a baker is being offered is a month of using the thing.
//
// The headline leads on the OFFER, not the price. "Free for 30 days" spent the largest line on
// something the CTA ("Start free") and the footnote ("No credit card") already say twice over —
// three ways of saying free, and nothing saying what the month is FOR. Free is the condition;
// a month of running your bakery on it is the proposition.
//
// And it does NOT say "every plan starts free for 30 days", which the strip did — a Blaze buyer
// reading that reasonably expects 30 free days of Blaze and does not get it.
//
// ⚠️ IT ALSO NO LONGER SAYS "EVERYTHING IN FLAME" (changed 2026-08-05). That was accurate, and it
// was still the wrong sentence, for two reasons:
//
//   * It is a PROMISE OF PARITY, and the trial does not have to be a tier. A trial exists to let a
//     baker experience Spattoo; there is no reason its credit allowance must match Flame's, and
//     seed_plan_entitlements.sql records "trial = Blaze for 30 days" as still pending precisely
//     because the AI allowance is "the one way a trial can cost real money". Copy that names a tier
//     pins a decision that is still open, and goes false the moment it moves.
//   * The line contradicted itself — "everything in Flame PLUS a starter allowance of credits",
//     when Flame's allowance IS 300/mo. "Plus" implied extra.
//
// So it now names what a baker GETS, in their own terms, and leaves the credit allowance
// deliberately unquantified. True today, and still true if the trial changes tier or allowance
// tomorrow. The card's job was never comparison anyway — see the block above it.
const trial = {
  badge: "START HERE",
  headline: "Experience Spattoo for a full month",
  body: "Then decide which plan fits.",
  detail: "Your own storefront, the 3D designer, flavour suggestions, and unlimited orders and quotes — with credits to try the smart tools.",
  foot: "No credit card. Nothing is charged until you pick a plan.",
  accent: "#6b8f7e",
  border: "rgba(107,143,126,0.35)",
  glow: "rgba(107,143,126,0.10)",
  cta: "Start free",
};

// ── The plans ───────────────────────────────────────────────────────────────────────────────────
// Every row here must be something the API ACTUALLY ENFORCES — not merely something declared in
// seed_plan_entitlements.sql. Those are not the same set, and the difference is how fiction reaches
// this page: someone reads a value in the seed and writes a row for it.
//
// "Saved templates 30 / Unlimited / Unlimited" was exactly that (removed 2026-08-02).
// `max_saved_templates` exists in the entitlement registry and in the seed and is checked by
// NOTHING — no route, no component. We were advertising a cap on Flame that does not exist, which
// under-sells the plan and would be indefensible if a baker ever counted.
//
// Before adding a row: grep for the key outside constants/entitlements.js and the seed. If the only
// hits are the declaration and the seed, it is not a feature yet.
//
// RENAMED 2026-08-05, three times, and the last one is the point. Every row in this table is a
// NOUN naming a thing you get — Custom templates, X-Ray reports, Smart tool credits, Support. A row
// that reads as a sentence stops being scannable next to them.
//
//   "Edible print sheet (A4)"          named the CONSUMABLE, and read as though we supply sheets.
//                                      We do not; the baker buys those.
//   "Edible sheet layout (A4)"         fixed that, then named the paper twice — A4 IS a layout —
//                                      and named us not at all.
//   "Edible prints, sized to the cake" said the right thing in the wrong register: a description
//                                      with a comma clause, sitting in a column of headings.
//
// "Edible Print Studio" is the noun. The tool (src/chefsdesk/a4/A4Sheet.jsx) holds the page to
// scale and puts cake-diameter guides on it, so a baker checks the image against the cake BEFORE
// printing, then exports with cut marks — which is what stops an expensive sheet going in the bin
// at the wrong size.
//
// I first argued AGAINST "Studio", on the grounds that it would collide with a family of
// decoration-design tools. It does not: the studios (Glaze, Bow, Relief Sticker, Chocolate Drip) are
// ADMIN surfaces — a baker never meets one, and the only mention outside admin is a comment naming
// "the admin Chocolate Drip Studio". So the word is unclaimed on the baker side and the objection
// was about a collision that cannot happen.
//
// A4 is dropped deliberately: it is the sheet they already buy, not something we provide, and it is
// visible inside the tool itself.
//
// The reverse also happened: "Edible print sheet (A4)" shipped a long time ago, is gated by nothing,
// and had never been sold. A baker arranges the customer's photo frames on an A4 sheet at true size,
// checks them against cake-diameter guides, and exports a print-ready PDF with cut marks — on the
// sheets they already buy. Unsold features are the cheaper mistake of the two, but still a mistake.
//
// FLAVOUR SUGGESTIONS IS A ROW (added 2026-08-05), and it is the same tick on all three. It passes
// the test above: not plumbing, but a capability a baker recognises — a customer who cannot decide
// is offered flavours from THIS baker's list, with the reason for each. It had shipped and was
// unsold, which is the mistake this file already names.
//
// Identical across tiers ON PURPOSE, and not an oversight to be "fixed" later by gating it. It is
// customer-facing: restricting it would give some bakers' CUSTOMERS worse recommendations, which is
// a strange thing to sell. It also improves with order volume, so limiting who can use it slows the
// data it runs on. There is no entitlement key to grep for, because there is no gate.
//
// BACKGROUND REMOVAL IS NOT A ROW (removed 2026-08-02). It is plumbing inside the upload flow, not
// a feature anyone shops for — a baker uploads a photo of their decoration and expects the cut-out;
// they do not compare plans on it. It also gated nothing. Where it belongs is inside the smart-tool
// story, which the credits row already carries.
//
// CUSTOM TEMPLATES IS ✓ EVERYWHERE (2026-08-02). It was "—" on Flame and a named Blaze hook, and
// `custom_templates` gates nothing — the registry calls it inert. Rather than keep selling a
// difference that does not exist, the capability is simply available to everyone, and the row now
// says so.
// Where the two disagreed, the SEED won and this file changed: the page must never promise more
// than a baker gets. Corrected 2026-08-02 — Spark's fictional "10 total orders" removed with the
// column (no plan has an order cap; a trial is bounded by TIME).
//
// TEAM SEATS ARE DELIBERATELY ABSENT, AND NOT MERELY DEFERRED. `max_team_members` exists in the
// entitlement registry (1/2/4/10) but nothing customer-facing enforces or shows it, staff seats are
// not a shipped feature, and it is NOT settled that they will be one.
//
// So: no row, and no "coming soon" either. A "coming soon" is a promise — cheap to print, expensive
// to withdraw — and the numbers beside it would commit us to 2/4/10 before the feature has a
// design. A pricing page should sell what a baker can use on the day they pay.
//
// Do not restore the row because the entitlement exists. If seats ever ship it comes back with
// values read from the seed, like every other row here.
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
      { label: "Flavour suggestions", value: "✓" },
      { label: "Orders & quotes", value: "Unlimited" },
      { label: "Custom templates", value: "✓" },
      { label: "X-Ray reports", value: "✓" },
      { label: "Edible Print Studio", value: "✓" },
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
      { label: "Flavour suggestions", value: "✓" },
      { label: "Orders & quotes", value: "Unlimited" },
      { label: "Custom templates", value: "✓" },
      { label: "X-Ray reports", value: "✓" },
      { label: "Edible Print Studio", value: "✓" },
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
      { label: "Flavour suggestions", value: "✓" },
      { label: "Orders & quotes", value: "Unlimited" },
      { label: "Custom templates", value: "✓" },
      { label: "X-Ray reports", value: "✓" },
      { label: "Edible Print Studio", value: "✓" },
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

          {/* ── The trial, as the FIRST card ────────────────────────────────────────────
              It was a full-width strip above the table, and a reader who came for prices
              scrolled past it straight into the columns — so the free month, which is the
              cheapest thing we have to offer, was the one thing they never saw.
              In the row it cannot be missed. What it must NOT become is a comparison column:
              a trial with a feature list that matches Flame row for row is what made Flame look
              like a paywall in the first place (SUBSCRIPTION_TIERS.md). So it carries MESSAGING
              and a CTA — no price row, no ticks, nothing to run an eye across. It reads as an
              on-ramp beside three plans, not a fourth plan. */}
          <div
            className="relative rounded-2xl p-6 flex flex-col gap-4 transition-all"
            style={{
              border: `1px solid ${trial.border}`,
              background: `radial-gradient(ellipse at top, ${trial.glow}, transparent 70%), #111111`,
            }}
          >
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold text-white whitespace-nowrap"
              style={{ backgroundColor: trial.accent }}
            >
              {trial.badge}
            </div>

            <div className="relative pt-1">
              {/* Deliberately NOT styled as a price. The three cards beside this one open with a
                  number; this one opens with a sentence, which is most of what stops it reading
                  as a fourth tier. */}
              <p className="text-2xl font-black leading-tight text-[#edeae3]">{trial.headline}</p>
              <p className="text-sm text-[#edeae3]/70 mt-2 leading-relaxed">{trial.body}</p>
            </div>

            <p className="text-xs text-[#edeae3]/55 leading-relaxed">{trial.detail}</p>

            <StartCta
              className="block w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer mt-auto"
              style={{ backgroundColor: trial.accent, color: "#fff" }}
            >
              {trial.cta}
            </StartCta>
            <p className="text-xs text-[#edeae3]/45 leading-relaxed">{trial.foot}</p>
          </div>

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
          X-Ray works on every plan, for cakes you design and for orders that are just a reference
          photo. Credits pay for the AI part — reading a photo, and working out how a decoration was
          made; an X-Ray of a cake you designed costs nothing. Monthly credits refresh on the 1st.
          Credits you buy never expire and are only used once the monthly ones are gone.
        </p>

        {/* Data retention note */}
        <p className="text-center text-[#edeae3]/45 text-xs mt-4">
          Cancel anytime. Your designs are retained for 30 days after cancellation.
        </p>

      </div>
    </section>
  );
}
