// Single source of truth for Spattoo's legal documents and the company details they
// reference. Consumed by the /terms /privacy /refund /grievance pages via
// components/LegalDocPage.tsx and the footer links in components/SiteFooter.tsx.
//
// TWO things to do before going live:
//   1. Fill the COMPANY blanks + each doc's `effectiveDate`, then set LEGAL_STATUS
//      to "published". While anything is blank it renders a visible "[to be provided]"
//      and the pages show a "draft — not yet in force" banner.
//   2. Versioning here backs DPDP Act 2023 demonstrable-consent: every published
//      version is retained + timestamped, and `version`/`docKey` are what a future
//      consent log (Layer 2) records a user's acceptance against. Never mutate a
//      published version in place — bump `version` and add a Document History row.

export const LEGAL_STATUS: "draft" | "published" = "draft";

// Registered company + statutory contact details.
// TODO before publishing: registeredOffice, cin, grievanceEmail, grievanceOfficer*.
export const COMPANY = {
  legalName: "FEELINGS&FLAVOURS (OPC) PRIVATE LIMITED",
  gstin: "36AAGCF5256J1ZD",
  cin: "", // e.g. "U15490TG2024OPC1XXXXX"
  registeredOffice: "", // full registered office address (Telangana)
  contactEmail: "care@spattoo.com",
  grievanceEmail: "", // dedicated mailbox recommended; falls back to contactEmail
  grievanceOfficerName: "", // a real person resident in India (IT Rules 2021 / DPDP)
  grievanceOfficerDesignation: "",
} as const;

export type LegalSlug = "terms" | "privacy" | "refund" | "grievance";

export type LegalDoc = {
  slug: LegalSlug;
  docKey: string; // stable key the consent log (Layer 2) references — never rename
  title: string;
  navLabel: string; // short label for footer / cross-links
  file: string; // filename under content/legal/
  version: string;
  effectiveDate: string; // human-readable date, or "" until published
  description: string; // <meta description> + summary
};

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: "terms",
    docKey: "tos",
    title: "Terms of Service",
    navLabel: "Terms",
    file: "terms-of-service.md",
    version: "1.0",
    effectiveDate: "",
    description:
      "The terms governing use of Spattoo — the technology platform for bakers and their customers.",
  },
  {
    slug: "privacy",
    docKey: "privacy",
    title: "Privacy Policy",
    navLabel: "Privacy",
    file: "privacy-policy.md",
    version: "1.0",
    effectiveDate: "",
    description:
      "How Spattoo collects, uses, shares, and protects personal data, in line with the DPDP Act, 2023.",
  },
  {
    slug: "refund",
    docKey: "refund",
    title: "Refund & Cancellation Policy",
    navLabel: "Refund",
    file: "refund-and-cancellation-policy.md",
    version: "1.0",
    effectiveDate: "",
    description:
      "Cancellations and refunds for Spattoo baker subscriptions, and how cake orders are handled by the baker.",
  },
  {
    slug: "grievance",
    docKey: "grievance",
    title: "Grievance & Contact",
    navLabel: "Grievance",
    file: "grievance-and-contact.md",
    version: "1.0",
    effectiveDate: "",
    description:
      "How to contact Spattoo and reach our Grievance Officer under the IT Rules, 2021 and DPDP Act, 2023.",
  },
];

export const getLegalDoc = (slug: string): LegalDoc | undefined =>
  LEGAL_DOCS.find((d) => d.slug === slug);

// {{TOKEN}} values substituted into the markdown bodies at render. Anything unset
// shows "[to be provided]" so nothing silently ships blank.
export function legalTokens(doc: LegalDoc): Record<string, string> {
  const todo = "[to be provided]";
  return {
    LEGAL_NAME: COMPANY.legalName,
    GSTIN: COMPANY.gstin,
    CIN: COMPANY.cin || todo,
    REGISTERED_OFFICE: COMPANY.registeredOffice || todo,
    CONTACT_EMAIL: COMPANY.contactEmail,
    GRIEVANCE_EMAIL: COMPANY.grievanceEmail || COMPANY.contactEmail,
    GRIEVANCE_OFFICER_NAME: COMPANY.grievanceOfficerName || todo,
    GRIEVANCE_OFFICER_DESIGNATION: COMPANY.grievanceOfficerDesignation || todo,
    EFFECTIVE_DATE: doc.effectiveDate || todo,
  };
}
