import { SPATTOO_PROFILE, LEGAL_DOCS } from "@/lib/legal";

// Shared site footer — used on the home page and every legal page. Legal links are
// driven off the LEGAL_DOCS registry so adding a document surfaces it here for free.
export default function SiteFooter() {
  return (
    <footer className="py-10 px-8 border-t border-[#3d5247]/20 text-center">
      <p className="text-sm text-[#edeae3]/75">
        © {new Date().getFullYear()} Spattoo ·{" "}
        <span className="font-[family-name:var(--font-fraunces)] italic text-sm text-[#edeae3]/90 tracking-tight">
          From idea to Cake, Visually
        </span>
      </p>
      <nav className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-[#edeae3]/60">
        {LEGAL_DOCS.map((d) => (
          <a
            key={d.slug}
            href={`/${d.slug}`}
            className="hover:text-[#edeae3] transition-colors"
          >
            {d.navLabel}
          </a>
        ))}
      </nav>
      <p className="mt-4 text-xs text-[#edeae3]/45">
        Spattoo is a service operated by {SPATTOO_PROFILE.legalName} · GSTIN: {SPATTOO_PROFILE.gstin}
      </p>
    </footer>
  );
}
