# Spattoo — Legal Documents

Draft legal documents for the Spattoo platform, operated by **FEELINGS&FLAVOURS (OPC)
PRIVATE LIMITED** (GSTIN `36AAGCF5256J1ZD`, Telangana). Written to match how the platform
actually works — **in its role as Platform operator**, Spattoo is a **technology
intermediary**: it does not bake or sell the cakes offered through Bakers' storefronts (the
subscribed Baker is the seller), and the designer is a **quote/enquiry tool** (customers
pay bakers directly, offline). Note: the operating company also runs its own bakery; ToS
§1.5 keeps that "Baker" capacity separate from the "operator" capacity so the disclaimers
stay factually accurate.

| Document | Covers |
|---|---|
| [terms-of-service.md](./terms-of-service.md) | Single ToS. Part A = common terms + the core disclaimers (we don't bake, design is a reference, no food-safety liability, no delivery, offline payment). Part B = Baker subscriptions. Part C = Customer designer/orders. |
| [privacy-policy.md](./privacy-policy.md) | DPDP Act 2023-aligned. Data collected, Baker-as-Data-Fiduciary split, sharing with the chosen Baker, cross-border processors, rights, grievance. |
| [refund-and-cancellation-policy.md](./refund-and-cancellation-policy.md) | Part 1 = cake orders (entirely the Baker's policy). Part 2 = Baker subscription refunds/cancellation. |
| [grievance-and-contact.md](./grievance-and-contact.md) | Grievance Officer + response timelines (IT Rules 2021 + DPDP Act). |

## ⚠️ Before publishing

1. **Have a qualified Indian lawyer review and finalise all four.** These are protective
   drafts, not legal advice.
2. **Fill every `[BRACKETED]` placeholder:**
   - `[REGISTERED OFFICE ADDRESS, TELANGANA]` — the company's registered office.
   - `[EFFECTIVE DATE]` — publish date on each doc.
   - `[GRIEVANCE OFFICER NAME]`, `[DESIGNATION]` — a real person resident in India.
   - `[grievance@spattoo.com]` — recommend a dedicated grievance mailbox (else use
     `care@spattoo.com`).
   - Consider adding **CIN** to the footer/contact block.
3. **Confirm the facts** each doc relies on still hold: 18% GST, Razorpay as processor,
   30-day post-cancellation retention, the third-party processor list (and their hosting
   regions), and that there is still **no** online cake payment or analytics/ad cookies.
4. **Then wire into the site:** create `apps/marketing/app/{terms,privacy,refund,contact}`
   pages, link all four from the marketing footer, and link ToS/Privacy from the
   storefront and signup/checkout flows (a consent checkbox at Baker signup and at
   Customer quote submission is recommended).
