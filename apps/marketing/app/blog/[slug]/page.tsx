import type { Metadata } from "next";
import BlogPostPage from "@/components/BlogPostPage";
import { getPost, visiblePosts } from "@/lib/blog";

export const dynamic = "force-static";

// Only what this deploy may serve gets built: on production a draft has no route at all,
// rather than a route that 404s at request time.
export function generateStaticParams() {
  return visiblePosts().map((p) => ({ slug: p.slug }));
}

// ⚠️ `params` is a PROMISE in this version of Next and must be awaited — it was a plain
// object up to 14. Reading it synchronously is the mistake to avoid here.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} — Spattoo`,
    description: post.description,
    // A draft that leaks onto a preview URL should still never be indexed.
    robots: post.status === "draft" ? { index: false, follow: false } : undefined,
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <BlogPostPage slug={slug} />;
}
