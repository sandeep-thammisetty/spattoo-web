"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "../../../lib/supabase";
import { makeCustomerApiClient } from "../../../lib/api";
import { setTelemetryContext } from "../../../lib/telemetry";
import { bridgeCoreTelemetryToSentry } from "../../../lib/coreTelemetryBridge";
import { takeResumeDesign } from "../../../lib/resumeDesign";

// The designer is a heavy WebGL client component — load it client-only.
const CakeDesigner = dynamic(
  () => import("@spattoo/designer").then((m) => m.CakeDesigner),
  {
    ssr: false,
    loading: () => (
      <div style={{ fontFamily: "sans-serif", padding: 48 }}>Loading designer…</div>
    ),
  }
);

// Mounts CakeDesigner in customer mode: the customer designs and hits "Request
// quote", which routes to apiClient.requestQuote → POST /api/customer/orders.
//
// When the customer dismisses the "Quote Requested!" success popup (Done), core
// fires onQuoteRequested — we redirect OFF the designer to the share screen
// (/[slug]/quote-sent), which closes the loop and shows the share design.
export default function DesignerClient({ slug }: { slug: string }) {
  const supabase = getSupabase();
  const router = useRouter();
  const apiClient = useMemo(() => makeCustomerApiClient(supabase, slug), [supabase, slug]);

  // If the customer arrived from an invite the baker attached a design to, StorefrontClient stashed
  // it — take it once (read-and-clear) and seed the designer with it. Null → a normal blank start.
  const [initialDesign] = useState(() => takeResumeDesign(slug));
  // Joining a baker's live co-design session via the shared link (?session=<id>).
  const [liveSessionId] = useState(() =>
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("session") : null,
  );

  useEffect(() => {
    setTelemetryContext({ surface: "designer", bakerSlug: slug, role: "customer" });
    bridgeCoreTelemetryToSentry("designer"); // route the designer's internal reportError to Sentry
  }, [slug]);

  return (
    <CakeDesigner
      apiClient={apiClient}
      supabase={supabase}
      cfAssetsBase={process.env.NEXT_PUBLIC_ASSETS_BASE}
      orderMode="customer"
      initialDesign={initialDesign}
      liveSessionId={liveSessionId}
      onQuoteRequested={(result: { orderId?: string }) => {
        const orderId = result?.orderId;
        router.push(orderId ? `/${slug}/quote-sent?order=${orderId}` : `/${slug}/orders`);
      }}
    />
  );
}
