import fs from "node:fs";
import path from "node:path";
import { getLegalDoc, legalTokens, LEGAL_STATUS } from "@/lib/legal";

// The canonical FINAL text of a legal document, machine-readable.
//
// WHY THIS EXISTS: the text is authored in git and rendered here, but the DPDP evidence store lives
// in the API's `legal_document_versions` table — the row a consent record points at. Something has to
// carry the exact bytes from one to the other. Until now that was
// `spattoo-api/scripts/publish-legal-version.mjs`, run by hand from a terminal with every {{TOKEN}}
// passed on the command line: two chances to get it wrong (a mistyped token, a stale --version) and
// nothing to catch either, because a hash mismatch is invisible until somebody disputes a consent.
//
// So the site publishes what it actually serves, and the admin publish screen freezes THAT. There is
// then exactly one definition of "the current text", and drift between page and evidence store
// becomes impossible rather than merely unlikely.
//
// PUBLIC, deliberately. These are published legal documents — the same words are already world-
// readable at /privacy, /terms, /refund and /grievance. Serving them as JSON discloses nothing new,
// and keeping it public means the API can fetch it server-side with no credentials and no CORS.
//
// ⚠️ THE LEADING H1 IS KEPT, and this deliberately differs from LegalDocPage.tsx, which strips it
// (`.replace(/^#\s+.*\n+/, "")`) because the page renders its own heading from the registry title.
//
// Two reasons to keep it here. First, v1.0 of all four documents was frozen WITH it — the stored
// content starts `# Spattoo — Privacy Policy` — so stripping it now would make a v1.0→v1.1 diff read
// as though every line changed, in the one place where an honest diff matters most. Second, the
// frozen artefact is a legal record in its own right, and a record that does not carry its own title
// is a worse record. Note the markdown H1 ("Spattoo — Privacy Policy") is not even the string the
// page displays ("Privacy Policy", from the registry), so matching the renderer here would buy no
// fidelity anyway.
//
// Everything else — token substitution, the exact bytes of the body — is what the page renders.
function loadBody(file: string, tokens: Record<string, string>): string {
  const raw = fs.readFileSync(path.join(process.cwd(), "content/legal", file), "utf8");
  return raw.replace(/\{\{(\w+)\}\}/g, (_, k) => tokens[k] ?? `{{${k}}}`);
}

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const doc = getLegalDoc(slug);
  if (!doc) {
    return Response.json({ error: "Unknown legal document" }, { status: 404 });
  }

  const content = loadBody(doc.file, legalTokens(doc));

  // A document still in draft has no business being frozen as evidence: `effectiveDate` may be blank
  // and the body would carry a visible "[to be provided]". Refusing here means the publish screen
  // cannot offer a button that would write a placeholder into the consent trail.
  const unresolved = [...content.matchAll(/\{\{([A-Z_]+)\}\}/g)].map((m) => m[1]);
  const publishable = LEGAL_STATUS === "published" && !!doc.effectiveDate && unresolved.length === 0;

  return Response.json(
    {
      docKey: doc.docKey,
      slug: doc.slug,
      title: doc.title,
      version: doc.version,
      effectiveDate: doc.effectiveDate,
      status: LEGAL_STATUS,
      publishable,
      // Named so a caller can say WHICH placeholder is missing rather than "not publishable".
      unresolvedTokens: [...new Set(unresolved)],
      content,
    },
    // Never cached: the publish screen's whole job is to compare the live text against the frozen
    // one, and a stale answer here would show "already published" for text that has since changed.
    { headers: { "Cache-Control": "no-store" } },
  );
}
