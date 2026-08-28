"use client";

import StartCta from "./StartCta";
import DemoCta from "./DemoCta";

export default function PricingCTA() {
  return (
    <section className="pt-10 pb-16 px-8 text-center bg-[#0a0a0a]">
      <h2 className="text-4xl md:text-6xl font-bold mb-4 text-[#edeae3]">
        Ready to ignite?
      </h2>
      {/* "Start free with 10 orders" until 2026-08-05, and it was fiction: NO plan has an order cap.
          Pricing.tsx removed the same claim from the table on 2026-08-02 ("Spark's fictional '10
          total orders' removed with the column — a trial is bounded by TIME") and this copy, in a
          different component, was missed. A trial is 30 days (`trial_days` in
          seed_plan_entitlements.sql), so that is what it now says — and it matches the trial card
          above, which offers "a full month". */}
      <p className="text-[#edeae3]/60 text-base mb-6 max-w-md mx-auto">
        Start free for a full month, or let us walk you through what Spattoo can do for you.
      </p>

      {/* ── The section had NO button at all in production ──────────────────────────────────────
          A review of the live site listed this as a fault: a dedicated bottom-of-page conversion
          moment with descriptive text and nothing to press. It was not missing — StartCta returns
          null while SHOW_SIGNIN is off, which it is in prod until the baker app opens, so the
          paragraph above made two offers and delivered neither.
          The second half of that sentence — "let us walk you through what Spattoo can do for you" —
          is a demo invitation, and DemoCta is not behind the flag. So the page keeps a working CTA
          whether or not signup is live, and gains a second one the day it is. */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <StartCta
          className="px-8 py-3.5 rounded-full font-semibold text-sm text-white transition-opacity hover:opacity-90 cursor-pointer"
          style={{ backgroundColor: "#3d5247" }}
        >
          Get Started Free
        </StartCta>
        <DemoCta
          className="px-8 py-3.5 rounded-full font-semibold text-sm text-[#edeae3] transition-colors hover:bg-[#3d5247]/30 cursor-pointer whitespace-nowrap"
          style={{ border: "1px solid rgba(107,143,126,0.45)" }}
        >
          Request a Demo
        </DemoCta>
      </div>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="mt-12 text-xs text-[#edeae3]/30 hover:text-[#edeae3]/60 transition-colors cursor-pointer flex items-center gap-2 mx-auto"
      >
        <span>↑</span>
        <span>Back to top</span>
      </button>
    </section>
  );
}
