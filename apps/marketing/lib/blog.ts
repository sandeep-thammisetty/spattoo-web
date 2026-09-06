// Single source of truth for the marketing site's articles. Mirrors lib/legal.ts on
// purpose: a registry of metadata in TypeScript, bodies as markdown under content/,
// rendered by one shared component. Consumed by app/blog/*, components/BlogPostPage.tsx
// and the "Blog" item in components/SiteNav.tsx + MobileNav.tsx.
//
// This file is imported by CLIENT components (the nav), so it must stay pure data —
// no `fs`. Reading the markdown body belongs in the server component that renders it.

import { IS_PRODUCTION_SITE } from "./domain";

export type PostStatus = "draft" | "published";

export type BlogPost = {
  slug: string;
  title: string;
  // Sentence that sits under the title on the index and in <meta description>.
  description: string;
  file: string; // filename under content/blog/
  status: PostStatus;
  date: string; // human-readable; "" while a post is still draft
  readingMinutes: number;
};

// ⚠️ STATUS IS NOT COSMETIC — it decides whether the public site serves the post.
//
//   published → visible everywhere.
//   draft     → visible on dev/preview deploys ONLY; 404 on spattoo.com.
//
// This is the same safe-by-default direction as guardInternalPage() in lib/domain.ts:
// production is whitelisted, so anything not explicitly published stays off the public
// site rather than needing to be remembered about. It lets a piece be read and reviewed
// at its real URL, on a phone, in the real layout, before anyone outside can reach it.
export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "cake-design-storytelling",
    title: "How Cake Design Is Becoming a New Form of Storytelling",
    description:
      "Cake design has shifted from marking an occasion to being about a specific person. What changed, and what it asks of the people who make them.",
    file: "cake-design-storytelling.md",
    // ⚠️ DRAFT ON PURPOSE — do not flip this without clearing the blockers recorded in
    // the working file (Downloads/Blogs/Spattoo_Cake_Storytelling_ARTICLE_DRAFT.md,
    // section "Before this goes live"). The open ones are rights-related, not editorial:
    //   · no cake photographs are licensed yet — a Pinterest or Instagram find is not a
    //     licence, and every cake photo belongs to whoever shot it;
    //   · the Indian baker quotes that sections 7 and 8 are built to carry do not exist
    //     yet, and nothing here may be presented as a quote until they do;
    //   · the Times of India source sits under /life-style/spotlight/, which is branded
    //     content rather than the newsroom, and is unused until someone confirms.
    // Publishing early is the expensive mistake here: a takedown on a marketing site is
    // public in a way that a missing article is not.
    status: "draft",
    date: "",
    readingMinutes: 8,
  },
];

export const getPost = (slug: string): BlogPost | undefined =>
  BLOG_POSTS.find((p) => p.slug === slug);

// What this DEPLOY may serve. Production sees published posts only; dev and preview see
// drafts too, so a piece can be reviewed at its real URL before it is public.
export const visiblePosts = (): BlogPost[] =>
  BLOG_POSTS.filter((p) => p.status === "published" || !IS_PRODUCTION_SITE);

// Whether the "Blog" nav item should appear at all. A nav link to an empty index is
// worse than no nav link, so the header follows the content rather than the other way
// round: on production the item appears the moment the first post is published, and
// disappears again if there is nothing to show.
export const BLOG_IN_NAV = visiblePosts().length > 0;
