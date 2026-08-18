// @spattoo/designer is a JS component library (no shipped types yet). Declare the
// exports we use as permissive React components so the app type-checks; tighten to
// real types if/when the library emits .d.ts.
declare module "@spattoo/designer" {
  import type { ComponentType } from "react";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const CakeDesigner: ComponentType<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const CustomerStorefront: ComponentType<any>;
  // The storefront's OTP screen, reused to gate /[slug]/design — every catalogue route behind the
  // designer needs a session, so an unverified visitor got an empty panel and 401s.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const VerifyStep: ComponentType<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const OrdersPanel: ComponentType<any>;
  export function configureTelemetry(opts: {
    transport?: { capture: (e: Error, c: Record<string, unknown>) => void; setContext?: (c: Record<string, unknown>) => void };
    surface?: string;
  }): void;
  // Suggest brand colours from a logo (onboarding). Resolves to the two most dominant, distinct
  // colours as '#rrggbb' (accent null for a one-colour logo), or null for a greyscale/undecodable file.
  export function extractLogoPalette(
    fileOrBlob: Blob,
    opts?: { sample?: number }
  ): Promise<{ primary: string; accent: string | null } | null>;
}
