"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { API_BASE } from "./api";

// The baker-side apiClient for the FULL CakeDesigner (baker mode) — which contains
// the designer, dashboard, OrdersPanel + Send quote, and edit-in-3D. Auth is the
// baker's Supabase session; every call carries the Bearer token and the API
// resolves the baker from baker_appusers. The 'owner'/'staff' roles hold
// design:create + order caps, so the global catalog endpoints work.
export function makeBakerApiClient(supabase: SupabaseClient) {
  async function authFetch(path: string, opts: RequestInit = {}) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((opts.headers as Record<string, string>) ?? {}),
    };
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
    const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      // Preserve the server's machine code + HTTP status so callers can branch
      // (e.g. BAKER_INACTIVE / ORDER_LIMIT_REACHED) instead of string-matching.
      const err = Object.assign(new Error(e.error ?? `API ${res.status}`), {
        code: e.code as string | undefined,
        status: res.status,
      });
      throw err;
    }
    return res.json();
  }
  const authGet = (path: string) => authFetch(path);
  const publicGet = (path: string) =>
    fetch(`${API_BASE}${path}`).then((r) => {
      if (!r.ok) throw new Error(`API ${r.status}`);
      return r.json();
    });

  // The baker's own slug (cached) — needed for the public order-create + flavours.
  let slugCache: string | null = null;
  async function bakerSlug(): Promise<string | null> {
    if (slugCache) return slugCache;
    const p = await authGet("/api/baker/profile").catch(() => null);
    slugCache = (p?.baker ?? p)?.slug ?? null;
    return slugCache;
  }

  return {
    // ── Baker context ─────────────────────────────────────────────────────────
    fetchBakerProfile: () => authGet("/api/baker/profile"),
    fetchBakerSettings: () => authGet("/api/baker/settings"),
    fetchMe: () => authGet("/api/me").catch(() => null),

    // ── Legal / consent (DPDP "Layer 2") ──────────────────────────────────────
    // Record the baker's acceptance of the CURRENT version of each doc. Idempotent
    // per (subject, version) server-side. `source`: 'signup' (self-signup) | 'gate'
    // (first-login / re-consent). The current version + whether acceptance is pending
    // come from GET /api/baker/profile → pending_consents.
    recordConsent: (docKeys: string[], source: "signup" | "gate" | "reconsent") =>
      authFetch("/api/legal/consent", {
        method: "POST",
        body: JSON.stringify({ doc_keys: docKeys, source }),
      }),

    // ── Consent withdrawal + account erasure (DPDP "Layer 3") ──────────────────
    // The Privacy & Data settings screen. Withdraw applies to OPTIONAL docs only —
    // the API returns 409 { error:'necessary_consent', action:'delete_account' } for
    // required docs (tos/privacy), which route into the account-deletion flow instead.
    // Current published docs + which are `required` (drives the optional-consent list without a
    // hardcoded doc allowlist). Public endpoint; [] while nothing is published (draft phase).
    fetchLegalCurrent: () => authGet("/api/legal/current"),
    fetchConsentHistory: () => authGet("/api/legal/consent/history"),
    withdrawConsent: (docKeys: string[]) =>
      authFetch("/api/legal/withdraw", {
        method: "POST",
        body: JSON.stringify({ doc_keys: docKeys }),
      }),
    // Account deletion is a lifecycle: request soft-deletes now (reversible until
    // erase_after); a scheduled job erases after the retention window.
    fetchDeletionStatus: () => authGet("/api/baker/account/deletion-status"),
    requestAccountDeletion: (reason?: string) =>
      authFetch("/api/baker/account/delete", {
        method: "POST",
        body: JSON.stringify({ reason: reason ?? null }),
      }),
    restoreAccount: () =>
      authFetch("/api/baker/account/restore", { method: "POST" }),

    // ── Catalog (baker Bearer; design:create) ─────────────────────────────────
    fetchElementTypes: () => authGet("/api/element-types"),
    fetchElements: (opts: { parentsOnly?: boolean; elementTypeId?: string } = {}) => {
      const qs = new URLSearchParams();
      if (opts.parentsOnly) qs.set("parents_only", "true");
      if (opts.elementTypeId) qs.set("element_type_id", opts.elementTypeId);
      const q = qs.toString();
      return authGet(`/api/elements${q ? `?${q}` : ""}`);
    },
    fetchMaterials: () => authGet("/api/materials"),
    fetchTextures: () => authGet("/api/textures"),
    fetchTextStyles: () => authGet("/api/text-styles"),
    fetchTags: () => authGet("/api/tags"),
    fetchTemplates: () => authGet("/api/templates").catch(() => []),
    fetchTemplate: (id: string) => authGet(`/api/templates/${id}`),

    // Saving a design as a template. Goes through the API (not a direct browser insert) so the
    // tenant is SERVER-resolved — the designer used to choose baker_id client-side. No rights
    // attestation here: a template is the baker's design library, seen only by their own invited
    // customers. The rights gate is storefront publish (see publishStorefront).
    createTemplate: (payload: Record<string, unknown>) =>
      authFetch("/api/baker/templates", { method: "POST", body: JSON.stringify(payload) }),
    // The exact sentence the baker affirms at publish, published + hashed server-side so we can
    // later prove which wording they saw. Null while Layer 1 is still draft.
    fetchAttestationStatement: () =>
      publicGet("/api/legal/content-rights").catch(() => null),

    // ── Uploads + order create/design (baker placing an order; edit-in-3D save) ─
    getSignedUploadUrl: (folder: string, filename: string, contentType: string) =>
      authFetch("/api/storage/sign-upload", {
        method: "POST",
        body: JSON.stringify({ folder, filename, contentType }),
      }),
    placeOrder: async (payload: Record<string, unknown>) =>
      authFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify({ ...payload, bakerSlug: await bakerSlug() }),
      }),
    updateOrderDesign: (id: string, payload: unknown) =>
      authFetch(`/api/orders/${id}/design`, { method: "PATCH", body: JSON.stringify(payload) }),

    // ── Orders + quoting ──────────────────────────────────────────────────────
    fetchOrders: (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return authGet(`/api/orders${qs ? `?${qs}` : ""}`);
    },
    updateOrderStatus: (id: string, status: string, comment?: string) =>
      authFetch(`/api/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, comment }) }),
    editOrder: (id: string, formData: unknown) =>
      authFetch(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify(formData) }),
    issueQuote: (id: string, body: { price: number; advanceAmount?: number | null; note?: string; lineItems?: unknown; validUntil?: string }) =>
      authFetch(`/api/orders/${id}/quote`, { method: "POST", body: JSON.stringify(body) }),
    fetchOrderAudit: (id: string) => authGet(`/api/orders/${id}/audit`),

    // ── Finished-cake photos (optional, ≤3; attached when marking ready) ────────
    fetchOrderPhotos: (id: string) => authGet(`/api/orders/${id}/photos`),
    saveOrderPhotos: (id: string, keys: string[]) =>
      authFetch(`/api/orders/${id}/photos`, { method: "POST", body: JSON.stringify({ keys }) }),
    deleteOrderPhoto: (id: string, photoId: string) =>
      authFetch(`/api/orders/${id}/photos/${photoId}`, { method: "DELETE" }),

    // ── Reference data ────────────────────────────────────────────────────────
    fetchOrderStatuses: () => publicGet("/api/order-statuses"),
    fetchFlavours: (bakerSlugArg?: string) =>
      bakerSlugArg
        ? publicGet(`/api/flavours?bakerSlug=${encodeURIComponent(bakerSlugArg)}`)
        : bakerSlug().then((s) => (s ? publicGet(`/api/flavours?bakerSlug=${encodeURIComponent(s)}`) : [])),
    fetchCraftGuides: (elementIds: string[]) =>
      authGet(`/api/craft-guide?element_ids=${(elementIds ?? []).join(",")}`).catch(() => []),

    // ── Customers ─────────────────────────────────────────────────────────────
    fetchCustomers: () => authGet("/api/baker/customers"),
    createCustomer: (payload: unknown) =>
      authFetch("/api/baker/customers", { method: "POST", body: JSON.stringify(payload) }),
    updateCustomer: (id: string, payload: unknown) =>
      authFetch(`/api/baker/customers/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
    deactivateCustomer: (id: string) =>
      authFetch(`/api/baker/customers/${id}/deactivate`, { method: "PATCH" }),
    reactivateCustomer: (id: string) =>
      authFetch(`/api/baker/customers/${id}/reactivate`, { method: "PATCH" }),
    inviteCustomer: (payload: unknown) =>
      authFetch("/api/baker/customers/invite", { method: "POST", body: JSON.stringify(payload) }),

    // ── Dashboard ─────────────────────────────────────────────────────────────
    fetchDashboard: () => authGet("/api/baker/dashboard"),
    fetchDashboardBreakdown: (period: string) =>
      authGet(`/api/baker/dashboard/breakdown?period=${encodeURIComponent(period)}`),

    // ── Flavours (baker management: global list + this baker's exclusions) ──────
    fetchBakerFlavours: () => authGet("/api/baker/flavours"),
    updateBakerFlavourExclusions: (excludedFlavourIds: string[]) =>
      authFetch("/api/baker/flavours/exclusions", {
        method: "PUT",
        body: JSON.stringify({ excluded_flavour_ids: excludedFlavourIds }),
      }),

    // ── Staff (owner adds a staff member) ─────────────────────────────────────
    addStaff: (payload: unknown) =>
      authFetch("/api/baker/staff", { method: "POST", body: JSON.stringify(payload) }),

    // ── Profile / Settings / Storefront publish ───────────────────────────────
    updateBakerProfile: (payload: unknown) =>
      authFetch("/api/baker/profile", { method: "PATCH", body: JSON.stringify(payload) }),
    updateBakerSettings: (settings: unknown) =>
      authFetch("/api/baker/settings", { method: "PUT", body: JSON.stringify(settings) }),
    fetchStorefrontThemes: () => authGet("/api/baker/storefront-themes"),
    // PUBLISH is the one rights gate: this is the moment the storefront becomes world-visible, so
    // it carries the baker's content-rights attestation (the API refuses it without one, and records
    // who vouched — content_attestations). `rightsAttested` MUST be the baker's real answer from the
    // publish confirmation — never default it to true.
    publishStorefront: (rightsAttested: boolean) =>
      authFetch("/api/baker/storefront/publish", {
        method: "POST",
        body: JSON.stringify({ rights_attested: rightsAttested }),
      }),
    unpublishStorefront: () => authFetch("/api/baker/storefront/unpublish", { method: "POST" }),

    // ── Storefront gallery + testimonials ─────────────────────────────────────
    // Not attested: a photo isn't public until the storefront is published, and THAT is the gate.
    addStorefrontPhoto: (key: string, caption?: string) =>
      authFetch("/api/baker/storefront-photos", {
        method: "POST",
        body: JSON.stringify({ storage_key: key, caption }),
      }),
    // Snapshot a cake design's thumbnail into the gallery as an independent photo (server copies the
    // R2 object). Presence of this method unhides the customiser's "Choose from your designs" picker.
    addStorefrontPhotoFromTemplate: (templateId: string) =>
      authFetch("/api/baker/storefront-photos/from-template", {
        method: "POST",
        body: JSON.stringify({ template_id: templateId }),
      }),
    // Snapshot a design thumbnail → { key, url } (no photo row); used to set the hero cake image.
    // Presence unhides the customiser's "Hero cake → Choose from your designs" picker.
    addStorefrontImageFromTemplate: (templateId: string) =>
      authFetch("/api/baker/storefront-image/from-template", {
        method: "POST",
        body: JSON.stringify({ template_id: templateId }),
      }),
    // Convert an uploaded storefront content image (e.g. a Highlight photo) to optimised WebP →
    // returns { key, url }. Used for section images that live in storefront_customizations jsonb.
    optimizeStorefrontImage: (key: string) =>
      authFetch("/api/baker/storefront-image", {
        method: "POST",
        body: JSON.stringify({ key }),
      }),
    updateStorefrontPhotos: (photos: unknown) =>
      authFetch("/api/baker/storefront-photos", { method: "PUT", body: JSON.stringify({ photos }) }),
    deleteStorefrontPhoto: (id: string) =>
      authFetch(`/api/baker/storefront-photos/${id}`, { method: "DELETE" }),
    updateTestimonials: (testimonials: unknown) =>
      authFetch("/api/baker/testimonials", { method: "PUT", body: JSON.stringify({ testimonials }) }),

    // ── Billing / subscription ────────────────────────────────────────────────
    fetchBillingStatus: () => authGet("/api/billing/status"),
    // Resolved entitlements + usage (e.g. orders_used vs max_orders_total) for the
    // baker — drives the "X of N orders used / upgrade" surface.
    fetchEntitlements: () => authGet("/api/baker/entitlements"),
    fetchBillingPeriods: () => authGet("/api/billing/periods"),
    // Public marketing plan catalog (one source for billing + onboarding).
    fetchPlans: () => publicGet("/api/plans"),
    fetchSubscriptionHistory: () => authGet("/api/baker/subscription/history"),
    // Payment history → { payments, total }. Fetch just the latest on first look;
    // the full (recent) list only when the baker drills in.
    fetchLatestPayment: () => authGet("/api/billing/payments?limit=1"),
    fetchPayments: () => authGet("/api/billing/payments?limit=24"),
    activateSparkPlan: () => authFetch("/api/billing/activate-spark", { method: "POST" }),
    // `intent` tags a same-tier deferred recreate for clarity/logging (the server independently confirms
    // the flow): 'change_method' re-authorizes a NEW payment method (e.g. UPI→card); 'switch_interval'
    // moves monthly↔yearly on the same tier. Both take over at the next renewal (no double charge).
    // Omitted for normal subscribe / upgrade / downgrade.
    createSubscription: (
      tier: string,
      billingPeriodId: string,
      opts?: { intent?: "change_method" | "switch_interval" },
    ) =>
      authFetch("/api/billing/subscribe", {
        method: "POST",
        body: JSON.stringify({ tier, billing_period_id: billingPeriodId, intent: opts?.intent }),
      }),
    cancelSubscription: () => authFetch("/api/billing/cancel", { method: "POST" }),
    // Save the baker's GSTIN (captured on the checkout screen). Persisted on the profile so automatic
    // renewals reuse it. Send null/'' to clear. Server validates the 15-char GSTIN (format + checksum).
    updateTaxProfile: (gstin: string | null) =>
      authFetch("/api/billing/tax-profile", {
        method: "PATCH",
        body: JSON.stringify({ gstin }),
      }),

    // ── Self-signup (free Spark tier; no payment) ─────────────────────────────
    checkSlug: (slug: string) =>
      publicGet(`/api/bakers/slug-available?slug=${encodeURIComponent(slug)}`),
    createBakerSelf: (payload: unknown) =>
      authFetch("/api/bakers/self", { method: "POST", body: JSON.stringify(payload) }),
    // Onboarding wizard plan step — sets the plan WITHOUT charge (dev/no-payment).
    selectPlan: (plan: string) =>
      authFetch("/api/baker/plan/select", { method: "POST", body: JSON.stringify({ plan }) }),

    // ── Live co-design sessions ───────────────────────────────────────────────
    // Presence of these methods is what unhides the designer's "Design Together" entry.
    createDesignSession: (body: unknown) =>
      authFetch("/api/design-sessions", { method: "POST", body: JSON.stringify(body) }),
    getDesignSession: (id: string) => authGet(`/api/design-sessions/${id}`),
    putDesignSessionDesign: (id: string, design: unknown) =>
      authFetch(`/api/design-sessions/${id}/design`, { method: "PUT", body: JSON.stringify({ design }) }),
    penDesignSession: (id: string, body: unknown) =>
      authFetch(`/api/design-sessions/${id}/pen`, { method: "POST", body: JSON.stringify(body) }),
    endDesignSession: (id: string) =>
      authFetch(`/api/design-sessions/${id}/end`, { method: "POST" }),

    // ── Account ───────────────────────────────────────────────────────────────
    signOut: () => supabase.auth.signOut(),
    changePassword: (password: string) => supabase.auth.updateUser({ password }),
  };
}

export type BakerApiClient = ReturnType<typeof makeBakerApiClient>;
