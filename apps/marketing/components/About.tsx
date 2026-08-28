// ── About Us ─────────────────────────────────────────────────────────────────────────────────────
// The nav has linked to `#about` since it was written and nothing on the site carried that id, so
// "About Us" scrolled nowhere. This is the section, and the anchor.
//
// Left-aligned and narrow (max-w-3xl), unlike the centred grids either side of it. This is the one
// place on the site that is somebody talking rather than a product explaining itself, and centred
// prose at this length is hard to read — the eye loses the start of each line.
//
// The copy is the founders' own, trimmed in two places: an ending that made the same point four
// times over, and a run of one-line paragraphs that had started to read as a slide deck rather than
// a person. The beats that carry weight — "Spattoo started with cakes", "And we noticed something",
// "From our bakery to yours" — are kept, because the rhythm is what makes it sound spoken.
export default function About() {
  return (
    <section id="about" className="py-28 px-8 md:px-16 bg-[#111111]">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs tracking-[0.35em] uppercase text-[#6b8f7e] mb-3">About Us</p>
        <h2 className="text-3xl md:text-5xl font-bold mb-10 text-[#edeae3]">
          We built Spattoo because we needed it ourselves.
        </h2>

        {/* 75% rather than the 55% used for captions elsewhere: this is body copy meant to be read
            end to end, not a label glanced at. Same palette, spaced far enough apart to be legible
            on a near-black page. */}
        <div className="flex flex-col gap-6 text-[#edeae3]/75 leading-relaxed">
          <p className="text-lg text-[#edeae3] font-semibold">Spattoo started with cakes.</p>

          <p>
            Before we built the technology, we were on the other side — taking custom cake orders,
            talking to customers, looking at reference images, figuring out what they really wanted,
            answering the same questions about flavours and sizes, and trying to turn an idea in
            someone&rsquo;s head into an actual cake.
          </p>

          <p>And we noticed something.</p>

          <p>
            The hardest part of a custom cake wasn&rsquo;t always making the cake. It was getting
            from &ldquo;I have an idea&rdquo; to &ldquo;this is exactly what I want.&rdquo; A
            customer might send a picture, change the colour, ask for a different size, wonder about
            flavours, and go back and forth over messages before an order was finally clear. For
            bakers, that meant hours of conversations, scattered photos, unclear requirements and too
            much time spent managing orders instead of baking.
          </p>

          <p>So we started building a better way.</p>

          <p className="text-lg text-[#edeae3] font-semibold pt-2">From our bakery to yours.</p>

          <p>
            We wanted customers to be able to see their cake, play with their ideas and make
            decisions visually — instead of trying to explain everything over a chat. And we wanted
            bakers to receive an enquiry that was already organised: the design, flavour, size, date
            and references, all in one place.
          </p>

          <p>
            That idea became Spattoo. Today it brings 3D cake design and order management together,
            giving bakers their own digital storefront to share with customers, where customers can
            explore, design and order cakes in a much simpler way.
          </p>

          <p>
            But the principle hasn&rsquo;t changed. We build Spattoo from the perspective of people
            who actually make cakes — because we know exactly what happens after a customer says,
            &ldquo;I want something like this…&rdquo;
          </p>

          <p className="text-lg text-[#edeae3] font-semibold pt-2">
            From idea to cake, visually. That&rsquo;s what Spattoo is about.
          </p>
        </div>
      </div>
    </section>
  );
}
