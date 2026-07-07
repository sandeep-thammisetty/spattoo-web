"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CustomerStorefront } from "@spattoo/designer";
import { getSupabase } from "../../lib/supabase";
import { API_BASE } from "../../lib/api";
import { setTelemetryContext } from "../../lib/telemetry";
import { stashResumeDesign } from "../../lib/resumeDesign";

// Mounts the core CustomerStorefront and routes its callbacks. The whole journey
// stays on this origin (the baker's subdomain) so the Supabase session set during
// the invite OTP login persists into the designer.
export default function StorefrontClient({ slug }: { slug: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const inviteId = params.get("invite");
  const supabase = getSupabase();

  // A live co-design invite carries ?session=<id>. Carry it into the designer URL so the
  // customer joins the live room (DesignerClient reads ?session=). Plain params drop across
  // router.push, so we append it explicitly.
  const sessionId = params.get("session");
  const designPath = sessionId ? `/${slug}/design?session=${sessionId}` : `/${slug}/design`;

  useEffect(() => setTelemetryContext({ surface: "storefront", bakerSlug: slug }), [slug]);

  return (
    <CustomerStorefront
      slug={slug}
      inviteId={inviteId}
      apiBaseUrl={API_BASE}
      supabase={supabase}
      // After OTP login (session is set), or a browse "start designing", go to the
      // designer on this same origin. If the baker attached a starting design to the
      // invite, core hands it here — stash it so the designer seeds from it on arrival.
      onAuthenticated={(_session?: unknown, designSnapshot?: unknown) => {
        stashResumeDesign(slug, designSnapshot);
        router.push(designPath);
      }}
      onStartDesign={() => router.push(designPath)}
    />
  );
}
