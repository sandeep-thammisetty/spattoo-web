import type { Metadata } from "next";
import StorefrontClient from "./StorefrontClient";

// Customer storefront for a baker, reached at {slug}.spattoo.com (middleware
// rewrites the subdomain to /[slug]) or /[slug] in local dev. The branding/story
// is fetched client-side by CustomerStorefront from the public storefront API.

// ── Why this page fetches the storefront TWICE ────────────────────────────────────────────────
// The body is rendered client-side, so a crawler that runs no JavaScript sees an empty shell. Until
// this existed, every baker's storefront served the root layout's `<title>Spattoo</title>` — the
// same three characters for every shop in the catalogue. Nothing distinguished one baker from
// another, so no baker could rank for their own name, which is the one search they are certain to
// be the best answer to.
//
// generateMetadata runs on the server, so this second fetch is what puts the baker's name in the
// tab, in Google's result, and on a WhatsApp link preview. Next dedupes fetches within a request,
// and the API response is small.
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

type Storefront = {
  name?: string;
  tagline?: string | null;
  story?: string | null;
  logo_url?: string | null;
  gallery?: { url?: string | null; caption?: string | null }[];
};

async function fetchStorefront(slug: string): Promise<Storefront | null> {
  if (!API_BASE) return null;
  try {
    const res = await fetch(`${API_BASE}/api/storefront/${encodeURIComponent(slug)}`, {
      // A baker edits their storefront rarely and expects the change to show. Five minutes is long
      // enough that a crawl does not hammer the API, short enough that "I fixed my tagline" is not
      // a support conversation.
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as Storefront;
  } catch {
    // Never let metadata take the page down. A storefront that renders with a plain title beats one
    // that 500s because the API blinked.
    return null;
  }
}

// First sentence of the story, for when a baker has not written a tagline. Cut at a sentence end
// rather than mid-word — a description truncated to "we make cakes for every occa" is worse than a
// short one.
function summarise(story: string, limit = 155): string {
  const flat = story.replace(/\s+/g, " ").trim();
  if (flat.length <= limit) return flat;
  const cut = flat.slice(0, limit);
  const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  return stop > 60 ? cut.slice(0, stop + 1) : cut.slice(0, cut.lastIndexOf(" ")) + "…";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const shop = await fetchStorefront(slug);

  // No storefront: unpublished, no such baker, or a lapsed subscription — the API 404s all three.
  // The page still renders (its own not-found state is friendlier than a bare 404 screen), but it
  // must not be INDEXED: *.spattoo.com answers every subdomain, so without this a crawler could
  // index an unlimited number of shops that do not exist.
  if (!shop?.name) {
    return { title: "Spattoo", robots: { index: false, follow: false } };
  }

  const title = `${shop.name} — Custom Cakes`;
  const description =
    shop.tagline?.trim() ||
    (shop.story ? summarise(shop.story) : `Design your cake with ${shop.name} and request a quote.`);

  // A cake photo sells the link; a logo is the fallback. This is what appears when a baker shares
  // their shop on WhatsApp, which is how most of these links will actually travel.
  const image = shop.gallery?.find((g) => g.url)?.url || shop.logo_url || undefined;

  return {
    title,
    description,
    alternates: { canonical: `https://${slug}.spattoo.com` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `https://${slug}.spattoo.com`,
      siteName: shop.name,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <StorefrontClient slug={slug} />;
}
