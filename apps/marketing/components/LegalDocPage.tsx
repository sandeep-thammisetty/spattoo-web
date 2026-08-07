import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SiteNav from "./SiteNav";
import SiteFooter from "./SiteFooter";
import {
  getLegalDoc,
  legalTokens,
  LEGAL_DOCS,
  LEGAL_STATUS,
} from "@/lib/legal";

// Reads the canonical markdown for `doc` and substitutes {{TOKENS}} from lib/legal.
// The file is read at build time (pages are statically generated), so the exact text
// rendered == the versioned source — which is what a future consent log hashes against.
function loadBody(file: string, tokens: Record<string, string>): string {
  const raw = fs.readFileSync(
    path.join(process.cwd(), "content/legal", file),
    "utf8"
  );
  return raw
    // The page renders its own <h1> from the registry title; drop the leading H1.
    .replace(/^#\s+.*\n+/, "")
    .replace(/\{\{(\w+)\}\}/g, (_, k) => tokens[k] ?? `{{${k}}}`);
}

// Shared renderer for all legal pages (/terms /privacy /refund /grievance).
export default function LegalDocPage({ slug }: { slug: string }) {
  const doc = getLegalDoc(slug);
  if (!doc) notFound();

  const body = loadBody(doc.file, legalTokens(doc));
  const updated = doc.effectiveDate || "not yet in force";

  return (
    <main className="min-h-screen bg-[#111111] text-[#edeae3]">
      <SiteNav />

      <article className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        {LEGAL_STATUS === "draft" && (
          <div className="mb-8 rounded-lg border border-[#6b8f7e]/40 bg-[#6b8f7e]/10 px-5 py-4 text-sm text-[#a8c5b5]">
            These policies are being finalised and are not yet in force. This is a draft
            published for review.
          </div>
        )}

        <p className="text-xs tracking-[0.35em] uppercase text-[#6b8f7e] mb-3">Legal</p>
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-[#edeae3]">{doc.title}</h1>
        <p className="text-sm text-[#edeae3]/50 mb-10">
          Version {doc.version} · Last updated {updated}
        </p>

        <div className="legal-doc">
          <Markdown remarkPlugins={[remarkGfm]}>{body}</Markdown>
        </div>

        <nav className="mt-16 pt-8 border-t border-[#3d5247]/20 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {LEGAL_DOCS.filter((d) => d.slug !== slug).map((d) => (
            <a
              key={d.slug}
              href={`/${d.slug}`}
              className="text-[#a8c5b5] hover:text-[#edeae3] transition-colors"
            >
              {d.title}
            </a>
          ))}
        </nav>
      </article>

      <SiteFooter />
    </main>
  );
}
