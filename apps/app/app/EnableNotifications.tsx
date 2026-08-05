"use client";

import { useCallback, useEffect, useState } from "react";
import { enablePush, pushSupported } from "../lib/push";
import type { makeBakerApiClient } from "../lib/bakerApi";

// ── "Never miss a delivery" ──────────────────────────────────────────────────────────────────────
// Asked once, shortly after a baker signs in, because the thing being offered is worth interrupting
// for: a missed enquiry costs one order, a missed delivery costs a customer.
//
// ── WHY THERE HAS TO BE AN ASK AT ALL ───────────────────────────────────────────────────────────
// Only the browser can grant notification permission, and only in response to a user gesture. A
// requestPermission() on page load is ignored, and Chrome punishes origins that try by blocking the
// prompt for that user permanently. So a click is the mechanism, not the manners.
//
// ── WHY OUR OWN PROMPT FIRST ────────────────────────────────────────────────────────────────────
// A declined BROWSER prompt is effectively permanent — nothing in script can re-open it, only the
// user digging through site settings. A declined prompt of OURS costs nothing and can be offered
// again. So the browser's dialog is only ever reached by someone who has already said yes to ours,
// which is also why the copy has to say what they get rather than "allow notifications?".
//
// PER DEVICE, NOT PER BAKER. Permission belongs to an origin in a browser, so a baker on a phone and
// the shop tablet is asked on each — correct, since each is separately addressable.

type Api = ReturnType<typeof makeBakerApiClient>;

const ASKED_KEY = "spattoo.push.askedAt";
// Long enough not to nag, short enough that "not now" is not "never". A baker who declines in a
// quiet week should be offered again before the busy one.
const ASK_AGAIN_AFTER_DAYS = 7;

// localStorage, not the sessionStorage helper in BakerApp: "have we asked" must outlive the tab, or
// every new session re-asks and the prompt becomes the thing they close on the way to work.
const ls = {
  get: (k: string) => (typeof window !== "undefined" ? window.localStorage.getItem(k) : null),
  set: (k: string, v: string) => { if (typeof window !== "undefined") window.localStorage.setItem(k, v); },
};

function askedRecently() {
  const at = Number(ls.get(ASKED_KEY) ?? 0);
  if (!at) return false;
  return Date.now() - at < ASK_AGAIN_AFTER_DAYS * 86400000;
}

export default function EnableNotifications({ api }: { api?: Pick<Api, "registerDeviceToken"> }) {
  const [asking, setAsking] = useState(false);
  const [working, setWorking] = useState(false);

  // Register whatever token this device currently has. Runs on every mount once permission is
  // granted — silently, no prompt. That is what refreshes last_seen_at, picks up a ROTATED token,
  // and re-points the row when a shop tablet changes hands.
  const register = useCallback(async () => {
    const token = await enablePush();
    if (token && api?.registerDeviceToken) {
      // Not surfaced to the baker — they granted permission and that worked; a backend hiccup is not
      // their refusal to fix, and the next mount retries. But LOGGED, because a swallowed failure
      // here is indistinguishable from "no row appeared" and that is a bad hour to spend.
      await api.registerDeviceToken(token, "web").catch((e) => {
        console.error("[push] permission granted but the token did not reach the API:", e?.message ?? e);
      });
    }
    return token;
  }, [api]);

  useEffect(() => {
    let alive = true;
    pushSupported().then((ok) => {
      if (!alive || !ok) return;

      // Already on — nothing to ask, just keep the token current.
      if (Notification.permission === "granted") { register(); return; }

      // Denied at the browser level cannot be undone from script. Asking again would be a button
      // that does nothing, which teaches a baker the feature is broken rather than blocked.
      if (Notification.permission === "denied") return;

      if (!askedRecently()) setAsking(true);
    });
    return () => { alive = false; };
  }, [register]);

  if (!asking) return null;

  const dismiss = () => { ls.set(ASKED_KEY, String(Date.now())); setAsking(false); };

  return (
    <div style={s.scrim} role="dialog" aria-modal="true" aria-labelledby="push-title">
      <div style={s.card}>
        <div style={s.icon} aria-hidden>🔔</div>
        <h2 id="push-title" style={s.title}>Never miss a delivery</h2>
        <p style={s.body}>
          Get a reminder on this device each morning for the day’s deliveries — and the moment a new
          enquiry comes in.
        </p>
        <button
          type="button"
          style={s.primary}
          disabled={working}
          onClick={async () => {
            setWorking(true);
            // Recorded BEFORE the browser prompt, not after. Whatever they answer — including
            // closing the dialog without answering — this device has now been asked, and re-opening
            // it on the next mount would be the nagging this flow exists to avoid.
            ls.set(ASKED_KEY, String(Date.now()));
            try { await register(); } catch { /* denied, or the token call failed; either way we stop asking */ }
            setWorking(false);
            setAsking(false);
          }}
        >
          {working ? "Turning on…" : "Turn on reminders"}
        </button>
        <button type="button" style={s.secondary} onClick={dismiss} disabled={working}>
          Not now
        </button>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  scrim: {
    position: "fixed", inset: 0, zIndex: 6000, background: "rgba(20,24,21,0.42)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
  },
  card: {
    background: "#fff", borderRadius: 18, padding: "28px 26px", width: "100%", maxWidth: 380,
    boxShadow: "0 18px 48px rgba(20,24,21,0.22)", textAlign: "center",
    fontFamily: "'Quicksand', sans-serif",
  },
  icon:  { fontSize: 34, lineHeight: 1, marginBottom: 10 },
  title: { margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "#2C4433" },
  body:  { margin: "0 0 20px", fontSize: 14, lineHeight: 1.6, color: "#4A5D51" },
  primary: {
    width: "100%", padding: "12px 0", borderRadius: 12, border: "none", background: "#3D5A44",
    color: "#fff", fontSize: 14.5, fontWeight: 800, cursor: "pointer",
  },
  secondary: {
    width: "100%", padding: "10px 0", marginTop: 8, borderRadius: 12, border: "none",
    background: "none", color: "#7A8B7F", fontSize: 13, fontWeight: 700, cursor: "pointer",
  },
};
