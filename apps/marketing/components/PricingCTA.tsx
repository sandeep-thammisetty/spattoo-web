"use client";

import StartCta from "./StartCta";

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

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <StartCta
          className="px-8 py-3.5 rounded-full font-semibold text-sm text-white transition-opacity hover:opacity-90 cursor-pointer"
          style={{ backgroundColor: "#3d5247" }}
        >
          Get Started Free
        </StartCta>
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
