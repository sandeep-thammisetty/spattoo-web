/* ── The half of the product the site never mentioned ────────────────────────────────────────────
 *
 * The story used to stop exactly where the baker's day starts: How It Works ends at "a complete
 * enquiry lands with you", and everything after — quoting, confirming, the delivery-date calendar,
 * the bake-day totals — was one clause inside step 03. PainPoint even names the pain ("Scrolling
 * back through chats on bake day") and the site never showed the answer.
 *
 * Deliberately a BAND and not a section. It sits between the problem and the price, which is where
 * "why would I pay every month" belongs — a 3D designer earns the first look, running your orders
 * earns the subscription. Three cards and a bullet list were drafted and cut: the page is already
 * long, and one sentence carries it.
 *
 * ⚠️ Narrative copy, NOT a plan claim. Anything phrased as a plan feature has to match
 * `subscription_plans.feature_bullets` or `check:plan-copy` fails — it exists because team seats
 * were sold in the in-app picker for three days after being struck from the marketing table.
 *
 * "designed in 3D or from a reference photo" is both real paths, and both are baker-facing here:
 * a storefront enquiry, and an order the baker adds themselves (manual orders — a walk-in, a phone
 * call). It is one sentence because the distinction matters to us and not to the reader.
 */
export default function OrderManagement() {
  return (
    <section className="py-16 px-8 md:px-16 bg-[#0d0d0d]">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs tracking-[0.35em] uppercase text-[#6b8f7e] mb-4">
          Order management
        </p>
        <h2 className="text-2xl md:text-4xl font-bold text-[#edeae3] mb-4 leading-tight">
          Built for how bakers actually work
        </h2>
        <p className="text-[#edeae3]/60 leading-relaxed max-w-2xl">
          Every order in one place — designed in 3D or from a reference photo. Quote it, confirm it,
          and see your bake day at a glance.
        </p>
      </div>
    </section>
  );
}
