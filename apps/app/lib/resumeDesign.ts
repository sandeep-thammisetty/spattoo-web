// Hand-off for the starting design a baker attached to an invite: from the storefront OTP login
// (StorefrontClient) to the designer (DesignerClient). The two live on the same origin but on
// different routes, so we stash the snapshot in sessionStorage across the client-side navigation to
// /[slug]/design. One place for the key + the read/write so the two sides can't drift.
const key = (slug: string) => `spattoo:resumeDesign:${slug}`;

export function stashResumeDesign(slug: string, design: unknown): void {
  if (typeof window === "undefined" || design == null) return;
  try {
    sessionStorage.setItem(key(slug), JSON.stringify(design));
  } catch {
    /* quota / private mode — non-fatal, the customer just starts blank */
  }
}

// Read AND clear (one-shot): a resumed design seeds a single designer mount, then is consumed so a
// later plain visit to the designer doesn't re-seed it.
export function takeResumeDesign(slug: string): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key(slug));
    if (raw) {
      sessionStorage.removeItem(key(slug));
      return JSON.parse(raw);
    }
  } catch {
    /* ignore malformed / unavailable storage */
  }
  return null;
}
