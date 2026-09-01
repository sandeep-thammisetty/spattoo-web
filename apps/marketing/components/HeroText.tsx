"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DemoCta from "./DemoCta";

const slides = [
  {
    eyebrow: "3D cake designer for bakers",
    headline: ["Your customers design", "their cake in 3D.", "You just bake it."],
    highlight: "You just bake it.",
  },
  {
    /* Merged with the old "No design skills needed. / Start from a template." slide rather than
     * deleting it. That slide's whole content was a label and a restatement of it, and this one had
     * a headline that already said the benefit — so the template becomes the LABEL here, which is
     * the rule every slide follows, and "Save hours every week" goes because "Less design chats.
     * More baking." was already saying that. Two slides, one idea each, into one slide with both. */
    eyebrow: "Start from a template",
    headline: ["Less design chats.", "More baking."],
    highlight: "More baking.",
  },
  {
    /* ⚠️ "Before they message you" conceded that messaging is the baseline — three slides after
     * promising fewer chats — and it made the message the subject rather than the storefront.
     *
     * Guiding is also a stronger claim than collecting: any order form collects a flavour and a
     * size. This one RECOMMENDS, and both halves were checked in the code before being claimed.
     * `suggestFlavour.js` reasons from the OCCASION ("children's birthdays nearly always go
     * chocolate") and is rules rather than a model precisely so it can say why; `SizeDateFacets`
     * asks how many people and works the size out, because a customer can answer a headcount and
     * cannot answer a weight.
     *
     * "the occasion", not "your occasion": the visitor is the BAKER, so the occasion belongs to
     * their customer. */
    eyebrow: "Your storefront guides them",
    headline: ["To pick the right", "flavour and size", "for the occasion."],
    highlight: "for the occasion.",
  },
  {
    /* ⚠️ The only slide about what happens AFTER the order arrives.
     *
     * The other five are all the customer's half — designing, the storefront asking, templates,
     * branding — and the rotation left a visitor with no idea Spattoo runs the orders too. That is
     * the half a baker pays for every month; the designer is what makes them look once.
     *
     * ⚠️ The statement is WHERE THE ORDERS COME FROM, not the bake-day view. An earlier draft read
     * "See your bake day at a glance", which is a detail inside the feature and too small a thing to
     * carry a hero slide — the point is that everything lands here, however it arrived. */
    eyebrow: "Baker focused order management",
    /* ⚠️ ~18 characters a line at this size, measured — not guessed. Longer lines wrap, and a
     * wrapped line means the authored break is ignored and the highlight lands mid-phrase. */
    headline: ["Orders from 3D", "or a photo.", "All in one place."],
    highlight: "All in one place.",
  },
  {
    /* ⚠️ The one thing on this page nobody else can say.
     *
     * Every other slide is a better version of a claim a competitor also makes. Turning a design
     * into the colour mix, the nozzle and the steps for modelling a fondant figure is not — a render
     * is a picture, and a picture is not a recipe.
     *
     * The tin was here and came out: it is the smallest of the four and the easiest to guess from
     * the tier count. The fondant guide is the opposite — genuinely hard, genuinely wanted, and it
     * goes LAST because the last line is the highlighted one.
     *
     * The specifics ARE the argument. "Step-by-step guides" would be worth less than saying nothing:
     * it is what anybody would write whether or not they had built it.
     *
     * This took the slot the template slide gave up when it merged into "Less design chats" above,
     * so the rotation stays at six. Seven would mean the last slide is seen by almost nobody. */
    eyebrow: "Order specific help guide",
    headline: ["The colour mix.", "The nozzle.", "The fondant guide."],
    highlight: "The fondant guide.",
  },
  {
    eyebrow: "They see your brand, not ours.",
    headline: ["Your logo.", "Your colours.", "Your customer's design experience."],
    highlight: "Your customer's design experience.",
  },
];

function Headline({ line, isHighlight, addBreak }: { line: string; isHighlight: boolean; addBreak: boolean }) {
  return isHighlight ? (
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#edeae3] to-[#a8c5b5]">
      {addBreak && <br />}{line}
    </span>
  ) : (
    <span>{addBreak && <br />}{line}</span>
  );
}

type Slide = (typeof slides)[number];

// One slide's eyebrow + headline at desktop sizing. Rendered by the slide that is actually visible
// AND, hidden, once per slide to reserve the grid cell's height — see the stack below.
//
// Both come from this ONE component deliberately. A spacer built from a copied block of markup
// drifts the moment either copy is edited, and it drifts SILENTLY: nobody looks at a spacer, so the
// first sign would be the jump quietly coming back.
//
// `heading` picks the tag. Only the visible slide is an <h1>; the five reservations are plain divs
// carrying identical typography. Six <h1> elements on a marketing landing page is not a thing to do
// to a page whose job is to be found.
function DesktopSlide({ slide, heading = false }: { slide: Slide; heading?: boolean }) {
  const H = heading ? "h1" : "div";
  return (
    <>
      <p
        className="inline-block text-sm tracking-[0.2em] uppercase text-[#a8c5b5] font-medium mb-5 px-4 py-1.5 rounded-full"
        style={{ border: "1px solid rgba(107,143,126,0.4)", backgroundColor: "rgba(107,143,126,0.08)" }}
      >
        {slide.eyebrow}
      </p>

      <div className="mb-6">
        <H className="text-3xl md:text-4xl font-bold leading-snug text-[#edeae3]">
          {slide.headline.map((line, i) => (
            <Headline key={line} line={line} isHighlight={line === slide.highlight} addBreak={i > 0} />
          ))}
        </H>
      </div>
    </>
  );
}

export default function HeroText() {
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block relative z-10 px-16 max-w-lg">
        {/* Grid stack: one cell, so a slide can be swapped without the two ever being laid out
            side by side.
            ⚠️ The cell does not auto-size to the tallest slide on its own — an earlier version of
            this comment claimed it did. That was true while AnimatePresence ran in "sync" mode and
            both slides were mounted at once; under "wait" only ONE is, so the cell was as tall as
            the CURRENT slide and everything below it — dots, buttons, the free-trial line — rode up
            and down as the slides rotated. Measured at 1246px wide, the five slides stand 276, 177,
            346, 128 and 276 tall: a 218px range, every six seconds. The hidden reservations below
            restore the property the comment used to describe — the cell holds at 346 whichever
            slide is showing.
            (Bottom-anchored mobile, `justify-end` further down, never had this: there the stack
            grows upward and the buttons hold still, which is why only desktop needs them.)
            ⚠️ mode="wait", and it is the whole fix for the "ghosting" a review caught on the live
            site. The stacking here was already right; the default AnimatePresence mode is "sync",
            which animates the outgoing and incoming slides AT THE SAME TIME. Two different
            headlines, in one grid cell, each at roughly half opacity for 0.6s — that is a double
            exposure, and it is unavoidable when crossfading words rather than images. "wait" holds
            the new slide until the old one has gone: fade out, then fade in, never both.
            0.35 rather than 0.6 because the two halves now run in SEQUENCE. At 0.6 the swap would
            take 1.2s and feel like a stall; at 0.35 the whole thing is 0.7s — slightly quicker than
            the overlapping version it replaces. */}
        <div style={{ display: "grid", marginBottom: "2rem" }}>
          {/* Height reservation: EVERY slide, laid into the same cell, hidden. A grid row is as tall
              as its tallest child, so the cell now measures the tallest slide instead of the current
              one and nothing below it moves.
              `visibility: hidden`, never `display: none` — a display:none child contributes no
              height, which is the entire job. aria-hidden and inert to the pointer so the five
              copies are neither read out nor clickable. Which slide is tallest depends on where the
              text wraps, so it is not hardcoded: all five are reserved and the browser takes the
              max. */}
          {slides.map((s) => (
            <div
              key={`reserve-${s.highlight}`}
              aria-hidden
              style={{ gridArea: "1 / 1", visibility: "hidden", pointerEvents: "none" }}
            >
              <DesktopSlide slide={s} />
            </div>
          ))}

          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              style={{ gridArea: "1 / 1" }}
            >
              <DesktopSlide slide={slide} heading />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dot indicators */}
        <div className="flex gap-2 mb-6">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className="h-1 rounded-full transition-all cursor-pointer"
              style={{
                width: i === index ? "24px" : "8px",
                backgroundColor: i === index ? "#6b8f7e" : "rgba(237,234,227,0.2)",
              }}
            />
          ))}
        </div>

        {/* ── Two buttons, and they stay on one line ────────────────────────────────────────────
            There were three. "Get Started Free" is gone from here because the nav already carries
            "Get started" behind the same SHOW_SIGNIN flag, so the two appeared and disappeared
            together and said the same thing twice on one screen.
            `whitespace-nowrap` is the rest of the fix. A rounded-full button whose label wraps to
            two lines stops being a pill and becomes a tall oval — which is what three of them did
            once they were sharing the column. */}
        <div className="flex gap-3">
          <a href="#how-it-works" className="px-6 py-2.5 rounded-full bg-[#3d5247] text-[#edeae3] font-semibold text-sm hover:bg-[#4a6357] transition-colors text-center whitespace-nowrap">
            See How It Works
          </a>
          {/* Outlined, not filled: two solid buttons side by side leave neither one primary. */}
          <DemoCta className="px-6 py-2.5 rounded-full text-[#edeae3] font-semibold text-sm text-center cursor-pointer transition-colors hover:bg-[#3d5247]/30 whitespace-nowrap"
                   style={{ border: "1px solid rgba(107,143,126,0.45)" }}>
            Request a Demo
          </DemoCta>
        </div>
        {/* The SHAPE of the offer — how long, and whether a card is needed — said here rather than
            making someone reach the pricing section to find out. It was written under a "Get Started
            Free" button, on the grounds that "free" on a button is a word every SaaS uses and nobody
            believes. That button now lives only in the nav, and the line stays: it is the answer to
            "what does it cost" whether or not there is something to press beside it. */}
        <p className="mt-3 text-xs text-[#edeae3]/55">
          Use Spattoo free for a month. No credit card needed.
        </p>
      </div>

      {/* Mobile */}
      <div
        className="md:hidden absolute bottom-0 top-[5.5rem] left-0 right-0 z-10 px-6 pt-4 pb-10 overflow-hidden flex flex-col justify-end"
        style={{ background: "linear-gradient(to top, #111111 35%, transparent)" }}
      >
        <div style={{ display: "grid", marginBottom: "1rem" }}>
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={`mob-${index}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              style={{ gridArea: "1 / 1" }}
            >
              <p
                className="inline-block text-xs tracking-[0.2em] uppercase text-[#a8c5b5] font-medium mb-2 px-3 py-1 rounded-full"
                style={{ border: "1px solid rgba(107,143,126,0.4)", backgroundColor: "rgba(107,143,126,0.08)" }}
              >
                {slide.eyebrow}
              </p>

              <h1 className="text-xl font-bold leading-snug mb-2 text-[#edeae3]">
                {slide.headline.map((line, i) => (
                  <Headline key={line} line={line} isHighlight={line === slide.highlight} addBreak={i > 0} />
                ))}
              </h1>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex gap-2 mb-4">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className="h-1 rounded-full transition-all cursor-pointer"
              style={{
                width: i === index ? "20px" : "6px",
                backgroundColor: i === index ? "#6b8f7e" : "rgba(237,234,227,0.2)",
              }}
            />
          ))}
        </div>

        {/* Two share the row on a phone. Three could not — "Request a Demo" needed its own line at
            a third of a 390px screen — and with the signup CTA gone from here they fit. */}
        <div className="flex gap-3">
          <a href="#how-it-works" className="flex-1 py-3.5 rounded-full bg-[#3d5247] text-[#edeae3] font-semibold text-sm text-center whitespace-nowrap">
            See How It Works
          </a>
          <DemoCta className="flex-1 py-3.5 rounded-full text-[#edeae3] font-semibold text-sm text-center cursor-pointer whitespace-nowrap"
                   style={{ border: "1px solid rgba(107,143,126,0.45)" }}>
            Request a Demo
          </DemoCta>
        </div>
        {/* Mobile carries its own copy of the CTA row, so it needs its own copy of this line —
            and it matters more here, where the pricing section is a long scroll away and the nav's
            "Get started" is behind a menu. */}
        <p className="mt-3 text-center text-xs text-[#edeae3]/55">
          Use Spattoo free for a month. No credit card needed.
        </p>
      </div>
    </>
  );
}
